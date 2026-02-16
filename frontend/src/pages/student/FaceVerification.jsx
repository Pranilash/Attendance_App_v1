import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
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
      });

      if (response.data.success) {
        setVerificationResult('success');
        setAttendanceData(response.data.data);
        toast.success('Attendance marked successfully!');
      } else {
        setVerificationResult('failed');
        toast.error(response.data.message || 'Face verification failed');
      }
    } catch (error) {
      console.error('Face verification error:', error);
      setVerificationResult('failed');
      toast.error(error.response?.data?.message || 'Verification failed');
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Face Verification</h1>
          <p className="text-gray-500 mt-1">Verify your identity to mark attendance</p>
        </div>
      </div>

      {/* Session Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-800">Session ID: {sessionId?.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-blue-600">Complete face verification to mark your attendance</p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      {isVerifying && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-yellow-600 animate-spin mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Verifying Face...</h3>
            <p className="text-sm text-yellow-700">Please wait while we verify your identity</p>
          </div>
        </div>
      )}

      {verificationResult === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-green-800">Attendance Marked Successfully!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your attendance has been recorded for this session.
            </p>
            {attendanceData && (
              <div className="mt-3 text-sm text-green-600">
                <p>Time: {new Date(attendanceData.timestamp).toLocaleTimeString()}</p>
                <p>Class: {attendanceData.className}</p>
              </div>
            )}
            <button
              onClick={handleGoToHistory}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              View Attendance History
            </button>
          </div>
        </div>
      )}

      {verificationResult === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-800">Verification Failed</h3>
            <p className="text-sm text-red-700 mt-1">
              Your face could not be verified. This could be due to:
            </p>
            <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
              <li>Face not registered in the system</li>
              <li>Poor lighting conditions</li>
              <li>Face not clearly visible</li>
              <li>Liveness check not passed</li>
            </ul>
            <button
              onClick={() => setVerificationResult(null)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Face Capture Component */}
      {!verificationResult && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Face Capture</h2>
              <p className="text-sm text-gray-500">Position your face and follow instructions</p>
            </div>
          </div>

          <FaceCapture
            onCapture={handleFaceCapture}
            mode="verification"
          />
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-800 mb-2">Security Notice</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>Face data is processed securely and not stored permanently</li>
          <li>Liveness detection prevents photo-based spoofing</li>
          <li>Your attendance is linked to your verified identity</li>
          <li>Proxy attendance attempts are logged and reported</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceVerification;