import mongoose, { Schema } from "mongoose";

const departmentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Department name must be at least 2 characters"],
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "Department code must be at least 2 characters"],
      maxlength: [10, "Department code cannot exceed 10 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    head: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

// Index for faster queries
departmentSchema.index({ code: 1 });
departmentSchema.index({ name: 1 });
departmentSchema.index({ isActive: 1 });

export const Department = mongoose.model("Department", departmentSchema);
