import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as knnClassifier from '@tensorflow-models/knn-classifier';
import { 
  Camera, 
  Plus, 
  Trash2, 
  Play, 
  Square, 
  Upload, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const ImageTrainer = () => {
  const [net, setNet] = useState(null);
  const [classifier, setClassifier] = useState(null);
  const [classes, setClasses] = useState([
    { id: '0', name: 'Class 1', count: 0 },
    { id: '1', name: 'Class 2', count: 0 }
  ]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [activeTrainingClass, setActiveTrainingClass] = useState(null);

  const videoRef = useRef(null);
  const requestRef = useRef(null);

  const setupWebcam = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
  }, []);

  const addExample = useCallback(async (classId) => {
    if (!net || !classifier || !videoRef.current) return;

    const img = tf.browser.fromPixels(videoRef.current);
    const activation = net.infer(img, true);
    classifier.addExample(activation, classId);
    img.dispose();

    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, count: classifier.getClassExampleCount()[classId] || 0 } : c
    ));
  }, [net, classifier]);

  const predictRef = useRef(null);

  const predict = useCallback(async () => {
    if (!net || !classifier || !videoRef.current || classifier.getNumClasses() === 0) {
      requestRef.current = requestAnimationFrame(predictRef.current);
      return;
    }

    const img = tf.browser.fromPixels(videoRef.current);
    const activation = net.infer(img, true);
    const result = await classifier.predictClass(activation);
    
    const classInfo = classes.find(c => c.id === result.label);
    setPrediction({
      label: classInfo?.name || 'Unknown',
      conf: result.confidences[result.label]
    });

    img.dispose();
    requestRef.current = requestAnimationFrame(predictRef.current);
  }, [net, classifier, classes]);

  useEffect(() => {
    predictRef.current = predict;
  }, [predict]);

  // Training loop for active class
  useEffect(() => {
    let interval;
    if (activeTrainingClass !== null) {
      interval = window.setInterval(() => {
        addExample(activeTrainingClass);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [activeTrainingClass, addExample]);

  // Initialize models
  useEffect(() => {
    const init = async () => {
      await tf.ready();
      const loadedNet = await mobilenet.load({ version: 1, alpha: 0.25 });
      const loadedClassifier = knnClassifier.create();
      setNet(loadedNet);
      setClassifier(loadedClassifier);
      setIsModelLoading(false);
      setupWebcam();
    };
    init();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [setupWebcam]);

  useEffect(() => {
    if (isPredicting) {
      requestRef.current = requestAnimationFrame(predict);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setTimeout(() => setPrediction(null), 0);
    }
  }, [isPredicting, predict]);

  const handleAddClass = () => {
    const newId = classes.length.toString();
    setClasses([...classes, { id: newId, name: `Class ${classes.length + 1}`, count: 0 }]);
  };

  const handleRemoveClass = (id) => {
    if (classifier) classifier.clearClass(id);
    setClasses(classes.filter(c => c.id !== id));
  };

  const handleFileUpload = async (classId, event) => {
    const files = event.target.files;
    if (!files || !net || !classifier) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const img = await loadImage(file);
        const tensor = tf.browser.fromPixels(img);
        const activation = net.infer(tensor, true);
        classifier.addExample(activation, classId);
        tensor.dispose();
      } else if (file.type.startsWith('video/')) {
        await processVideo(file, classId);
      }
    }

    setClasses(prev => prev.map(c => 
      c.id === classId ? { ...c, count: classifier.getClassExampleCount()[classId] || 0 } : c
    ));
  };

  const processVideo = (file, classId) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = async () => {
        video.play();
        const duration = video.duration;
        const framesToCapture = Math.min(20, Math.floor(duration * 2)); // Capture ~2 frames per second
        
        for (let i = 0; i < framesToCapture; i++) {
          video.currentTime = (i / framesToCapture) * duration;
          await new Promise(r => setTimeout(r, 100)); // Wait for seek
          
          if (net && classifier) {
            const tensor = tf.browser.fromPixels(video);
            const activation = net.infer(tensor, true);
            classifier.addExample(activation, classId);
            tensor.dispose();
          }
        }
        resolve();
      };
    });
  };

  const loadImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = e.target?.result;
      };
      reader.readAsDataURL(file);
    });
  };



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Input & Prediction */}
      <div className="space-y-6">
        <div className="relative aspect-video bg-ink rounded-2xl overflow-hidden border border-line group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <div className={`px-3 py-1 bg-ink/80 text-bg text-[9px] font-mono uppercase tracking-widest rounded-full flex items-center gap-2 ${isModelLoading ? 'animate-pulse' : ''}`}>
              {isModelLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />} 
              {isModelLoading ? 'Initializing...' : 'Live Feed'}
            </div>
          </div>
          
          {prediction && (
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-ink/90 to-transparent text-bg">
              <p className="col-header text-bg/50 mb-1">Current Prediction</p>
              <div className="flex items-baseline gap-4">
                <h3 className="text-5xl font-sans font-bold uppercase tracking-tighter">{prediction.label}</h3>
                <span className="font-mono text-sm opacity-50">{(prediction.conf * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1 bg-bg/20 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-100" 
                  style={{ width: `${prediction.conf * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setIsPredicting(!isPredicting)}
            disabled={isModelLoading || classes.every(c => c.count === 0)}
            className={`flex-1 py-4 font-sans font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all rounded-xl border border-line ${
              isPredicting ? 'bg-ink text-bg' : 'bg-white hover:bg-ink/5 disabled:opacity-30'
            }`}
          >
            {isPredicting ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isPredicting ? 'Stop Recognition' : 'Start Recognition'}
          </button>
        </div>
      </div>

      {/* Right: Classes & Training */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="col-header flex items-center gap-2">
            <BrainCircuit className="w-3 h-3" /> Training Classes
          </h3>
          <button
            onClick={handleAddClass}
            className="p-2 border border-line hover:bg-ink hover:text-bg transition-all rounded-lg"
            title="Add Class"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {classes.map((cls) => (
            <div key={cls.id} className="border border-line p-6 rounded-2xl bg-white space-y-4">
              <div className="flex justify-between items-center">
                <input
                  type="text"
                  value={cls.name}
                  onChange={(e) => setClasses(classes.map(c => c.id === cls.id ? { ...c, name: e.target.value } : c))}
                  className="bg-transparent font-sans font-bold text-lg focus:outline-none border-b border-transparent focus:border-ink"
                />
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] opacity-50 uppercase">{cls.count} Examples</span>
                  <button
                    onClick={() => handleRemoveClass(cls.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onMouseDown={() => setActiveTrainingClass(cls.id)}
                  onMouseUp={() => setActiveTrainingClass(null)}
                  onMouseLeave={() => setActiveTrainingClass(null)}
                  disabled={isModelLoading}
                  className={`py-3 rounded-xl border border-line font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-30 ${
                    activeTrainingClass === cls.id ? 'bg-ink text-bg scale-95' : 'bg-white hover:bg-ink/5 disabled:hover:bg-white'
                  }`}
                >
                  <Camera className="w-3 h-3" /> Hold to Record
                </button>
                
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(cls.id, e)}
                    disabled={isModelLoading}
                    className={`absolute inset-0 opacity-0 ${isModelLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                  <div className={`h-full py-3 rounded-xl border border-line font-mono text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 bg-white transition-all ${isModelLoading ? 'opacity-30' : 'hover:bg-ink/5'}`}>
                    <Upload className="w-3 h-3" /> Upload Assets
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border border-line rounded-2xl bg-emerald-50 space-y-2">
          <h4 className="font-sans font-bold text-sm text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Local Processing Active
          </h4>
          <p className="text-xs text-emerald-700/70 leading-relaxed">
            All training data is stored in your browser's RAM. No images are sent to any server. You can train on images from your webcam or upload existing image and video files.
          </p>
        </div>
      </div>
    </div>
  );
};

const BrainCircuit = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 .94 4.82 2.5 2.5 0 0 0 0 4.28 2.5 2.5 0 0 0-.94 4.82 2.5 2.5 0 0 0 1.98 3 2.5 2.5 0 0 0 4.96-.46" />
    <path d="M12 4.5a2.5 2.5 0 0 1 4.96-.46 2.5 2.5 0 0 1 1.98 3 2.5 2.5 0 0 1-.94 4.82 2.5 2.5 0 0 1 0 4.28 2.5 2.5 0 0 1 .94 4.82 2.5 2.5 0 0 1-1.98 3 2.5 2.5 0 0 1-4.96-.46" />
    <path d="M9 13h6" />
    <path d="M12 10v6" />
  </svg>
);
