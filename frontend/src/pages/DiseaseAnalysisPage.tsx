import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertCircle, AlertTriangle, Cpu, HeartPulse, Info, Shield, Sparkles, FlaskConical } from 'lucide-react';
import { useDisease } from '../hooks/useDisease';
import { usePrediction } from '../hooks/usePrediction';
import { DiseaseSelector } from '../features/disease/DiseaseSelector';
import { BiomarkerInput } from '../components/inputs/BiomarkerInput';
import { PresetSelector } from '../components/inputs/PresetSelector';
import { PipelineExecutor } from '../components/quantum/PipelineExecutor';
import { Card } from '../components/ui/Card';
import { Skeleton, SkeletonCard } from '../components/ui/SkeletonLoader';
import { BatchTriageView } from '../components/triage/BatchTriageView';
import { Users, User } from 'lucide-react';

/* ─── Preset fallback data for each disease ─────────────── */
const PRESETS: Record<string, Record<string, Record<string, number>>> = {
  diabetes: {
    healthy: {
      Age: 36,
      Gender: 1,
      BMI: 21.8,
      SBP_mmHg: 112,
      DBP_mmHg: 72,
      FPG_mg_dL: 88,
      Cholesterol_mmol_L: 4.1,
      Triglyceride_mmol_L: 0.9,
      ALT_UL: 18,
      CCR_umol_L: 68,
      family_history_of_diabetes: 0,
    },
    moderate: {
      Age: 52,
      Gender: 1,
      BMI: 26.2,
      SBP_mmHg: 132,
      DBP_mmHg: 84,
      FPG_mg_dL: 112,
      Cholesterol_mmol_L: 5.4,
      Triglyceride_mmol_L: 2.2,
      ALT_UL: 32,
      CCR_umol_L: 74,
      family_history_of_diabetes: 0,
    },
    high_risk: {
      Age: 62,
      Gender: 1,
      BMI: 29.8,
      SBP_mmHg: 150,
      DBP_mmHg: 92,
      FPG_mg_dL: 124,
      Cholesterol_mmol_L: 6.3,
      Triglyceride_mmol_L: 3.6,
      ALT_UL: 58,
      CCR_umol_L: 88,
      family_history_of_diabetes: 1,
    },
  },
  heart: {
    healthy:   { age: 42, sex: 1, cp: 0, trestbps: 118, chol: 195, fbs: 0, restecg: 0, thalach: 168, exang: 0, oldpeak: 0.2, slope: 2, ca: 0, thal: 2 },
    moderate:  { age: 56, sex: 1, cp: 1, trestbps: 135, chol: 245, fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2, slope: 1, ca: 1, thal: 2 },
    high_risk: { age: 64, sex: 1, cp: 3, trestbps: 160, chol: 295, fbs: 1, restecg: 2, thalach: 122, exang: 1, oldpeak: 2.8, slope: 0, ca: 2, thal: 3 },
  },
  breast_cancer: {
    healthy:   { 'mean radius': 11.2, 'mean texture': 14.5, 'mean perimeter': 72.0, 'mean area': 385.0, 'mean smoothness': 0.082, 'mean compactness': 0.048, 'mean concavity': 0.015, 'mean concave points': 0.012, 'mean symmetry': 0.165, 'mean fractal dimension': 0.058 },
    moderate:  { 'mean radius': 14.8, 'mean texture': 19.2, 'mean perimeter': 96.5, 'mean area': 680.0, 'mean smoothness': 0.102, 'mean compactness': 0.115, 'mean concavity': 0.065, 'mean concave points': 0.048, 'mean symmetry': 0.188, 'mean fractal dimension': 0.063 },
    high_risk: { 'mean radius': 20.5, 'mean texture': 25.8, 'mean perimeter': 138.0, 'mean area': 1320.0, 'mean smoothness': 0.125, 'mean compactness': 0.245, 'mean concavity': 0.285, 'mean concave points': 0.155, 'mean symmetry': 0.242, 'mean fractal dimension': 0.075 },
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
  let val: number;
  if (n === 'sex' || n === 'gender') val = 1;
  else if (min === 0 && max === 1) val = 0;
  else if (n === 'sg') val = 1.015;
  else if (n === 'sc') val = 1.0;
  else if (n.includes('age')) val = 45;
  else if (n.includes('fpg') || n.includes('glucose') || n.includes('bgr')) val = 95;
  else if (n.includes('sbp')) val = 120;
  else if (n === 'trestbps') val = 125;
  else if (n.includes('dbp') || ['bloodpressure', 'bp'].includes(n)) val = 80;
  else if (n.includes('cholesterol') || n === 'chol') val = min > 50 ? 210 : 4.5;
  else if (n.includes('triglyceride')) val = 1.5;
  else if (n.includes('alt')) val = 25;
  else if (n.includes('ccr')) val = 75;
  else if (n.includes('family_history')) val = 0;
  else if (n === 'bmi') val = 24.5;
  else {
    const isInt = Number.isInteger(min) && Number.isInteger(max) && (max - min) > 1;
    const mid = (min + max) / 2;
    val = isInt ? Math.round(mid) : Number(mid.toFixed(2));
  }
  return Math.max(min, Math.min(max, val));
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
interface DiseaseAnalysisPageProps {
  defaultMode?: 'individual' | 'batch';
}

export const DiseaseAnalysisPage: React.FC<DiseaseAnalysisPageProps> = ({ defaultMode }) => {
  const navigate = useNavigate();
  const { diseaseId } = useParams<{ diseaseId?: string }>();
  const { diseases, selectedDisease, selectDisease, isLoading: diseaseLoading } = useDisease();
  const { predict, isLoading: predictLoading, result, error } = usePrediction();

  const [formData, setFormData] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'hybrid' | 'classical' | 'quantum'>('hybrid');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [screeningMode, setScreeningMode] = useState<'individual' | 'batch'>(defaultMode || 'individual');

  // Synchronize diseaseId param if provided
  useEffect(() => {
    if (diseaseId && diseases.some((d) => d.id === diseaseId)) {
      selectDisease(diseaseId);
    }
  }, [diseaseId, diseases, selectDisease]);

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

  // Load preset dynamically
  const handlePreset = (preset: 'healthy' | 'moderate' | 'high_risk') => {
    setActivePreset(preset);
    let data: Record<string, number> | undefined;
    if (activeDisease?.presets?.[preset]) {
      const p = activeDisease.presets[preset];
      data = (p as any).data ? (p as any).data : (p as any);
    } else if (PRESETS[selectedDisease]?.[preset]) {
      data = PRESETS[selectedDisease][preset];
    }
    if (data) setFormData((prev) => ({ ...prev, ...data }));
  };

  // Quick Edge-case test triggers for Judges
  const handleTriggerSentinel = () => {
    setActivePreset(null);
    if (selectedDisease === 'diabetes') {
      setFormData((prev) => ({ ...prev, FPG_mg_dL: 0, Glucose: 0 }));
    } else if (selectedDisease === 'heart') {
      setFormData((prev) => ({ ...prev, trestbps: 0 }));
    } else {
      const f = activeDisease?.features.find((feat) => feat.missing_sentinels && feat.missing_sentinels.length > 0);
      if (f) setFormData((prev) => ({ ...prev, [f.name]: f.missing_sentinels![0] }));
    }
  };

  const handleTriggerOOD = () => {
    setActivePreset(null);
    if (selectedDisease === 'diabetes') {
      setFormData((prev) => ({ ...prev, FPG_mg_dL: 750, Glucose: 750 }));
    } else if (selectedDisease === 'heart') {
      setFormData((prev) => ({ ...prev, trestbps: 350 }));
    } else if (selectedDisease === 'breast_cancer') {
      setFormData((prev) => ({ ...prev, 'mean radius': 95.0 }));
    } else {
      setFormData((prev) => ({ ...prev, age: 140 }));
    }
  };

  // Run prediction
  const handlePredict = async () => {
    if (!selectedDisease) return;
    try {
      const res = await predict({ disease: selectedDisease, features: formData, mode });
      if (res) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Diagnostic pipeline execution error:', err);
    }
  };

  // Navigate to dashboard on result (fallback)
  useEffect(() => {
    if (result && !predictLoading) {
      navigate('/dashboard');
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
      <div className="space-y-8 pb-12">
        {/* Skeleton header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div className="space-y-3 flex-1">
            <Skeleton variant="text" width="40%" height={14} />
            <Skeleton variant="text" width="70%" height={36} />
            <Skeleton variant="text" width="55%" height={14} />
          </div>
          <Skeleton width={180} height={56} className="rounded-2xl" />
        </div>
        {/* Skeleton disease selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} className="h-24" />)}
        </div>
        {/* Skeleton form grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SkeletonCard className="h-96" />
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  /* ─── Main render ─────────────────────────────── */
  return (
    <div className="space-y-8 pb-12">
      {/* Research Disclaimer Banner */}
      <div className="bg-black/80 border border-white/[0.08] px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-2 text-amber-300/90 font-medium">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          Research & Educational Decision-Support Prototype. Not a medical device and not intended for clinical diagnosis.
        </span>
        <span className="font-mono text-gray-500 hidden md:inline">SIH 2026 Problem Statement #26139</span>
      </div>

      {/* Header */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6"
      >
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Activity size={14} /> Diagnostic Configuration
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Patient Disease Risk Analysis</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure biomarker inputs and run the hybrid quantum-classical pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.06] p-3 rounded-2xl">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Cpu size={20} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Quantum Register</div>
            <div className="text-sm font-mono font-bold text-white">6 Qubits (Angle RY)</div>
          </div>
        </div>
      </motion.div>

      {/* Disease Provenance & Synthetic Flag */}
      {activeDisease && (
        <motion.div custom={0.5} variants={sectionVariants} initial="hidden" animate="show">
          {activeDisease.is_synthetic_demonstration ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                <span>
                  <strong>Synthetic Clinical Demonstration Module:</strong> Modeled on UCI Chronic Kidney Disease attributes (Rubini et al., 2015; 400 demonstration samples).
                </span>
              </div>
              <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-[10px] text-amber-300 uppercase font-bold shrink-0">
                Synthetic Demonstration
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-gray-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-indigo-400 shrink-0" />
                <span>
                  Clinical Provenance: <strong>{activeDisease.source_citation || activeDisease.source || activeDisease.name}</strong> ({activeDisease.source_rows ?? activeDisease.dataset_size} real records)
                </span>
              </div>
              <span className="font-mono text-gray-400 text-[11px]">
                Evaluation Split: 60% Train / 20% Val (Calibration) / 20% Untouched Test
              </span>
            </div>
          )}
        </motion.div>
      )}

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

      {/* Screening Mode Switcher: Individual Patient vs Batch Hospital Triage */}
      <motion.div custom={1.5} variants={sectionVariants} initial="hidden" animate="show" className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.08]">
          <button
            type="button"
            onClick={() => setScreeningMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              screeningMode === 'individual'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <User size={15} /> Individual Patient Analysis
          </button>
          <button
            type="button"
            onClick={() => setScreeningMode('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              screeningMode === 'batch'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Users size={15} /> Batch Hospital Triage (CSV / Cohort)
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SIH High-Throughput
            </span>
          </button>
        </div>

        <div className="text-xs font-mono text-gray-500">
          Workflow: <span className="text-indigo-400 font-semibold">{screeningMode === 'individual' ? '1:1 Clinical Assessment & Quantum Explanations' : 'Multi-Patient Population Risk Stratification'}</span>
        </div>
      </motion.div>

      {/* Main Content Area: Conditional between Individual and Batch Triage */}
      {screeningMode === 'batch' ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <BatchTriageView disease={selectedDisease} />
        </motion.div>
      ) : (
        /* Main 2-column layout */
        <div className="grid lg:grid-cols-3 gap-8">
        {/* ─── Left: Biomarker inputs ─────────────── */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="show" className="lg:col-span-2">
          <Card className="border-white/[0.06] bg-white/[0.03] backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HeartPulse size={18} className="text-indigo-400" /> Clinical Biomarkers
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Adjust values or select clinical cohorts.</p>
              </div>
              <PresetSelector activePreset={activePreset} onSelect={handlePreset} />
            </div>

            {/* Judge Evaluation & Abstention Edge-Case Buttons */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/[0.06] via-purple-500/[0.04] to-indigo-500/[0.06] border border-amber-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
                  <FlaskConical size={16} className="text-amber-400 shrink-0" />
                  <span>Clinical Validation & Safety Scenarios (1-Click Presets):</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  Evaluates Consensus, Abstention & Ethnic Recalibration
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePreset('healthy')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
                    activePreset === 'healthy'
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Normal Baseline
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset('high_risk')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
                    activePreset === 'high_risk'
                      ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-rose-400"></span> High Risk Profile
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSentinel}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                  title="Injects 0 on missing sentinels (e.g. Glucose=0) to demonstrate automatic safety abstention"
                >
                  <AlertTriangle size={13} /> Test Safety Abstention (Glucose = 0)
                </button>
                <button
                  type="button"
                  onClick={handleTriggerOOD}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                  title="Injects non-physiological outlier values to demonstrate OOD rejection"
                >
                  <AlertCircle size={13} /> Test Out-of-Distribution (OOD)
                </button>
              </div>
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
          <Card className="border-white/[0.06] bg-white/[0.03] backdrop-blur">
            <PipelineExecutor
              mode={mode}
              onModeChange={setMode}
              onExecute={handlePredict}
              isLoading={predictLoading}
            />
          </Card>

          {/* Quick info note */}
          <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.06] text-xs text-gray-400 space-y-2">
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
      )}
    </div>
  );
};
