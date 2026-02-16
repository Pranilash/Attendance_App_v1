import mongoose, { Schema } from "mongoose";

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      minlength: [2, "Class name must be at least 2 characters"],
      maxlength: [100, "Class name cannot exceed 100 characters"],
    },
    subjectCode: {
      type: String,
      required: [true, "Subject code is required"],
      uppercase: true,
      trim: true,
    },
    subjectName: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceUser",
      required: [true, "Faculty is required"],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "AttendanceUser",
      },
    ],
    schedule: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Please enter a valid time in HH:mm format",
          ],
        },
        endTime: {
          type: String,
          required: true,
          match: [
            /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Please enter a valid time in HH:mm format",
          ],
        },
        room: {
          type: String,
          trim: true,
        },
      },
    ],
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      match: [
        /^\d{4}-\d{4}$/,
        "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)",
      ],
    },
    semester: {
      type: Number,
      required: [true, "Semester is required"],
      min: [1, "Semester must be at least 1"],
      max: [8, "Semester cannot exceed 8"],
    },
    credits: {
      type: Number,
      default: 3,
      min: [1, "Credits must be at least 1"],
      max: [6, "Credits cannot exceed 6"],
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

// Indexes for better query performance
classSchema.index({ subjectCode: 1, academicYear: 1 });
classSchema.index({ faculty: 1 });
classSchema.index({ department: 1 });
classSchema.index({ isActive: 1 });
classSchema.index({ academicYear: 1, semester: 1 });

// Virtual for student count
classSchema.virtual("studentCount").get(function () {
  return this.students?.length || 0;
});

// Method to check if a student is enrolled
classSchema.methods.isStudentEnrolled = function (studentId) {
  return this.students.some(
    (student) => student.toString() === studentId.toString()
  );
};

// Method to add student
classSchema.methods.addStudent = function (studentId) {
  if (!this.isStudentEnrolled(studentId)) {
    this.students.push(studentId);
  }
  return this;
};

// Method to remove student
classSchema.methods.removeStudent = function (studentId) {
  this.students = this.students.filter(
    (student) => student.toString() !== studentId.toString()
  );
  return this;
};

export const Class = mongoose.model("Class", classSchema);
