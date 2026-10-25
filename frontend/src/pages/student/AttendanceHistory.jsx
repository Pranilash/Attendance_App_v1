import { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Filter, Loader2, ChevronLeft, ChevronRight, QrCode, ScanFace } from 'lucide-react';
import { studentAPI } from '../../services/api';
import AcademicTable from '../../components/common/AcademicTable';

const AttendanceHistory = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });

  const fetchAttendanceHistory = useCallback(async () => {
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
  }, [filters.startDate, filters.endDate, filters.status, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory]);

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

  const columns = [
    {
      header: 'Date',
      accessor: 'timestamp',
      width: '120px',
      render: (row) => (
        <span className="font-mono text-slate-800">
          {new Date(row.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })}
        </span>
      ),
    },
    {
      header: 'Time',
      accessor: 'time',
      width: '110px',
      render: (row) => (
        <span className="font-mono text-slate-600 inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Course Code',
      accessor: 'subjectCode',
      width: '120px',
      render: (row) => (
        <span className="font-mono font-medium text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
          {row.subjectCode || '—'}
        </span>
      ),
    },
    {
      header: 'Course Title',
      accessor: 'className',
      render: (row) => (
        <span className="font-medium text-slate-900">{row.className || 'General Lecture'}</span>
      ),
    },
    {
      header: 'Verification Modality',
      accessor: 'modality',
      align: 'center',
      width: '170px',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {row.qrVerified && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-800 border border-slate-300">
              <QrCode className="w-3 h-3 text-slate-600" />
              QR
            </span>
          )}
          {row.faceVerified && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-300">
              <ScanFace className="w-3 h-3 text-blue-700" />
              Biometric
            </span>
          )}
          {!row.qrVerified && !row.faceVerified && (
            <span className="text-[11px] text-slate-400 font-mono">Manual Entry</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      width: '120px',
      render: (row) => (
        row.status === 'present' ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-700" />
            PRESENT
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-700" />
            ABSENT
          </span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Official Attendance Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical transaction records and biometric verification logs
          </p>
        </div>

        <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          Total Recorded Sessions: <span className="font-semibold text-slate-900">{pagination.total}</span>
        </div>
      </div>

      {/* Filter Ledger Bar */}
      <div className="bg-white border border-slate-200 rounded-md p-3">
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="h-9 px-2.5 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="h-9 px-2.5 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Attendance Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="h-9 px-2.5 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-700 bg-white min-w-[120px]"
            >
              <option value="">All Records</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>

          <button
            onClick={applyFilters}
            className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply Filter
          </button>
        </div>
      </div>

      {/* Academic Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 border border-slate-200 rounded-md bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-700 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Querying Attendance Ledger...
          </p>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="text-center py-12 border border-slate-200 rounded-md bg-white">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">No Attendance Records Found</p>
          <p className="text-xs text-slate-500 mt-1">Adjust selected date window or filter status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AcademicTable columns={columns} data={attendanceRecords} />

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-md text-xs text-slate-600">
              <span className="font-mono">
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total sessions)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="h-8 px-2.5 border border-slate-300 rounded-md flex items-center gap-1 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="h-8 px-2.5 border border-slate-300 rounded-md flex items-center gap-1 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;