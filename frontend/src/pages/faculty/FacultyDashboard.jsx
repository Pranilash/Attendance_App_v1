import { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Clock,
  QrCode,
  Calendar,
  TrendingUp,
  Play,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { facultyAPI } from '../../services/api';

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todaySessions: 0,
    averageAttendance: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [activeSession] = useState(null);
  const [debarmentCount, setDebarmentCount] = useState(0);
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

      // Count students below 75% across all classes (debarment risk)
      let belowThreshold = 0;
      classes.forEach((cls) => {
        if (cls.students) {
          cls.students.forEach((s) => {
            if (s.attendanceRate !== undefined && s.attendanceRate < 75) {
              belowThreshold++;
            }
          });
        }
      });
      setDebarmentCount(belowThreshold);

      setStats({
        totalClasses: classes.length,
        totalStudents,
        todaySessions,
        averageAttendance: 0,
      });

      setUpcomingClasses(classes.slice(0, 5));
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
    <div className="space-y-4">
      {/* Page Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900">Faculty Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Course management and attendance session control</p>
      </div>

      {/* Debarment Watchlist Alert */}
      {debarmentCount > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-md">
          <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
          <p className="text-xs font-semibold text-rose-700">
            Debarment Watchlist Alert: {debarmentCount} student{debarmentCount !== 1 ? 's' : ''} below 75.0% statutory minimum
          </p>
        </div>
      )}

      {/* Active Class Launchpad */}
      <div className="bg-white border border-slate-200 rounded-md">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Active Class Launchpad</h2>
          <a
            href="/faculty/session"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-xs font-semibold"
          >
            <Play className="w-3.5 h-3.5" />
            Start Attendance Session
          </a>
        </div>
        {activeSession ? (
          <div className="p-4">
            <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">{activeSession.className}</p>
                  <p className="text-[11px] text-slate-500">Started {activeSession.startTime}</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <QrCode className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No active session. Select a course to begin.</p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Courses</p>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{stats.totalClasses}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Enrolled Students</p>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{stats.totalStudents}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Today&apos;s Sessions</p>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{stats.todaySessions}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
          <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Avg Attendance</p>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{stats.averageAttendance}%</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="bg-white border border-slate-200 rounded-md">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-4">
            <a
              href="/faculty/classes"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Manage Courses</span>
            </a>
            <a
              href="/faculty/session"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Start Session</span>
            </a>
            <a
              href="/faculty/reports"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Attendance Reports</span>
            </a>
            <a
              href="/faculty/history"
              className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
            >
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">Session History</span>
            </a>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white border border-slate-200 rounded-md">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Today&apos;s Schedule</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {upcomingClasses.map((cls, index) => (
              <div
                key={cls._id || index}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900">{cls.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {cls.subjectCode} · {cls.students?.length || 0} enrolled
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-900 font-mono tabular-nums">
                    {cls.schedule?.[0]?.startTime || '—'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {cls.schedule?.[0]?.room || '—'}
                  </p>
                </div>
              </div>
            ))}
            {upcomingClasses.length === 0 && (
              <div className="text-center py-6">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No courses scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;