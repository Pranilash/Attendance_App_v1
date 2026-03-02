import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AttendanceUser } from '../models/attendanceUser.model.js';
import { Class } from '../models/class.model.js';
import { AttendanceSession } from '../models/attendanceSession.model.js';
import { Attendance } from '../models/attendance.model.js';
import { FaceEmbedding } from '../models/faceEmbedding.model.js';
import crypto from 'crypto';
import { verifyFaceEmbedding } from '../utils/faceVerification.util.js';

// ==================== CLASS VIEWS ====================

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

// ==================== QR VERIFICATION ====================

/**
 * Verify QR code
 * @route POST /api/student/attendance/verify-qr
 * @access Student only
 */
const verifyQR = asyncHandler(async (req, res) => {
  const { qrPayload } = req.body;
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

  // Find session - must select qrSecret explicitly since it has select: false
  const session = await AttendanceSession.findById(sessionId).select('+qrSecret');
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  if (!session.isActive) {
    throw new ApiError(400, 'Session has ended');
  }

  // Verify timestamp (30 seconds expiry to account for scan + network latency)
  const currentTime = Date.now();
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
  if (!student.faceEmbedding) {
    throw new ApiError(400, 'Please register your face before marking attendance');
  }

  // Return session info for face verification
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessionId,
        classId: session.classId,
        className: classData.name,
        subjectCode: classData.subjectCode,
        message: 'QR verified. Please proceed with face verification.',
      },
      'QR code verified successfully'
    )
  );
});

// ==================== FACE VERIFICATION ====================

/**
 * Verify face and mark attendance
 * @route POST /api/student/attendance/verify-face
 * @access Student only
 */
const verifyFace = asyncHandler(async (req, res) => {
  const { sessionId, embedding, image, livenessPassed } = req.body;
  const studentId = req.user._id;

  // Validate session
  const session = await AttendanceSession.findById(sessionId);
  if (!session || !session.isActive) {
    throw new ApiError(400, 'Session not found or has ended');
  }

  // Check if already marked
  const existingAttendance = await Attendance.findOne({
    sessionId,
    studentId,
  });

  if (existingAttendance) {
    throw new ApiError(400, 'Attendance already marked for this session');
  }

  // Get stored face embedding
  const student = await AttendanceUser.findById(studentId).select('+faceEmbedding');
  if (!student || !student.faceEmbedding) {
    throw new ApiError(400, 'Face not registered. Please register your face first.');
  }

  // Compare face embeddings
  const storedEmbedding = student.faceEmbedding;
  const result = verifyFaceEmbedding(embedding, storedEmbedding);
  const faceMatch = result.isMatch;

  if (!faceMatch) {
    throw new ApiError(400, 'Face verification failed. Face does not match.');
  }

  // Check liveness
  if (!livenessPassed) {
    throw new ApiError(400, 'Liveness check failed. Please try again.');
  }

  // Create attendance record
  const attendance = await Attendance.create({
    sessionId,
    studentId,
    classId: session.classId,
    status: 'present',
    qrVerified: true,
    faceVerified: true,
    timestamp: new Date(),
  });

  // Get class info
  const classData = await Class.findById(session.classId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        attendanceId: attendance._id,
        timestamp: attendance.timestamp,
        className: classData?.name,
        subjectCode: classData?.subjectCode,
        status: 'present',
      },
      'Attendance marked successfully'
    )
  );
});

// ==================== ATTENDANCE HISTORY ====================

/**
 * Get attendance history
 * @route GET /api/student/attendance/history
 * @access Student only
 */
const getAttendanceHistory = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

  // Build query
  const query = { studentId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
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
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Attendance.countDocuments(query);

  // Format records
  const formattedRecords = records.map((record) => ({
    _id: record._id,
    timestamp: record.timestamp,
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
  const absentCount = totalSessions - presentCount;

  // Calculate attendance rate
  const attendanceRate = totalSessions > 0 
    ? Math.round((presentCount / totalSessions) * 100) 
    : 0;

  // Check face registration status
  const student = await AttendanceUser.findById(studentId);
  const faceRegistered = !!student.faceEmbedding;

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
      },
      'Attendance stats fetched successfully'
    )
  );
});

// ==================== FACE REGISTRATION ====================

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
    throw new ApiError(400, 'Invalid face embedding');
  }

  // Update student with face embedding
  const student = await AttendanceUser.findByIdAndUpdate(
    studentId,
    { faceEmbedding: embedding },
    { new: true }
  ).select('-password -refreshToken');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Store face embedding record
  await FaceEmbedding.findOneAndUpdate(
    { userId: studentId },
    {
      userId: studentId,
      embedding,
      registeredAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { registered: true }, 'Face registered successfully'));
});

/**
 * Get face registration status
 * @route GET /api/student/face/status
 * @access Student only
 */
const getFaceStatus = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const faceRecord = await FaceEmbedding.findOne({ userId: studentId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        registered: !!faceRecord,
        registeredAt: faceRecord?.registeredAt,
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
};