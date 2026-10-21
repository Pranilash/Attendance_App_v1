import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GraduationCap, Search, Loader2, X, Camera, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AcademicTable from '../../components/common/AcademicTable';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterFaceStatus, setFilterFaceStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    enrollmentNumber: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, deptRes] = await Promise.all([
        adminAPI.getStudents(),
        adminAPI.getDepartments(),
      ]);
      const studentsData = studentsRes.data.data;
      setStudents(studentsData.students || studentsData);
      setDepartments(deptRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        email: student.email,
        password: '',
        department: student.department?._id || student.department || '',
        enrollmentNumber: student.enrollmentNumber || '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        department: '',
        enrollmentNumber: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      department: '',
      enrollmentNumber: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await adminAPI.updateStudent(editingStudent._id, updateData);
        toast.success('Student updated successfully');
      } else {
        await adminAPI.createStudent(formData);
        toast.success('Student created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await adminAPI.deleteStudent(id);
      toast.success('Student deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !filterDepartment || student.department?._id === filterDepartment;
    const matchesFaceStatus =
      !filterFaceStatus ||
      (filterFaceStatus === 'registered' && student.faceRegistered) ||
      (filterFaceStatus === 'pending' && !student.faceRegistered);
    return matchesSearch && matchesDepartment && matchesFaceStatus;
  });

  const columns = [
    {
      header: 'Student',
      accessor: 'name',
      width: '220px',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-slate-600">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">{row.name}</p>
            <p className="text-[11px] text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Enrollment No.',
      accessor: 'enrollmentNumber',
      width: '140px',
      align: 'left',
      render: (row) => (
        <span className="font-mono tabular-nums text-slate-700">
          {row.enrollmentNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span className="text-slate-700">{row.department?.name || '—'}</span>
      ),
    },
    {
      header: 'Biometric Status',
      accessor: 'faceRegistered',
      align: 'center',
      width: '120px',
      render: (row) =>
        row.faceRegistered ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" />
            Registered
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Camera className="w-3 h-3" />
            Pending
          </span>
        ),
    },
    {
      header: 'Attendance',
      accessor: 'attendanceRate',
      align: 'right',
      width: '100px',
      render: (row) => {
        const rate = row.attendanceRate || 0;
        return (
          <span className={`font-mono tabular-nums font-medium ${
            rate >= 75 ? 'text-emerald-700' : rate >= 65 ? 'text-amber-700' : 'text-rose-700'
          }`}>
            {rate.toFixed(1)}%
          </span>
        );
      },
    },
    {
      header: 'Actions',
      align: 'right',
      width: '100px',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            title="View Record"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
            title="Delete Student"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Course Enrollment Roster — Students</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or enrollment number…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 h-9 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
        <select
          value={filterFaceStatus}
          onChange={(e) => setFilterFaceStatus(e.target.value)}
          className="h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
        >
          <option value="">All Biometric Status</option>
          <option value="registered">Registered</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Students Table */}
      <AcademicTable
        columns={columns}
        data={filteredStudents}
        emptyIcon={GraduationCap}
        emptyMessage="No students found matching the current filters"
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-md p-5 w-full max-w-md mx-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                {editingStudent ? 'Edit Student Record' : 'Add Student'}
              </h2>
              <button onClick={handleCloseModal} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Password {editingStudent && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingStudent}
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Enrollment Number
                </label>
                <input
                  type="text"
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 font-mono"
                  placeholder="Enter enrollment number"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 h-9 px-3 text-xs font-semibold border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-9 px-3 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800"
                >
                  {editingStudent ? 'Update Record' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;