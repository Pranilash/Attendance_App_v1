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
  X,
  Download,
  ShieldAlert,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyAPI } from '../../services/api';

const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todaySessions: 0,
    averageAttendance: 0,
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [activeSession] = useState(null);
  const [debarmentCount, setDebarmentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Debarment Watchlist Modal State (VII Sem Upgrade 4)
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [selectedWatchlistClass, setSelectedWatchlistClass] = useState('');
  const [watchlistData, setWatchlistData] = useState(null);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await facultyAPI.getClasses();
      const classes = response.data.data;
      setAllClasses(classes);

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
      if (classes.length > 0) {
        setSelectedWatchlistClass(classes[0]._id);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWatchlist = async (classId = null) => {
    const targetId = classId || selectedWatchlistClass || allClasses[0]?._id;
    if (!targetId) {
      toast.error('No courses available for watchlist inspection');
      return;
    }
    setSelectedWatchlistClass(targetId);
    setIsWatchlistOpen(true);
    await loadWatchlistForClass(targetId);
  };

  const loadWatchlistForClass = async (classId) => {
    setIsLoadingWatchlist(true);
    try {
      const response = await facultyAPI.getDebarmentWatchlist(classId);
      setWatchlistData(response.data.data);
    } catch (error) {
      console.error('Error fetching debarment watchlist:', error);
      toast.error('Failed to load debarment watchlist');
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  const exportWatchlistCSV = () => {
    if (!watchlistData?.watchlist?.length) {
      toast.error('No student watchlist records to export');
      return;
    }

    const headers = [
      'Enrollment Number',
      'Student Name',
      'Email',
      'Attended Sessions',
      'Conducted Sessions',
      'Remaining Sessions',
      'Current Attendance %',
      'Max Achievable %',
      'Classes Needed for 75%',
      'DRI Score',
      'Risk Classification',
    ];

    const rows = watchlistData.watchlist.map((s) => [
      s.enrollmentNumber || '',
      `"${s.name || ''}"`,
      s.email || '',
      s.attended || 0,
      s.conducted || 0,
      s.remaining || 0,
      `${s.currentRate || 0}%`,
      `${s.maxAchievableRate || 0}%`,
      s.requiredSessions || 0,
      `${s.dri || 0}%`,
      s.riskLevel || 'SAFE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debarment_watchlist_${watchlistData.subjectCode || 'course'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Debarment watchlist exported to CSV');
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

      {/* Debarment Watchlist Alert Banner */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-md border transition-colors ${
        debarmentCount > 0
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center gap-2.5">
          {debarmentCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <div>
            <p className="text-xs font-semibold">
              {debarmentCount > 0
                ? `Debarment Watchlist Alert: ${debarmentCount} student${debarmentCount !== 1 ? 's' : ''} below 75.0% statutory threshold`
                : 'All Course Enrollments Satisfy Statutory Minimum (≥ 75%)'}
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Predictive Debarment Risk Index (DRI) analysis across registered course cohorts
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenWatchlist()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          Inspect Watchlist
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>
      </div>

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

      {/* Debarment Watchlist Modal (VII Sem Upgrade 4) */}
      {isWatchlistOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Debarment Risk Watchlist & DRI Trajectory Engine
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    VII Sem Capstone Upgrade 4 • Statutory Attendance Cutoff Threshold ≥ 75.0%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsWatchlistOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Course Filter & Action Controls */}
            <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  Selected Course:
                </label>
                <select
                  value={selectedWatchlistClass}
                  onChange={(e) => handleOpenWatchlist(e.target.value)}
                  className="h-8 px-2.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-800"
                >
                  {allClasses.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.subjectCode} — {cls.name} ({cls.students?.length || 0} enrolled)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportWatchlistCSV}
                  disabled={!watchlistData?.watchlist?.length}
                  className="inline-flex items-center gap-1.5 h-8 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Watchlist CSV
                </button>
              </div>
            </div>

            {/* Modal Body / Table */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoadingWatchlist ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin mb-2 text-blue-700" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Computing Debarment Risk Indices...
                  </p>
                </div>
              ) : watchlistData ? (
                <>
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md">
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Conducted Sessions</p>
                      <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                        {watchlistData.conducted} / {watchlistData.totalPlanned}
                      </p>
                    </div>
                    <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-md">
                      <p className="text-[10px] font-semibold uppercase text-slate-500">Remaining Sessions</p>
                      <p className="text-base font-bold font-mono text-slate-900 tabular-nums">
                        {watchlistData.remaining}
                      </p>
                    </div>
                    <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-md">
                      <p className="text-[10px] font-semibold uppercase text-rose-700">Critical / Debarred</p>
                      <p className="text-base font-bold font-mono text-rose-800 tabular-nums">
                        {watchlistData.watchlist?.filter((s) => s.riskLevel === 'CRITICAL' || s.riskLevel === 'DEBARRED').length || 0} Students
                      </p>
                    </div>
                    <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-[10px] font-semibold uppercase text-amber-700">Warning Status</p>
                      <p className="text-base font-bold font-mono text-amber-800 tabular-nums">
                        {watchlistData.watchlist?.filter((s) => s.riskLevel === 'WARNING').length || 0} Students
                      </p>
                    </div>
                  </div>

                  {/* Student Watchlist Table */}
                  <div className="border border-slate-200 rounded-md overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="px-3.5 py-2.5">Student</th>
                          <th className="px-3.5 py-2.5">Enrollment No.</th>
                          <th className="px-3.5 py-2.5 text-right font-mono">Attended</th>
                          <th className="px-3.5 py-2.5 text-right font-mono">Current %</th>
                          <th className="px-3.5 py-2.5 text-right font-mono">Max Achievable</th>
                          <th className="px-3.5 py-2.5 text-center">Req. Next</th>
                          <th className="px-3.5 py-2.5 text-center">DRI Score</th>
                          <th className="px-3.5 py-2.5 text-center">Risk Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-slate-700">
                        {watchlistData.watchlist?.map((s) => (
                          <tr
                            key={s.studentId}
                            className={`hover:bg-slate-50 transition-colors ${
                              s.riskLevel === 'CRITICAL' || s.riskLevel === 'DEBARRED'
                                ? 'bg-rose-50/30'
                                : s.riskLevel === 'WARNING'
                                ? 'bg-amber-50/20'
                                : ''
                            }`}
                          >
                            <td className="px-3.5 py-2 font-medium text-slate-900">
                              <p className="font-semibold text-slate-900">{s.name}</p>
                              <p className="text-[10px] text-slate-500">{s.email}</p>
                            </td>
                            <td className="px-3.5 py-2 font-mono text-slate-700 tabular-nums">
                              {s.enrollmentNumber}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono tabular-nums">
                              {s.attended} / {s.conducted}
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono font-semibold tabular-nums">
                              <span
                                className={
                                  s.currentRate >= 75
                                    ? 'text-emerald-700'
                                    : s.currentRate >= 65
                                    ? 'text-amber-700'
                                    : 'text-rose-700'
                                }
                              >
                                {s.currentRate}%
                              </span>
                            </td>
                            <td className="px-3.5 py-2 text-right font-mono tabular-nums text-slate-600">
                              {s.maxAchievableRate}%
                            </td>
                            <td className="px-3.5 py-2 text-center font-mono font-medium">
                              {s.requiredSessions > 0 ? (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold">
                                  {s.requiredSessions} of {s.remaining}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2 text-center font-mono font-semibold tabular-nums text-slate-900">
                              {s.dri}%
                            </td>
                            <td className="px-3.5 py-2 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  s.riskLevel === 'SAFE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : s.riskLevel === 'WARNING'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : s.riskLevel === 'CRITICAL'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-red-700 text-white'
                                }`}
                              >
                                {s.riskLevel}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {(!watchlistData.watchlist || watchlistData.watchlist.length === 0) && (
                      <div className="text-center py-10 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No student cohort data registered for this course.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>
                Statutory criteria: Students with attendance &lt; 75% at final semester cutoff are prohibited from terminal examinations.
              </span>
              <button
                onClick={() => setIsWatchlistOpen(false)}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;