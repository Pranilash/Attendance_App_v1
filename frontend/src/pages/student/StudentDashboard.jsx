import { useState, useEffect } from 'react';
import {
  QrCode,
  Calendar,
  Camera,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { studentAPI } from '../../services/api';
import AcademicTable from '../../components/common/AcademicTable';

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
      setUpcomingClasses(classes);

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

  // Academic calculation per §4.4:
  // Safe absences before falling below 75%: Math.floor((A - 0.75 * C) / 0.75)
  // Needed consecutive classes to reach 75%:  Math.ceil((0.75 * C - A) / 0.25)
  const getMarginInfo = (attended, conducted) => {
    if (conducted === 0) return { status: 'eligible', safeAbsences: 0, needed: 0 };
    const rate = attended / conducted;
    if (rate >= 0.75) {
      return {
        status: 'eligible',
        safeAbsences: Math.floor((attended - 0.75 * conducted) / 0.75),
        needed: 0,
      };
    } else {
      return {
        status: 'at_risk',
        safeAbsences: 0,
        needed: Math.ceil((0.75 * conducted - attended) / 0.25),
      };
    }
  };

  const margin = getMarginInfo(stats.presentCount, stats.presentCount + stats.absentCount);
  const totalConducted = stats.presentCount + stats.absentCount;

  // Course table columns
  const courseColumns = [
    {
      header: 'Course Code',
      accessor: 'subjectCode',
      width: '110px',
      render: (row) => (
        <span className="font-mono tabular-nums text-xs font-semibold text-slate-900">
          {row.subjectCode || '—'}
        </span>
      ),
    },
    {
      header: 'Course Title',
      accessor: 'name',
      render: (row) => <span className="text-xs text-slate-900">{row.name}</span>,
    },
    {
      header: 'Faculty',
      accessor: 'faculty',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.faculty?.name || '—'}</span>
      ),
    },
    {
      header: 'Attended / Held',
      accessor: 'attendedSessions',
      align: 'right',
      width: '120px',
      render: (row) => {
        const attended = row.attendedSessions || 0;
        const total = row.totalSessions || 0;
        return (
          <span className="font-mono tabular-nums text-xs text-slate-700">
            {attended} / {total}
          </span>
        );
      },
    },
    {
      header: 'Percentage',
      accessor: 'attendancePercentage',
      align: 'right',
      width: '100px',
      render: (row) => {
        const pct = row.attendancePercentage || 0;
        return (
          <span className={`font-mono tabular-nums text-xs font-semibold ${
            pct >= 75 ? 'text-emerald-700' : pct >= 65 ? 'text-amber-700' : 'text-rose-700'
          }`}>
            {pct.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: 'Eligibility',
      accessor: 'eligibility',
      align: 'center',
      width: '120px',
      render: (row) => {
        const pct = row.attendancePercentage || 0;
        if (pct >= 75) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Eligible
            </span>
          );
        } else if (pct >= 65) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              Marginal
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
              At Risk
            </span>
          );
        }
      },
    },
  ];

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
        <h1 className="text-lg font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Enrolled courses and attendance status</p>
      </div>

      {/* Biometric Registration Alert */}
      {!stats.faceRegistered && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800">Biometric Registration Required</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              You must register your face to mark attendance via biometric verification.
            </p>
          </div>
          <a
            href="/student/register-face"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white rounded-md hover:bg-amber-800 text-xs font-semibold flex-shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            Register
          </a>
        </div>
      )}

      {/* Debarment Risk Margin Widget — §4.4 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Primary metric card */}
        <div className="bg-white border border-slate-200 rounded-md px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Attendance Summary</p>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {stats.presentCount} / {totalConducted} Sessions Attended ({totalConducted > 0 ? stats.attendanceRate.toFixed(1) : '0.0'}%)
          </p>
        </div>

        {/* Status pill */}
        <div className={`border rounded-md px-4 py-3 ${
          margin.status === 'eligible'
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Eligibility Status</p>
          <p className={`text-sm font-bold mt-1 ${
            margin.status === 'eligible' ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            {margin.status === 'eligible'
              ? 'Statutory Minimum Satisfied'
              : 'Below 75.0% Statutory Minimum'}
          </p>
        </div>

        {/* Advisory */}
        <div className="bg-white border border-slate-200 rounded-md px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Advisory</p>
          {margin.status === 'eligible' ? (
            <p className="text-xs font-semibold text-slate-700 mt-1">
              You can miss {margin.safeAbsences} additional lecture{margin.safeAbsences !== 1 ? 's' : ''} before debarment risk.
            </p>
          ) : (
            <p className="text-xs font-semibold text-rose-700 mt-1">
              You need {margin.needed} consecutive attended session{margin.needed !== 1 ? 's' : ''} to reach 75.0%.
            </p>
          )}
        </div>
      </div>

      {/* Debarment Risk Radar (VII Sem Upgrade 4) */}
      {stats.debarmentRisk && (
        <div className="bg-white border border-slate-200 rounded-md">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Debarment Risk Index (DRI)</h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    stats.debarmentRisk.riskLevel === 'SAFE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : stats.debarmentRisk.riskLevel === 'WARNING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {stats.debarmentRisk.riskLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Predictive cutoff trajectory modeling — statutory attendance ≥ 75%
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Overall DRI</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">{stats.debarmentRisk.dri}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {stats.debarmentRisk.classes?.map((item) => (
              <div key={item.classId} className="px-3 py-2.5 border border-slate-200 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 truncate">{item.subjectCode}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      item.riskLevel === 'SAFE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.riskLevel === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    DRI {item.dri}%
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Current: <strong className="text-slate-700 font-mono tabular-nums">{item.currentRate}%</strong></span>
                  <span>Max: <strong className="text-slate-700 font-mono tabular-nums">{item.maxAchievableRate}%</strong></span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.currentRate >= 75 ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    style={{ width: `${Math.min(100, item.currentRate)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Need <strong className="text-slate-700 font-mono tabular-nums">{item.requiredSessions}</strong> more attended out of <strong className="text-slate-700 font-mono tabular-nums">{item.remaining}</strong> remaining
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrolled Courses Table */}
      <div>
        <div className="mb-2">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Enrolled Courses</h2>
        </div>
        <AcademicTable
          columns={courseColumns}
          data={upcomingClasses}
          emptyIcon={BookOpen}
          emptyMessage="No enrolled courses found"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-md">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4">
          <a
            href="/student/scan"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            <QrCode className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Scan QR</span>
              <span className="text-[11px] text-slate-500">Mark Attendance</span>
            </div>
          </a>
          <a
            href="/student/history"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-xs font-semibold text-slate-700 block">History</span>
              <span className="text-[11px] text-slate-500">View Records</span>
            </div>
          </a>
          <a
            href="/student/register-face"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-xs font-semibold text-slate-700 block">
                {stats.faceRegistered ? 'Update Biometrics' : 'Register Face'}
              </span>
              <span className="text-[11px] text-slate-500">
                {stats.faceRegistered ? 'Re-enroll data' : 'Required'}
              </span>
            </div>
          </a>
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Current Attendance</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-500">
                {stats.attendanceRate.toFixed(1)}%
                {stats.attendanceRate >= 75 ? ' (Eligible)' : ' (At Risk)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;