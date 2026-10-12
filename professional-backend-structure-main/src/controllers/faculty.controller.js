import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Class } from '../models/class.model.js';
import { AttendanceUser } from '../models/attendanceUser.model.js';
import { AttendanceSession } from '../models/attendanceSession.model.js';
import { Attendance } from '../models/attendance.model.js';
import { Department } from '../models/department.model.js';
import { TimetableSchedule } from '../models/timetableSchedule.model.js';
import crypto from 'crypto';

// Student management

/**
 * Get students by department (for faculty to add to classes)
 * @route GET /api/faculty/students
 * @access Faculty only
 */
const getStudentsByDepartment = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;
  const { departmentId, search } = req.query;

  // Get faculty's department if not specified
  const faculty = await AttendanceUser.findById(facultyId);
  const targetDepartment = departmentId || faculty.department;

  // Build query
  const query = {
    role: 'student',
    isActive: true,
  };

  if (targetDepartment) {
    query.department = targetDepartment;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { enrollmentNumber: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const students = await AttendanceUser.find(query)
    .select('name email enrollmentNumber department batch semester faceRegistered')
    .populate('department', 'name code')
    .sort({ name: 1 })
    .limit(100);

  return res
    .status(200)
    .json(new ApiResponse(200, students, 'Students fetched successfully'));
});

/**
 * Get departments list (for faculty)
 * @route GET /api/faculty/departments
 * @access Faculty only
 */
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true })
    .select('name code')
    .sort({ name: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, departments, 'Departments fetched successfully'));
});

// Class management

/**
 * Create a new class
 * @route POST /api/faculty/class
 * @access Faculty only
 */
const createClass = asyncHandler(async (req, res) => {
  const { name, subjectCode, subjectName, department, schedule, academicYear, semester, credits } = req.body;
  const facultyId = req.user._id;

  // Check if class with same subject code exists for this faculty
  const existingClass = await Class.findOne({
    faculty: facultyId,
    subjectCode,
  });

  if (existingClass) {
    throw new ApiError(409, 'Class with this subject code already exists');
  }

  const newClass = await Class.create({
    name,
    subjectCode,
    subjectName: subjectName || name,
    department,
    faculty: facultyId,
    schedule: schedule || [],
    academicYear: academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    semester: semester || 1,
    credits: credits || 3,
    students: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newClass, 'Class created successfully'));
});

/**
 * Get all classes for faculty
 * @route GET /api/faculty/classes
 * @access Faculty only
 */
const getClasses = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  const classes = await Class.find({ faculty: facultyId, isActive: true })
    .populate('students', 'name email enrollmentNumber department')
    .populate('department', 'name code')
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, classes, 'Classes fetched successfully'));
});

/**
 * Get single class
 * @route GET /api/faculty/class/:id
 * @access Faculty only
 */
const getClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const facultyId = req.user._id;

  const classData = await Class.findOne({
    _id: id,
    faculty: facultyId,
  })
    .populate('students', 'name email enrollmentNumber department faceRegistered')
    .populate('department', 'name code');

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, classData, 'Class fetched successfully'));
});

/**
 * Update class
 * @route PATCH /api/faculty/class/:id
 * @access Faculty only
 */
const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const facultyId = req.user._id;
  const { name, subjectCode, schedule } = req.body;

  const classData = await Class.findOneAndUpdate(
    { _id: id, faculty: facultyId },
    { name, subjectCode, schedule },
    { new: true, runValidators: true }
  );

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, classData, 'Class updated successfully'));
});

/**
 * Delete class
 * @route DELETE /api/faculty/class/:id
 * @access Faculty only
 */
const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const facultyId = req.user._id;

  const classData = await Class.findOneAndDelete({
    _id: id,
    faculty: facultyId,
  });

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Class deleted successfully'));
});

/**
 * Add students to class
 * @route POST /api/faculty/class/:classId/students
 * @access Faculty only
 */
const addStudentsToClass = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { studentIds } = req.body;
  const facultyId = req.user._id;

  const classData = await Class.findOne({
    _id: classId,
    faculty: facultyId,
  });

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  // Add students (avoid duplicates)
  const existingStudents = classData.students.map((s) => s.toString());
  const newStudents = studentIds.filter((id) => !existingStudents.includes(id));

  classData.students = [...classData.students, ...newStudents];
  await classData.save();

  return res
    .status(200)
    .json(new ApiResponse(200, classData, 'Students added successfully'));
});

