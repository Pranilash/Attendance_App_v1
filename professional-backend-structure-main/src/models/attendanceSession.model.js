import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const attendanceSessionSchema = new Schema(
  {
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
    },
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUser",
      required: [true, "Faculty ID is required"],
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    qrSecret: {
      type: String,
      required: true,
      select: false, // Don't include in queries by default for security
    },
    qrRefreshInterval: {
      type: Number,
      default: 15, // seconds
      min: [5, "QR refresh interval must be at least 5 seconds"],
      max: [60, "QR refresh interval cannot exceed 60 seconds"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    scheduledEndTime: {
      type: Date,
    },
    duration: {
      type: Number, // in minutes
      default: 60,
      min: [5, "Duration must be at least 5 minutes"],
      max: [180, "Duration cannot exceed 180 minutes"],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
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
      radius: {
        type: Number,
        default: 100, // meters
        min: [10, "Radius must be at least 10 meters"],
        max: [1000, "Radius cannot exceed 1000 meters"],
      },
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      deviceInfo: {
        type: String,
      },
      ipAddress: {
        type: String,
      },
      userAgent: {
        type: String,
      },
    },
    settings: {
      allowLateMarking: {
        type: Boolean,
        default: true,
      },
      lateThreshold: {
        type: Number,
        default: 15, // minutes after start time
      },
      requireLocation: {
        type: Boolean,
        default: false,
      },
      requireFaceVerification: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
attendanceSessionSchema.index({ classId: 1, startTime: -1 });
attendanceSessionSchema.index({ facultyId: 1, isActive: 1 });
attendanceSessionSchema.index({ sessionToken: 1 }, { unique: true });
attendanceSessionSchema.index({ isActive: 1, startTime: -1 });

// Generate session token
attendanceSessionSchema.methods.generateSessionToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

// Generate QR secret
attendanceSessionSchema.methods.generateQRSecret = function () {
  return crypto.randomBytes(64).toString("hex");
};

// Generate QR payload with HMAC signature
attendanceSessionSchema.methods.generateQRPayload = function () {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = {
    sessionId: this._id.toString(),
    timestamp: timestamp,
  };

  // Create HMAC signature
  const dataToSign = `${payload.sessionId}:${payload.timestamp}`;
  const signature = crypto
    .createHmac("sha256", this.qrSecret)
    .update(dataToSign)
    .digest("hex");

  return {
    ...payload,
    signature: signature,
  };
};

// Verify QR payload
attendanceSessionSchema.methods.verifyQRPayload = function (payload) {
  const { sessionId, timestamp, signature } = payload;
  const currentTime = Math.floor(Date.now() / 1000);

  // Check if session ID matches
  if (sessionId !== this._id.toString()) {
    return { valid: false, reason: "Invalid session ID" };
  }

  // Check timestamp (within refresh interval)
  const timeDiff = Math.abs(currentTime - timestamp);
  if (timeDiff > this.qrRefreshInterval) {
    return { valid: false, reason: "QR code expired" };
  }

  // Verify signature
  const dataToSign = `${sessionId}:${timestamp}`;
  const expectedSignature = crypto
    .createHmac("sha256", this.qrSecret)
    .update(dataToSign)
    .digest("hex");

  if (signature !== expectedSignature) {
    return { valid: false, reason: "Invalid signature" };
  }

  // Check if session is active
  if (!this.isActive) {
    return { valid: false, reason: "Session is not active" };
  }

  // Check if session has ended
  if (this.endTime) {
    return { valid: false, reason: "Session has ended" };
  }

  return { valid: true };
};

// End session
attendanceSessionSchema.methods.endSession = async function () {
  this.isActive = false;
  this.endTime = new Date();
  return this.save();
};

// Update attendance counts
attendanceSessionSchema.methods.updateCounts = async function (
  presentCount,
  absentCount
) {
  this.presentCount = presentCount;
  this.absentCount = absentCount;
  return this.save();
};

// Static method to get active sessions for a class
attendanceSessionSchema.statics.getActiveSessionsForClass = function (classId) {
  return this.find({ classId, isActive: true }).populate("facultyId", "name email");
};

// Static method to get sessions for a faculty
attendanceSessionSchema.statics.getSessionsForFaculty = function (facultyId) {
  return this.find({ facultyId })
    .sort({ startTime: -1 })
    .populate("classId", "name subjectCode subjectName");
};

// Virtual for session duration in minutes
attendanceSessionSchema.virtual("actualDuration").get(function () {
  if (this.endTime) {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  return null;
});

// Virtual for attendance percentage
attendanceSessionSchema.virtual("attendancePercentage").get(function () {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.presentCount / this.totalStudents) * 100);
});

export const AttendanceSession = mongoose.model(
  "AttendanceSession",
  attendanceSessionSchema
);