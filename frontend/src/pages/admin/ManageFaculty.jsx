import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Search, Loader2, X, Mail, Building2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Faculty</h1>
          <p className="text-gray-500 mt-1">Add and manage faculty members</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Faculty
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Classes</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFaculty.map((fac) => (
                <tr key={fac._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {fac.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{fac.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{fac.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {fac.department?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {fac.classesCount || 0} classes
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        fac.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {fac.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(fac)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fac._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFaculty.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No faculty members found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingFaculty ? 'Edit Faculty' : 'Add Faculty'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingFaculty && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingFaculty}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                >
                  {editingFaculty ? 'Update' : 'Create'}
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