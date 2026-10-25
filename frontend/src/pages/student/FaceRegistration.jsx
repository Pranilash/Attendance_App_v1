import { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, ShieldCheck, Eye, Move } from 'lucide-react';
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
        toast.success('Biometric template enrolled successfully');
        setFaceStatus({ registered: true, registeredAt: new Date() });
      } else {
        setRegistrationResult('failed');
        toast.error(response.data.message || 'Template enrollment failed');
      }
    } catch (error) {
      console.error('Face registration error:', error);
      setRegistrationResult('failed');
      toast.error(error.response?.data?.message || 'Biometric template enrollment failed');
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-slate-200 rounded-md bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700 mb-2" />
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Querying Biometric Registry...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Biometric Template Enrollment
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate authoritative 128-dimensional facial vector template for classroom attendance verification
        </p>
      </div>

      {/* Current Status Pill Card */}
      {faceStatus?.registered && !registrationResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-md p-3.5 flex items-start gap-3 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold uppercase tracking-wider text-emerald-900">
              Active Template on Record
            </h3>
            <p className="text-emerald-800 text-xs mt-0.5">
              Your biometric embedding was registered on{' '}
              <span className="font-mono font-medium">
                {new Date(faceStatus.registeredAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>.
            </p>
            <p className="text-[11px] text-emerald-700 mt-1">
              You can re-enroll below at any time to recalibrate your biometric feature descriptors.
            </p>
          </div>
        </div>
      )}

      {/* Registration Status Banners */}
      {isRegistering && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center gap-2.5 text-xs text-blue-900">
          <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
          <div>
            <p className="font-semibold uppercase tracking-wider">Enrolling Biometric Descriptors...</p>
            <p className="text-[11px] text-blue-700">Writing 128-float Euclidean embedding to institutional record</p>
          </div>
        </div>
      )}

      {registrationResult === 'success' && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-md p-3.5 flex items-start gap-2.5 text-xs text-emerald-900">
          <CheckCircle className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold uppercase tracking-wider">Template Enrolled Successfully</p>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Your biometric record is now synchronized. You are authorized to complete dual-factor QR and facial verifications.
            </p>
          </div>
        </div>
      )}

      {registrationResult === 'failed' && (
        <div className="bg-rose-50 border border-rose-300 rounded-md p-3.5 flex items-start gap-2.5 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold uppercase tracking-wider">Enrollment Rejected</p>
            <p className="text-[11px] text-rose-800 mt-0.5">
              Could not generate clean 68-point landmark descriptors. Ensure uniform classroom lighting and retry.
            </p>
          </div>
        </div>
      )}

      {/* Viewfinder Main Section */}
      <div className="border border-slate-200 rounded-md bg-white p-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
          <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Camera className="w-4 h-4 text-slate-800" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Biometric Reticle &amp; Feature Extractor
            </h2>
            <p className="text-[11px] text-slate-500">
              Center face within reticle and follow the dynamic landmark prompts
            </p>
          </div>
        </div>

        <FaceCapture onCapture={handleFaceCapture} mode="registration" />
      </div>

      {/* Anti-spoofing and Quality Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            Liveness Verification Protocol
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            To prevent presentation attacks with static photographs or display screens, the verification engine dynamically analyzes eye blink (EAR) and head yaw rotation:
          </p>
          <div className="space-y-1 text-slate-700 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Step 1: Slow eye blink (EAR delta &gt; 0.04)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-slate-500" />
              <span>Step 2: Head yaw rotation delta (&gt; 8°)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-2">
          <div className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            Quality Acceptance Constraints
          </div>
          <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
            <li>Uniform ambient illumination without harsh specular reflections.</li>
            <li>Maintain neutral facial posture with eyes and nose fully visible.</li>
            <li>Distance: approximately 40–60 cm from optical sensor.</li>
            <li>Encrypted template stored exclusively as a 128-float mathematical vector.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistration;