import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  Building2,
  User,
  QrCode,
  Loader2,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { studentAPI } from '../../services/api';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const StudentTimetable = () => {
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0); // 0 = Full Week

  const todayDayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday...

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const response = await studentAPI.getTimetable();
      setTimetable(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching student timetable:', error);
      toast.error('Failed to load course timetable');
    } finally {
      setIsLoading(false);
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
          Retrieving Course Schedule...
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
              Weekly Course Timetable
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              Enrolled Roster
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized schedule of lectures, rooms, and active roll-call periods
          </p>
        </div>

        <button
          onClick={() => navigate('/student/scan')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <QrCode className="w-3.5 h-3.5" />
          Scan Attendance Token
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
          All Days ({timetable.length})
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

      {/* Grouped Day Schedules */}
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
                {group.slots.length} class{group.slots.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {group.slots.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {group.slots.map((slot) => {
                  const activeNow = isSlotCurrent(slot);
                  const course = slot.classId;
                  const instructor = slot.facultyId;
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
                              {course?.name || 'Course Lecture'}
                            </span>
                            {activeNow && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                CLASS IN PROGRESS
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="font-mono font-medium text-slate-700">
                              {slot.startTime} – {slot.endTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {slot.roomNumber || 'Room 101'}
                            </span>
                            {instructor?.name && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  {instructor.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {activeNow && (
                        <button
                          onClick={() => navigate('/student/scan')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors self-end sm:self-center"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Scan Attendance Token
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
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
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No Schedule Data Available</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your professors have not yet published recurring timetable slots for your enrolled courses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTimetable;

