import { Router } from "express";
import {
  register,
  registerStudent,
  registerFaculty,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateProfile,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/authAttendance.middleware.js";
import { authLimiter } from "../middlewares/security.middleware.js";
import { validate } from "../validators/auth.validators.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validators/auth.validators.js";

const router = Router();

// Public routes (no authentication required)
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/register/student", authLimiter, validate(registerSchema), registerStudent);
router.post("/register/faculty", authLimiter, validate(registerSchema), registerFaculty);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh-token", validate(refreshTokenSchema), refreshAccessToken);

// Protected routes (authentication required)
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getCurrentUser);
router.post(
  "/change-password",
  verifyJWT,
  validate(changePasswordSchema),
  changePassword
);
router.patch(
  "/profile",
  verifyJWT,
  validate(updateProfileSchema),
  updateProfile
);

export default router;