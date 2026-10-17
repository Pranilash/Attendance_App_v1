import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AttendanceUser } from '../models/attendanceUser.model.js';
import { Class } from '../models/class.model.js';
import { AttendanceSession } from '../models/attendanceSession.model.js';
import { Attendance } from '../models/attendance.model.js';
import { FaceEmbedding } from '../models/faceEmbedding.model.js';
import { AttendanceChallenge } from '../models/attendanceChallenge.model.js';
import { TimetableSchedule } from '../models/timetableSchedule.model.js';
import crypto from 'crypto';
import { verifyFaceEmbedding } from '../utils/faceVerification.util.js';

// Class views

/**
 * Get student's classes
 * @route GET /api/student/classes
 * @access Student only
 */
const getClasses = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const classes = await Class.find({
    students: studentId,
    isActive: true,
  })
    .populate('faculty', 'name email')
    .populate('department', 'name code')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, classes, 'Classes fetched successfully'));
});

// QR code verification

/**
 * Verify QR code
 * @route POST /api/student/attendance/verify-qr
 * @access Student only
 */
const verifyQR = asyncHandler(async (req, res) => {
  const { qrPayload, bleProof } = req.body;
  const studentId = req.user._id;

  // Parse QR payload
  let sessionId, timestamp, signature;
  try {
    const payload = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
    sessionId = payload.sessionId;
    timestamp = payload.timestamp;
    signature = payload.signature;
  } catch (e) {
    throw new ApiError(400, 'Invalid QR code format');
  }

  // Find session - must select qrSecret and bleBeaconSecret explicitly since they have select: false
  const session = await AttendanceSession.findById(sessionId)
    .select('+qrSecret +bleBeaconSecret');
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  if (!session.isActive) {
    throw new ApiError(400, 'Session has ended');
  }

  // Verify timestamp (30 seconds expiry to account for scan + network latency)
  const currentTime = Date.now();
  if (timestamp > currentTime + 5000) {
    throw new ApiError(400, 'QR code timestamp cannot be in the future');
  }

  const qrAge = currentTime - timestamp;
  if (qrAge > 30000) {
    throw new ApiError(400, 'QR code has expired. Please scan again.');
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', session.qrSecret)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new ApiError(400, 'Invalid QR code signature');
  }

  // BLE Proximity Verification (VII Sem Upgrade 2)
  let bleVerified = false;
  let detectedRssi = null;
  if (session.bleEnabled) {
    if (!bleProof || !bleProof.beaconToken) {
      throw new ApiError(403, 'Classroom BLE proximity verification required. Please enable Bluetooth.');
    }
    if (bleProof.beaconToken !== session.bleBeaconToken) {
      throw new ApiError(403, 'Invalid classroom beacon token. Proximity check failed.');
    }
    if (typeof bleProof.rssi === 'number') {
      detectedRssi = bleProof.rssi;
      const threshold = session.bleRssiThreshold || -75;
      if (bleProof.rssi < threshold) {
        throw new ApiError(403, `BLE RSSI signal too weak (${bleProof.rssi} dBm < ${threshold} dBm). You appear to be outside the classroom.`);
      }
    }
    bleVerified = true;
  }

  // Check if student is enrolled in the class
  const classData = await Class.findById(session.classId);
  if (!classData || !classData.students.includes(studentId)) {
    throw new ApiError(403, 'You are not enrolled in this class');
  }

  // Check if already marked attendance
  const existingAttendance = await Attendance.findOne({
    sessionId,
    studentId,
  });

  if (existingAttendance) {
    throw new ApiError(400, 'Attendance already marked for this session');
  }

  // Check if face is registered
  const student = await AttendanceUser.findById(studentId).select('+faceEmbedding');
  if (!student.faceEmbedding || student.faceEmbedding.length !== 128) {
    throw new ApiError(400, 'Please register your face before marking attendance');
  }

  // Dynamic randomized action sequence for active liveness challenge (VII Sem Upgrade 3)
  const candidateActions = ['blink', 'turnLeft', 'turnRight', 'smile'];
  const shuffledActions = [...candidateActions].sort(() => 0.5 - Math.random()).slice(0, 2);
  const actionSequence = shuffledActions.length >= 2 ? shuffledActions : ['blink', 'turnLeft'];

  // Issue single-use challenge for Algorithm 1 verification pipeline
  await AttendanceChallenge.deleteMany({ studentId, sessionId });
  const nonce = crypto.randomBytes(16).toString('hex');
  const challenge = await AttendanceChallenge.create({
    studentId,
    sessionId,
    classId: session.classId,
    nonce,
    qrTimestamp: timestamp,
    actionSequence,
    bleVerified,
    bleRssi: detectedRssi,
    expiresAt: new Date(Date.now() + 60 * 1000), // 60 seconds validity
  });

  // Return session info and challenge for face verification
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessionId,
        classId: session.classId,
        className: classData.name,
        subjectCode: classData.subjectCode,
        challengeId: challenge._id,
        nonce,
        actionSequence: challenge.actionSequence,
        bleVerified,
        message: 'QR verified. Please proceed with face verification.',
      },
      'QR code verified successfully'
    )
  );
});

