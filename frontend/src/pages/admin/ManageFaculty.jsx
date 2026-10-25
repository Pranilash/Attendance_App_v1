import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import AcademicTable from '../../components/common/AcademicTable';

const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [facultyRes, deptRes] = await Promise.all([
        adminAPI.getFaculty(),
        adminAPI.getDepartments(),
      ]);
      setFaculty(facultyRes.data.data);
      setDepartments(deptRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (fac = null) => {
    if (fac) {
      setEditingFaculty(fac);
      setFormData({
        name: fac.name,
        email: fac.email,
        password: '',
        department: fac.department?._id || fac.department || '',
      });
    } else {
      setEditingFaculty(null);
      setFormData({ name: '', email: '', password: '', department: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFaculty(null);
    setFormData({ name: '', email: '', password: '', department: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await adminAPI.updateFaculty(editingFaculty._id, updateData);
        toast.success('Faculty updated successfully');
      } else {
        await adminAPI.createFaculty(formData);
        toast.success('Faculty created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving faculty:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;

    try {
      await adminAPI.deleteFaculty(id);
      toast.success('Faculty deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting faculty:', error);
    }
  };

  const filteredFaculty = faculty.filter((fac) => {
    const matchesSearch =
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fac.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !filterDepartment || fac.department?._id === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const columns = [
    {
      header: 'Faculty Member',
      accessor: 'name',
      width: '220px',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-slate-600">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-900">{row.name}</span>
        </div>
      ),
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => <span className="text-slate-600">{row.email}</span>,
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => <span className="text-slate-700">{row.department?.name || '—'}</span>,
    },
    {
      header: 'Courses',
      accessor: 'classesCount',
      align: 'right',
      width: '80px',
      render: (row) => (
        <span className="font-mono tabular-nums text-slate-700">{row.classesCount || 0}</span>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      align: 'center',
      width: '90px',
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            row.isActive
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
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
            title="Delete Faculty"
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
          <h1 className="text-lg font-bold text-slate-900">Faculty Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredFaculty.length} faculty member{filteredFaculty.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Faculty
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
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
      </div>

      {/* Faculty Table */}
      <AcademicTable
        columns={columns}
        data={filteredFaculty}
        emptyIcon={Users}
        emptyMessage="No faculty members found matching the current filters"
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-md p-5 w-full max-w-md mx-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                {editingFaculty ? 'Edit Faculty Record' : 'Add Faculty'}
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
                  Password {editingFaculty && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingFaculty}
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  placeholder="Enter password"
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
                  {editingFaculty ? 'Update Record' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageFaculty;