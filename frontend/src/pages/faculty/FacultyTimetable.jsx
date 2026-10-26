import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Play,
  Building2,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { facultyAPI } from '../../services/api';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const FacultyTimetable = () => {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = All Days, 1-6 = Mon-Sat
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    classId: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    roomNumber: 'Room 101',
    autoStart: true,
  });

  const todayDayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday...

  useEffect(() => {
    fetchTimetableData();
  }, []);

  const fetchTimetableData = async () => {
    setIsLoading(true);
    try {
      const [timetableRes, classesRes] = await Promise.all([
        facultyAPI.getTimetable(),
        facultyAPI.getClasses(),
      ]);
      setTimetable(timetableRes.data?.data || []);
      const classList = classesRes.data?.data || [];
      setClasses(classList);
      if (classList.length > 0) {
        setFormData((prev) => ({ ...prev, classId: classList[0]._id }));
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      toast.error('Failed to load timetable schedule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!formData.classId) {
      toast.error('Please select a course');
      return;
    }

    setIsSubmitting(true);
    try {
      await facultyAPI.createTimetableSlot({
        ...formData,
        dayOfWeek: Number(formData.dayOfWeek),
      });
      toast.success('Timetable schedule slot added');
      setShowAddModal(false);
      fetchTimetableData();
    } catch (error) {
      console.error('Error creating timetable slot:', error);
      toast.error(error.response?.data?.message || 'Failed to create slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled lecture slot?')) return;
    try {
      await facultyAPI.deleteTimetableSlot(slotId);
      toast.success('Schedule slot deleted');
      setTimetable((prev) => prev.filter((s) => s._id !== slotId));
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast.error('Failed to delete schedule slot');
    }
  };

  const isSlotCurrent = (slot) => {
    if (slot.dayOfWeek !== todayDayOfWeek) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = slot.startTime.split(':').map(Number);
    const [endH, endM] = slot.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  const filteredSlots = selectedDay === 0
    ? timetable
    : timetable.filter((s) => s.dayOfWeek === selectedDay);

  // Group slots by day
  const groupedByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    slots: filteredSlots
      .filter((s) => s.dayOfWeek === day.id)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((group) => selectedDay === 0 || group.id === selectedDay);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-slate-200 rounded-md bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700 mb-2" />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Loading Academic Schedule...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Timetable & Schedule Engine
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
              Upgrade 5
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Faculty weekly teaching slots with automated session synchronization
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Schedule Slot
        </button>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setSelectedDay(0)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
            selectedDay === 0
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Full Week ({timetable.length})
        </button>
        {DAYS_OF_WEEK.map((day) => {
          const count = timetable.filter((s) => s.dayOfWeek === day.id).length;
          const isToday = todayDayOfWeek === day.id;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDay === day.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{day.name}</span>
              <span className={`text-[10px] px-1 rounded font-mono ${
                selectedDay === day.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {count}
              </span>
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Today" />
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule Content */}
      <div className="space-y-4">
        {groupedByDay.map((group) => (
          <div key={group.id} className="bg-white border border-slate-200 rounded-md overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-600" />
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {group.name}
                </h2>
                {todayDayOfWeek === group.id && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Today
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-slate-500">
                {group.slots.length} lecture{group.slots.length !== 1 ? 's' : ''}
              </span>
            </div>

            {group.slots.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {group.slots.map((slot) => {
                  const activeNow = isSlotCurrent(slot);
                  const course = slot.classId;
                  return (
                    <div
                      key={slot._id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
                        activeNow ? 'bg-emerald-50/40 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                              {course?.subjectCode || 'CRS'}
                            </span>
                            <span className="text-sm font-semibold text-slate-900">
                              {course?.name || 'Class Lecture'}
                            </span>
                            {activeNow && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                IN PROGRESS NOW
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                            <span>{slot.startTime} – {slot.endTime}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {slot.roomNumber || 'Room 101'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {activeNow && (
                          <button
                            onClick={() => navigate('/faculty/session')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Launch Live Session
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSlot(slot._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <p className="text-xs">No lectures scheduled for {group.name}</p>
              </div>
            )}
          </div>
        ))}

        {timetable.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No Timetable Slots Defined</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Create your recurring weekly lecture slots to synchronize the academic schedule and enable automated roll-call sessions.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Timetable Slot
            </button>
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900">Add Timetable Lecture Slot</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Course
                </label>
                <select
                  required
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
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
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.id} value={day.id}>
                      {day.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Lecture Hall / Room Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hall 302, Lab 4"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-semibold"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Save Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyTimetable;

