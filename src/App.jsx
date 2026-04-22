import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageTrainer } from './components/ImageTrainer';
import { WebcamFeed } from './components/WebcamFeed';
import { analyzeFrame } from './services/sensitive-ai';
import { 
  Brain, 
  Database, 
  Zap,
  Info,
  Github,
  Network,
  Globe,
  Activity,
  Smile,
  History,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [mode, setMode] = useState('image');
  
  // Sensitive AI State
  const [sensitiveAIResults, setSensitiveAIResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisRef = useRef(0);
  const [autoScan, setAutoScan] = useState(false);
  const [triggerCapture, setTriggerCapture] = useState(0);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sensitive_ai_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSensitiveAIFrame = useCallback(async (base64) => {
    if (isAnalyzing) return;
    
    const currentId = analysisRef.current + 1;
    analysisRef.current = currentId;
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeFrame(base64, apiKey);
      
      if (result && analysisRef.current === currentId) {
        const newResult = {
          ...result,
          timestamp: new Date().toLocaleTimeString(),
        };
        setSensitiveAIResults(prev => [newResult, ...prev].slice(0, 50));
      }
    } finally {
      if (analysisRef.current === currentId) {
        setIsAnalyzing(false);
      }
    }
  }, [isAnalyzing, apiKey]);

  // Auto-scan effect for Sensitive AI
  useEffect(() => {
    let interval;
    if (autoScan && mode === 'sensitiveAI') {
      interval = window.setInterval(() => {
        setTriggerCapture(prev => prev + 1);
      }, 8000);
    }
    return () => clearInterval(interval);
  }, [autoScan, mode]);

  const toggleAutoScan = () => {
    const next = !autoScan;
    setAutoScan(next);
    if (!next) {
      setTriggerCapture(0);
    }
  };

  const stopAutoScan = () => {
    setAutoScan(false);
    setTriggerCapture(0);
    analysisRef.current += 1; // Cancel pending analysis
    setIsAnalyzing(false);
  };

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('sensitive_ai_api_key', val);
  };

  const latestSensitiveAI = sensitiveAIResults[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] text-[#141414]">
      {/* Header */}
      <header className="border-b border-line p-6 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-ink flex items-center justify-center rounded-lg">
            <Brain className="w-6 h-6 text-bg" />
          </div>
          <div>
            <h1 className="text-2xl font-sans font-bold tracking-tighter uppercase">Hybrid ML Trainer</h1>
            <p className="font-mono text-[10px] opacity-50 uppercase tracking-[0.2em]">Local Neural Networks & Cloud Intelligence</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button 
            onClick={() => setMode('image')}
            className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-line transition-all ${mode === 'image' ? 'bg-ink text-bg' : 'hover:bg-ink/5'}`}
          >
            Vision (Local)
          </button>
          <button 
            onClick={() => setMode('sensitiveAI')}
            className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest border border-line transition-all ${mode === 'sensitiveAI' ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-ink/5'}`}
          >
            Sensitive AI
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        {/* Intro Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-line p-8 rounded-2xl bg-white shadow-sm space-y-4">
              <h2 className="text-4xl font-sans font-bold tracking-tighter uppercase leading-none">
                {mode === 'sensitiveAI' ? 'Cloud' : 'Local'} <span className="text-emerald-600">Intelligence</span>.
              </h2>
              <p className="text-lg opacity-70 leading-relaxed">
                {mode === 'sensitiveAI' 
                  ? "Leverage the power of Sensitive AI for advanced real-time visual analysis. This mode requires an internet connection and uses cloud-based neural networks."
                  : "Experience true privacy and edge computing. This application allows you to train neural networks directly in your browser using your own images and videos."}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-ink/5 rounded-full border border-line">
                  {mode === 'sensitiveAI' ? <Globe className="w-4 h-4 text-emerald-600" /> : <Zap className="w-4 h-4 text-emerald-600" />}
                  <span className="font-mono text-[10px] uppercase tracking-widest">{mode === 'sensitiveAI' ? 'Online Analysis' : 'No Internet Required'}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-ink/5 rounded-full border border-line">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Local Data Storage</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-ink/5 rounded-full border border-line">
                  <Network className="w-4 h-4 text-purple-600" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">Edge Inference</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-line p-8 rounded-2xl bg-ink text-bg space-y-6 flex flex-col justify-center">
            <h3 className="col-header text-bg/50 flex items-center gap-2">
              <Info className="w-3 h-3" /> System Overview
            </h3>
            <ul className="space-y-4 font-mono text-[11px] uppercase tracking-widest leading-relaxed">
              {mode === 'image' && (
                <>
                  <li className="flex gap-3">
                    <span className="opacity-30">01</span>
                    <span>Capture images via webcam or upload assets to each class.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="opacity-30">02</span>
                    <span>Train a classifier on top of MobileNet locally.</span>
                  </li>
                </>
              )}
              {mode === 'sensitiveAI' && (
                <>
                  <li className="flex gap-3">
                    <span className="opacity-30">01</span>
                    <span>Activate the live webcam feed for visual input.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="opacity-30">02</span>
                    <span>Send frames to Sensitive AI for deep multimodal interpretation.</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </section>

        {/* Action Section */}
        <section className="space-y-8">
          <AnimatePresence mode="wait">
            {mode === 'image' ? (
              <motion.div
                key="image-trainer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ImageTrainer />
              </motion.div>
            ) : (
              <motion.div
                key="sensitive-ai-mode"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8"
              >
                {/* Sensitive AI Left Column */}
                <div className="space-y-6">
                  <section className="space-y-4">
                    <div className="flex justify-between items-end">
                      <h2 className="col-header">Primary Optical Input</h2>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowKeyInput(!showKeyInput)}
                          className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 border border-line transition-all ${showKeyInput ? 'bg-ink text-bg' : 'hover:bg-ink/5'}`}
                        >
                          API Key: {apiKey ? 'SET' : 'MISSING'}
                        </button>
                        <button 
                          onClick={toggleAutoScan}
                          className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1 border border-line transition-all ${autoScan ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-ink/5'}`}
                        >
                          {autoScan ? 'Recognition Active' : 'Start Recognition'}
                        </button>
                        {autoScan && (
                          <button 
                            onClick={stopAutoScan}
                            className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 border border-red-600 bg-red-600 text-white transition-all hover:bg-red-700"
                          >
                            Stop
                          </button>
                        )}
                      </div>
                    </div>

                    {showKeyInput && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 border border-line bg-white space-y-2"
                      >
                        <label className="col-header text-[9px]">Enter Sensitive AI API Key (Stored Locally)</label>
                        <div className="flex gap-2">
                          <input 
                            type="password"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            placeholder="AI Studio API Key..."
                            className="flex-1 bg-bg border border-line px-3 py-2 font-mono text-xs focus:outline-none focus:border-ink"
                          />
                          <button 
                            onClick={() => setShowKeyInput(false)}
                            className="bg-ink text-bg px-4 py-2 font-mono text-[10px] uppercase tracking-widest"
                          >
                            Save
                          </button>
                        </div>
                        <p className="font-mono text-[9px] opacity-50">
                          Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">AI Studio</a>.
                        </p>
                      </motion.div>
                    )}

                    {!apiKey && !process.env.SENSITIVE_AI_API_KEY && (
                      <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-sans font-bold text-sm text-amber-900 uppercase tracking-tight">API Key Required</p>
                          <p className="text-xs text-amber-800 opacity-80">
                            To use Sensitive AI mode, please provide an API key in the settings above.
                          </p>
                        </div>
                      </div>
                    )}

                    <WebcamFeed 
                      onFrame={handleSensitiveAIFrame} 
                      isAnalyzing={isAnalyzing} 
                      triggerCapture={triggerCapture} 
                      onStop={stopAutoScan}
                    />
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-line p-6 space-y-4 bg-white">
                      <h3 className="col-header flex items-center gap-2">
                        <Smile className="w-3 h-3" /> Emotion Vector
                      </h3>
                      <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-sans font-bold uppercase tracking-tighter">
                          {latestSensitiveAI?.emotion || '---'}
                        </span>
                        <span className="data-value opacity-50">
                          {latestSensitiveAI ? `${(latestSensitiveAI.confidence * 100).toFixed(1)}%` : '0.0%'}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-ink/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-ink"
                          initial={{ width: 0 }}
                          animate={{ width: latestSensitiveAI ? `${latestSensitiveAI.confidence * 100}%` : 0 }}
                        />
                      </div>
                    </div>

                    <div className="border border-line p-6 space-y-4 bg-white">
                      <h3 className="col-header flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Activity Signature
                      </h3>
                      <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-sans font-bold uppercase tracking-tighter">
                          {latestSensitiveAI?.activity || '---'}
                        </span>
                        <span className="data-value opacity-50">
                          {latestSensitiveAI ? 'Active' : 'Idle'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(20)].map((_, i) => (
                          <motion.div 
                            key={i}
                            className="flex-1 h-4 bg-ink/10"
                            animate={{ 
                              height: latestSensitiveAI ? [16, 24 + (i % 5) * 4, 16] : 16,
                              backgroundColor: latestSensitiveAI ? '#141414' : '#1414141a'
                            }}
                            transition={{ repeat: Infinity, duration: 0.5 + (i % 3) * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  </section>

                  {latestSensitiveAI && (
                    <motion.section 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-line p-6 bg-white shadow-sm"
                    >
                      <h3 className="col-header mb-2 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Neural Interpretation
                      </h3>
                      <p className="font-mono text-sm leading-relaxed">
                        {latestSensitiveAI.details}
                      </p>
                    </motion.section>
                  )}
                </div>

                {/* Sensitive AI Right Column */}
                <div className="bg-white border border-line rounded-2xl flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-line flex justify-between items-center">
                    <h2 className="col-header flex items-center gap-2">
                      <History className="w-3 h-3" /> Event Log
                    </h2>
                    <span className="data-value text-[10px] opacity-50">{sensitiveAIResults.length} Entries</span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto max-h-[400px]">
                    <AnimatePresence initial={false}>
                      {sensitiveAIResults.length === 0 ? (
                        <div className="p-12 text-center space-y-4 opacity-30">
                          <AlertCircle className="w-8 h-8 mx-auto" />
                          <p className="font-mono text-[10px] uppercase tracking-widest">No data captured</p>
                        </div>
                      ) : (
                        sensitiveAIResults.map((res, i) => (
                          <motion.div 
                            key={res.timestamp + i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex justify-between items-center p-4 border-b border-line hover:bg-ink hover:text-bg transition-colors cursor-default"
                          >
                            <span className="data-value text-[10px] opacity-30">{i + 1}</span>
                            <span className="font-bold uppercase text-xs">{res.emotion}</span>
                            <span className="data-value text-[10px]">{res.activity}</span>
                            <span className="data-value text-[10px] text-right">{res.timestamp}</span>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-6 border-t border-line bg-bg">
                    <h3 className="col-header mb-4 flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> Aggregate Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] uppercase">Avg Confidence</span>
                        <span className="data-value">
                          {sensitiveAIResults.length > 0 
                            ? `${(sensitiveAIResults.reduce((acc, r) => acc + r.confidence, 0) / sensitiveAIResults.length * 100).toFixed(1)}%`
                            : '0.0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>


      {/* Footer */}
      <footer className="border-t border-line p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-white">
        <div className="flex gap-8">
          <div className="space-y-1">
            <p className="col-header">Privacy Protocol</p>
            <p className="data-value text-[10px]">Zero-Knowledge Architecture</p>
          </div>
          <div className="space-y-1">
            <p className="col-header">Compute Engine</p>
            <p className="data-value text-[10px]">WebGL 2.0 Accelerated</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="#" className="opacity-30 hover:opacity-100 transition-opacity">
            <Github className="w-5 h-5" />
          </a>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest opacity-50">
              &copy; 2026 LocalML Systems. All Rights Reserved.
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest opacity-30">
              Built with TensorFlow.js & React
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
