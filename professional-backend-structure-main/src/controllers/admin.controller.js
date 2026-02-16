import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AttendanceUser } from '../models/attendanceUser.model.js';
import { Department } from '../models/department.model.js';
import { Class } from '../models/class.model.js';
import { Attendance } from '../models/attendance.model.js';
import { AttendanceSession } from '../models/attendanceSession.model.js';

// ==================== DEPARTMENT MANAGEMENT ====================

/**
 * Create a new department
 * @route POST /api/admin/department
 * @access Admin only
 */
const createDepartment = asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;

  // Check if department already exists
  const existingDepartment = await Department.findOne({
    $or: [{ name }, { code }],
  });

  if (existingDepartment) {
    throw new ApiError(409, 'Department with this name or code already exists');
  }

  const department = await Department.create({
    name,
    code,
    description,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, department, 'Department created successfully'));
});

/**
 * Get all departments
 * @route GET /api/admin/departments
 * @access Admin only
 */
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({ isActive: true }).sort({ name: 1 });

  const departmentsWithCounts = await Promise.all(
    departments.map(async (dept) => {
      const facultyCount = await AttendanceUser.countDocuments({ department: dept._id, role: 'faculty', isActive: true });
      const studentCount = await AttendanceUser.countDocuments({ department: dept._id, role: 'student', isActive: true });
      return { ...dept.toObject(), facultyCount, studentCount };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, departmentsWithCounts, 'Departments fetched successfully'));
});

/**
 * Update department
 * @route PATCH /api/admin/department/:id
 * @access Admin only
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, description } = req.body;

  const department = await Department.findByIdAndUpdate(
    id,
    { name, code, description },
    { new: true, runValidators: true }
  );

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, department, 'Department updated successfully'));
});

/**
 * Delete department
 * @route DELETE /api/admin/department/:id
 * @access Admin only
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!department) {
    throw new ApiError(404, 'Department not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Department deleted successfully'));
});

// ==================== FACULTY MANAGEMENT ====================

/**
 * Get all faculty
 * @route GET /api/admin/faculty
 * @access Admin only
 */
const getFaculty = asyncHandler(async (req, res) => {
  const faculty = await AttendanceUser.find({ role: 'faculty' })
    .populate('department', 'name code')
    .select('-password -refreshToken -faceEmbedding')
    .sort({ createdAt: -1 });

  // Get class count for each faculty
  const facultyWithClasses = await Promise.all(
    faculty.map(async (fac) => {
      const classesCount = await Class.countDocuments({ faculty: fac._id });
      return { ...fac.toObject(), classesCount };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, facultyWithClasses, 'Faculty fetched successfully'));
});

/**
 * Create a new faculty member
 * @route POST /api/admin/faculty
 * @access Admin only
 */
const createFaculty = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department, employeeId, designation } = req.body;

  if (!name || !email || !password || !department) {
    throw new ApiError(400, 'Name, email, password, and department are required');
  }

  const existingUser = await AttendanceUser.findOne({ $or: [{ email }, ...(employeeId ? [{ employeeId }] : [])] });
  if (existingUser) {
    throw new ApiError(409, 'User with this email or employee ID already exists');
  }

  const user = await AttendanceUser.create({
    name,
    email,
    password,
    phone,
    role: 'faculty',
    department,
    employeeId: employeeId || `FAC${Date.now()}`,
    designation,
    isActive: true,
  });

  const createdUser = await AttendanceUser.findById(user._id)
    .select('-password -refreshToken')
    .populate('department', 'name code');

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'Faculty created successfully'));
});

/**
 * Update faculty
 * @route PATCH /api/admin/faculty/:id
 * @access Admin only
 */
const updateFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, department, isActive } = req.body;

  const updateData = { name, email, department, isActive };
  if (password) {
    updateData.password = password; // Will be hashed by pre-save middleware
  }

  const faculty = await AttendanceUser.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password -refreshToken -faceEmbedding');

  if (!faculty) {
    throw new ApiError(404, 'Faculty not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, faculty, 'Faculty updated successfully'));
});

/**
 * Delete faculty
 * @route DELETE /api/admin/faculty/:id
 * @access Admin only
 */
const deleteFaculty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faculty = await AttendanceUser.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!faculty) {
    throw new ApiError(404, 'Faculty not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Faculty deleted successfully'));
});

// ==================== STUDENT MANAGEMENT ====================

/**
 * Get all students
 * @route GET /api/admin/students
 * @access Admin only
 */
const getStudents = asyncHandler(async (req, res) => {
  const { department, page = 1, limit = 20 } = req.query;

  const query = { role: 'student' };
  if (department) query.department = department;

  const students = await AttendanceUser.find(query)
    .populate('department', 'name code')
    .select('-password -refreshToken -faceEmbedding')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await AttendanceUser.countDocuments(query);

  // Get attendance rate for each student
  const studentsWithAttendance = await Promise.all(
    students.map(async (student) => {
      const totalClasses = await Attendance.countDocuments({ studentId: student._id });
      const presentClasses = await Attendance.countDocuments({
        studentId: student._id,
        status: 'present',
      });
      const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
      return {
        ...student.toObject(),
        attendanceRate,
        faceRegistered: !!student.faceEmbedding,
      };
    })
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        students: studentsWithAttendance,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
      },
      'Students fetched successfully'
    )
  );
});

/**
 * Create a new student
 * @route POST /api/admin/student
 * @access Admin only
 */
const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, phone, department, enrollmentNumber, batch, semester } = req.body;

  if (!name || !email || !password || !department || !enrollmentNumber) {
    throw new ApiError(400, 'Name, email, password, department, and enrollment number are required');
  }

  const existingUser = await AttendanceUser.findOne({ $or: [{ email }, { enrollmentNumber }] });
  if (existingUser) {
    throw new ApiError(409, 'User with this email or enrollment number already exists');
  }

  const user = await AttendanceUser.create({
    name,
    email,
    password,
    phone,
    role: 'student',
    department,
    enrollmentNumber,
    batch,
    semester,
    isActive: true,
  });

  const createdUser = await AttendanceUser.findById(user._id)
    .select('-password -refreshToken')
    .populate('department', 'name code');

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, 'Student created successfully'));
});

/**
 * Update student
 * @route PATCH /api/admin/student/:id
 * @access Admin only
 */
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, department, enrollmentNumber, isActive } = req.body;

  const updateData = { name, email, department, enrollmentNumber, isActive };
  if (password) {
    updateData.password = password;
  }

  const student = await AttendanceUser.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).select('-password -refreshToken -faceEmbedding');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, student, 'Student updated successfully'));
});

/**
 * Delete student
 * @route DELETE /api/admin/student/:id
 * @access Admin only
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await AttendanceUser.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Student deleted successfully'));
});

// ==================== DASHBOARD STATS ====================

/**
 * Get admin dashboard stats
 * @route GET /api/admin/stats
 * @access Admin only
 */
const getStats = asyncHandler(async (req, res) => {
  const totalStudents = await AttendanceUser.countDocuments({ role: 'student', isActive: true });
  const totalFaculty = await AttendanceUser.countDocuments({ role: 'faculty', isActive: true });
  const totalDepartments = await Department.countDocuments({ isActive: true });
  const totalClasses = await Class.countDocuments({ isActive: true });

  // Today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await Attendance.countDocuments({
    timestamp: { $gte: today },
    status: 'present',
  });

  // Active sessions
  const activeSessions = await AttendanceSession.countDocuments({ isActive: true });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalClasses,
        todayAttendance,
        activeSessions,
      },
      'Stats fetched successfully'
    )
  );
});

export {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  createFaculty,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  getStats,
};