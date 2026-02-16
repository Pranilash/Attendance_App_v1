import { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  QrCode,
  Calendar,
  TrendingUp,
  Play,
} from 'lucide-react';
import { facultyAPI } from '../../services/api';

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

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todaySessions: 0,
    averageAttendance: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await facultyAPI.getClasses();
      const classes = response.data.data;

      // Calculate stats
      const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
      const todaySessions = classes.filter((cls) => {
        const today = new Date().getDay();
        return cls.schedule?.some((s) => s.day === today);
      }).length;

      setStats({
        totalClasses: classes.length,
        totalStudents,
        todaySessions,
        averageAttendance: 0,
      });

      setUpcomingClasses(classes.slice(0, 3));
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
        <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your classes and attendance sessions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={BookOpen}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Today's Sessions"
          value={stats.todaySessions}
          icon={Calendar}
          color="bg-green-500"
        />
        <StatCard
          title="Avg Attendance"
          value={`${stats.averageAttendance}%`}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      {/* Quick Actions & Active Session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/faculty/classes"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Manage Classes</span>
            </a>
            <a
              href="/faculty/session"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <QrCode className="w-6 h-6 text-green-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Start Session</span>
            </a>
            <a
              href="/faculty/reports"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <TrendingUp className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">View Reports</span>
            </a>
            <a
              href="/faculty/history"
              className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Clock className="w-6 h-6 text-orange-500 mb-2" />
              <span className="text-sm font-medium text-gray-700">Session History</span>
            </a>
          </div>
        </div>

        {/* Active Session */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Session</h2>
          {activeSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activeSession.className}</p>
                    <p className="text-sm text-gray-500">Started {activeSession.startTime}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  Live
                </span>
              </div>
              <div className="flex gap-3">
                <a
                  href="/faculty/session"
                  className="flex-1 text-center py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  View QR
                </a>
                <button className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                  End Session
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No active session</p>
              <a
                href="/faculty/session"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <Play className="w-4 h-4" />
                Start New Session
              </a>
            </div>
          )}
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
                    {cls.subjectCode} · {cls.students?.length || 0} students
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

export default FacultyDashboard;