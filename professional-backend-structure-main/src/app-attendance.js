import express from "express";
import cookieParser from "cookie-parser";
import {
  securityHeaders,
  corsOptions,
  sanitizeData,
  preventParameterPollution,
  requestLogger,
  xssProtection,
  apiLimiter,
} from "./middlewares/security.middleware.js";
import cors from "cors";

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(xssProtection);
app.use(sanitizeData);
app.use(preventParameterPollution);
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Apply general rate limiting to API routes
app.use("/api", apiLimiter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Public route - departments list (for registration)
app.get("/api/departments", async (req, res) => {
  try {
    const { Department } = await import("./models/department.model.js");
    const departments = await Department.find({ isActive: true }).select("name code _id").sort({ name: 1 });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch departments" });
  }
});

// API Routes
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import facultyRoutes from "./routes/faculty.routes.js";
import studentRoutes from "./routes/student.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/student", studentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app }; 
