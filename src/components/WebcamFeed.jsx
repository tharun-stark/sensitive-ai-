import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Square } from 'lucide-react';

export const WebcamFeed = ({ onFrame, isAnalyzing, triggerCapture, onStop }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setError(null);
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsActive(false);
    }
  };

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current && isActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.7);
        onFrame(base64);
      }
    }
  }, [isActive, onFrame]);

  const captureFrameRef = useRef(captureFrame);
  useEffect(() => {
    captureFrameRef.current = captureFrame;
  }, [captureFrame]);

  useEffect(() => {
    if (triggerCapture && triggerCapture > 0) {
      captureFrameRef.current();
    }
  }, [triggerCapture]);

  useEffect(() => {
    const init = async () => {
      await startCamera();
    };
    init();
    return () => stopCamera();
  }, []);

  return (
    <div className="relative w-full aspect-video bg-ink rounded-sm overflow-hidden border border-line group">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-bg p-6 text-center">
          <CameraOff className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-mono text-sm">{error}</p>
          <button 
            onClick={startCamera}
            className="mt-4 px-4 py-2 border border-bg/30 hover:bg-bg hover:text-ink transition-colors font-mono text-xs uppercase tracking-widest"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-bg animate-spin opacity-30" />
            </div>
          )}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-mono text-[10px] text-bg uppercase tracking-tighter">
              {isActive ? 'Live Feed' : 'Offline'}
            </span>
          </div>

          {isActive && (
            <div className="absolute bottom-4 right-4 flex gap-2">
              {isAnalyzing && onStop && (
                <button 
                  onClick={onStop}
                  className="px-4 py-2 bg-red-600 text-white font-mono text-xs uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Square className="w-3 h-3" /> Stop
                </button>
              )}
              <button 
                onClick={captureFrame}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-bg text-ink font-mono text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Manual Scan'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
