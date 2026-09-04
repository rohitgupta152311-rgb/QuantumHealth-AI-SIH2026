import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, Cpu, HeartPulse, Info } from 'lucide-react';
import { useDisease } from '../hooks/useDisease';
import { usePrediction } from '../hooks/usePrediction';
import { DiseaseSelector } from '../features/disease/DiseaseSelector';
import { BiomarkerInput } from '../components/inputs/BiomarkerInput';
import { PresetSelector } from '../components/inputs/PresetSelector';
import { PipelineExecutor } from '../components/quantum/PipelineExecutor';
import { Card } from '../components/ui/Card';

/* ─── Preset data for each disease ─────────────── */
const PRESETS: Record<string, Record<string, Record<string, number>>> = {
  diabetes: {
    healthy:   { Pregnancies: 1, Glucose: 88, BloodPressure: 66, SkinThickness: 20, Insulin: 70, BMI: 22.4, DiabetesPedigreeFunction: 0.25, Age: 28 },
    moderate:  { Pregnancies: 3, Glucose: 128, BloodPressure: 76, SkinThickness: 28, Insulin: 115, BMI: 28.5, DiabetesPedigreeFunction: 0.48, Age: 42 },
    high_risk: { Pregnancies: 6, Glucose: 178, BloodPressure: 88, SkinThickness: 38, Insulin: 180, BMI: 36.8, DiabetesPedigreeFunction: 0.85, Age: 54 },
  },
  heart: {
    healthy:   { age: 42, sex: 1, cp: 0, trestbps: 118, chol: 195, fbs: 0, restecg: 0, thalach: 168, exang: 0, oldpeak: 0.2, slope: 2, ca: 0, thal: 2 },
    moderate:  { age: 56, sex: 1, cp: 1, trestbps: 135, chol: 245, fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2, slope: 1, ca: 1, thal: 2 },
    high_risk: { age: 64, sex: 1, cp: 3, trestbps: 160, chol: 295, fbs: 1, restecg: 2, thalach: 122, exang: 1, oldpeak: 2.8, slope: 0, ca: 2, thal: 3 },
  },
  breast_cancer: {
    healthy:   { 'mean radius': 11.2, 'mean texture': 14.5, 'mean perimeter': 72.0, 'mean area': 385.0, 'mean smoothness': 0.082, 'mean compactness': 0.048 },
    moderate:  { 'mean radius': 14.8, 'mean texture': 19.2, 'mean perimeter': 96.5, 'mean area': 680.0, 'mean smoothness': 0.102, 'mean compactness': 0.115 },
    high_risk: { 'mean radius': 20.5, 'mean texture': 25.8, 'mean perimeter': 138.0, 'mean area': 1320.0, 'mean smoothness': 0.125, 'mean compactness': 0.245 },
  },
  kidney: {
    healthy:   { age: 35, bp: 70, sg: 1.020, al: 0, su: 0, bgr: 95, bu: 25, sc: 0.8, sod: 140, pot: 4.2, hemo: 15.0, htn: 0 },
    moderate:  { age: 52, bp: 80, sg: 1.015, al: 1, su: 1, bgr: 135, bu: 48, sc: 1.4, sod: 136, pot: 4.6, hemo: 12.2, htn: 0 },
    high_risk: { age: 64, bp: 95, sg: 1.008, al: 3, su: 2, bgr: 210, bu: 115, sc: 4.8, sod: 128, pot: 5.8, hemo: 8.4, htn: 1 },
  },
};

/* ─── Helpers ──────────────────────────────────── */
function getDefaultValue(name: string, min: number, max: number): number {
  const n = name.toLowerCase();
  if (n === 'sex' || n === 'gender') return 1;
  if (min === 0 && max === 1) return 0;
  if (n === 'sg') return 1.015;
  if (n === 'sc') return 1.0;
  if (n.includes('age')) return 45;
  if (n === 'pregnancies') return 1;
  if (n === 'glucose' || n === 'bgr') return 110;
  if (['bloodpressure', 'bp', 'trestbps'].includes(n)) return 120;
  if (n === 'bmi') return 26.5;
  const isInt = Number.isInteger(min) && Number.isInteger(max) && (max - min) > 1;
  const mid = (min + max) / 2;
  return isInt ? Math.round(mid) : Number(mid.toFixed(2));
}

