import { Router } from 'express';
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  createFaculty,
  getFaculty,
  updateFaculty,
  deleteFaculty,
  createStudent,
  getStudents,
  updateStudent,
  deleteStudent,
  getStats,
} from '../controllers/admin.controller.js';
import { verifyJWT } from '../middlewares/authAttendance.middleware.js';
import { requireRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

// All routes require authentication and admin role
router.use(verifyJWT);
router.use(requireRoles('admin'));

// Department routes
router.route('/departments').post(createDepartment).get(getDepartments);
router
  .route('/department/:id')
  .patch(updateDepartment)
  .delete(deleteDepartment);

// Faculty routes
router.route('/faculty').get(getFaculty).post(createFaculty);
router
  .route('/faculty/:id')
  .patch(updateFaculty)
  .delete(deleteFaculty);

// Student routes
router.route('/students').get(getStudents);
router.route('/student').post(createStudent);
router
  .route('/student/:id')
  .patch(updateStudent)
  .delete(deleteStudent);

// Stats
router.route('/stats').get(getStats);

export default router;