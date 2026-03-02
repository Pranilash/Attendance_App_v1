import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
      // Cleanup on unmount - check if scanner is actually running
      if (html5QrCodeRef.current && isScanningRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanner = async () => {
    try {
      // Clean up any existing scanner instance
      if (html5QrCodeRef.current && isScanningRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
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
          // Success callback
          setLastResult(decodedText);
          setScanStatus('success');
          
          if (onScanSuccess) {
            onScanSuccess(decodedText);
          }
          
          // Stop scanner after successful scan
          if (html5QrCodeRef.current && isScanningRef.current) {
            html5QrCodeRef.current.stop().then(() => {
              setIsScanning(false);
              isScanningRef.current = false;
            }).catch(() => {});
          }
        },
        (errorMessage) => {
          // Ignore frequent scan errors (no QR found)
          // Only log actual errors
          if (!errorMessage.includes('No QR code found')) {
            console.log('Scan error:', errorMessage);
          }
        }
      );
      
      setIsScanning(true);
      setScanStatus(null);
    } catch (err) {
      console.error('Error starting scanner:', err);
      isScanningRef.current = false;
      toast.error('Failed to access camera. Please check permissions.');
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
    <div className="w-full max-w-md mx-auto">
      {/* Scanner Container */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden">
        <div
          id="qr-reader"
          ref={scannerRef}
          className="w-full aspect-square"
        />
        
        {/* Overlay when not scanning */}
        {!isScanning && !lastResult && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-400 text-center px-4">
              Click "Start Scanner" to scan QR code
            </p>
          </div>
        )}
        
        {/* Success Overlay */}
        {scanStatus === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/90">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <p className="text-green-400 font-medium">QR Code Scanned!</p>
          </div>
        )}
        
        {/* Error Overlay */}
        {scanStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-red-400 font-medium">Scan Failed</p>
          </div>
        )}
        
        {/* Scanning indicator */}
        {isScanning && !scanStatus && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white text-sm">Scanning...</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-3">
        {!isScanning && !lastResult && (
          <button
            onClick={startScanner}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Start Scanner
          </button>
        )}
        
        {isScanning && (
          <button
            onClick={stopScanner}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <X className="w-5 h-5" />
            Stop Scanner
          </button>
        )}
        
        {lastResult && (
          <>
            <button
              onClick={resetScanner}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
              Reset
            </button>
            <button
              onClick={startScanner}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Camera className="w-5 h-5" />
              Scan Again
            </button>
          </>
        )}
      </div>

      {/* Last Result Display */}
      {lastResult && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Last scanned:</p>
          <p className="text-sm font-mono text-gray-900 break-all">{lastResult}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>1. Click "Start Scanner" to begin</li>
          <li>2. Point your camera at the QR code</li>
          <li>3. Hold steady until scanned</li>
          <li>4. You'll be redirected to face verification</li>
        </ul>
      </div>
    </div>
  );
};

export default QRScanner;