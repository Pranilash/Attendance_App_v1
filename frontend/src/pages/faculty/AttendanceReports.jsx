import { useState, useEffect } from 'react';
import { Download, Calendar, Users, TrendingUp, Loader2, FileSpreadsheet, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyAPI } from '../../services/api';
import AcademicTable from '../../components/common/AcademicTable';

const AttendanceReports = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await facultyAPI.getClasses();
      setClasses(response.data.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedClass) {
      toast.error('Please select a course');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await facultyAPI.getClassReport(selectedClass);
      setReport(response.data.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportCSV = async () => {
    if (!selectedClass) {
      toast.error('Please select a course');
      return;
    }

    try {
      // Try backend export first
      try {
        const response = await facultyAPI.exportReportCSV(selectedClass);
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Report exported');
        return;
      } catch {
        // Fall back to client-side CSV generation with university column headers
      }

      if (!report?.students?.length) {
        toast.error('Generate a report first');
        return;
      }

      // University-standard CSV column headers per §5.2
      const headers = [
        'Enrollment Number',
        'Student Name',
        'Department',
        'Attended Sessions',
        'Total Sessions',
        'Attendance Percentage',
        'Debarment Status',
      ];

      const totalSessions = report.totalSessions || 0;
      const rows = report.students.map((s) => [
        s.enrollmentNumber || '',
        s.name || '',
        s.department || '',
        s.presentCount || 0,
        totalSessions,
        s.attendancePercentage || 0,
        (s.attendancePercentage || 0) >= 75 ? 'Eligible' : 'At Risk',
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report_${selectedClass}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Report exported');
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const studentColumns = [
    {
      header: 'Student',
      accessor: 'name',
      width: '200px',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-slate-600">
              {row.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Enrollment No.',
      accessor: 'enrollmentNumber',
      width: '130px',
      render: (row) => (
        <span className="font-mono tabular-nums text-slate-700">{row.enrollmentNumber}</span>
      ),
    },
    {
      header: 'Attended',
      accessor: 'presentCount',
      align: 'right',
      width: '80px',
      render: (row) => (
        <span className="font-mono tabular-nums text-emerald-700 font-medium">{row.presentCount}</span>
      ),
    },
    {
      header: 'Absent',
      accessor: 'absentCount',
      align: 'right',
      width: '80px',
      render: (row) => (
        <span className="font-mono tabular-nums text-rose-700 font-medium">{row.absentCount}</span>
      ),
    },
    {
      header: 'Attendance %',
      accessor: 'attendancePercentage',
      align: 'right',
      width: '110px',
      render: (row) => {
        const pct = row.attendancePercentage || 0;
        return (
          <span className={`font-mono tabular-nums font-semibold ${
            pct >= 75 ? 'text-emerald-700' : pct >= 65 ? 'text-amber-700' : 'text-rose-700'
          }`}>
            {pct.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: 'Eligibility',
      accessor: 'status',
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
              Marginal Risk
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
              Debarment Risk
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
        <h1 className="text-lg font-bold text-slate-900">Attendance Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Generate and export course attendance data</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-md">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Report Parameters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Course
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="">Select course…</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.subjectCode} — {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BarChart3 className="w-3.5 h-3.5" />
              )}
              Generate
            </button>
            <button
              onClick={exportCSV}
              className="h-9 px-3 border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {report ? (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Sessions Conducted</p>
                <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{report.totalSessions || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Enrolled Students</p>
                <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{report.totalStudents || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Avg Attendance</p>
                <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{report.averageAttendance || 0}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-md">
              <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Export</p>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
              </div>
            </div>
          </div>

          {/* Student-wise Attendance Table */}
          <div>
            <div className="mb-2">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Student-wise Attendance</h2>
            </div>
            <AcademicTable
              columns={studentColumns}
              data={report.students || []}
              emptyIcon={Users}
              emptyMessage="No student attendance data available"
            />
          </div>

          {/* Session History */}
          <div className="bg-white border border-slate-200 rounded-md">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Session History</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {report.sessions?.map((session) => (
                <div key={session._id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      {new Date(session.startTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(session.startTime).toLocaleTimeString()} –{' '}
                      {session.endTime
                        ? new Date(session.endTime).toLocaleTimeString()
                        : 'Ongoing'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                      {session.presentCount}/{session.totalStudents}
                    </p>
                    <p className="text-[11px] text-slate-500">Present</p>
                  </div>
                </div>
              ))}
            </div>

            {(!report.sessions || report.sessions.length === 0) && (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No session history available</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-md text-center py-10">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 mb-1">No Report Generated</h3>
          <p className="text-xs text-slate-500">
            Select a course and click &quot;Generate&quot; to view attendance data.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;