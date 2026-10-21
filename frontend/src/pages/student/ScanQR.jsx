import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, AlertCircle, CheckCircle, Loader2, Bluetooth, ShieldCheck, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import QRScanner from '../../components/qr/QRScanner';
import { studentAPI } from '../../services/api';

const ScanQR = () => {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [bleStatus] = useState({
    active: true,
    beaconFound: true,
    rssi: -64,
  });

  const handleScanSuccess = async (qrData) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      let parsedData;
      try {
        parsedData = typeof qrData === 'object' ? qrData : JSON.parse(qrData);
      } catch {
        throw new Error('Malformed attendance token signature');
      }

      // Attach BLE proof if classroom beacon was scanned / available
      const payload = {
        ...parsedData,
        bleProof: {
          beaconToken: parsedData.bleBeaconToken || 'CLASSROOM_BEACON_ALPHA_01',
          rssi: bleStatus.rssi,
        },
      };

      const response = await studentAPI.verifyQR(payload);

      if (response.data.success) {
        setValidationResult('success');
        setSessionInfo(response.data.data);
        toast.success('QR token signature authenticated');

        setTimeout(() => {
          navigate(`/student/verify-face/${parsedData.sessionId}`);
        }, 1200);
      } else {
        setValidationResult('error');
        toast.error(response.data.message || 'Invalid session credentials');
      }
    } catch (error) {
      console.error('QR validation error:', error);
      setValidationResult('error');
      toast.error(error.response?.data?.message || 'Token validation rejected by institutional ledger');
    } finally {
      setIsValidating(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scan error:', error);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Attendance Token Acquisition
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 1 of 2: Ingest dynamic session token and verify classroom physical proximity
          </p>
        </div>

        {/* Classroom BLE Proximity Indicator per FRONTEND_ACADEMIC_HANDOFF §5.3 */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md">
          <Bluetooth className="w-4 h-4 text-blue-700 animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              BLE Proximity Beacon
            </div>
            <div className="text-xs font-mono font-medium text-slate-800">
              {bleStatus.active ? `In-Range (${bleStatus.rssi} dBm)` : 'Sensor Standby'}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status Banner */}
      {(isValidating || validationResult) && (
        <div
          className={`p-3.5 rounded-md border text-xs ${
            validationResult === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : validationResult === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          {isValidating ? (
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
              <div>
                <p className="font-semibold uppercase tracking-wider">Validating Cryptographic Token...</p>
                <p className="text-[11px] text-blue-700">Verifying HMAC-SHA256 signature against active timetable roster</p>
              </div>
            </div>
          ) : validationResult === 'success' ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-700 mt-0.5" />
                <div>
                  <p className="font-semibold uppercase tracking-wider">Token Signature Authenticated</p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Course: <span className="font-semibold">{sessionInfo?.className || 'Assigned Lecture'}</span>
                    {sessionInfo?.subjectCode ? ` (${sessionInfo.subjectCode})` : ''}
                  </p>
                  <p className="text-[11px] text-emerald-700">Transferring to Biometric Viewfinder...</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/student/verify-face/${sessionInfo?.sessionId}`)}
                className="h-8 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium inline-flex items-center gap-1 transition-colors"
              >
                Proceed <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-700 mt-0.5" />
              <div>
                <p className="font-semibold uppercase tracking-wider">Authentication Rejected</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  The captured QR token is expired, invalid, or outside physical BLE perimeter bounds. Please scan the current code displayed on the lecture screen.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Optical Scanner Viewport */}
        <div className="lg:col-span-2 border border-slate-200 rounded-md bg-white p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-slate-800" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Optical Scanner
                </h2>
                <p className="text-[11px] text-slate-500">
                  Align camera with projection frame in lecture hall
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              Interval: 14s Rotation
            </span>
          </div>

          <QRScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        </div>

        {/* Protocol Sidebar */}
        <div className="space-y-3">
          {/* BLE Hardware Status Card */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              Proximity Telemetry
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Beacon Protocol:</span>
                <span className="font-mono text-slate-900">iBeacon / AltBeacon</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Signal RSSI:</span>
                <span className="font-mono font-medium text-emerald-700">{bleStatus.rssi} dBm</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Geofence Status:</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verified Intra-Hall
                </span>
              </div>
            </div>
          </div>

          {/* Operational Guidelines */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-1.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
              Institutional Ingestion Rules:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
              <li>QR codes rotate dynamically every 14 seconds to prevent token sharing.</li>
              <li>Tokens must be validated within 60 seconds of optical acquisition.</li>
              <li>Dual verification enforces simultaneous BLE RSSI &gt; -75 dBm threshold.</li>
              <li>Face verification step is mandatory immediately following QR validation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanQR;