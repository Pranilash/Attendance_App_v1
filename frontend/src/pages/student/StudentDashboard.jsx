import { useState, useEffect } from 'react';
import {
  QrCode,
  Calendar,
  CheckCircle,
  XCircle,
  Camera,
  TrendingUp,
  Clock,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { studentAPI } from '../../services/api';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="mt-1 text-sm text-gray-400">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const StudentDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    faceRegistered: false,
    debarmentRisk: null,
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [classesRes, statsRes] = await Promise.all([
        studentAPI.getClasses(),
        studentAPI.getAttendanceStats(),
      ]);

      const classes = classesRes.data.data;
      setUpcomingClasses(classes.slice(0, 3));

      if (statsRes.data.data) {
        setStats({
          totalClasses: statsRes.data.data.totalClasses || classes.length,
          presentCount: statsRes.data.data.presentCount || 0,
          absentCount: statsRes.data.data.absentCount || 0,
          attendanceRate: statsRes.data.data.attendanceRate || 0,
          faceRegistered: statsRes.data.data.faceRegistered || false,
          debarmentRisk: statsRes.data.data.debarmentRisk || null,
        });
      }
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
        <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">View your attendance and upcoming classes</p>
      </div>

      {/* Face Registration Alert */}
      {!stats.faceRegistered && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-yellow-800">Face Registration Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please register your face to mark attendance. You won't be able to mark attendance
              without face verification.
            </p>
            <a
              href="/student/register-face"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
            >
              <Camera className="w-4 h-4" />
              Register Face
            </a>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={BookOpen}
          color="bg-purple-500"
        />
        <StatCard
          title="Present"
          value={stats.presentCount}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <StatCard
          title="Absent"
          value={stats.absentCount}
          icon={XCircle}
          color="bg-red-500"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendanceRate}%`}
          icon={TrendingUp}
          color="bg-blue-500"
        />
      </div>

      {/* Debarment Risk Radar (VII Sem Upgrade 4) */}
      {stats.debarmentRisk && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Debarment Risk Radar (DRI)</h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    stats.debarmentRisk.riskLevel === 'SAFE'
                      ? 'bg-green-100 text-green-800'
                      : stats.debarmentRisk.riskLevel === 'WARNING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {stats.debarmentRisk.riskLevel}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Predictive cutoff trajectory modeling to guarantee statutory attendance (≥ 75%)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-gray-400 uppercase tracking-wider block">Overall DRI</span>
                <span className="text-2xl font-bold text-gray-900">{stats.debarmentRisk.dri}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.debarmentRisk.classes?.map((item) => (
              <div key={item.classId} className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm truncate">{item.subjectCode}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      item.riskLevel === 'SAFE'
                        ? 'bg-green-100 text-green-700'
                        : item.riskLevel === 'WARNING'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    DRI {item.dri}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Current: <strong className="text-gray-700">{item.currentRate}%</strong></span>
                  <span>Max: <strong className="text-gray-700">{item.maxAchievableRate}%</strong></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.currentRate >= 75 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, item.currentRate)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">
                  Need <strong className="text-gray-700">{item.requiredSessions}</strong> more attended out of <strong className="text-gray-700">{item.remaining}</strong> remaining
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions & Attendance Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/student/scan"
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <QrCode className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Scan QR</span>
              <span className="text-xs text-gray-500">Mark Attendance</span>
            </a>
            <a
              href="/student/history"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Calendar className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">History</span>
              <span className="text-xs text-gray-500">View Records</span>
            </a>
            <a
              href="/student/register-face"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Camera className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">
                {stats.faceRegistered ? 'Update Face' : 'Register Face'}
              </span>
              <span className="text-xs text-gray-500">
                {stats.faceRegistered ? 'Change your face data' : 'Required for attendance'}
              </span>
            </a>
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Stats</span>
              <span className="text-xs text-gray-500">{stats.attendanceRate}% Attendance</span>
            </div>
          </div>
        </div>

        {/* Attendance Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Progress</h2>
          <div className="space-y-4">
            {/* Progress Circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={
                      stats.attendanceRate >= 75
                        ? '#22c55e'
                        : stats.attendanceRate >= 50
                        ? '#eab308'
                        : '#ef4444'
                    }
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - stats.attendanceRate / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{stats.attendanceRate}%</span>
                  <span className="text-sm text-gray-500">Attendance</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              {stats.attendanceRate >= 75 ? (
                <p className="text-green-600 font-medium">Great! Your attendance is good.</p>
              ) : stats.attendanceRate >= 50 ? (
                <p className="text-yellow-600 font-medium">
                  Warning: Try to improve your attendance.
                </p>
              ) : (
                <p className="text-red-600 font-medium">
                  Critical: Your attendance is below required.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Classes */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Classes</h2>
        <div className="space-y-3">
          {upcomingClasses.map((cls, index) => (
            <div
              key={cls._id || index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{cls.name}</p>
                  <p className="text-sm text-gray-500">
                    {cls.subjectCode} · {cls.faculty?.name || 'Faculty'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {cls.schedule?.[0]?.startTime || '9:00 AM'}
                </p>
                <p className="text-sm text-gray-500">
                  {cls.schedule?.[0]?.room || 'Room 101'}
                </p>
              </div>
            </div>
          ))}
          {upcomingClasses.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No classes scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;