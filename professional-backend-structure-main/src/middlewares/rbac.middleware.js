import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * This middleware provides fine-grained access control based on user roles.
 * Supports multiple roles hierarchy and permission checks.
 */

// Role hierarchy for permission inheritance
const ROLE_HIERARCHY = {
  admin: 3,
  faculty: 2,
  student: 1,
};

// Permission definitions
const PERMISSIONS = {
  // User management
  CREATE_USER: ["admin"],
  READ_USER: ["admin", "faculty"],
  UPDATE_USER: ["admin"],
  DELETE_USER: ["admin"],

  // Department management
  CREATE_DEPARTMENT: ["admin"],
  READ_DEPARTMENT: ["admin", "faculty", "student"],
  UPDATE_DEPARTMENT: ["admin"],
  DELETE_DEPARTMENT: ["admin"],

  // Class management
  CREATE_CLASS: ["admin", "faculty"],
  READ_CLASS: ["admin", "faculty", "student"],
  UPDATE_CLASS: ["admin", "faculty"],
  DELETE_CLASS: ["admin", "faculty"],

  // Session management
  CREATE_SESSION: ["admin", "faculty"],
  READ_SESSION: ["admin", "faculty", "student"],
  UPDATE_SESSION: ["admin", "faculty"],
  END_SESSION: ["admin", "faculty"],

  // Attendance management
  MARK_ATTENDANCE: ["student"],
  READ_ATTENDANCE: ["admin", "faculty", "student"],
  UPDATE_ATTENDANCE: ["admin", "faculty"],
  EXPORT_ATTENDANCE: ["admin", "faculty"],

  // Face registration
  REGISTER_FACE: ["student"],
  UPDATE_FACE: ["student", "admin"],
  DELETE_FACE: ["admin"],

  // Reports
  VIEW_REPORTS: ["admin", "faculty"],
  VIEW_OWN_REPORTS: ["student"],
};

/**
 * Check if user has required role(s)
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 */
export const requireRoles = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      throw new ApiError(
        403,
        "Access denied. Required roles: " + roles.join(", ") + ", your role: " + userRole
      );
    }

    next();
  });
};

/**
 * Check if user has minimum role level (based on hierarchy)
 * @param {string} minimumRole - Minimum required role
 * @returns {Function} Express middleware
 */
export const requireMinRole = (minimumRole) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

    if (userLevel < requiredLevel) {
      throw new ApiError(
        403,
        "Access denied. Minimum role required: " + minimumRole
      );
    }

    next();
  });
};

/**
 * Check if user has specific permission
 * @param {string} permission - Permission to check
 * @returns {Function} Express middleware
 */
export const requirePermission = (permission) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const allowedRoles = PERMISSIONS[permission];

    if (!allowedRoles) {
      throw new ApiError(500, "Permission " + permission + " is not defined");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        "Access denied. You don't have permission: " + permission
      );
    }

    next();
  });
};

/**
 * Check if user owns the resource or has admin role
 * @param {string} resourceIdParam - Request parameter name for resource ID
 * @returns {Function} Express middleware
 */
export const requireOwnershipOrAdmin = (resourceIdParam = "id") => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user._id.toString();

    // Admin can access any resource
    if (req.user.role === "admin") {
      return next();
    }

    // Check ownership
    if (resourceId === userId) {
      return next();
    }

    throw new ApiError(403, "Access denied. You can only access your own resources");
  });
};

/**
 * Check if faculty owns the class
 * @returns {Function} Express middleware
 */
export const requireClassOwnership = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  // Admin can access any class
  if (req.user.role === "admin") {
    return next();
  }

  // Faculty can only access their own classes
  if (req.user.role === "faculty") {
    req.checkClassOwnership = true;
    return next();
  }

  throw new ApiError(403, "Access denied. Only class faculty or admin can perform this action");
});

/**
 * Check if student is enrolled in the class
 * @returns {Function} Express middleware
 */
export const requireClassEnrollment = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  // Admin and faculty can access any class
  if (req.user.role === "admin" || req.user.role === "faculty") {
    return next();
  }

  // Student must be enrolled in the class
  if (req.user.role === "student") {
    req.checkClassEnrollment = true;
    return next();
  }

  throw new ApiError(403, "Access denied. You are not enrolled in this class");
});

/**
 * Check if session belongs to the faculty
 * @returns {Function} Express middleware
 */
export const requireSessionOwnership = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  // Admin can access any session
  if (req.user.role === "admin") {
    return next();
  }

  // Faculty can only access their own sessions
  if (req.user.role === "faculty") {
    req.checkSessionOwnership = true;
    return next();
  }

  throw new ApiError(403, "Access denied. Only session owner or admin can perform this action");
});

/**
 * Middleware to check if user is active
 */
export const requireActiveUser = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  if (!req.user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact administrator.");
  }

  next();
});

/**
 * Middleware to check if student has registered face
 */
export const requireFaceRegistration = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  if (req.user.role !== "student") {
    return next(); // Only students need face registration
  }

  if (!req.user.faceRegistered) {
    throw new ApiError(
      400,
      "Face registration required. Please register your face before marking attendance."
    );
  }

  next();
});

/**
 * Combine multiple middleware checks
 * @param {Function[]} middlewares - Array of middleware functions
 * @returns {Function} Combined middleware
 */
export const combineMiddlewares = (...middlewares) => {
  return asyncHandler(async (req, res, next) => {
    const executeMiddleware = (index) => {
      if (index >= middlewares.length) {
        return next();
      }

      middlewares[index](req, res, (err) => {
        if (err) return next(err);
        executeMiddleware(index + 1);
      });
    };

    executeMiddleware(0);
  });
};

// Export role constants for use in other files
export const ROLES = {
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",
};

// Export permission constants
export { PERMISSIONS };

export default {
  requireRoles,
  requireMinRole,
  requirePermission,
  requireOwnershipOrAdmin,
  requireClassOwnership,
  requireClassEnrollment,
  requireSessionOwnership,
  requireActiveUser,
  requireFaceRegistration,
  combineMiddlewares,
  ROLES,
  PERMISSIONS,
};