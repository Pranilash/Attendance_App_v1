import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageStudents from './pages/admin/ManageStudents';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ManageClasses from './pages/faculty/ManageClasses';
import SessionControl from './pages/faculty/SessionControl';
import AttendanceReports from './pages/faculty/AttendanceReports';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import ScanQR from './pages/student/ScanQR';
import FaceVerification from './pages/student/FaceVerification';
import AttendanceHistory from './pages/student/AttendanceHistory';
import FaceRegistration from './pages/student/FaceRegistration';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    // Redirect to appropriate dashboard based on role
    const role = useAuthStore.getState().getRole();
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'faculty':
        return <Navigate to="/faculty" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

// Public Route - redirects authenticated users
const PublicRoute = ({ children }) => {
  const { isAuthenticated, getRole } = useAuthStore();

  if (isAuthenticated) {
    const role = getRole();
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'faculty':
        return <Navigate to="/faculty" replace />;
      case 'student':
        return <Navigate to="/student" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="departments" element={<ManageDepartments />} />
        <Route path="faculty" element={<ManageFaculty />} />
        <Route path="students" element={<ManageStudents />} />
      </Route>

      {/* Faculty Routes */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FacultyDashboard />} />
        <Route path="classes" element={<ManageClasses />} />
        <Route path="session" element={<SessionControl />} />
        <Route path="reports" element={<AttendanceReports />} />
      </Route>

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="scan" element={<ScanQR />} />
        <Route path="verify-face/:sessionId" element={<FaceVerification />} />
        <Route path="history" element={<AttendanceHistory />} />
        <Route path="register-face" element={<FaceRegistration />} />
      </Route>

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;