import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2, Eye, Move } from 'lucide-react';
import toast from 'react-hot-toast';

const FaceCapture = ({ onCapture, mode = 'verification' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState(null);
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessComplete, setLivenessComplete] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const livenessInstructions = [
    { action: 'blink', instruction: 'Blink your eyes slowly', icon: Eye },
    { action: 'turnLeft', instruction: 'Turn your head slightly left', icon: Move },
    { action: 'turnRight', instruction: 'Turn your head slightly right', icon: Move },
  ];

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Load models from CDN
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        setIsLoading(false);
        toast.success('Face detection models loaded');
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load face detection models');
        setIsLoading(false);
      }
    };

    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
        setError(null);
        startFaceDetection();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions.');
      toast.error('Camera access denied');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setFaceDetected(false);
  };

  // Face detection loop
  const startFaceDetection = () => {
    const detectFace = async () => {
      if (!videoRef.current || !canvasRef.current || !isStreaming) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Make sure video is ready
      if (video.readyState !== 4) {
        requestAnimationFrame(detectFace);
        return;
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Detect face
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections.length > 0) {
        setFaceDetected(true);
        
        // Draw detection box
        const dims = faceapi.matchDimensions(canvas, video, true);
        const resizedDetections = faceapi.resizeResults(detections, dims);
        
        // Draw face box
        const box = resizedDetections[0].detection.box;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw landmarks
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      } else {
        setFaceDetected(false);
      }

      requestAnimationFrame(detectFace);
    };

    detectFace();
  };

  // Simulate liveness detection
  const performLivenessCheck = async () => {
    setIsCapturing(true);
    setCaptureStatus('liveness');

    for (let i = 0; i < livenessInstructions.length; i++) {
      setLivenessStep(i);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setLivenessComplete(true);
    await captureFace();
  };

  // Capture face embedding
  const captureFace = async () => {
    if (!videoRef.current || !faceDetected) {
      toast.error('No face detected');
      setIsCapturing(false);
      return;
    }

    setCaptureStatus('capturing');

    try {
      const video = videoRef.current;
      
      // Detect face with landmarks and descriptor
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        throw new Error('No face detected during capture');
      }

      // Get face embedding (descriptor)
      const embedding = Array.from(detection.descriptor);
      
      // Capture image as base64
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

      setCaptureStatus('success');
      toast.success('Face captured successfully!');

      // Callback with face data
      if (onCapture) {
        onCapture({
          embedding,
          image: imageBase64,
          livenessPassed: livenessComplete,
        });
      }
    } catch (err) {
      console.error('Error capturing face:', err);
      setCaptureStatus('error');
      toast.error('Failed to capture face');
    } finally {
      setIsCapturing(false);
    }
  };

  // Reset capture
  const resetCapture = () => {
    setCaptureStatus(null);
    setLivenessStep(0);
    setLivenessComplete(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-600">Loading face detection models...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="font-medium text-red-800 mb-2">Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Video Container */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[4/3]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          onPlay={() => {
            if (isStreaming) startFaceDetection();
          }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* Overlay when not streaming */}
        {!isStreaming && !captureStatus && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
            <Camera className="w-16 h-16 text-gray-400 mb-4" />
            <p className="text-gray-400">Click "Start Camera" to begin</p>
          </div>
        )}

        {/* Face detection indicator */}
        {isStreaming && !captureStatus && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                faceDetected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
              {faceDetected ? 'Face Detected' : 'No Face'}
            </span>
          </div>
        )}

        {/* Liveness check overlay */}
        {captureStatus === 'liveness' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="text-center">
              {(() => {
                const step = livenessInstructions[livenessStep];
                const Icon = step.icon;
                return (
                  <>
                    <Icon className="w-16 h-16 text-white mx-auto mb-4 animate-bounce" />
                    <p className="text-white text-xl font-medium">{step.instruction}</p>
                    <p className="text-gray-300 mt-2">
                      Step {livenessStep + 1} of {livenessInstructions.length}
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Success overlay */}
        {captureStatus === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/90">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <p className="text-green-400 text-xl font-medium">Face Captured!</p>
          </div>
        )}

        {/* Error overlay */}
        {captureStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90">
            <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-red-400 text-xl font-medium">Capture Failed</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isStreaming && !captureStatus && (
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Start Camera
          </button>
        )}

        {isStreaming && !isCapturing && !captureStatus && (
          <>
            <button
              onClick={stopCamera}
              className="px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={performLivenessCheck}
              disabled={!faceDetected}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              {mode === 'registration' ? 'Register Face' : 'Verify & Mark'}
            </button>
          </>
        )}

        {captureStatus === 'error' && (
          <button
            onClick={resetCapture}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Ensure good lighting on your face</li>
          <li>Position your face within the frame</li>
          <li>Follow the liveness check instructions</li>
          <li>Stay still during capture</li>
        </ul>
      </div>
    </div>
  );
};

export default FaceCapture;