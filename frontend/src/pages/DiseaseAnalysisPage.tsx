import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDisease } from '../hooks/useDisease';
import { usePrediction } from '../hooks/usePrediction';
import { DiseaseSelector } from '../features/disease/DiseaseSelector';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProcessingPipeline } from '../components/quantum/ProcessingPipeline';
import {
  Play, Sparkles, AlertCircle, ShieldCheck, HeartPulse,
  Activity, Info, Cpu, CheckCircle2, RotateCcw
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const DiseaseAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { diseases, selectedDisease, selectDisease, isLoading: diseaseLoading } = useDisease();
  const { predict, isLoading: predictLoading, result, error } = usePrediction();
  
  const [formData, setFormData] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'hybrid' | 'classical' | 'quantum'>('hybrid');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const activeDisease = diseases.find(d => d.id === selectedDisease);

  // Initialize form defaults whenever active disease changes
  useEffect(() => {
    if (activeDisease) {
      const initial: Record<string, number> = {};
      activeDisease.features.forEach(f => {
        const min = f.min_val ?? f.min ?? 0;
        const max = f.max_val ?? f.max ?? 100;
        initial[f.name] = Number(((min + max) / 2).toFixed(2));
      });
      setFormData(initial);
      setActivePreset(null);
    }
  }, [activeDisease]);

  const loadPreset = (presetType: 'healthy' | 'moderate' | 'high_risk') => {
    setActivePreset(presetType);
    if (selectedDisease === 'diabetes') {
      if (presetType === 'healthy') {
        setFormData({
          Pregnancies: 1, Glucose: 88, BloodPressure: 66,
          SkinThickness: 20, Insulin: 70, BMI: 22.4,
          DiabetesPedigreeFunction: 0.25, Age: 28
        });
      } else if (presetType === 'moderate') {
        setFormData({
          Pregnancies: 3, Glucose: 128, BloodPressure: 76,
          SkinThickness: 28, Insulin: 115, BMI: 28.5,
          DiabetesPedigreeFunction: 0.48, Age: 42
        });
      } else {
        setFormData({
          Pregnancies: 6, Glucose: 178, BloodPressure: 88,
          SkinThickness: 38, Insulin: 180, BMI: 36.8,
          DiabetesPedigreeFunction: 0.85, Age: 54
        });
      }
    } else if (selectedDisease === 'heart') {
      if (presetType === 'healthy') {
        setFormData({
          age: 42, sex: 1, cp: 0, trestbps: 118, chol: 195,
          fbs: 0, restecg: 0, thalach: 168, exang: 0, oldpeak: 0.2,
          slope: 2, ca: 0, thal: 2
        });
      } else if (presetType === 'moderate') {
        setFormData({
          age: 56, sex: 1, cp: 1, trestbps: 135, chol: 245,
          fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2,
          slope: 1, ca: 1, thal: 2
        });
      } else {
        setFormData({
          age: 64, sex: 1, cp: 3, trestbps: 160, chol: 295,
          fbs: 1, restecg: 2, thalach: 122, exang: 1, oldpeak: 2.8,
          slope: 0, ca: 2, thal: 3
        });
      }
    } else if (selectedDisease === 'breast_cancer') {
      if (presetType === 'healthy') {
        setFormData((previous) => ({
          ...previous,
          'mean radius': 11.2,
          'mean texture': 14.5,
          'mean perimeter': 72.0,
          'mean area': 385.0,
          'mean smoothness': 0.082,
          'mean compactness': 0.048,
        }));
      } else if (presetType === 'moderate') {
        setFormData((previous) => ({
          ...previous,
          'mean radius': 14.8,
          'mean texture': 19.2,
          'mean perimeter': 96.5,
          'mean area': 680.0,
          'mean smoothness': 0.102,
          'mean compactness': 0.115,
        }));
      } else {
        setFormData((previous) => ({
          ...previous,
          'mean radius': 20.5,
          'mean texture': 25.8,
          'mean perimeter': 138.0,
          'mean area': 1320.0,
          'mean smoothness': 0.125,
          'mean compactness': 0.245,
        }));
      }
    }
  };

  const handlePredict = async () => {
    if (!selectedDisease) return;
    await predict({ disease: selectedDisease, features: formData, mode });
  };

  useEffect(() => {
    if (result && !predictLoading) {
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  }, [result, predictLoading, navigate]);

  if (diseaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <div className="text-lg font-semibold text-gray-200">Loading Biomedical Intelligence Modules...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Activity size={14} /> Diagnostic Configuration
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Patient Disease Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure clinical biomarker inputs to execute the hybrid classical-quantum classification pipeline.
          </p>
        </div>

        {/* Quantum Readiness Indicator */}
        <div className="flex items-center gap-3 bg-gray-900/90 border border-gray-800 p-3 rounded-2xl">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Quantum Register</div>
            <div className="text-sm font-mono font-bold text-white">6 Qubits (Angle RY)</div>
          </div>
        </div>
      </div>

      {/* Disease Selection Tabs */}
      <DiseaseSelector
        diseases={diseases}
        selectedId={selectedDisease}
        onSelect={(id) => {
          selectDisease(id);
          setActivePreset(null);
        }}
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400" />
          <span>Error connecting to prediction pipeline: {error}</span>
        </div>
      )}

      {/* Main Parameters Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-800/90 bg-gray-900/60 backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HeartPulse size={18} className="text-indigo-400" /> Clinical Biomarkers
                </h2>
                <p className="text-xs text-gray-400">Adjust sliders or use direct quick presets below.</p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => loadPreset('healthy')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                    activePreset === 'healthy'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-emerald-300 hover:border-emerald-500/30'
                  }`}
                >
                  🟢 Low Risk
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('moderate')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                    activePreset === 'moderate'
                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 shadow-sm'
                      : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-yellow-300 hover:border-yellow-500/30'
                  }`}
                >
                  🟡 Moderate
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('high_risk')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-all ${
                    activePreset === 'high_risk'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                      : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-rose-300 hover:border-rose-500/30'
                  }`}
                >
                  🔴 High Risk
                </button>
              </div>
            </div>
            
            {activeDisease && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {activeDisease.features.map((feature) => {
                  const min = feature.min_val ?? feature.min ?? 0;
                  const max = feature.max_val ?? feature.max ?? 100;
                  const val = formData[feature.name] ?? min;
                  const step = (max - min) > 10 ? 1 : 0.01;
                  
                  // Compute simple relative position for visual tint
                  const ratio = (val - min) / (max - min || 1);
                  const isHigh = ratio > 0.7;

                  return (
                    <div
                      key={feature.name}
                      className="bg-gray-950/70 p-4 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-all space-y-2.5"
                    >
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-200">
                          {feature.label || feature.name}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={min}
                            max={max}
                            step={step}
                            value={val}
                            onChange={(e) => {
                              const num = parseFloat(e.target.value);
                              if (!isNaN(num)) {
                                setFormData(prev => ({ ...prev, [feature.name]: num }));
                              }
                            }}
                            className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-0.5 text-xs text-right font-mono font-bold text-quantum-300 focus:outline-none focus:border-quantum-500"
                          />
                          {feature.unit && (
                            <span className="text-[10px] text-gray-400 font-mono">{feature.unit}</span>
                          )}
                        </div>
                      </div>

                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={val}
                        onChange={(e) => setFormData(prev => ({ ...prev, [feature.name]: parseFloat(e.target.value) }))}
                        className="w-full accent-quantum-500 cursor-pointer h-1.5 bg-gray-800 rounded-lg"
                      />

                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                        <span>Min: {min}</span>
                        {isHigh ? (
                          <span className="text-rose-400 font-semibold">Elevated Range</span>
                        ) : (
                          <span className="text-emerald-400/80 font-semibold">Baseline</span>
                        )}
                        <span>Max: {max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Execution Settings & Pipeline Preview */}
        <div className="space-y-6">
          <Card className="border-gray-800/90 bg-gray-900/60 backdrop-blur">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Cpu size={18} className="text-indigo-400" /> Pipeline Configuration
            </h2>

            <div className="space-y-3 mb-6">
              <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                mode === 'hybrid'
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)] text-white'
                  : 'border-gray-800 hover:bg-gray-800/40 text-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'hybrid'}
                  onChange={() => setMode('hybrid')}
                  className="text-indigo-500 mt-1"
                />
                <div>
                  <div className="font-semibold text-sm">Hybrid Mode (Recommended)</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    60% Classical Ensemble + 40% PennyLane VQC with consensus validation.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                mode === 'quantum'
                  ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.15)] text-white'
                  : 'border-gray-800 hover:bg-gray-800/40 text-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'quantum'}
                  onChange={() => setMode('quantum')}
                  className="text-purple-500 mt-1"
                />
                <div>
                  <div className="font-semibold text-sm">Quantum VQC Simulation Only</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    Angle Encoding & Parameterized VQC on default.qubit simulator.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                mode === 'classical'
                  ? 'bg-blue-950/40 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.15)] text-white'
                  : 'border-gray-800 hover:bg-gray-800/40 text-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'classical'}
                  onChange={() => setMode('classical')}
                  className="text-blue-500 mt-1"
                />
                <div>
                  <div className="font-semibold text-sm">Classical Ensemble Only</div>
                  <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                    Random Forest + SVM + Logistic Regression.
                  </div>
                </div>
              </label>
            </div>

            <Button
              className="w-full text-base py-3.5 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
              size="lg"
              onClick={handlePredict}
              isLoading={predictLoading}
              leftIcon={<Play size={18} />}
            >
              {predictLoading ? 'Simulating Pipeline...' : 'Run Disease Risk Analysis'}
            </Button>
          </Card>

          {/* Interactive Pipeline Trace during execution */}
          {predictLoading && (
            <Card glowing className="border-indigo-500/40 bg-gray-950">
              <div className="text-xs font-mono font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span> Live Execution Trace:
              </div>
              <ProcessingPipeline steps={[
                { step: 1, name: 'Biomedical Imputation & Outlier Clipping', status: 'completed' },
                { step: 2, name: 'StandardScaler & SelectKBest Filtering', status: 'completed' },
                { step: 3, name: 'Classical Model Inference (RF, SVM, LR)', status: 'completed' },
                { step: 4, name: 'Quantum Angle Encoding (RY Gates)', status: 'in_progress' },
                { step: 5, name: 'PennyLane VQC Circuit Simulation', status: 'in_progress' },
                { step: 6, name: 'Quantum-Classical Consensus Aggregation', status: 'pending' },
              ]} />
            </Card>
          )}

          {/* Quick Explanation Note */}
          <div className="bg-gray-950/80 rounded-2xl p-4 border border-gray-800/80 text-xs text-gray-400 space-y-2">
            <div className="flex items-center gap-1.5 text-gray-200 font-semibold">
              <Info size={14} className="text-quantum-400" /> SIH Demonstration Protocol:
            </div>
            <p className="leading-relaxed">
              Upon clicking <strong>Run Analysis</strong>, your parameters will be scaled and evaluated across both classical and quantum pipelines. Results will be synthesized in the <strong>Hybrid AI Dashboard</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
