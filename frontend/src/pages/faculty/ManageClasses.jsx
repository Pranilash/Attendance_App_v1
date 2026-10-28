import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Users,
  Search,
  Loader2,
  X,
  CheckCircle,
  GraduationCap,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
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
  const [studentModalTab, setStudentModalTab] = useState('enrolled'); // 'enrolled' | 'available'
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
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
      toast.error('Failed to load courses');
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
        toast.success('Course updated successfully');
      } else {
        await facultyAPI.createClass(formData);
        toast.success('Course created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course? All session records will be archived.')) return;

    try {
      await facultyAPI.deleteClass(id);
      toast.success('Course deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Failed to delete course');
    }
  };

  const handleOpenStudentModal = (cls) => {
    setSelectedClass(cls);
    setStudentSearchQuery('');
    setStudentModalTab('enrolled');
    setShowStudentModal(true);
  };

  const handleAddStudent = async (studentId) => {
    try {
      await facultyAPI.addStudentsToClass(selectedClass._id, [studentId]);
      toast.success('Student enrolled in course roster');
      // Refresh class details
      const updatedClassRes = await facultyAPI.getClass(selectedClass._id);
      setSelectedClass(updatedClassRes.data.data);
      fetchData();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error('Failed to enroll student');
    }
  };

  const handleRemoveStudent = async (classId, studentId) => {
    try {
      await facultyAPI.removeStudentFromClass(classId, studentId);
      toast.success('Student removed from course roster');
      const updatedClassRes = await facultyAPI.getClass(classId);
      setSelectedClass(updatedClassRes.data.data);
      fetchData();
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('Failed to remove student');
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter students inside the student modal
  const enrolledStudents = (selectedClass?.students || []).filter((s) => {
    const q = studentSearchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.enrollmentNumber?.toLowerCase().includes(q);
  });

  const availableStudents = students
    .filter((s) => !selectedClass?.students?.some((cs) => cs._id === s._id))
    .filter((s) => {
      const q = studentSearchQuery.toLowerCase();
      return s.name?.toLowerCase().includes(q) || s.enrollmentNumber?.toLowerCase().includes(q);
    });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-slate-200 rounded-md bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700 mb-2" />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Loading Course Catalog...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Course Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure assigned academic courses, weekly recurrence, and student rosters
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Course
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter courses by code or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
        />
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredClasses.map((cls) => (
          <div
            key={cls._id}
            className="bg-white rounded-md border border-slate-200 hover:border-slate-300 shadow-sm transition-all flex flex-col justify-between"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center text-blue-700 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{cls.name}</h3>
                    <p className="text-xs font-mono font-semibold text-blue-700">{cls.subjectCode}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenModal(cls)}
                    className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit course parameters"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cls._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete course"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Course Meta Info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-mono py-1 border-y border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Semester</span>
                  <span className="font-semibold text-slate-800">Sem {cls.semester || 1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Credits</span>
                  <span className="font-semibold text-slate-800">{cls.credits || 3} Credits</span>
                </div>
              </div>

              {/* Schedule Preview */}
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Schedule Recurrence
                </p>
                <div className="space-y-1">
                  {cls.schedule?.map((slot, index) => (
                    <div key={index} className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center justify-between">
                      <span>{slot.day?.slice(0, 3)}: {slot.startTime}–{slot.endTime}</span>
                      <span className="text-slate-500 text-[11px]">{slot.room || 'Room 101'}</span>
                    </div>
                  ))}
                  {(!cls.schedule || cls.schedule.length === 0) && (
                    <p className="text-xs text-slate-400 italic">No schedule set</p>
                  )}
                </div>
              </div>
            </div>

            {/* Student Roster Footer Bar */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono font-bold">{cls.students?.length || 0}</span> enrolled
              </div>

              <button
                onClick={() => handleOpenStudentModal(cls)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              >
                Inspect Roster
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredClasses.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-md p-10 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-900">No Courses Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery ? 'Try adjusting your search filter.' : 'Create your first course to begin scheduling attendance sessions.'}
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Course Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">
                {editingClass ? 'Edit Course Parameters' : 'Create New Academic Course'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 text-slate-400 hover:text-slate-700 rounded-md">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS301"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleChange}
                    className="w-full h-9 px-3 text-xs font-mono uppercase bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    required
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  >
                    <option value="">Select Dept…</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database Management Systems"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    name="credits"
                    value={formData.credits}
                    onChange={handleChange}
                    className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                  />
                </div>
              </div>

              {/* Schedule Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                    Weekly Schedule Slots
                  </label>
                  <button
                    type="button"
                    onClick={addScheduleSlot}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    + Add Slot
                  </button>
                </div>

                {formData.schedule.map((slot, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md items-center text-xs">
                    <select
                      value={slot.day}
                      onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                      className="col-span-4 h-8 px-2 text-xs border border-slate-300 rounded bg-white"
                    >
                      {days.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>

                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                      className="col-span-3 h-8 px-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                    />

                    <input
                      type="text"
                      placeholder="Room"
                      value={slot.room}
                      onChange={(e) => handleScheduleChange(index, 'room', e.target.value)}
                      className="col-span-3 h-8 px-2 text-xs border border-slate-300 rounded bg-white"
                    />

                    <button
                      type="button"
                      onClick={() => removeScheduleSlot(index)}
                      className="col-span-2 p-1 text-slate-400 hover:text-rose-600 flex justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
                >
                  {editingClass ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Roster Inspector Drawer / Modal */}
      {showStudentModal && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Course Roster: {selectedClass.subjectCode} — {selectedClass.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedClass.students?.length || 0} students enrolled in this section
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowStudentModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs and Search Bar */}
            <div className="px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStudentModalTab('enrolled')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    studentModalTab === 'enrolled'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Enrolled Students ({selectedClass.students?.length || 0})
                </button>
                <button
                  onClick={() => setStudentModalTab('available')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    studentModalTab === 'available'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Enroll More Students ({availableStudents.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by name or roll no..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 w-full sm:w-52"
                />
              </div>
            </div>

            {/* Student List Content */}
            <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
              {studentModalTab === 'enrolled' ? (
                enrolledStudents.length > 0 ? (
                  enrolledStudents.map((student) => (
                    <div
                      key={student._id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{student.enrollmentNumber || student.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {student.faceRegistered && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" /> Biometrics Ready
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveStudent(selectedClass._id, student._id)}
                          className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">
                      {studentSearchQuery ? 'No matching enrolled students.' : 'No students enrolled in this course yet.'}
                    </p>
                  </div>
                )
              ) : (
                availableStudents.length > 0 ? (
                  availableStudents.map((student) => (
                    <div
                      key={student._id}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{student.enrollmentNumber || student.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddStudent(student._id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Enroll
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                    <p className="text-xs">All registered department students are already enrolled.</p>
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setShowStudentModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-200 rounded-md text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClasses;
