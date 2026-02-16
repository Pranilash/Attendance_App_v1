import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AttendanceUser } from "../models/attendanceUser.model.js";
import { Department } from "../models/department.model.js";
import jwt from "jsonwebtoken";

/**
 * Authentication Controller
 * 
 * Handles user registration, login, logout, and token management.
 */

/**
 * Generate Access and Refresh Tokens
 * @param {string} userId - User ID
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await AttendanceUser.findById(userId);
    
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating tokens: " + error.message
    );
  }
};

/**
 * Register a new user
 * Admin can create any role, others cannot register
 */
const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    department,
    enrollmentNumber,
    batch,
    semester,
    employeeId,
    designation,
  } = req.body;

  // Validate required fields based on role
  if (!name || !email || !password || !role || !department) {
    throw new ApiError(400, "Name, email, password, role, and department are required");
  }

  // Check if department exists
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw new ApiError(400, "Invalid department ID");
  }

  // Validate role-specific fields
  if (role === "student" && !enrollmentNumber) {
    throw new ApiError(400, "Enrollment number is required for students");
  }

  if ((role === "faculty" || role === "admin") && !employeeId) {
    throw new ApiError(400, "Employee ID is required for faculty/admin");
  }

  // Check if user already exists
  const existingUser = await AttendanceUser.findOne({
    $or: [{ email }, { enrollmentNumber }, { employeeId }],
  });

  if (existingUser) {
    const field = existingUser.email === email 
      ? "Email" 
      : existingUser.enrollmentNumber === enrollmentNumber 
        ? "Enrollment number" 
        : "Employee ID";
    throw new ApiError(409, field + " already exists");
  }

  // Create user
  const user = await AttendanceUser.create({
    name,
    email,
    password,
    phone,
    role,
    department,
    enrollmentNumber: role === "student" ? enrollmentNumber : undefined,
    batch: role === "student" ? batch : undefined,
    semester: role === "student" ? semester : undefined,
    employeeId: role === "faculty" || role === "admin" ? employeeId : undefined,
    designation: role === "faculty" ? designation : undefined,
  });

  // Get created user without sensitive fields
  const createdUser = await AttendanceUser.findById(user._id)
    .select("-password -refreshToken")
    .populate("department", "name code");

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find user
  const user = await AttendanceUser.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // Verify password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Update last login
  user.lastLogin = new Date();
  user.loginCount = (user.loginCount || 0) + 1;
  await user.save({ validateBeforeSave: false });

  // Get user without sensitive fields
  const loggedInUser = await AttendanceUser.findById(user._id)
    .select("-password -refreshToken")
    .populate("department", "name code");

  // Cookie options
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "Login successful"
      )
    );
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from database
  await AttendanceUser.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "Logout successful"));
});

/**
 * Refresh access token
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    // Verify refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user
    const user = await AttendanceUser.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Verify that the refresh token matches
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is invalid or has been revoked");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid refresh token");
  }
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await AttendanceUser.findById(req.user._id).select("+password");

  // Verify current password
  const isPasswordValid = await user.isPasswordCorrect(currentPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

/**
 * Get current user
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await AttendanceUser.findById(req.user._id)
    .select("-password -refreshToken")
    .populate("department", "name code");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetched successfully"));
});

/**
 * Update profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, dateOfBirth, gender } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;
  if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
  if (gender) updateData.gender = gender;

  const user = await AttendanceUser.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .select("-password -refreshToken")
    .populate("department", "name code");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile updated successfully"));
});

/**
 * Register a new student (public registration)
 */
const registerStudent = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    department,
    enrollmentNumber,
    batch,
    semester,
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !department || !enrollmentNumber) {
    throw new ApiError(400, "Name, email, password, department, and enrollment number are required");
  }

  // Check if department exists
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw new ApiError(400, "Invalid department ID");
  }

  // Check if user already exists
  const existingUser = await AttendanceUser.findOne({
    $or: [{ email }, { enrollmentNumber }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Enrollment number";
    throw new ApiError(409, field + " already exists");
  }

  // Create student
  const user = await AttendanceUser.create({
    name,
    email,
    password,
    phone,
    role: "student",
    department,
    enrollmentNumber,
    batch,
    semester,
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // Get created user without sensitive fields
  const createdUser = await AttendanceUser.findById(user._id)
    .select("-password -refreshToken")
    .populate("department", "name code");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(201, { user: createdUser, accessToken }, "Student registered successfully")
    );
});

/**
 * Register a new faculty (public registration)
 */
const registerFaculty = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    department,
    employeeId,
    designation,
  } = req.body;

  // Validate required fields
  if (!name || !email || !password || !department || !employeeId) {
    throw new ApiError(400, "Name, email, password, department, and employee ID are required");
  }

  // Check if department exists
  const departmentExists = await Department.findById(department);
  if (!departmentExists) {
    throw new ApiError(400, "Invalid department ID");
  }

  // Check if user already exists
  const existingUser = await AttendanceUser.findOne({
    $or: [{ email }, { employeeId }],
  });

  if (existingUser) {
    const field = existingUser.email === email ? "Email" : "Employee ID";
    throw new ApiError(409, field + " already exists");
  }

  // Create faculty
  const user = await AttendanceUser.create({
    name,
    email,
    password,
    phone,
    role: "faculty",
    department,
    employeeId,
    designation,
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  // Get created user without sensitive fields
  const createdUser = await AttendanceUser.findById(user._id)
    .select("-password -refreshToken")
    .populate("department", "name code");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(201, { user: createdUser, accessToken }, "Faculty registered successfully")
    );
});

export {
  register,
  registerStudent,
  registerFaculty,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateProfile,
};