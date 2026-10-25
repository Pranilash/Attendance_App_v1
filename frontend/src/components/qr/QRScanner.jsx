import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', null
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && isScanningRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        isScanningRef.current = false;
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      if (html5QrCodeRef.current && isScanningRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch {
          // Ignore errors when stopping previous instance
        }
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      isScanningRef.current = true;

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setLastResult(decodedText);
          setScanStatus('success');

          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }

          if (html5QrCodeRef.current && isScanningRef.current) {
            html5QrCodeRef.current
              .stop()
              .then(() => {
                setIsScanning(false);
                isScanningRef.current = false;
              })
              .catch(() => {});
          }
        },
        (errorMessage) => {
          if (!errorMessage.includes('No QR code found')) {
            // normal scanning polling
          }
        }
      );

      setIsScanning(true);
      setScanStatus(null);
    } catch (err) {
      console.error('Error starting scanner:', err);
      isScanningRef.current = false;
      toast.error('Failed to access optical sensor. Please check camera permissions.');
      if (onScanError) {
        onScanError(err);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
        isScanningRef.current = false;
      } catch (err) {
        console.error('Error stopping scanner:', err);
        isScanningRef.current = false;
      }
    }
  };

  const resetScanner = () => {
    setLastResult(null);
    setScanStatus(null);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Scanner Viewport with Targeting Square and Hairline Corners */}
      <div className="relative bg-slate-950 border border-slate-300 rounded-md overflow-hidden aspect-square shadow-inner flex items-center justify-center">
        <div id="qr-reader" ref={scannerRef} className="w-full h-full" />

        {/* Viewfinder Hairline Corner Reticle Overlay */}
        <div className="absolute inset-8 pointer-events-none flex items-center justify-center">
          <div className="relative w-56 h-56">
            {/* Top-Left Corner */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500" />
            {/* Top-Right Corner */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500" />
            {/* Bottom-Left Corner */}
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500" />
            {/* Bottom-Right Corner */}
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500" />
          </div>
        </div>

        {/* Overlay when not scanning */}
        {!isScanning && !lastResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-6">
            <div className="w-12 h-12 rounded-md border border-slate-700 bg-slate-800 flex items-center justify-center mb-3">
              <Camera className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Optical QR Targeting Frame
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Click &quot;Initialize Scanner&quot; to activate environment sensor
            </p>
          </div>
        )}

        {/* Success Overlay */}
        {scanStatus === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 p-6 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-white uppercase tracking-wider">
              QR Signature Captured
            </p>
            <p className="text-xs text-emerald-200 mt-1 font-mono">
              Payload decoding and token validation in progress
            </p>
          </div>
        )}

        {/* Error Overlay */}
        {scanStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/90 p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mb-2" />
            <p className="text-xs font-semibold text-white uppercase tracking-wider">
              Optical Recognition Error
            </p>
            <p className="text-xs text-rose-200 mt-1">
              Unable to parse valid HMAC token. Please retry.
            </p>
          </div>
        )}

        {/* Live scanning pill */}
        {isScanning && !scanStatus && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 border border-slate-700 px-2.5 py-1 rounded-md">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-white text-[11px] font-mono uppercase tracking-wider">
              Sensor Active • 10 FPS
            </span>
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex gap-2">
        {!isScanning && !lastResult && (
          <button
            onClick={startScanner}
            className="flex-1 h-9 flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-semibold transition-colors"
          >
            <Camera className="w-4 h-4" />
            Initialize Scanner
          </button>
        )}

        {isScanning && (
          <button
            onClick={stopScanner}
            className="flex-1 h-9 flex items-center justify-center gap-2 bg-rose-700 text-white hover:bg-rose-800 rounded-md text-xs font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            Stop Scanner
          </button>
        )}

        {lastResult && (
          <>
            <button
              onClick={resetScanner}
              className="flex-1 h-9 flex items-center justify-center gap-2 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold transition-colors"
            >
              <X className="w-4 h-4" />
              Reset Buffer
            </button>
            <button
              onClick={startScanner}
              className="flex-1 h-9 flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-semibold transition-colors"
            >
              <Camera className="w-4 h-4" />
              Scan Subsequent Code
            </button>
          </>
        )}
      </div>

      {/* Last Result Debug Display */}
      {lastResult && (
        <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-md">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Raw Decoded Payload:
          </p>
          <p className="text-xs font-mono text-slate-800 break-all bg-white p-2 border border-slate-200 rounded">
            {lastResult}
          </p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
