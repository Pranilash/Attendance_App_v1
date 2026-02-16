import { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={`mt-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className="inline w-4 h-4 mr-1" />
            {trend > 0 ? '+' : ''}{trend}% from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalDepartments: 0,
    totalClasses: 0,
    todayAttendance: 0,
    activeSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your attendance system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          color="bg-green-500"
        />
        <StatCard
          title="Total Faculty"
          value={stats.totalFaculty}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Departments"
          value={stats.totalDepartments}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Classes"
          value={stats.totalClasses}
          icon={BookOpen}
          color="bg-orange-500"
        />
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Present Today</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.todayAttendance}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Active Sessions</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.activeSessions}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/admin/departments"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Building2 className="w-6 h-6 text-purple-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Department</span>
            </a>
            <a
              href="/admin/faculty"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Users className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Faculty</span>
            </a>
            <a
              href="/admin/students"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <GraduationCap className="w-6 h-6 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Add Student</span>
            </a>
            <a
              href="/admin/reports"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BookOpen className="w-6 h-6 text-orange-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">View Reports</span>
            </a>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Activity will appear here as sessions are started and attendance is marked.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;