/**
 * Remove student from class
 * @route DELETE /api/faculty/class/:classId/student/:studentId
 * @access Faculty only
 */
const removeStudentFromClass = asyncHandler(async (req, res) => {
  const { classId, studentId } = req.params;
  const facultyId = req.user._id;

  const classData = await Class.findOne({
    _id: classId,
    faculty: facultyId,
  });

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  classData.students = classData.students.filter(
    (s) => s.toString() !== studentId
  );
  await classData.save();

  return res
    .status(200)
    .json(new ApiResponse(200, classData, 'Student removed successfully'));
});

// Session management

/**
 * Start attendance session
 * @route POST /api/faculty/session/start
 * @access Faculty only
 */
const startSession = asyncHandler(async (req, res) => {
  const { classId, bleEnabled, bleRssiThreshold } = req.body;
  const facultyId = req.user._id;

  // Verify class belongs to faculty
  const classData = await Class.findOne({
    _id: classId,
    faculty: facultyId,
  });

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  // Check if there's already an active session for this class
  const activeSession = await AttendanceSession.findOne({
    classId,
    isActive: true,
  });

  if (activeSession) {
    throw new ApiError(400, 'An active session already exists for this class');
  }

  // Generate QR secret
  const qrSecret = crypto.randomBytes(32).toString('hex');
  const sessionToken = crypto.randomBytes(32).toString('hex');

  // Generate BLE credentials if proximity verification is requested (Upgrade 2)
  const isBle = Boolean(bleEnabled);
  const bleServiceUuid = isBle ? crypto.randomUUID() : null;
  const bleBeaconSecret = isBle ? crypto.randomBytes(16).toString('hex') : null;
  const bleBeaconToken = isBle ? crypto.randomBytes(8).toString('hex') : null;

  const session = await AttendanceSession.create({
    classId,
    facultyId,
    qrSecret,
    sessionToken,
    startTime: new Date(),
    isActive: true,
    bleEnabled: isBle,
    bleServiceUuid,
    bleBeaconSecret,
    bleBeaconToken,
    bleRssiThreshold: typeof bleRssiThreshold === 'number' ? bleRssiThreshold : -75,
  });

  // Generate QR signature
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', qrSecret)
    .update(`${session._id}:${timestamp}`)
    .digest('hex');

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: session._id,
        classId,
        startTime: session.startTime,
        qrSignature: signature,
        timestamp,
        bleEnabled: isBle,
        bleServiceUuid,
        bleBeaconToken,
        bleRssiThreshold: session.bleRssiThreshold,
      },
      'Session started successfully'
    )
  );
});

/**
 * End attendance session
 * @route POST /api/faculty/session/end
 * @access Faculty only
 */
const endSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const facultyId = req.user._id;

  const session = await AttendanceSession.findOne({
    _id: sessionId,
    facultyId,
    isActive: true,
  });

  if (!session) {
    throw new ApiError(404, 'Active session not found');
  }

  session.isActive = false;
  session.endTime = new Date();
  await session.save();

  // Get attendance summary
  const presentCount = await Attendance.countDocuments({
    sessionId,
    status: 'present',
  });

  const classData = await Class.findById(session.classId);
  const totalStudents = classData?.students?.length || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessionId,
        endTime: session.endTime,
        presentCount,
        absentCount: totalStudents - presentCount,
        totalStudents,
      },
      'Session ended successfully'
    )
  );
});

/**
 * Get active session for a class
 * @route GET /api/faculty/session/active/:classId
 * @access Faculty only
 */
const getActiveSession = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const facultyId = req.user._id;

  // Must select qrSecret explicitly since it has select: false in schema
  const session = await AttendanceSession.findOne({
    classId,
    facultyId,
    isActive: true,
  }).select('+qrSecret');

  if (!session) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'No active session'));
  }

  // Generate new QR signature for refresh
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha256', session.qrSecret)
    .update(`${session._id}:${timestamp}`)
    .digest('hex');

  // Get real attendance count
  const presentCount = await Attendance.countDocuments({
    sessionId: session._id,
    status: 'present',
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: session._id,
        classId,
        startTime: session.startTime,
        qrSignature: signature,
        timestamp,
        presentCount,
      },
      'Active session found'
    )
  );
});

/**
 * Get session history for a class
 * @route GET /api/faculty/session/history/:classId
 * @access Faculty only
 */