// Facial verification

/**
 * Verify face and mark attendance
 * @route POST /api/student/attendance/verify-face
 * @access Student only
 */
const verifyFace = asyncHandler(async (req, res) => {
  const { sessionId, embedding, image, livenessPassed, livenessMetrics } = req.body;
  const studentId = req.user._id;

  // Validate session - must select qrSecret explicitly since it has select: false
  const session = await AttendanceSession.findById(sessionId).select('+qrSecret');
  if (!session || !session.isActive) {
    throw new ApiError(400, 'Session not found or has ended');
  }

  // Validate and consume single-use server challenge atomically
  const challenge = await AttendanceChallenge.findOneAndUpdate(
    {
      studentId,
      sessionId,
      consumed: false,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: { consumed: true, consumedAt: new Date() },
    },
    { new: true }
  );

  if (!challenge) {
    throw new ApiError(
      400,
      'QR verification challenge expired or missing. Please scan the QR code again.'
    );
  }

  // Get stored face embedding
  const student = await AttendanceUser.findById(studentId).select('+faceEmbedding');
  if (!student || !student.faceEmbedding || student.faceEmbedding.length !== 128) {
    throw new ApiError(400, 'Face not registered. Please register your face first.');
  }

  // Compare face embeddings
  const storedEmbedding = student.faceEmbedding;
  const result = verifyFaceEmbedding(embedding, storedEmbedding);
  const faceMatch = result.isMatch;

  if (!faceMatch) {
    throw new ApiError(400, 'Face verification failed. Face does not match.');
  }

  // Dynamic Server-Verified Liveness Protocol (VII Sem Upgrade 3)
  if (livenessMetrics) {
    const { earDelta, yawDelta, durationMs } = livenessMetrics;
    if (typeof durationMs === 'number' && (durationMs < 800 || durationMs > 25000)) {
      throw new ApiError(400, 'Liveness timing out of bounds. Please follow the on-screen prompts.');
    }
    if (
      challenge.actionSequence?.includes('blink') &&
      typeof earDelta === 'number' &&
      earDelta < 0.03
    ) {
      throw new ApiError(400, 'Liveness check failed: Eye blink not detected with sufficient fidelity.');
    }
    if (
      (challenge.actionSequence?.includes('turnLeft') ||
        challenge.actionSequence?.includes('turnRight')) &&
      typeof yawDelta === 'number' &&
      Math.abs(yawDelta) < 8
    ) {
      throw new ApiError(400, 'Liveness check failed: Head rotation not detected.');
    }
  } else if (!livenessPassed) {
    throw new ApiError(400, 'Liveness check failed. Please try again.');
  }

  // Atomically create attendance record - prevents double-marking race condition
  let attendance;
  try {
    attendance = await Attendance.create({
      sessionId,
      studentId,
      classId: session.classId,
      status: 'present',
      qrVerified: true,
      faceVerified: true,
      bleVerified: Boolean(challenge.bleVerified),
      bleRssi: challenge.bleRssi || null,
      bleDetectedAt: challenge.bleVerified ? (challenge.createdAt || new Date()) : null,
      livenessScore: 1,
      qrScannedAt: challenge.createdAt || new Date(),
      faceVerifiedAt: new Date(),
      markedAt: new Date(),
      faceVerificationDetails: {
        similarityScore: typeof result.distance === 'number' ? result.distance : 0.95,
        livenessChecks: {
          blink: challenge.actionSequence?.includes('blink') ?? true,
          headMovement:
            challenge.actionSequence?.some((a) => a.startsWith('turn')) ?? true,
          smile: challenge.actionSequence?.includes('smile') ?? false,
        },
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(400, 'Attendance already marked for this session');
    }
    throw err;
  }

  // Get class info
  const classData = await Class.findById(session.classId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        attendanceId: attendance._id,
        markedAt: attendance.markedAt,
        timestamp: attendance.markedAt,
        className: classData?.name,
        subjectCode: classData?.subjectCode,
        status: 'present',
      },
      'Attendance marked successfully'
    )
  );
});

