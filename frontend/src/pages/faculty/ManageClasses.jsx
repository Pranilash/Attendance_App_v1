import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Users, Search, Loader2, X, UserPlus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyAPI } from '../../services/api';

const ManageClasses = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subjectCode: '',
    subjectName: '',
    department: '',
    semester: 1,
    credits: 3,
    schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }],
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, studentsRes, deptsRes] = await Promise.all([
        facultyAPI.getClasses(),
        facultyAPI.getStudents(),
        facultyAPI.getDepartments(),
      ]);
      setClasses(classesRes.data.data);
      setStudents(studentsRes.data.data);
      setDepartments(deptsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls);
      setFormData({
        name: cls.name,
        subjectCode: cls.subjectCode,
        subjectName: cls.subjectName || cls.name,
        department: cls.department?._id || cls.department || '',
        semester: cls.semester || 1,
        credits: cls.credits || 3,
        schedule: cls.schedule?.length > 0 ? cls.schedule : [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }],
      });
    } else {
      setEditingClass(null);
      // Set default department to first available
      const defaultDept = departments.length > 0 ? departments[0]._id : '';
      setFormData({
        name: '',
        subjectCode: '',
        subjectName: '',
        department: defaultDept,
        semester: 1,
        credits: 3,
        schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    setFormData({
      name: '',
      subjectCode: '',
      subjectName: '',
      department: '',
      semester: 1,
      credits: 3,
      schedule: [{ day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScheduleChange = (index, field, value) => {
    setFormData((prev) => {
      const newSchedule = [...prev.schedule];
      newSchedule[index] = { ...newSchedule[index], [field]: value };
      return { ...prev, schedule: newSchedule };
    });
  };

  const addScheduleSlot = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [...prev.schedule, { day: 'Monday', startTime: '09:00', endTime: '10:00', room: '' }],
    }));
  };

  const removeScheduleSlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await facultyAPI.updateClass(editingClass._id, formData);
        toast.success('Class updated successfully');
      } else {
        await facultyAPI.createClass(formData);
        toast.success('Class created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      await facultyAPI.deleteClass(id);
      toast.success('Class deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const handleOpenStudentModal = (cls) => {
    setSelectedClass(cls);
    setShowStudentModal(true);
  };

  const handleAddStudent = async (studentId) => {
    try {
      await facultyAPI.addStudentsToClass(selectedClass._id, [studentId]);
      toast.success('Student added to class');
      fetchData();
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    try {
      await facultyAPI.removeStudentFromClass(classId, studentId);
      toast.success('Student removed from class');
      fetchData();
    } catch (error) {
      console.error('Error removing student:', error);
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Manage Classes</h1>
          <p className="text-gray-500 mt-1">Create and manage your classes</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Class
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search classes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
          <div
            key={cls._id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.subjectCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(cls)}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cls._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Schedule */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </div>
              <div className="space-y-1">
                {cls.schedule?.map((slot, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    {slot.day}: {slot.startTime} - {slot.endTime}
                    {slot.room && ` (${slot.room})`}
                  </div>
                ))}
              </div>
            </div>

            {/* Students */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  {cls.students?.length || 0} Students
                </div>
                <button
                  onClick={() => handleOpenStudentModal(cls)}
                  className="text-sm text-purple-500 hover:text-purple-600"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex -space-x-2">
                {cls.students?.slice(0, 5).map((student, index) => (
                  <div
                    key={student._id || index}
                    className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border-2 border-white"
                    title={student.name}
                  >
                    <span className="text-xs font-medium text-green-600">
                      {student.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                ))}
                {(cls.students?.length || 0) > 5 && (
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-xs font-medium text-gray-600">
                      +{cls.students.length - 5}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No classes found</p>
        </div>
      )}

      {/* Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingClass ? 'Edit Class' : 'Create Class'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Data Structures"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., CS201"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    name="subjectName"
                    value={formData.subjectName}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Data Structures"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
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
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>{sem}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credits
                  </label>
                  <select
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((credit) => (
                      <option key={credit} value={credit}>{credit}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                {formData.schedule.map((slot, index) => (
                  <div key={index} className="flex gap-2 mb-2 flex-wrap">
                    <select
                      value={slot.day}
                      onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {days.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={slot.room}
                      onChange={(e) => handleScheduleChange(index, 'room', e.target.value)}
                      placeholder="Room"
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-[80px]"
                    />
                    {formData.schedule.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleSlot(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addScheduleSlot}
                  className="text-sm text-purple-500 hover:text-purple-600"
                >
                  + Add another time slot
                </button>
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
                  {editingClass ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStudentModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Manage Students - {selectedClass?.name}
              </h2>
              <button
                onClick={() => setShowStudentModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Students */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Enrolled Students</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedClass?.students?.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-green-600">
                          {student.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.enrollmentNumber}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveStudent(selectedClass._id, student._id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Students */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add Students</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {students
                  .filter(
                    (s) =>
                      !selectedClass?.students?.some((cs) => cs._id === s._id)
                  )
                  .map((student) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {student.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.enrollmentNumber}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddStudent(student._id)}
                        className="p-1 text-green-500 hover:bg-green-50 rounded"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;