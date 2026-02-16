import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { AttendanceUser } from "../models/attendanceUser.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Authentication Middleware for Attendance System
 * 
 * Verifies JWT tokens and attaches user information to request object.
 */

/**
 * Verify JWT Token Middleware
 * Extracts and verifies the access token from cookies or Authorization header
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request. No access token provided.");
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Find user by ID from token
    const user = await AttendanceUser.findById(decodedToken?._id).select(
      "-password -refreshToken -passwordResetToken -passwordResetExpires"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token. User not found.");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, "Your account has been deactivated. Please contact administrator.");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired. Please refresh your token.");
    }
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid access token.");
    }
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

/**
 * Optional Authentication Middleware
 * Attaches user if token is present, but doesn't require it
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await AttendanceUser.findById(decodedToken?._id).select(
        "-password -refreshToken"
      );
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
});

/**
 * Verify Refresh Token Middleware
 * Used for token refresh endpoint
 */
export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await AttendanceUser.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token. User not found.");
    }

    // Verify that the refresh token matches the one stored in database
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is invalid or has been revoked.");
    }

    req.user = user;
    req.refreshToken = incomingRefreshToken;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired. Please login again.");
    }
    throw new ApiError(401, "Invalid refresh token");
  }
});

/**
 * Extract user info for logging
 */
export const extractUserForLog = (req) => {
  if (!req.user) return null;
  return {
    userId: req.user._id,
    email: req.user.email,
    role: req.user.role,
    name: req.user.name,
  };
};

export default {
  verifyJWT,
  optionalAuth,
  verifyRefreshToken,
  extractUserForLog,
};