import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, AlertCircle, Loader2, ArrowLeft, History, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import FaceCapture from '../../components/face/FaceCapture';
import { studentAPI } from '../../services/api';

const FaceVerification = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);

  const handleFaceCapture = async (faceData) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await studentAPI.verifyFace(sessionId, {
        embedding: faceData.embedding,
        image: faceData.image,
        livenessPassed: faceData.livenessPassed,
        livenessMetrics: faceData.livenessMetrics,
      });

      if (response.data.success) {
        setVerificationResult('success');
        setAttendanceData(response.data.data);
        toast.success('Attendance verified and marked in roster');
      } else {
        setVerificationResult('failed');
        toast.error(response.data.message || 'Biometric signature rejected');
      }
    } catch (error) {
      console.error('Face verification error:', error);
      setVerificationResult('failed');
      toast.error(error.response?.data?.message || 'Biometric verification transaction failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoBack = () => {
    navigate('/student/scan');
  };

  const handleGoToHistory = () => {
    navigate('/student/history');
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="h-8 w-8 flex items-center justify-center border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
            title="Return to QR scanner"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Biometric Verification Viewfinder
            </h1>
            <p className="text-xs text-slate-500">
              Phase 2 of 2: Facial landmark analysis and dynamic anti-spoofing challenge
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            Session: <span className="font-semibold text-slate-900">{sessionId?.slice(-8).toUpperCase()}</span>
          </span>
        </div>
      </div>

      {/* Verification In-Progress Banner */}
      {isVerifying && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center gap-2.5 text-xs text-blue-900">
          <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
          <div>
            <p className="font-semibold uppercase tracking-wider">Matching Facial Vector...</p>
            <p className="text-[11px] text-blue-700">Comparing descriptor distance against registered student embedding in university registry</p>
          </div>
        </div>
      )}

      {/* Success Transaction Receipt */}
      {verificationResult === 'success' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-md p-4 text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-900">
                  Attendance Transaction Confirmed
                </h3>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Your attendance has been immutably recorded in the institutional database.
                </p>
              </div>

              {attendanceData && (
                <div className="bg-white/80 border border-emerald-200 rounded p-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Course Name</span>
                    <span className="font-semibold text-slate-800">{attendanceData.className || 'Lecture Section'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Timestamp</span>
                    <span className="text-slate-800">{new Date(attendanceData.timestamp || Date.now()).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Status</span>
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      PRESENT (VERIFIED)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleGoToHistory}
                  className="h-8 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  View Enrolled Ledger
                </button>
                <button
                  onClick={() => navigate('/student')}
                  className="h-8 px-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failure Banner */}
      {verificationResult === 'failed' && (
        <div className="bg-rose-50 border border-rose-300 rounded-md p-4 text-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-700 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-rose-900">
                  Biometric Verification Rejected
                </h3>
                <p className="text-rose-700 text-xs mt-0.5">
                  The captured facial landmarks could not be verified against your registered template or failed dynamic anti-spoofing criteria.
                </p>
              </div>

              <div className="bg-white/80 border border-rose-200 rounded p-2 text-xs text-rose-800 space-y-1">
                <p className="font-semibold text-[11px] uppercase tracking-wider">Troubleshooting Protocol:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                  <li>Ensure your frontal face template is registered in the system.</li>
                  <li>Avoid backlighting, hats, or thick-rimmed glasses during verification.</li>
                  <li>Perform the dynamic challenge prompt (e.g. eye blink or head turn) clearly.</li>
                </ul>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setVerificationResult(null)}
                  className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
                >
                  Re-initialize Viewfinder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewfinder Main Card */}
      {!verificationResult && (
        <div className="border border-slate-200 rounded-md bg-white p-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
            <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Camera className="w-4 h-4 text-slate-800" />
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Biometric Viewfinder & Anti-Spoofing Engine
              </h2>
              <p className="text-[11px] text-slate-500">
                Center face within alignment reticle and complete live motion test
              </p>
            </div>
          </div>

          <FaceCapture
            onCapture={handleFaceCapture}
            mode="verification"
          />
        </div>
      )}

      {/* Statutory Notice */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-start gap-2 text-xs text-slate-600">
        <ShieldAlert className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold text-slate-800 uppercase tracking-wider mr-1">Statutory Compliance:</span>
          Attendance logging is subject to institutional academic integrity regulations. Biometric descriptors are ephemeral and analyzed client-side via WebAssembly tensors. Proxy attendance or spoofing attempts are recorded with client telemetry and submitted to the Office of the Registrar.
        </div>
      </div>
    </div>
  );
};

export default FaceVerification;