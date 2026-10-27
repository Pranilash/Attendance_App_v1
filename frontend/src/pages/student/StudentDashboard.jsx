import { useState, useEffect } from 'react';
import {
  QrCode,
  Calendar,
  Camera,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  Loader2,
  Calculator,
  CalendarDays,
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
  const [simUpcoming, setSimUpcoming] = useState(5);
  const [simAttended, setSimAttended] = useState(5);

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
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">Student Dashboard</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Enrolled courses and attendance status</p>
      </div>

      {/* Biometric Registration Alert */}
      {!stats.faceRegistered && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Biometric Registration Required</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Summary</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
            {stats.presentCount} / {totalConducted} Sessions Attended ({totalConducted > 0 ? stats.attendanceRate.toFixed(1) : '0.0'}%)
          </p>
        </div>

        {/* Status pill */}
        <div className={`border rounded-md px-4 py-3 ${
          margin.status === 'eligible'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
        }`}>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Eligibility Status</p>
          <p className={`text-sm font-bold mt-1 ${
            margin.status === 'eligible' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
          }`}>
            {margin.status === 'eligible'
              ? 'Statutory Minimum Satisfied'
              : 'Below 75.0% Statutory Minimum'}
          </p>
        </div>

        {/* Advisory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Advisory</p>
          {margin.status === 'eligible' ? (
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-1">
              You can miss {margin.safeAbsences} additional lecture{margin.safeAbsences !== 1 ? 's' : ''} before debarment risk.
            </p>
          ) : (
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-1">
              You need {margin.needed} consecutive attended session{margin.needed !== 1 ? 's' : ''} to reach 75.0%.
            </p>
          )}
        </div>
      </div>

      {/* Debarment Risk Radar (VII Sem Upgrade 4) */}
      {stats.debarmentRisk && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Debarment Risk Index (DRI)</h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                    stats.debarmentRisk.riskLevel === 'SAFE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                      : stats.debarmentRisk.riskLevel === 'WARNING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                  }`}
                >
                  {stats.debarmentRisk.riskLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Predictive cutoff trajectory modeling — statutory attendance ≥ 75%
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Overall DRI</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">{stats.debarmentRisk.dri}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {stats.debarmentRisk.classes?.map((item) => (
              <div key={item.classId} className="px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-md space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.subjectCode}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      item.riskLevel === 'SAFE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : item.riskLevel === 'WARNING'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                    }`}
                  >
                    DRI {item.dri}%
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Current: <strong className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">{item.currentRate}%</strong></span>
                  <span>Max: <strong className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">{item.maxAchievableRate}%</strong></span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      item.currentRate >= 75 ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                    style={{ width: `${Math.min(100, item.currentRate)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Need <strong className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">{item.requiredSessions}</strong> more attended out of <strong className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">{item.remaining}</strong> remaining
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "What-If" Predictive Attendance Simulator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              &quot;What-If&quot; Attendance Simulator & Trajectory Forecast
            </h2>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
            Interactive Modeling
          </span>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slider 1: Total Upcoming Lectures */}
            <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Next Upcoming Lectures:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{simUpcoming} lectures</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={simUpcoming}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSimUpcoming(val);
                  if (simAttended > val) setSimAttended(val);
                }}
                className="w-full accent-blue-700 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 lecture</span>
                <span>10 lectures</span>
                <span>20 lectures</span>
              </div>
            </div>

            {/* Slider 2: Lectures You Plan to Attend */}
            <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Lectures You Attend:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  {simAttended} of {simUpcoming}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={simUpcoming}
                value={simAttended}
                onChange={(e) => setSimAttended(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 attended (miss all)</span>
                <span>{simUpcoming} attended (100% presence)</span>
              </div>
            </div>
          </div>

          {/* Simulation Outcome Strip */}
          {(() => {
            const simTotalConducted = totalConducted + simUpcoming;
            const simTotalAttended = stats.presentCount + Math.min(simAttended, simUpcoming);
            const simRate = simTotalConducted > 0 ? (simTotalAttended / simTotalConducted) * 100 : 0;
            const simDelta = simRate - (totalConducted > 0 ? stats.attendanceRate : 0);
            const simIsEligible = simRate >= 75.0;

            return (
              <div className={`p-4 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                simIsEligible
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                  : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Projected Attendance:</span>
                    <span className="text-lg font-bold font-mono tabular-nums">
                      {simRate.toFixed(1)}%
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      simDelta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                    }`}>
                      ({simDelta >= 0 ? `+${simDelta.toFixed(1)}%` : `${simDelta.toFixed(1)}%`})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    If you attend <strong className="text-slate-900 dark:text-white">{simAttended}</strong> out of your next <strong className="text-slate-900 dark:text-white">{simUpcoming}</strong> sessions, your cumulative tally becomes <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{simTotalAttended} / {simTotalConducted}</strong>.
                  </p>
                </div>

                <div className="shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${
                    simIsEligible
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                  }`}>
                    {simIsEligible ? 'Statutory Minimum Satisfied (≥ 75%)' : 'Debarment Warning (< 75%)'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md transition-colors">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 p-4">
          <a
            href="/student/scan"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <QrCode className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">Scan QR</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Mark Attendance</span>
            </div>
          </a>
          <a
            href="/student/timetable"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CalendarDays className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">Timetable</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Weekly Schedule</span>
            </div>
          </a>
          <a
            href="/student/history"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">History</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">View Records</span>
            </div>
          </a>
          <a
            href="/student/register-face"
            className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Camera className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                {stats.faceRegistered ? 'Biometrics' : 'Register Face'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {stats.faceRegistered ? 'Re-enroll template' : 'Required'}
              </span>
            </div>
          </a>
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md col-span-2 sm:col-span-1">
            <TrendingUp className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">Current Tally</span>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
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