const getSessionHistory = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const facultyId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  // Verify class belongs to faculty
  const classData = await Class.findOne({
    _id: classId,
    faculty: facultyId,
  });

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  const sessions = await AttendanceSession.find({ classId })
    .sort({ startTime: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await AttendanceSession.countDocuments({ classId });

  // Get attendance count for each session
  const sessionsWithAttendance = await Promise.all(
    sessions.map(async (session) => {
      const presentCount = await Attendance.countDocuments({
        sessionId: session._id,
        status: 'present',
      });
      return {
        ...session.toObject(),
        presentCount,
        totalStudents: classData.students?.length || 0,
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessions: sessionsWithAttendance,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
      'Session history fetched successfully'
    )
  );
});

// Attendance reports

/**
 * Get class attendance report
 * @route GET /api/faculty/report/class/:classId
 * @access Faculty only
 */
const getClassReport = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const facultyId = req.user._id;

  // Verify class belongs to faculty
  const classData = await Class.findOne({
    _id: classId,
    faculty: facultyId,
  })
    .populate('students', 'name email enrollmentNumber')
    .populate('department', 'name code');

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  // Get all sessions for this class
  const sessions = await AttendanceSession.find({ classId }).sort({ startTime: -1 });
  const totalSessions = sessions.length;

  // Get attendance for each student
  const studentsWithAttendance = await Promise.all(
    classData.students.map(async (student) => {
      const presentCount = await Attendance.countDocuments({
        sessionId: { $in: sessions.map((s) => s._id) },
        studentId: student._id,
        status: 'present',
      });

      const absentCount = totalSessions - presentCount;
      const attendancePercentage = totalSessions > 0 
        ? Math.round((presentCount / totalSessions) * 100) 
        : 0;

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        enrollmentNumber: student.enrollmentNumber,
        presentCount,
        absentCount,
        attendancePercentage,
      };
    })
  );

  // Calculate average attendance
  const averageAttendance = studentsWithAttendance.length > 0
    ? Math.round(
        studentsWithAttendance.reduce((sum, s) => sum + s.attendancePercentage, 0) /
          studentsWithAttendance.length
      )
    : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        class: classData,
        totalSessions,
        totalStudents: classData.students.length,
        averageAttendance,
        students: studentsWithAttendance,
        sessions: sessions.map((s) => ({
          _id: s._id,
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive,
        })),
      },
      'Class report fetched successfully'
    )
  );
});

/**
 * Get session attendance report
 * @route GET /api/faculty/report/session/:sessionId
 * @access Faculty only
 */
const getSessionReport = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const facultyId = req.user._id;

  const session = await AttendanceSession.findOne({
    _id: sessionId,
    facultyId,
  }).populate('classId', 'name subjectCode');

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  const attendance = await Attendance.find({ sessionId })
    .populate('studentId', 'name email enrollmentNumber')
    .sort({ markedAt: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, { session, attendance }, 'Session report fetched successfully'));
});

/**
 * Export class report as CSV
 * @route GET /api/faculty/report/class/:classId/csv
 * @access Faculty only
 */
