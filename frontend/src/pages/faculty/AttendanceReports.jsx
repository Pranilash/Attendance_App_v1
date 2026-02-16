import { useState, useEffect } from 'react';
import { Download, Search, Calendar, Users, TrendingUp, Loader2, FileSpreadsheet, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyAPI } from '../../services/api';

const AttendanceReports = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [report, setReport] = useState(null);
  const [sessions, setSessions] = useState([]);
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
      toast.error('Please select a class');
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
      toast.error('Please select a class');
      return;
    }

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
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
        <p className="text-gray-500 mt-1">View and export attendance reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} ({cls.subjectCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={generateReport}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Generate
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {report ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{report.totalSessions || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Students</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{report.totalStudents || 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg Attendance</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{report.averageAttendance || 0}%</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Export</p>
                  <button
                    onClick={exportCSV}
                    className="mt-2 flex items-center gap-2 text-purple-500 hover:text-purple-600"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    Download CSV
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-orange-500">
                  <Download className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Student-wise Attendance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Student-wise Attendance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Enrollment No.</th>
                    <th className="px-6 py-3">Present</th>
                    <th className="px-6 py-3">Absent</th>
                    <th className="px-6 py-3">Attendance %</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.students?.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-green-600">
                              {student.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.enrollmentNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">
                        {student.presentCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-red-600 font-medium">
                        {student.absentCount}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                student.attendancePercentage >= 75
                                  ? 'bg-green-500'
                                  : student.attendancePercentage >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendancePercentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {student.attendancePercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            student.attendancePercentage >= 75
                              ? 'bg-green-100 text-green-700'
                              : student.attendancePercentage >= 50
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {student.attendancePercentage >= 75
                            ? 'Good'
                            : student.attendancePercentage >= 50
                            ? 'Warning'
                            : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!report.students || report.students.length === 0) && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No student data available</p>
              </div>
            )}
          </div>

          {/* Session History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Session History</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {report.sessions?.map((session) => (
                <div key={session._id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(session.startTime).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.startTime).toLocaleTimeString()} -{' '}
                          {session.endTime
                            ? new Date(session.endTime).toLocaleTimeString()
                            : 'Ongoing'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {session.presentCount}/{session.totalStudents}
                      </p>
                      <p className="text-sm text-gray-500">Present</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!report.sessions || report.sessions.length === 0) && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No session history available</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
          <p className="text-gray-500 mb-4">
            Select a class and click "Generate" to view the attendance report
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;