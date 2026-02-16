import { Router } from 'express';
import {
  getStudentsByDepartment,
  getDepartments,
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  addStudentsToClass,
  removeStudentFromClass,
  startSession,
  endSession,
  getActiveSession,
  getSessionHistory,
  getClassReport,
  getSessionReport,
  exportClassCSV,
} from '../controllers/faculty.controller.js';
import { verifyJWT } from '../middlewares/authAttendance.middleware.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

// All routes require authentication and faculty role
router.use(verifyJWT);
router.use(requireRoles('faculty'));

// Student and Department routes (for class management)
router.route('/students').get(getStudentsByDepartment);
router.route('/departments').get(getDepartments);

// Class routes
router.route('/classes').post(createClass).get(getClasses);
router
  .route('/class/:id')
  .get(getClass)
  .patch(updateClass)
  .delete(deleteClass);

// Student management in class
router.route('/class/:classId/students').post(addStudentsToClass);
router.route('/class/:classId/student/:studentId').delete(removeStudentFromClass);

// Session routes
router.route('/session/start').post(startSession);
router.route('/session/end').post(endSession);
router.route('/session/active/:classId').get(getActiveSession);
router.route('/session/history/:classId').get(getSessionHistory);

// Report routes
router.route('/report/class/:classId').get(getClassReport);
router.route('/report/class/:classId/csv').get(exportClassCSV);
router.route('/report/session/:sessionId').get(getSessionReport);

export default router;