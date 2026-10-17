import mongoose, { Schema } from "mongoose";

const attendanceChallengeSchema = new Schema(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUser",
      required: [true, "Student ID is required"],
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: [true, "Session ID is required"],
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class ID is required"],
    },
    nonce: {
      type: String,
      required: [true, "Challenge nonce is required"],
      unique: true,
      index: true,
    },
    qrTimestamp: {
      type: Number,
      required: true,
    },
    actionSequence: {
      type: [String],
      default: ["blink", "turnLeft", "turnRight"],
    },
    bleVerified: {
      type: Boolean,
      default: false,
    },
    bleRssi: {
      type: Number,
      default: null,
    },
    consumed: {
      type: Boolean,
      default: false,
      index: true,
    },
    consumedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire documents from MongoDB after expiresAt
attendanceChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
attendanceChallengeSchema.index(
  { _id: 1, studentId: 1, sessionId: 1, consumed: 1 }
);

export const AttendanceChallenge = mongoose.model(
  "AttendanceChallenge",
  attendanceChallengeSchema
);