const exportClassCSV = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const facultyId = req.user._id;

  // Verify class belongs to faculty
  const classData = await Class.findOne({
    _id: classId,
    faculty: facultyId,
  }).populate('students', 'name email enrollmentNumber');

  if (!classData) {
    throw new ApiError(404, 'Class not found');
  }

  const sessions = await AttendanceSession.find({ classId });

  // Build CSV
  const headers = ['Name', 'Email', 'Enrollment No.', 'Present', 'Absent', 'Attendance %'];
  const rows = await Promise.all(
    classData.students.map(async (student) => {
      const presentCount = await Attendance.countDocuments({
        sessionId: { $in: sessions.map((s) => s._id) },
        studentId: student._id,
        status: 'present',
      });
      const absentCount = sessions.length - presentCount;
      const percentage = sessions.length > 0 
        ? Math.round((presentCount / sessions.length) * 100) 
        : 0;

      return [student.name, student.email, student.enrollmentNumber, presentCount, absentCount, `${percentage}%`];
    })
  );

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="attendance_${classId}.csv"`);
  res.send(csv);
});

// Debarment watchlist

/**
 * Get predictive debarment watchlist for a class
 * @route GET /api/faculty/classes/:id/debarment-watchlist
 * @access Faculty only
 */
const getClassDebarmentWatchlist = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const facultyId = req.user._id;

  const classData = await Class.findOne({ _id: classId, faculty: facultyId }).populate(
    'students',
    'name email enrollmentNumber faceRegistered'
  );

  if (!classData) {
    throw new ApiError(404, 'Class not found or unauthorized');
  }

  const totalPlanned = classData.totalPlannedSessions || 40;
  const sessions = await AttendanceSession.find({ classId });
  const conducted = sessions.length;
  const sessionIds = sessions.map((s) => s._id);
  const remaining = Math.max(0, totalPlanned - conducted);

  const studentWatchlist = await Promise.all(
    classData.students.map(async (student) => {
      const attended = await Attendance.countDocuments({
        sessionId: { $in: sessionIds },
        studentId: student._id,
        status: 'present',
      });

      const currentRate = conducted > 0 ? Math.round((attended / conducted) * 100) : 100;
      const maxAchievableRate = Math.min(
        100,
        Math.round(((attended + remaining) / totalPlanned) * 100)
      );
      const requiredSessions = Math.max(0, Math.ceil(0.75 * totalPlanned) - attended);

      // Debarment Risk Index (DRI) calculation
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
        studentId: student._id,
        name: student.name,
        email: student.email,
        enrollmentNumber: student.enrollmentNumber || 'N/A',
        faceRegistered: Boolean(student.faceRegistered),
        attended,
        conducted,
        remaining,
        currentRate,
        maxAchievableRate,
        requiredSessions,
        dri,
        riskLevel,
      };
    })
  );

  // Sort: DEBARRED and CRITICAL first, then WARNING, then SAFE
  const severityOrder = { DEBARRED: 0, CRITICAL: 1, WARNING: 2, SAFE: 3 };
  studentWatchlist.sort((a, b) => severityOrder[a.riskLevel] - severityOrder[b.riskLevel] || b.dri - a.dri);

  const summary = {
    totalStudents: studentWatchlist.length,
    debarredCount: studentWatchlist.filter((s) => s.riskLevel === 'DEBARRED').length,
    criticalCount: studentWatchlist.filter((s) => s.riskLevel === 'CRITICAL').length,
    warningCount: studentWatchlist.filter((s) => s.riskLevel === 'WARNING').length,
    safeCount: studentWatchlist.filter((s) => s.riskLevel === 'SAFE').length,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        class: {
          _id: classData._id,
          name: classData.name,
          subjectCode: classData.subjectCode,
          totalPlanned,
          conducted,
          remaining,
        },
        summary,
        watchlist: studentWatchlist,
      },
      'Debarment watchlist fetched successfully'
    )
  );
});

// Timetable engine

/**
 * Get faculty weekly timetable
 * @route GET /api/faculty/timetable
 * @access Faculty only
 */
const getFacultyTimetable = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;

  const timetable = await TimetableSchedule.find({
    facultyId,
    isActive: true,
  })
    .populate('classId', 'name subjectCode room')
    .sort({ dayOfWeek: 1, startTime: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, timetable, 'Faculty timetable fetched successfully'));
});

/**
 * Create timetable schedule slot
 * @route POST /api/faculty/timetable
 * @access Faculty only
 */
const createTimetableSlot = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;
  const { classId, roomNumber, dayOfWeek, startTime, endTime, autoStart, autoEnd } = req.body;

  const classData = await Class.findOne({ _id: classId, faculty: facultyId });
  if (!classData) {
    throw new ApiError(404, 'Class not found or unauthorized');
  }

  const slot = await TimetableSchedule.create({
    classId,
    facultyId,
    roomNumber: roomNumber || 'Room 101',
    dayOfWeek: Number(dayOfWeek),
    startTime,
    endTime,
    autoStart: autoStart !== false,
    autoEnd: autoEnd !== false,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, slot, 'Timetable slot created successfully'));
});

/**
 * Delete timetable schedule slot
 * @route DELETE /api/faculty/timetable/:id
 * @access Faculty only
 */
const deleteTimetableSlot = asyncHandler(async (req, res) => {
  const facultyId = req.user._id;
  const { id } = req.params;

  const slot = await TimetableSchedule.findOneAndDelete({ _id: id, facultyId });
  if (!slot) {
    throw new ApiError(404, 'Timetable slot not found or unauthorized');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Timetable slot deleted successfully'));
});

export {
  getStudentsByDepartment,
  getDepartments,
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  addStudentsToClass,
  removeStudentFromClass,
  startSession,
  endSession,
  getActiveSession,
  getSessionHistory,
  getClassReport,
  getSessionReport,
  exportClassCSV,
  getClassDebarmentWatchlist,
  getFacultyTimetable,
  createTimetableSlot,
  deleteTimetableSlot,
};