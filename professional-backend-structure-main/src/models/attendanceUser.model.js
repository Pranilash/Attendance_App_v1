import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const attendanceUserSchema = new Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    // Role and Department
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: [true, "Role is required"],
      default: "student",
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    // Student-specific fields
    enrollmentNumber: {
      type: String,
      unique: true,
      sparse: true, // Only required for students
      trim: true,
      uppercase: true,
    },
    batch: {
      type: String,
      trim: true,
    },
    semester: {
      type: Number,
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester cannot exceed 8"],
    },
    // Faculty-specific fields
    employeeId: {
      type: String,
      unique: true,
      sparse: true, // Only required for faculty/admin
      trim: true,
      uppercase: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    // Face Registration
    faceEmbeddingId: {
      type: Schema.Types.ObjectId,
      ref: "FaceEmbedding",
    },
    faceRegistered: {
      type: Boolean,
      default: false,
    },
    faceEmbedding: {
      type: [Number],
      select: false,
    },
    faceRegisteredAt: {
      type: Date,
    },
    // Profile
    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Authentication
    refreshToken: {
      type: String,
      select: false,
    },
    // Login tracking
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    // Password reset
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    // Additional fields
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
attendanceUserSchema.index({ email: 1 });
attendanceUserSchema.index({ enrollmentNumber: 1 }, { sparse: true });
attendanceUserSchema.index({ employeeId: 1 }, { sparse: true });
attendanceUserSchema.index({ department: 1, role: 1 });
attendanceUserSchema.index({ isActive: 1 });

// Hash password before saving
attendanceUserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
attendanceUserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
attendanceUserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
      department: this.department,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    }
  );
};

// Generate Refresh Token
attendanceUserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    }
  );
};

// Generate Password Reset Token
attendanceUserSchema.methods.generatePasswordResetToken = function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 3600000; // 1 hour

  return resetToken;
};

// Update last login
attendanceUserSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Static method to find students by department
attendanceUserSchema.statics.findStudentsByDepartment = function (departmentId) {
  return this.find({ department: departmentId, role: "student", isActive: true });
};

// Static method to find faculty by department
attendanceUserSchema.statics.findFacultyByDepartment = function (departmentId) {
  return this.find({ department: departmentId, role: "faculty", isActive: true });
};

// Static method to get user statistics
attendanceUserSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
        },
        faceRegistered: {
          $sum: { $cond: [{ $eq: ["$faceRegistered", true] }, 1, 0] },
        },
      },
    },
  ]);

  return stats.reduce((acc, curr) => {
    acc[curr._id] = {
      total: curr.count,
      active: curr.active,
      faceRegistered: curr.faceRegistered,
    };
    return acc;
  }, {});
};

// Method to get public profile
attendanceUserSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

// Virtual for full profile URL
attendanceUserSchema.virtual("profileUrl").get(function () {
  return `/api/v1/users/${this._id}`;
});

export const AttendanceUser = mongoose.model(
  "AttendanceUser",
  attendanceUserSchema
);
