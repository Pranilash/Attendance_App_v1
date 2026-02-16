import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import QRScanner from '../../components/qr/QRScanner';
import { studentAPI } from '../../services/api';

const ScanQR = () => {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  const handleScanSuccess = async (qrData) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      // Parse QR data
      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (e) {
        throw new Error('Invalid QR code format');
      }

      // Validate QR with backend
      const response = await studentAPI.verifyQR(parsedData);
      
      if (response.data.success) {
        setValidationResult('success');
        setSessionInfo(response.data.data);
        toast.success('QR code validated successfully!');
        
        // Redirect to face verification after short delay
        setTimeout(() => {
          navigate(`/student/verify-face/${parsedData.sessionId}`);
        }, 1500);
      } else {
        setValidationResult('error');
        toast.error(response.data.message || 'Invalid QR code');
      }
    } catch (error) {
      console.error('QR validation error:', error);
      setValidationResult('error');
      toast.error(error.response?.data?.message || 'Failed to validate QR code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
    toast.error('Failed to scan QR code');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
        <p className="text-gray-500 mt-1">Scan the attendance QR code displayed by your faculty</p>
      </div>

      {/* Validation Status */}
      {(isValidating || validationResult) && (
        <div
          className={`rounded-xl p-4 flex items-start gap-3 ${
            validationResult === 'success'
              ? 'bg-green-50 border border-green-200'
              : validationResult === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          {isValidating ? (
            <>
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Validating QR Code...</h3>
                <p className="text-sm text-blue-700">Please wait while we verify the session</p>
              </div>
            </>
          ) : validationResult === 'success' ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800">QR Code Valid!</h3>
                <p className="text-sm text-green-700">
                  Redirecting to face verification...
                </p>
                {sessionInfo && (
                  <p className="text-sm text-green-600 mt-1">
                    Class: {sessionInfo.className}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Invalid QR Code</h3>
                <p className="text-sm text-red-700">
                  This QR code is invalid or has expired. Please try again.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* QR Scanner */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">QR Scanner</h2>
            <p className="text-sm text-gray-500">Position the QR code within the frame</p>
          </div>
        </div>

        <QRScanner
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
        />
      </div>

      {/* Tips */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <h3 className="font-medium text-yellow-800 mb-2">Tips for Successful Scan</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>Make sure you have a stable internet connection</li>
          <li>Ensure good lighting when scanning</li>
          <li>Hold your phone steady and at the right distance</li>
          <li>QR codes expire after 15 seconds - ask faculty to refresh if needed</li>
        </ul>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 className="font-medium text-red-800 mb-2">Important Notice</h3>
        <ul className="text-sm text-red-700 space-y-1">
          <li>Each QR code can only be scanned once per session</li>
          <li>You must complete face verification after scanning</li>
          <li>Proxy attendance is strictly prohibited and monitored</li>
        </ul>
      </div>
    </div>
  );
};

export default ScanQR;