// Attendance history and analytics

/**
 * Get attendance history
 * @route GET /api/student/attendance/history
 * @access Student only
 */
const getAttendanceHistory = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

  // Build query using canonical markedAt
  const query = { studentId };
  
  if (startDate || endDate) {
    query.markedAt = {};
    if (startDate) query.markedAt.$gte = new Date(startDate);
    if (endDate) query.markedAt.$lte = new Date(endDate);
  }
  
  if (status) query.status = status;

  const records = await Attendance.find(query)
    .populate({
      path: 'sessionId',
      select: 'startTime endTime',
    })
    .populate({
      path: 'classId',
      select: 'name subjectCode',
    })
    .sort({ markedAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Attendance.countDocuments(query);

  // Format records with both markedAt and timestamp
  const formattedRecords = records.map((record) => ({
    _id: record._id,
    markedAt: record.markedAt,
    timestamp: record.markedAt,
    status: record.status,
    qrVerified: record.qrVerified,
    faceVerified: record.faceVerified,
    className: record.classId?.name || 'Unknown',
    subjectCode: record.classId?.subjectCode || 'N/A',
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        records: formattedRecords,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
      'Attendance history fetched successfully'
    )
  );
});

/**
 * Get attendance stats
 * @route GET /api/student/attendance/stats
 * @access Student only
 */
const getAttendanceStats = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  // Get total classes student is enrolled in
  const classes = await Class.find({ students: studentId });
  const classIds = classes.map((c) => c._id);

  // Get total sessions for those classes
  const totalSessions = await AttendanceSession.countDocuments({
    classId: { $in: classIds },
  });

  // Get present count
  const presentCount = await Attendance.countDocuments({
    studentId,
    status: 'present',
  });

  // Get absent count
  const absentCount = Math.max(0, totalSessions - presentCount);

  // Calculate attendance rate
  const attendanceRate = totalSessions > 0 
    ? Math.round((presentCount / totalSessions) * 100) 
    : 0;

  // Calculate Debarment Risk Index (DRI) across classes (VII Sem Upgrade 4)
  const classBreakdown = await Promise.all(
    classes.map(async (cls) => {
      const totalPlanned = cls.totalPlannedSessions || 40;
      const classSessions = await AttendanceSession.find({ classId: cls._id });
      const conducted = classSessions.length;
      const sessionIds = classSessions.map((s) => s._id);
      const attended = await Attendance.countDocuments({
        sessionId: { $in: sessionIds },
        studentId,
        status: 'present',
      });

      const remaining = Math.max(0, totalPlanned - conducted);
      const currentRate = conducted > 0 ? Math.round((attended / conducted) * 100) : 100;
      const maxAchievableRate = Math.min(
        100,
        Math.round(((attended + remaining) / totalPlanned) * 100)
      );
      const requiredSessions = Math.max(0, Math.ceil(0.75 * totalPlanned) - attended);

      let dri = 0;
      let riskLevel = 'SAFE';

      if (maxAchievableRate < 75) {
        dri = 100;
        riskLevel = 'DEBARRED';
      } else if (remaining > 0) {
        dri = Math.min(100, Math.max(0, Math.round((requiredSessions / remaining) * 100)));
        if (dri >= 80) riskLevel = 'CRITICAL';
        else if (dri >= 50) riskLevel = 'WARNING';
        else riskLevel = 'SAFE';
      } else {
        dri = 0;
        riskLevel = currentRate >= 75 ? 'SAFE' : 'DEBARRED';
      }

      return {
        classId: cls._id,
        className: cls.name,
        subjectCode: cls.subjectCode,
        totalPlanned,
        conducted,
        attended,
        remaining,
        currentRate,
        maxAchievableRate,
        requiredSessions,
        dri,
        riskLevel,
      };
    })
  );

  let overallDri = 0;
  let overallRiskLevel = 'SAFE';
  if (classBreakdown.length > 0) {
    const severities = { DEBARRED: 4, CRITICAL: 3, WARNING: 2, SAFE: 1 };
    let highestSeverity = 1;
    for (const c of classBreakdown) {
      if (severities[c.riskLevel] > highestSeverity) {
        highestSeverity = severities[c.riskLevel];
        overallRiskLevel = c.riskLevel;
      }
      if (c.dri > overallDri) {
        overallDri = c.dri;
      }
    }
  }

  // Check face registration status correctly from both model and embedding
  const student = await AttendanceUser.findById(studentId).select('+faceEmbedding');
  const faceRegistered = Boolean(
    student?.faceRegistered ||
    (student?.faceEmbedding && student.faceEmbedding.length === 128)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalClasses: classes.length,
        totalSessions,
        presentCount,
        absentCount,
        attendanceRate,
        faceRegistered,
        debarmentRisk: {
          dri: overallDri,
          riskLevel: overallRiskLevel,
          classes: classBreakdown,
        },
      },
      'Attendance stats fetched successfully'
    )
  );
});

// Timetable engine

/**
 * Get student weekly timetable
 * @route GET /api/student/timetable
 * @access Student only
 */
const getStudentTimetable = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const classes = await Class.find({ students: studentId, isActive: true });
  const classIds = classes.map((c) => c._id);

  const timetable = await TimetableSchedule.find({
    classId: { $in: classIds },
    isActive: true,
  })
    .populate('classId', 'name subjectCode room')
    .populate('facultyId', 'name email')
    .sort({ dayOfWeek: 1, startTime: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, timetable, 'Student timetable fetched successfully'));
});

// Face registration

/**
 * Register face
 * @route POST /api/student/face/register
 * @access Student only
 */
const registerFace = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { embedding, image, livenessPassed } = req.body;

  // Validate liveness
  if (!livenessPassed) {
    throw new ApiError(400, 'Liveness check failed. Please try again.');
  }

  // Validate embedding
  if (!embedding || !Array.isArray(embedding) || embedding.length !== 128) {
    throw new ApiError(400, 'Invalid face embedding format. Must be 128 dimensions.');
  }

  const now = new Date();

  // Store face embedding audit record
  const faceRecord = await FaceEmbedding.findOneAndUpdate(
    { userId: studentId },
    {
      userId: studentId,
      embedding,
      registeredAt: now,
      referenceImage: {
        publicId: 'webcam_capture',
        url: image ? (typeof image === 'string' ? image.slice(0, 100) : 'captured') : '',
      },
    },
    { upsert: true, new: true }
  );

  // Update student with face embedding and set faceRegistered to true
  const student = await AttendanceUser.findByIdAndUpdate(
    studentId,
    {
      faceEmbedding: embedding,
      faceRegistered: true,
      faceRegisteredAt: now,
      faceEmbeddingId: faceRecord._id,
    },
    { new: true }
  ).select('-password -refreshToken');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          registered: true,
          faceRegisteredAt: now,
        },
        'Face registered successfully'
      )
    );
});

/**
 * Get face registration status
 * @route GET /api/student/face/status
 * @access Student only
 */
const getFaceStatus = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const student = await AttendanceUser.findById(studentId).select('+faceEmbedding');
  const faceRecord = await FaceEmbedding.findOne({ userId: studentId });

  const isRegistered = Boolean(
    student?.faceRegistered ||
    (student?.faceEmbedding && student.faceEmbedding.length === 128) ||
    faceRecord
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        registered: isRegistered,
        registeredAt: student?.faceRegisteredAt || faceRecord?.registeredAt,
      },
      'Face status fetched successfully'
    )
  );
});

export {
  getClasses,
  verifyQR,
  verifyFace,
  getAttendanceHistory,
  getAttendanceStats,
  registerFace,
  getFaceStatus,
  getStudentTimetable,
};