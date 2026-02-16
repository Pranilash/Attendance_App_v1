import mongoose, { Schema } from "mongoose";

const attendanceSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: [true, "Session ID is required"],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUser",
      required: [true, "Student ID is required"],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
    },
    // Verification status
    qrVerified: {
      type: Boolean,
      default: false,
    },
    faceVerified: {
      type: Boolean,
      default: false,
    },
    livenessScore: {
      type: Number,
      min: [0, "Liveness score must be between 0 and 1"],
      max: [1, "Liveness score must be between 0 and 1"],
    },
    // Timestamps for each verification step
    qrScannedAt: {
      type: Date,
    },
    faceVerifiedAt: {
      type: Date,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    // Location data
    location: {
      latitude: {
        type: Number,
        min: [-90, "Invalid latitude"],
        max: [90, "Invalid latitude"],
      },
      longitude: {
        type: Number,
        min: [-180, "Invalid longitude"],
        max: [180, "Invalid longitude"],
      },
      accuracy: {
        type: Number, // in meters
      },
    },
    // Device information
    deviceInfo: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    // Face verification details
    faceVerificationDetails: {
      similarityScore: {
        type: Number,
        min: [0, "Similarity score must be between 0 and 1"],
        max: [1, "Similarity score must be between 0 and 1"],
      },
      livenessChecks: {
        blink: {
          type: Boolean,
          default: false,
        },
        headMovement: {
          type: Boolean,
          default: false,
        },
        smile: {
          type: Boolean,
          default: false,
        },
      },
      capturedImageId: {
        type: String, // Cloudinary public ID
      },
    },
    // Status
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      default: "present",
    },
    // Remarks
    remarks: {
      type: String,
      maxlength: [500, "Remarks cannot exceed 500 characters"],
    },
    // For excused absences
    excusedReason: {
      type: String,
    },
    excusedBy: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUser",
    },
    excusedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate attendance for same session and student
attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

// Additional indexes for better query performance
attendanceSchema.index({ studentId: 1, markedAt: -1 });
attendanceSchema.index({ classId: 1, markedAt: -1 });
attendanceSchema.index({ sessionId: 1 });
attendanceSchema.index({ status: 1 });

// Static method to get attendance for a session
attendanceSchema.statics.getAttendanceForSession = function (sessionId) {
  return this.find({ sessionId })
    .populate("studentId", "name email enrollmentNumber avatar")
    .sort({ markedAt: 1 });
};

// Static method to get attendance history for a student
attendanceSchema.statics.getStudentAttendanceHistory = function (
  studentId,
  options = {}
) {
  const { limit = 20, skip = 0, classId } = options;
  const query = { studentId };
  if (classId) query.classId = classId;

  return this.find(query)
    .populate("classId", "name subjectCode subjectName")
    .populate("sessionId", "startTime endTime")
    .sort({ markedAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to get attendance statistics for a student
attendanceSchema.statics.getStudentStats = async function (studentId) {
  const stats = await this.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        late: {
          $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
        },
        excused: {
          $sum: { $cond: [{ $eq: ["$status", "excused"] }, 1, 0] },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalClasses: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      attendancePercentage: 0,
    };
  }

  const { totalClasses, present, absent, late, excused } = stats[0];
  const attendancePercentage =
    totalClasses > 0
      ? Math.round(((present + late + excused) / totalClasses) * 100)
      : 0;

  return {
    totalClasses,
    present,
    absent,
    late,
    excused,
    attendancePercentage,
  };
};

// Static method to get class attendance report
attendanceSchema.statics.getClassReport = async function (classId) {
  return this.aggregate([
    { $match: { classId: new mongoose.Types.ObjectId(classId) } },
    {
      $group: {
        _id: "$studentId",
        totalSessions: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
        },
        late: {
          $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "attendanceusers",
        localField: "_id",
        foreignField: "_id",
        as: "student",
      },
    },
    {
      $unwind: "$student",
    },
    {
      $project: {
        studentId: "$_id",
        name: "$student.name",
        email: "$student.email",
        enrollmentNumber: "$student.enrollmentNumber",
        totalSessions: 1,
        present: 1,
        absent: 1,
        late: 1,
        attendancePercentage: {
          $round: [
            {
              $multiply: [
                {
                  $divide: [
                    { $add: ["$present", "$late"] },
                    "$totalSessions",
                  ],
                },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    { $sort: { name: 1 } },
  ]);
};

// Static method to get session attendance report
attendanceSchema.statics.getSessionReport = async function (sessionId) {
  return this.find({ sessionId })
    .populate("studentId", "name email enrollmentNumber avatar")
    .select("status markedAt qrVerified faceVerified livenessScore")
    .sort({ "studentId.name": 1 });
};

// Method to check if attendance is complete (both QR and face verified)
attendanceSchema.methods.isComplete = function () {
  return this.qrVerified && this.faceVerified;
};

// Method to mark as late
attendanceSchema.methods.markAsLate = function () {
  const sessionStartTime = this.markedAt; // This should be compared with session start
  this.status = "late";
  return this.save();
};

// Method to excuse absence
attendanceSchema.methods.excuseAbsence = function (reason, excusedBy) {
  this.status = "excused";
  this.excusedReason = reason;
  this.excusedBy = excusedBy;
  this.excusedAt = new Date();
  return this.save();
};

export const Attendance = mongoose.model("Attendance", attendanceSchema);