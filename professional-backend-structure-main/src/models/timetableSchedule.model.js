import mongoose, { Schema } from "mongoose";

const timetableScheduleSchema = new Schema(
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
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
      trim: true,
    },
    dayOfWeek: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6, 7], // 1=Mon, 7=Sun
      required: [true, "Day of week is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm format required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm format required"],
    },
    autoStart: {
      type: Boolean,
      default: true,
    },
    autoEnd: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

timetableScheduleSchema.index({ facultyId: 1, dayOfWeek: 1 });
timetableScheduleSchema.index({ classId: 1, dayOfWeek: 1 });

export const TimetableSchedule = mongoose.model("TimetableSchedule", timetableScheduleSchema);
