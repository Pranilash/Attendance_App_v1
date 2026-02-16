import { Router } from 'express';
import {
  getClasses,
  verifyQR,
  verifyFace,
  getAttendanceHistory,
  getAttendanceStats,
  registerFace,
  getFaceStatus,
} from '../controllers/student.controller.js';
import { verifyJWT } from '../middlewares/authAttendance.middleware.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

// All routes require authentication and student role
router.use(verifyJWT);
router.use(requireRoles('student'));

// Class routes
router.route('/classes').get(getClasses);

// Attendance routes
router.route('/attendance/verify-qr').post(verifyQR);
router.route('/attendance/verify-face').post(verifyFace);
router.route('/attendance/history').get(getAttendanceHistory);
router.route('/attendance/stats').get(getAttendanceStats);

// Face registration routes
router.route('/face/register').post(registerFace);
router.route('/face/status').get(getFaceStatus);

export default router;