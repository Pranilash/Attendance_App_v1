import { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, Shield, Eye, Move } from 'lucide-react';
import toast from 'react-hot-toast';
import FaceCapture from '../../components/face/FaceCapture';
import { studentAPI } from '../../services/api';

const FaceRegistration = () => {
  const [faceStatus, setFaceStatus] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkFaceStatus();
  }, []);

  const checkFaceStatus = async () => {
    try {
      const response = await studentAPI.getFaceStatus();
      setFaceStatus(response.data.data);
    } catch (error) {
      console.error('Error checking face status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaceCapture = async (faceData) => {
    setIsRegistering(true);
    setRegistrationResult(null);

    try {
      const response = await studentAPI.registerFace({
        embedding: faceData.embedding,
        image: faceData.image,
        livenessPassed: faceData.livenessPassed,
      });

      if (response.data.success) {
        setRegistrationResult('success');
        toast.success('Face registered successfully!');
        setFaceStatus({ registered: true, registeredAt: new Date() });
      } else {
        setRegistrationResult('failed');
        toast.error(response.data.message || 'Face registration failed');
      }
    } catch (error) {
      console.error('Face registration error:', error);
      setRegistrationResult('failed');
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Face Registration</h1>
        <p className="text-gray-500 mt-1">
          Register your face for attendance verification
        </p>
      </div>

      {/* Current Status */}
      {faceStatus?.registered && !registrationResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Face Already Registered</h3>
            <p className="text-sm text-green-700 mt-1">
              Your face was registered on{' '}
              {new Date(faceStatus.registeredAt).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-green-600 mt-2">
              You can register again to update your face data if needed.
            </p>
          </div>
        </div>
      )}

      {/* Registration Status */}
      {isRegistering && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-yellow-600 animate-spin mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Registering Face...</h3>
            <p className="text-sm text-yellow-700">
              Please wait while we process your face data
            </p>
          </div>
        </div>
      )}

      {registrationResult === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Registration Successful!</h3>
            <p className="text-sm text-green-700 mt-1">
              Your face has been registered. You can now mark attendance using face verification.
            </p>
          </div>
        </div>
      )}

      {registrationResult === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Registration Failed</h3>
            <p className="text-sm text-red-700 mt-1">
              Could not register your face. Please try again with better lighting.
            </p>
          </div>
        </div>
      )}

      {/* Face Capture Component */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Camera className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Capture Your Face</h2>
            <p className="text-sm text-gray-500">
              Follow the instructions to register your face
            </p>
          </div>
        </div>

        <FaceCapture onCapture={handleFaceCapture} mode="registration" />
      </div>

      {/* Liveness Detection Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Liveness Detection</h3>
            <p className="text-sm text-blue-700 mt-1">
              To prevent spoofing with photos, you'll be asked to perform simple actions:
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Eye className="w-4 h-4" />
                <span>Blink your eyes slowly</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Move className="w-4 h-4" />
                <span>Turn your head slightly left and right</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-medium text-gray-800 mb-3">Requirements for Registration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Good Lighting</p>
              <p className="text-xs text-gray-500">
                Ensure your face is well-lit without harsh shadows
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Face Clearly Visible</p>
              <p className="text-xs text-gray-500">
                Remove masks, sunglasses, or other face coverings
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Centered Position</p>
              <p className="text-xs text-gray-500">
                Keep your face centered in the camera frame
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Neutral Expression</p>
              <p className="text-xs text-gray-500">
                Keep a neutral expression for best accuracy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Privacy Notice</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>Your face embedding is stored securely in an encrypted format</li>
          <li>Actual face images are not stored permanently</li>
          <li>Face data is only used for attendance verification</li>
          <li>You can request deletion of your face data at any time</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceRegistration;