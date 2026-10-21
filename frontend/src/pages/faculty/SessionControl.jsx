import { useState, useEffect, useRef } from 'react';
import { Play, StopCircle, Users, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { facultyAPI } from '../../services/api';

const SessionControl = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, total: 0 });
  const [countdown, setCountdown] = useState(14);
  const qrRefreshInterval = useRef(null);
  const countdownInterval = useRef(null);

  useEffect(() => {
    fetchClasses();
    return () => {
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
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

  const startCountdown = () => {
    setCountdown(14);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 14;
        return prev - 1;
      });
    }, 1000);
  };

  const startSession = async () => {
    if (!selectedClass) {
      toast.error('Please select a course first');
      return;
    }

    setIsStarting(true);
    try {
      const response = await facultyAPI.startSession(selectedClass);
      const session = response.data.data;
      setActiveSession(session);

      // Generate initial QR
      await generateQR(session);
      startCountdown();

      // Start QR refresh interval (every 14 seconds, before 15s expiry)
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
      qrRefreshInterval.current = setInterval(() => {
        refreshQR(session);
        setCountdown(14);
      }, 14000);

      toast.success('Attendance session started');
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    try {
      await facultyAPI.endSession(activeSession._id);

      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }

      setActiveSession(null);
      setQrDataUrl('');
      setSelectedClass('');
      toast.success('Session ended');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const generateQR = async (session) => {
    try {
      const qrPayload = JSON.stringify({
        sessionId: session._id,
        timestamp: session.timestamp,
        signature: session.qrSignature,
      });

      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const refreshQR = async () => {
    try {
      const response = await facultyAPI.getActiveSession(selectedClass);
      const updatedSession = response.data.data;
      if (updatedSession) {
        await generateQR(updatedSession);
      }
    } catch (error) {
      console.error('Error refreshing QR:', error);
    }
  };

  // Poll real attendance counts from backend
  useEffect(() => {
    if (activeSession && selectedClass) {
      const fetchAttendance = async () => {
        try {
          const response = await facultyAPI.getActiveSession(selectedClass);
          const session = response.data.data;
          if (session) {
            setAttendanceStats((prev) => ({
              ...prev,
              present: session.presentCount || prev.present,
            }));
          }
        } catch {
          // ignore polling errors
        }
      };
      const interval = setInterval(fetchAttendance, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSession, selectedClass]);

  const selectedClassData = classes.find((c) => c._id === selectedClass);
  const totalStudents = selectedClassData?.students?.length || 0;
  const attendanceRate = totalStudents > 0 ? Math.round((attendanceStats.present / totalStudents) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header — visible from 20 meters on projector */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {activeSession && selectedClassData
            ? `${selectedClassData.subjectCode} — ${selectedClassData.name}`
            : 'Session Control'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {activeSession && selectedClassData
            ? `Room ${selectedClassData.schedule?.[0]?.room || '—'} · Started ${new Date(activeSession.startTime).toLocaleTimeString()}`
            : 'Start an attendance session and display the QR code'}
        </p>
      </div>

      {!activeSession ? (
        /* Start Session Form */
        <div className="bg-white border border-slate-200 rounded-md max-w-md">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Start Attendance Session</h2>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Select Course
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
              >
                <option value="">Choose a course…</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.subjectCode} — {cls.name} ({cls.students?.length || 0} enrolled)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startSession}
              disabled={isStarting || !selectedClass}
              className="w-full flex items-center justify-center gap-2 h-10 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting…
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Attendance Session
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Active Session — Lecture Hall Projector HUD */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* QR Code Display — 320px clean canvas */}
          <div className="bg-white border border-slate-200 rounded-md">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">QR Code</h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
                <button
                  onClick={() => refreshQR(activeSession)}
                  className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-md"
                  title="Refresh QR code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center p-6">
              {qrDataUrl ? (
                <div className="relative">
                  {/* Clean 320×320 QR canvas with sharp 2px border */}
                  <div className="border-2 border-slate-300 rounded-md p-2 bg-white">
                    <img
                      src={qrDataUrl}
                      alt="Attendance QR Code"
                      className="w-[320px] h-[320px]"
                    />
                  </div>

                  {/* SVG Circular Progress Ring — 14s rotation */}
                  <div className="mt-4 flex items-center justify-center">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                      <circle
                        cx="20" cy="20" r="16"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="3"
                      />
                      <circle
                        cx="20" cy="20" r="16"
                        fill="none"
                        stroke="#1d4ed8"
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 16}`}
                        strokeDashoffset={`${2 * Math.PI * 16 * (1 - countdown / 14)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="ml-2 text-xs font-mono tabular-nums text-slate-600">
                      {countdown}s
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-[320px] h-[320px] bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}

              <p className="mt-3 text-[11px] text-slate-500 text-center">
                Rotates every 14s · Dynamic HMAC-SHA256 Signed
              </p>
            </div>
          </div>

          {/* Live Roster Drawer */}
          <div className="space-y-3">
            {/* Session Info */}
            <div className="bg-white border border-slate-200 rounded-md">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Session Info</h2>
              </div>
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Course</span>
                  <span className="text-xs font-semibold text-slate-900">
                    {selectedClassData?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Session ID</span>
                  <span className="font-mono text-xs text-slate-900 tabular-nums">
                    {activeSession._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Duration</span>
                  <span className="text-xs font-semibold text-slate-900 font-mono tabular-nums">
                    {Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 60000)} min
                  </span>
                </div>
              </div>
            </div>

            {/* Live Attendance Counter — high contrast */}
            <div className="bg-white border border-slate-200 rounded-md">
              <div className="px-4 py-3 border-b border-slate-200">
                <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Live Attendance</h2>
              </div>
              <div className="p-4">
                {/* High-contrast counter visible from back of lecture hall */}
                <div className="text-center mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                    Attended: {attendanceStats.present} / {totalStudents} ({attendanceRate}.0%)
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-md">
                    <CheckCircle className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                    <p className="text-lg font-bold text-emerald-700 font-mono tabular-nums">{attendanceStats.present}</p>
                    <p className="text-[11px] text-slate-600">Present</p>
                  </div>
                  <div className="text-center px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-md">
                    <XCircle className="w-4 h-4 text-rose-700 mx-auto mb-1" />
                    <p className="text-lg font-bold text-rose-700 font-mono tabular-nums">
                      {totalStudents - attendanceStats.present}
                    </p>
                    <p className="text-[11px] text-slate-600">Absent</p>
                  </div>
                  <div className="text-center px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md">
                    <Users className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-slate-900 font-mono tabular-nums">{totalStudents}</p>
                    <p className="text-[11px] text-slate-600">Total</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* End Session Button */}
            <button
              onClick={endSession}
              className="w-full flex items-center justify-center gap-2 h-10 bg-rose-700 text-white rounded-md hover:bg-rose-800 transition-colors text-xs font-semibold"
            >
              <StopCircle className="w-4 h-4" />
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionControl;