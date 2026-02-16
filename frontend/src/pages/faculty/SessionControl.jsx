import { useState, useEffect, useRef } from 'react';
import { Play, StopCircle, QrCode, Clock, Users, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
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
  const qrRefreshInterval = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchClasses();
    return () => {
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
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

  const startSession = async () => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }

    setIsStarting(true);
    try {
      const response = await facultyAPI.startSession(selectedClass);
      const session = response.data.data;
      setActiveSession(session);

      // Generate initial QR
      await generateQR(session);

      // Start QR refresh interval (every 14 seconds, before 15s expiry)
      qrRefreshInterval.current = setInterval(() => {
        refreshQR(session);
      }, 14000);

      toast.success('Session started successfully');
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

      setActiveSession(null);
      setQrDataUrl('');
      setSelectedClass('');
      toast.success('Session ended successfully');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const generateQR = async (session) => {
    try {
      // Use the timestamp and signature from the backend response
      // The backend generates the signature using sessionId:timestamp format
      const qrPayload = JSON.stringify({
        sessionId: session._id,
        timestamp: session.timestamp, // Use backend's timestamp, not Date.now()
        signature: session.qrSignature,
      });

      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  const refreshQR = async (session) => {
    try {
      // Fetch new QR data from backend
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
        } catch (err) {
          // ignore polling errors
        }
      };
      const interval = setInterval(fetchAttendance, 5000);
      return () => clearInterval(interval);
    }
  }, [activeSession, selectedClass]);

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session Control</h1>
        <p className="text-gray-500 mt-1">Start attendance sessions and display QR codes</p>
      </div>

      {!activeSession ? (
        /* Start Session Form */
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Start New Session</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Choose a class...</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name} ({cls.subjectCode}) - {cls.students?.length || 0} students
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startSession}
              disabled={isStarting || !selectedClass}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Attendance Session
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Active Session View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">QR Code</h2>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
                <button
                  onClick={() => refreshQR(activeSession)}
                  className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center">
              {qrDataUrl ? (
                <div className="relative">
                  <img
                    src={qrDataUrl}
                    alt="Attendance QR Code"
                    className="w-64 h-64 rounded-lg shadow-lg"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                    Refreshes in 15s
                  </div>
                </div>
              ) : (
                <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              <p className="mt-4 text-sm text-gray-500 text-center">
                Students should scan this QR code to mark their attendance
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>
                  Started at {new Date(activeSession.startTime).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Session Stats */}
          <div className="space-y-4">
            {/* Session Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Info</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Class</span>
                  <span className="font-medium text-gray-900">
                    {classes.find((c) => c._id === selectedClass)?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Session ID</span>
                  <span className="font-mono text-sm text-gray-900">
                    {activeSession._id?.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium text-gray-900">
                    {Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 60000)} mins
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Attendance</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
                  <p className="text-sm text-gray-500">Present</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {(classes.find((c) => c._id === selectedClass)?.students?.length || 0) - attendanceStats.present}
                  </p>
                  <p className="text-sm text-gray-500">Absent</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-600">
                    {classes.find((c) => c._id === selectedClass)?.students?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Attendance Rate</span>
                  <span className="font-medium text-gray-900">
                    {Math.round(
                      (attendanceStats.present /
                        (classes.find((c) => c._id === selectedClass)?.students?.length || 1)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (attendanceStats.present /
                          (classes.find((c) => c._id === selectedClass)?.students?.length || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* End Session Button */}
            <button
              onClick={endSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <StopCircle className="w-5 h-5" />
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionControl;