import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post('/api/auth/refresh-token', {}, { withCredentials: true });
        const newAccessToken = response.data.data.accessToken;

        // Update store with new token
        useAuthStore.getState().setAccessToken(newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  registerStudent: (userData) => api.post('/auth/register/student', userData),
  registerFaculty: (userData) => api.post('/auth/register/faculty', userData),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh-token'),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
  changePassword: (data) => api.patch('/auth/change-password', data),
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Departments
  createDepartment: (data) => api.post('/admin/departments', data),
  getDepartments: () => api.get('/admin/departments'),
  updateDepartment: (id, data) => api.patch(`/admin/department/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/department/${id}`),

  // Faculty
  createFaculty: (data) => api.post('/admin/faculty', data),
  getFaculty: () => api.get('/admin/faculty'),
  updateFaculty: (id, data) => api.patch(`/admin/faculty/${id}`, data),
  deleteFaculty: (id) => api.delete(`/admin/faculty/${id}`),

  // Students
  createStudent: (data) => api.post('/admin/student', data),
  getStudents: (params) => api.get('/admin/students', { params }),
  updateStudent: (id, data) => api.patch(`/admin/student/${id}`, data),
  deleteStudent: (id) => api.delete(`/admin/student/${id}`),

  // Stats
  getStats: () => api.get('/admin/stats'),
};

// ==================== FACULTY API ====================
export const facultyAPI = {
  // Classes
  createClass: (data) => api.post('/faculty/classes', data),
  getClasses: () => api.get('/faculty/classes'),
  getClass: (id) => api.get(`/faculty/class/${id}`),
  updateClass: (id, data) => api.patch(`/faculty/class/${id}`, data),
  deleteClass: (id) => api.delete(`/faculty/class/${id}`),
  addStudentsToClass: (classId, studentIds) => api.post(`/faculty/class/${classId}/students`, { studentIds }),
  removeStudentFromClass: (classId, studentId) => api.delete(`/faculty/class/${classId}/student/${studentId}`),

  // Students and Departments (for class management)
  getStudents: (params) => api.get('/faculty/students', { params }),
  getDepartments: () => api.get('/faculty/departments'),

  // Sessions
  startSession: (classId) => api.post('/faculty/session/start', { classId }),
  endSession: (sessionId) => api.post('/faculty/session/end', { sessionId }),
  getActiveSession: (classId) => api.get(`/faculty/session/active/${classId}`),
  getSessionHistory: (classId) => api.get(`/faculty/session/history/${classId}`),

  // Reports
  getClassReport: (classId) => api.get(`/faculty/report/class/${classId}`),
  getSessionReport: (sessionId) => api.get(`/faculty/report/session/${sessionId}`),
  exportReportCSV: (classId) => api.get(`/faculty/report/class/${classId}/csv`, { responseType: 'blob' }),
};

// ==================== STUDENT API ====================
export const studentAPI = {
  // Classes
  getClasses: () => api.get('/student/classes'),

  // Attendance
  verifyQR: (qrPayload) => api.post('/student/attendance/verify-qr', { qrPayload }),
  verifyFace: (sessionId, faceData) => api.post('/student/attendance/verify-face', { sessionId, ...faceData }),
  getAttendanceHistory: (params) => api.get('/student/attendance/history', { params }),
  getAttendanceStats: () => api.get('/student/attendance/stats'),

  // Face Registration
  registerFace: (faceData) => api.post('/student/face/register', faceData),
  getFaceStatus: () => api.get('/student/face/status'),
};

// ==================== SESSION API ====================
export const sessionAPI = {
  validateQR: (qrPayload) => api.post('/session/validate-qr', { qrPayload }),
  getActiveSessions: () => api.get('/session/active'),
};

// ==================== REPORT API ====================
export const reportAPI = {
  getClassReport: (classId) => api.get(`/report/class/${classId}`),
  getSessionReport: (sessionId) => api.get(`/report/session/${sessionId}`),
  getStudentReport: (studentId) => api.get(`/report/student/${studentId}`),
  exportClassCSV: (classId) => api.get(`/report/class/${classId}/csv`, { responseType: 'blob' }),
  exportSessionCSV: (sessionId) => api.get(`/report/session/${sessionId}/csv`, { responseType: 'blob' }),
};

export default api;