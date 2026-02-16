import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { studentAPI } from '../../services/api';

const AttendanceHistory = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '', // 'present', 'absent', ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchAttendanceHistory();
  }, [pagination.page]);

  const fetchAttendanceHistory = async () => {
    setIsLoading(true);
    try {
      const response = await studentAPI.getAttendanceHistory({
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        page: pagination.page,
        limit: pagination.limit,
      });

      setAttendanceRecords(response.data.data.records || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.data.total || 0,
        totalPages: response.data.data.totalPages || 0,
      }));
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchAttendanceHistory();
  };

  const goToPage = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const getStatusBadge = (status) => {
    if (status === 'present') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3" />
          Present
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" />
        Absent
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-500 mt-1">View your past attendance records</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <button
            onClick={applyFilters}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            <Filter className="w-4 h-4" />
            Apply
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-sm font-medium text-gray-500">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {new Date(record.timestamp).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{record.className}</p>
                          <p className="text-sm text-gray-500">{record.subjectCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {new Date(record.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {record.qrVerified && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              QR
                            </span>
                          )}
                          {record.faceVerified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Face
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {attendanceRecords.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No attendance records found</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .slice(
                      Math.max(0, pagination.page - 3),
                      Math.min(pagination.totalPages, pagination.page + 2)
                    )
                    .map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                          page === pagination.page
                            ? 'bg-purple-500 text-white'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  <button
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-700">
                {attendanceRecords.filter((r) => r.status === 'present').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-700">
                {attendanceRecords.filter((r) => r.status === 'absent').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-700">
                {attendanceRecords.length > 0
                  ? Math.round(
                      (attendanceRecords.filter((r) => r.status === 'present').length /
                        attendanceRecords.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;