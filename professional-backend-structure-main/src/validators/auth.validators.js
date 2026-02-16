import { z } from "zod";

// Common validation schemas
const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required")
  .max(255, "Email cannot exceed 255 characters");

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(100, "Password cannot exceed 100 characters");

const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name cannot exceed 100 characters");

const phoneSchema = z
  .string()
  .regex(/^[0-9]{10}$/, "Phone number must be 10 digits")
  .optional();

const enrollmentNumberSchema = z
  .string()
  .min(1, "Enrollment number is required")
  .max(20, "Enrollment number cannot exceed 20 characters")
  .regex(/^[A-Z0-9]+$/, "Enrollment number must be alphanumeric and uppercase");

const employeeIdSchema = z
  .string()
  .min(1, "Employee ID is required")
  .max(20, "Employee ID cannot exceed 20 characters")
  .regex(/^[A-Z0-9]+$/, "Employee ID must be alphanumeric and uppercase");

// Auth validation schemas
export const registerSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    role: z.enum(["student", "faculty", "admin"], {
      errorMap: () => ({ message: "Role must be student, faculty, or admin" }),
    }),
    department: z.string().min(1, "Department is required"),
    enrollmentNumber: enrollmentNumberSchema.optional(),
    batch: z.string().max(20).optional(),
    semester: z.number().int().min(1).max(8).optional(),
    employeeId: employeeIdSchema.optional(),
    designation: z.string().max(100).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: nameSchema.optional(),
    phone: phoneSchema,
    address: z.object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      pincode: z.string().regex(/^[0-9]{6}$/).optional(),
    }).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
  }),
});

// Department validation schemas
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    code: z.string().min(2).max(10).regex(/^[A-Z]+$/, "Code must be uppercase letters"),
    description: z.string().max(500).optional(),
    head: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    code: z.string().min(2).max(10).regex(/^[A-Z]+$/).optional(),
    description: z.string().max(500).optional(),
    head: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Department ID is required"),
  }),
});

// Class validation schemas
export const createClassSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    subjectCode: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/),
    subjectName: z.string().min(1).max(100),
    faculty: z.string().min(1, "Faculty is required"),
    department: z.string().min(1, "Department is required"),
    students: z.array(z.string()).optional(),
    schedule: z.array(
      z.object({
        day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        room: z.string().optional(),
      })
    ).optional(),
    academicYear: z.string().regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"),
    semester: z.number().int().min(1).max(8),
    credits: z.number().int().min(1).max(6).optional(),
  }),
});

export const updateClassSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    subjectCode: z.string().min(1).max(20).regex(/^[A-Z0-9]+$/).optional(),
    subjectName: z.string().min(1).max(100).optional(),
    faculty: z.string().optional(),
    students: z.array(z.string()).optional(),
    schedule: z.array(
      z.object({
        day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        room: z.string().optional(),
      })
    ).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Class ID is required"),
  }),
});

// Session validation schemas
export const startSessionSchema = z.object({
  body: z.object({
    classId: z.string().min(1, "Class ID is required"),
    duration: z.number().int().min(5).max(180).optional(),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radius: z.number().min(10).max(1000).optional(),
    }).optional(),
    settings: z.object({
      allowLateMarking: z.boolean().optional(),
      lateThreshold: z.number().int().min(1).max(60).optional(),
      requireLocation: z.boolean().optional(),
      requireFaceVerification: z.boolean().optional(),
    }).optional(),
  }),
});

export const endSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, "Session ID is required"),
  }),
});

// Attendance validation schemas
export const verifyQRSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    timestamp: z.number().int().positive(),
    signature: z.string().min(1, "Signature is required"),
  }),
});

export const verifyFaceSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    embedding: z.array(z.number()).length(128, "Embedding must be 128-dimensional array"),
    livenessScore: z.number().min(0).max(1).optional(),
    livenessChecks: z.object({
      blink: z.boolean().optional(),
      headMovement: z.boolean().optional(),
      smile: z.boolean().optional(),
    }).optional(),
    capturedImage: z.string().optional(),
  }),
});

export const markAttendanceSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().optional(),
    }).optional(),
    deviceInfo: z.string().optional(),
  }),
});

// Face registration validation schema
export const registerFaceSchema = z.object({
  body: z.object({
    embedding: z.array(z.number()).length(128, "Embedding must be 128-dimensional array"),
    livenessChecks: z.object({
      blink: z.boolean(),
      headMovement: z.boolean(),
      smile: z.boolean().optional(),
    }),
    livenessScore: z.number().min(0).max(1),
    referenceImage: z.string().min(1, "Reference image is required"),
  }),
});

// Report query validation
export const reportQuerySchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(["present", "absent", "late", "excused"]).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.string().optional(),
  }),
  params: z.object({
    classId: z.string().min(1, "Class ID is required"),
  }),
});

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }
      next(error);
    }
  };
};

export default {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createClassSchema,
  updateClassSchema,
  startSessionSchema,
  endSessionSchema,
  verifyQRSchema,
  verifyFaceSchema,
  markAttendanceSchema,
  registerFaceSchema,
  reportQuerySchema,
  validate,
};