/* ─── Staggered animation variants ─────────────── */
const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, type: 'spring', stiffness: 200, damping: 22 },
  }),
};

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const gridItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

/* ─── Main Component ───────────────────────────── */
export const DiseaseAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { diseases, selectedDisease, selectDisease, isLoading: diseaseLoading } = useDisease();
  const { predict, isLoading: predictLoading, result, error } = usePrediction();

  const [formData, setFormData] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'hybrid' | 'classical' | 'quantum'>('hybrid');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const activeDisease = diseases.find((d) => d.id === selectedDisease);

  // Initialize defaults when disease changes
  useEffect(() => {
    if (!activeDisease) return;
    const initial: Record<string, number> = {};
    activeDisease.features.forEach((f) => {
      const min = f.min_val ?? f.min ?? 0;
      const max = f.max_val ?? f.max ?? 100;
      initial[f.name] = getDefaultValue(f.name, min, max);
    });
    setFormData(initial);
    setActivePreset(null);
  }, [activeDisease]);

  // Load preset
  const handlePreset = (preset: 'healthy' | 'moderate' | 'high_risk') => {
    setActivePreset(preset);
    const data = PRESETS[selectedDisease]?.[preset];
    if (data) setFormData((prev) => ({ ...prev, ...data }));
  };

  // Run prediction
  const handlePredict = async () => {
    if (!selectedDisease) return;
    await predict({ disease: selectedDisease, features: formData, mode });
  };

  // Navigate to dashboard on result
  useEffect(() => {
    if (result && !predictLoading) {
      const t = setTimeout(() => navigate('/dashboard'), 150);
      return () => clearTimeout(t);
    }
  }, [result, predictLoading, navigate]);

  // Handle input change
  const handleInputChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setActivePreset(null);
  };

  /* ─── Loading state ───────────────────────────── */
  if (diseaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent"
        />
        <div className="text-lg font-semibold text-gray-200">Loading Biomedical Modules...</div>
      </div>
    );
  }

  /* ─── Main render ─────────────────────────────── */
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6"
      >
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Activity size={14} /> Diagnostic Configuration
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Patient Disease Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure biomarker inputs and run the hybrid quantum-classical pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-gray-900/90 border border-gray-800 p-3 rounded-2xl">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Quantum Register</div>
            <div className="text-sm font-mono font-bold text-white">6 Qubits (Angle RY)</div>
          </div>
        </div>
      </motion.div>

      {/* Disease Selector */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="show">
        <DiseaseSelector
          diseases={diseases}
          selectedId={selectedDisease}
          onSelect={(id) => { selectDisease(id); setActivePreset(null); }}
        />
      </motion.div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3"
        >
          <AlertCircle size={18} className="text-red-400" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Main 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* ─── Left: Biomarker inputs ─────────────── */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="show" className="lg:col-span-2">
          <Card className="border-gray-800/90 bg-gray-900/60 backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HeartPulse size={18} className="text-indigo-400" /> Clinical Biomarkers
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Adjust values or use quick presets.</p>
              </div>
              <PresetSelector activePreset={activePreset} onSelect={handlePreset} />
            </div>

            {activeDisease && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={gridVariants}
                initial="hidden"
                animate="show"
                key={selectedDisease} // re-animate on disease change
              >
                {activeDisease.features.map((feature) => (
                  <motion.div key={feature.name} variants={gridItem}>
                    <BiomarkerInput
                      feature={feature}
                      value={formData[feature.name] ?? 0}
                      onChange={handleInputChange}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* ─── Right: Pipeline config & execution ─── */}
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="show" className="space-y-5">
          <Card className="border-gray-800/90 bg-gray-900/60 backdrop-blur">
            <PipelineExecutor
              mode={mode}
              onModeChange={setMode}
              onExecute={handlePredict}
              isLoading={predictLoading}
            />
          </Card>

          {/* Quick info note */}
          <div className="bg-gray-950/80 rounded-2xl p-4 border border-gray-800/80 text-xs text-gray-400 space-y-2">
            <div className="flex items-center gap-1.5 text-gray-200 font-semibold">
              <Info size={14} className="text-indigo-400" /> How it works
            </div>
            <p className="leading-relaxed">
              Your biomarkers are scaled and evaluated across classical ML models and a 6-qubit
              variational quantum circuit. Results are fused in the{' '}
              <strong className="text-gray-300">Hybrid AI Dashboard</strong>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
