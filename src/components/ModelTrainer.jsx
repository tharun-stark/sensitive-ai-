import React, { useState, useEffect, useRef } from 'react';
import { MLTrainer } from '../lib/ml';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play, Square, Save, Settings, BrainCircuit, BarChart2 } from 'lucide-react';

export const ModelTrainer = ({ data, columns }) => {
  const [features, setFeatures] = useState([]);
  const [target, setTarget] = useState('');
  const [config, setConfig] = useState({
    epochs: 50,
    learningRate: 0.01,
    hiddenLayers: [10, 5]
  });
  const [trainingProgress, setTrainingProgress] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [modelTrained, setModelTrained] = useState(false);
  const trainerRef = useRef(null);

  useEffect(() => {
    trainerRef.current = new MLTrainer();
  }, []);

  const handleStartTraining = async () => {
    if (!trainerRef.current || features.length === 0 || !target) return;

    setIsTraining(true);
    setTrainingProgress([]);
    setModelTrained(false);

    try {
      // Prepare data
      const xData = data.map(row => features.map(f => Number(row[f]) || 0));
      const yData = data.map(row => [Number(row[target]) || 0]);

      // Create and train model
      await trainerRef.current.createModel(features.length, 1, config);
      await trainerRef.current.train(xData, yData, config, (progress) => {
        setTrainingProgress(prev => [...prev, progress]);
      });

      setModelTrained(true);
    } catch (err) {
      console.error('Training failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleSaveModel = async () => {
    if (!trainerRef.current || !modelTrained) return;
    await trainerRef.current.saveModel('local-model');
    alert('Model saved to local storage!');
  };

  return (
    <div className="space-y-8">
      {/* Configuration Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-line p-6 rounded-xl space-y-6 bg-white/50">
          <h3 className="col-header flex items-center gap-2">
            <Settings className="w-3 h-3" /> Model Configuration
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">Features (Inputs)</label>
              <div className="flex flex-wrap gap-2">
                {columns.map(col => (
                  <button
                    key={col}
                    onClick={() => setFeatures(prev => 
                      prev.includes(col) ? prev.filter(f => f !== col) : [...prev, col]
                    )}
                    className={`px-3 py-1 text-xs rounded-full border border-line transition-all ${
                      features.includes(col) ? 'bg-ink text-bg' : 'hover:bg-ink/5'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">Target (Output)</label>
              <div className="flex flex-wrap gap-2">
                {columns.map(col => (
                  <button
                    key={col}
                    onClick={() => setTarget(col)}
                    className={`px-3 py-1 text-xs rounded-full border border-line transition-all ${
                      target === col ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-ink/5'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">Epochs</label>
                <input
                  type="number"
                  value={config.epochs}
                  onChange={e => setConfig(prev => ({ ...prev, epochs: Number(e.target.value) }))}
                  className="w-full bg-transparent border border-line p-2 text-sm focus:outline-none focus:border-ink"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">Learning Rate</label>
                <input
                  type="number"
                  step="0.001"
                  value={config.learningRate}
                  onChange={e => setConfig(prev => ({ ...prev, learningRate: Number(e.target.value) }))}
                  className="w-full bg-transparent border border-line p-2 text-sm focus:outline-none focus:border-ink"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              onClick={handleStartTraining}
              disabled={isTraining || features.length === 0 || !target}
              className="flex-1 bg-ink text-bg py-3 font-sans font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-30 hover:scale-[1.02] transition-transform"
            >
              {isTraining ? <Square className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
              {isTraining ? 'Training...' : 'Start Training'}
            </button>
            {modelTrained && (
              <button
                onClick={handleSaveModel}
                className="px-4 border border-line hover:bg-ink/5 transition-all"
                title="Save Model"
              >
                <Save className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Training Progress Section */}
        <div className="border border-line p-6 rounded-xl space-y-6 bg-white/50">
          <h3 className="col-header flex items-center gap-2">
            <BarChart2 className="w-3 h-3" /> Training Loss
          </h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trainingProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis 
                  dataKey="epoch" 
                  tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                  label={{ value: 'Epoch', position: 'insideBottom', offset: -5, fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                  label={{ value: 'Loss', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', color: '#fff', border: 'none', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="loss" 
                  stroke="#141414" 
                  strokeWidth={2} 
                  dot={false} 
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {trainingProgress.length > 0 && (
            <div className="flex justify-between items-center pt-4 border-t border-line">
              <div className="text-center">
                <p className="col-header">Current Epoch</p>
                <p className="data-value">{trainingProgress[trainingProgress.length - 1].epoch + 1}</p>
              </div>
              <div className="text-center">
                <p className="col-header">Current Loss</p>
                <p className="data-value">{trainingProgress[trainingProgress.length - 1].loss.toFixed(6)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inference Section */}
      {modelTrained && (
        <div className="border border-line p-6 rounded-xl space-y-6 bg-ink text-bg">
          <h3 className="col-header text-bg/50 flex items-center gap-2">
            <BrainCircuit className="w-3 h-3" /> Live Inference (No API/Internet)
          </h3>
          <InferenceTester trainer={trainerRef.current} features={features} target={target} />
        </div>
      )}
    </div>
  );
};

const InferenceTester = ({ trainer, features, target }) => {
  const [inputs, setInputs] = useState({});
  const [prediction, setPrediction] = useState(null);

  const handlePredict = async () => {
    const inputValues = features.map(f => inputs[f] || 0);
    const result = await trainer.predict(inputValues);
    setPrediction(result[0]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        {features.map(f => (
          <div key={f}>
            <label className="block font-mono text-[10px] uppercase tracking-widest opacity-50 mb-2">{f}</label>
            <input
              type="number"
              value={inputs[f] || ''}
              onChange={e => setInputs(prev => ({ ...prev, [f]: Number(e.target.value) }))}
              placeholder={`Value for ${f}`}
              className="w-full bg-transparent border border-bg/20 p-2 text-sm focus:outline-none focus:border-bg"
            />
          </div>
        ))}
        <button
          onClick={handlePredict}
          className="w-full bg-bg text-ink py-3 font-sans font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform"
        >
          Predict {target}
        </button>
      </div>
      <div className="flex flex-col items-center justify-center border border-bg/20 rounded-lg p-8">
        <p className="col-header text-bg/50 mb-2">Predicted {target}</p>
        <p className="text-7xl font-sans font-bold tracking-tighter">
          {prediction !== null ? prediction.toFixed(4) : '---'}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest opacity-30 mt-4 text-center">
          Computed locally in browser<br />using TensorFlow.js
        </p>
      </div>
    </div>
  );
};
