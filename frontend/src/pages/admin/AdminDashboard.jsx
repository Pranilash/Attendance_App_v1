import { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const KpiCell = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
    <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-600" />
    </div>
    <div>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{value}</p>
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
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900">Registrar & Department Administration</h1>
        <p className="text-xs text-slate-500 mt-0.5">Smart Attendance System administration and ledger overview</p>
      </div>

      {/* KPI Grid — 4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCell
          label="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
        />
        <KpiCell
          label="Total Faculty"
          value={stats.totalFaculty}
          icon={Users}
        />
        <KpiCell
          label="Active Courses"
          value={stats.totalClasses}
          icon={BookOpen}
        />
        <KpiCell
          label="Daily Attendance Volume"
          value={stats.todayAttendance}
          icon={CheckCircle}
        />
      </div>

      {/* Today's Attendance Session Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overview */}
        <div className="bg-white border border-slate-200 rounded-md">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Today&apos;s Overview</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-medium text-slate-700">Recorded Present Today</span>
              </div>
              <span className="text-sm font-bold text-emerald-700 font-mono tabular-nums">{stats.todayAttendance}</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-medium text-slate-700">Active Sessions</span>
              </div>
              <span className="text-sm font-bold text-blue-700 font-mono tabular-nums">{stats.activeSessions}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-md">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Administration</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            <a
              href="/admin/departments"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Manage Departments</span>
            </a>
            <a
              href="/admin/faculty"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Users className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Manage Faculty</span>
            </a>
            <a
              href="/admin/students"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <GraduationCap className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Manage Students</span>
            </a>
            <a
              href="/admin/reports"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">View Reports</span>
            </a>
          </div>
        </div>
      </div>

      {/* System Activity */}
      <div className="bg-white border border-slate-200 rounded-md">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">System Activity</h2>
        </div>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Session activity appears here when attendance sessions are started.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;