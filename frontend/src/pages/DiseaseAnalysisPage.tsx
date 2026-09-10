import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Cpu,
  HeartPulse,
  Info,
  FlaskConical,
  Stethoscope,
  RotateCcw,
  Users,
  User,
  Sparkles,
} from 'lucide-react';
import { useDisease } from '../hooks/useDisease';
import { usePrediction } from '../hooks/usePrediction';
import { DiseaseSelector } from '../features/disease/DiseaseSelector';
import { BiomarkerField } from '../components/forms/BiomarkerField';
import { SegmentedButtonGroup } from '../components/forms/SegmentedButtonGroup';
import { StepIndicator } from '../components/ui/StepIndicator';
import { PipelineExecutor } from '../components/quantum/PipelineExecutor';
import { Card } from '../components/ui/Card';
import { Skeleton, SkeletonCard } from '../components/ui/SkeletonLoader';
import { BatchTriageView } from '../components/triage/BatchTriageView';
import { getDiseaseConfig } from '../features/disease/diseaseConfig';
import { getDemoMockPrediction } from '../services/api';

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
    healthy: { age: 42, sex: 1, cp: 0, trestbps: 118, chol: 195, fbs: 0, restecg: 0, thalach: 168, exang: 0, oldpeak: 0.2, slope: 2, ca: 0, thal: 2 },
    moderate: { age: 56, sex: 1, cp: 1, trestbps: 135, chol: 245, fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2, slope: 1, ca: 1, thal: 2 },
    high_risk: { age: 64, sex: 1, cp: 3, trestbps: 160, chol: 295, fbs: 1, restecg: 2, thalach: 122, exang: 1, oldpeak: 2.8, slope: 0, ca: 2, thal: 3 },
  },
  breast_cancer: {
    healthy: { 'mean radius': 11.2, 'mean texture': 14.5, 'mean perimeter': 72.0, 'mean area': 385.0, 'mean smoothness': 0.082, 'mean compactness': 0.048, 'mean concavity': 0.015, 'mean concave points': 0.012, 'mean symmetry': 0.165, 'mean fractal dimension': 0.058 },
    moderate: { 'mean radius': 14.8, 'mean texture': 19.2, 'mean perimeter': 96.5, 'mean area': 680.0, 'mean smoothness': 0.102, 'mean compactness': 0.115, 'mean concavity': 0.065, 'mean concave points': 0.048, 'mean symmetry': 0.188, 'mean fractal dimension': 0.063 },
    high_risk: { 'mean radius': 20.5, 'mean texture': 25.8, 'mean perimeter': 138.0, 'mean area': 1320.0, 'mean smoothness': 0.125, 'mean compactness': 0.245, 'mean concavity': 0.285, 'mean concave points': 0.155, 'mean symmetry': 0.242, 'mean fractal dimension': 0.075 },
  },
  kidney: {
    healthy: { age: 35, bp: 70, sg: 1.020, al: 0, su: 0, bgr: 95, bu: 25, sc: 0.8, sod: 140, pot: 4.2, hemo: 15.0, htn: 0 },
    moderate: { age: 52, bp: 80, sg: 1.015, al: 1, su: 1, bgr: 135, bu: 48, sc: 1.4, sod: 136, pot: 4.6, hemo: 12.2, htn: 0 },
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
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, type: 'spring', stiffness: 220, damping: 22 },
  }),
};

/* ─── Main Component ───────────────────────────── */
interface DiseaseAnalysisPageProps {
  defaultMode?: 'individual' | 'batch';
}

export const DiseaseAnalysisPage: React.FC<DiseaseAnalysisPageProps> = ({ defaultMode }) => {
  const navigate = useNavigate();
  const { diseaseId } = useParams<{ diseaseId?: string }>();
  const [searchParams] = useSearchParams();
  const { diseases, selectedDisease, selectDisease, isLoading: diseaseLoading } = useDisease();
  const { predict, isLoading: predictLoading, result, error } = usePrediction();

  const [formData, setFormData] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'hybrid' | 'classical' | 'quantum'>('hybrid');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [screeningMode, setScreeningMode] = useState<'individual' | 'batch'>(defaultMode || 'individual');
  const errorRef = useRef<HTMLDivElement>(null);

  // Synchronize diseaseId param or ?disease= query param
  useEffect(() => {
    const urlDisease = diseaseId || searchParams.get('disease');
    if (urlDisease && diseases.some((d) => d.id === urlDisease) && urlDisease !== selectedDisease) {
      selectDisease(urlDisease);
    }
  }, [diseaseId, searchParams, diseases, selectedDisease, selectDisease]);

  const activeDisease = diseases.find((d) => d.id === selectedDisease);
  const activeConfig = getDiseaseConfig(selectedDisease);

  const handleDiseaseChange = (id: string) => {
    navigate(`/analyze/${encodeURIComponent(id)}`);
    setActivePreset(null);
  };

  // Reset inputs to dataset medians/defaults
  const resetToMedian = useCallback(() => {
    const initial: Record<string, number> = {};
    const medians = activeConfig?.medians || {};

    if (activeDisease && activeDisease.features && activeDisease.features.length > 0) {
      activeDisease.features.forEach((f) => {
        if (medians[f.name] !== undefined) {
          initial[f.name] = medians[f.name];
        } else {
          const min = f.min_val ?? f.min ?? 0;
          const max = f.max_val ?? f.max ?? 100;
          initial[f.name] = getDefaultValue(f.name, min, max);
        }
      });
    } else if (activeConfig) {
      Object.entries(medians).forEach(([k, v]) => {
        initial[k] = v;
      });
    }
    setFormData(initial);
    setActivePreset('median');
  }, [activeDisease, activeConfig]);

  // Initialize defaults when disease changes
  useEffect(() => {
    resetToMedian();
  }, [resetToMedian]);

  // Load presets
  const handleApplyPreset = (presetKey: 'lower' | 'intermediate' | 'higher') => {
    setActivePreset(presetKey);

    const mappedKey = presetKey === 'lower' ? 'healthy' : presetKey === 'intermediate' ? 'moderate' : 'high_risk';

    // 1. Prefer backend-provided presets if available on activeDisease
    if (activeDisease?.presets) {
      const backendPresets = activeDisease.presets as Record<string, { label?: string; data?: Record<string, number> }>;
      const backendPresetData = backendPresets[mappedKey]?.data || backendPresets[presetKey]?.data;
      if (backendPresetData) {
        setFormData((prev) => ({ ...prev, ...backendPresetData }));
        return;
      }
    }

    // 2. Check activeConfig presets
    if (activeConfig) {
      const cfgPreset = activeConfig.presets.find((p) => p.id === presetKey);
      if (cfgPreset) {
        setFormData((prev) => ({ ...prev, ...cfgPreset.values }));
        return;
      }
    }

    // 3. Fallback to hardcoded presets
    const fallbackData = PRESETS[selectedDisease]?.[mappedKey];
    if (fallbackData) {
      setFormData((prev) => ({ ...prev, ...fallbackData }));
    }
  };

  // Edge-case triggers for judge evaluation
  const handleTriggerSentinel = () => {
    setActivePreset('sentinel');
    if (selectedDisease === 'diabetes') {
      setFormData((prev) => ({ ...prev, FPG_mg_dL: 0 }));
    } else if (selectedDisease === 'heart') {
      setFormData((prev) => ({ ...prev, trestbps: 0 }));
    } else {
      const f = activeDisease?.features.find((feat) => feat.missing_sentinels && feat.missing_sentinels.length > 0);
      if (f) setFormData((prev) => ({ ...prev, [f.name]: f.missing_sentinels![0] }));
    }
  };

  const handleTriggerOOD = () => {
    setActivePreset('ood');
    if (selectedDisease === 'diabetes') {
      setFormData((prev) => ({ ...prev, FPG_mg_dL: 750 }));
    } else if (selectedDisease === 'heart') {
      setFormData((prev) => ({ ...prev, trestbps: 350 }));
    } else if (selectedDisease === 'breast_cancer') {
      setFormData((prev) => ({ ...prev, 'mean radius': 95.0 }));
    } else {
      setFormData((prev) => ({ ...prev, age: 140 }));
    }
  };

  // Launch client-side simulated demonstration immediately
  const handleSimulatedPreview = () => {
    const demo = getDemoMockPrediction(selectedDisease);
    localStorage.setItem('qhai_last_prediction', JSON.stringify(demo));
    navigate('/dashboard');
  };

  // Execute prediction
  const handlePredict = async () => {
    if (!selectedDisease) return;
    try {
      // Sanitize formData so only valid feature keys defined in the cohort schema are transmitted
      let payloadFeatures = formData;
      if (activeDisease?.features && activeDisease.features.length > 0) {
        const validKeys = new Set(activeDisease.features.map((f) => f.name));
        payloadFeatures = Object.fromEntries(
          Object.entries(formData).filter(([k]) => validKeys.has(k))
        );
      }
      const res = await predict({ disease: selectedDisease, features: payloadFeatures, mode });
      if (res) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Diagnostic pipeline execution error:', err);
      // Auto-scroll to error notice so user has immediate visibility and action buttons
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Handle single input change
  const handleInputChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setActivePreset(null);
  };

  // Group features clinically
  const featureGroups = useMemo(() => {
    if (activeDisease && activeDisease.features && activeDisease.features.length > 0) {
      if (activeConfig && activeConfig.featureGroups.length > 0) {
        const assignedFeatureNames = new Set<string>();

        const groups = activeConfig.featureGroups.map((group) => {
          const matchingFeatures = activeDisease.features.filter((f) =>
            group.featureKeys.includes(f.name)
          );
          matchingFeatures.forEach((f) => assignedFeatureNames.add(f.name));
          return {
            groupName: group.groupName,
            description: group.description,
            features: matchingFeatures,
          };
        }).filter((g) => g.features.length > 0);

        const remainingFeatures = activeDisease.features.filter((f) => !assignedFeatureNames.has(f.name));
        if (remainingFeatures.length > 0) {
          groups.push({
            groupName: 'Additional Clinical Biomarkers',
            description: 'Complementary clinical parameters and laboratory measurements.',
            features: remainingFeatures,
          });
        }

        return groups;
      }

      return [
        {
          groupName: 'Clinical Parameters',
          description: 'Dataset input features.',
          features: activeDisease.features,
        },
      ];
    }

    // Fallback if activeDisease is still loading or offline: build from activeConfig
    if (activeConfig && activeConfig.featureGroups.length > 0) {
      return activeConfig.featureGroups.map((group) => ({
        groupName: group.groupName,
        description: group.description,
        features: group.featureKeys.map((key) => {
          const med = activeConfig.medians[key] ?? 50;
          return {
            name: key,
            label: key.replace(/_/g, ' '),
            min: 0,
            max: Math.max(100, med * 2.5),
            min_val: 0,
            max_val: Math.max(100, med * 2.5),
            unit: '',
            description: `Clinical parameter: ${key}`,
            required: true,
          };
        }),
      }));
    }

    return [];
  }, [activeDisease, activeConfig]);

  if (diseaseLoading) {
    return (
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div className="space-y-3 flex-1">
            <Skeleton variant="text" width="40%" height={14} />
            <Skeleton variant="text" width="70%" height={36} />
            <Skeleton variant="text" width="55%" height={14} />
          </div>
          <Skeleton width={180} height={56} className="rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <SkeletonCard className="h-96" />
          </div>
          <SkeletonCard className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Research Disclaimer Banner */}
      <div className="bg-slate-950/90 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2 text-amber-300 font-medium">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          Research & Educational Decision-Support Prototype. Not a medical device and not intended for clinical diagnosis.
        </span>
        <span className="font-mono text-slate-500 hidden md:inline">SIH 2026 Problem Statement #26139</span>
      </div>

      {/* Header */}
      <motion.div
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5"
      >
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Stethoscope size={14} /> Diagnostic Clinical Intake
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {activeConfig?.name || activeDisease?.name || 'Patient Disease Risk Analysis'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            {activeConfig?.description || 'Configure clinical biomarkers to execute the hybrid classical-quantum classification pipeline.'}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl self-start md:self-auto">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Cpu size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Quantum Hardware Target</div>
            <div className="text-xs font-mono font-bold text-slate-200">6 Qubits (Angle RY, 2-Layer VQC)</div>
          </div>
        </div>
      </motion.div>

      {/* Step Indicator: 1. Select Cohort -> 2. Patient Biomarkers -> 3. Synthesized Output */}
      <StepIndicator
        currentStep={2}
        onStepClick={(step) => {
          if (step === 1) navigate('/');
          if (step === 3 && result) navigate('/dashboard');
        }}
      />

      {/* Disease Selection Tab Bar */}
      <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="show">
        <DiseaseSelector
          diseases={diseases}
          selectedId={selectedDisease}
          onSelect={handleDiseaseChange}
        />
      </motion.div>

      {/* Error banner - Clear, retryable failure state */}
      {error && (
        <div ref={errorRef} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
              <AlertCircle size={18} />
            </div>
            <div>
              <div className="font-semibold text-rose-200">Diagnostic Pipeline Error</div>
              <div className="text-xs text-rose-300/90 mt-0.5 leading-relaxed">{error}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handlePredict}
              disabled={predictLoading}
              className="text-xs px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-200 font-semibold border border-rose-500/30 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <RotateCcw size={13} className={predictLoading ? 'animate-spin' : ''} />
              {predictLoading ? 'Retrying...' : 'Retry Live Pipeline'}
            </button>
            <button
              type="button"
              onClick={handleSimulatedPreview}
              className="text-xs px-3.5 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-white font-semibold shadow-sm cursor-pointer flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Sparkles size={13} />
              Launch Simulated Preview
            </button>
          </div>
        </div>
      )}

      {/* Screening Mode Switcher: Individual Patient vs Batch Hospital Triage */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setScreeningMode('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 ${
              screeningMode === 'individual'
                ? 'bg-teal-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User size={15} /> Individual Patient Analysis
          </button>
          <button
            type="button"
            onClick={() => setScreeningMode('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 ${
              screeningMode === 'batch'
                ? 'bg-teal-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users size={15} /> Batch Hospital Triage (CSV)
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              SIH High-Throughput
            </span>
          </button>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Mode: <span className="text-teal-400 font-semibold">{screeningMode === 'individual' ? '1:1 Clinical Biomarker Intake' : 'Multi-Patient Batch Stratification'}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {screeningMode === 'batch' ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <BatchTriageView disease={selectedDisease} />
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Categorized Clinical Biomarker Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md">
              {/* Presets & Reset Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <HeartPulse size={18} className="text-teal-400" /> Patient Biomarker Profile
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Adjust clinical parameters or load authenticated benchmark cases.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('lower')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      activePreset === 'lower'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-emerald-300 hover:border-emerald-500/30'
                    }`}
                    title="Lower-risk demonstration profile"
                  >
                    Demo — Lower Risk
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('intermediate')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      activePreset === 'intermediate'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-300 hover:border-amber-500/30'
                    }`}
                    title="Intermediate risk demonstration profile"
                  >
                    Demo — Intermediate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('higher')}
                    className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      activePreset === 'higher'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-rose-300 hover:border-rose-500/30'
                    }`}
                    title="Elevated risk demonstration profile"
                  >
                    Demo — Higher Risk
                  </button>
                  <button
                    type="button"
                    onClick={resetToMedian}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium border border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500"
                    title="Reset all inputs to cohort median values"
                  >
                    <RotateCcw size={12} /> Dataset Median
                  </button>
                </div>
              </div>

              {/* Safety & Outlier Test Scenarios for Clinical Evaluation */}
              <div className="mb-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                    <FlaskConical size={15} className="text-amber-400 shrink-0" />
                    <span>Safety Validation Triggers:</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Demonstrates Abstention on Malformed Inputs & Outliers
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTriggerSentinel}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                    title="Injects 0 on physiologically impossible values (e.g. Glucose=0) to demonstrate automatic safety abstention"
                  >
                    <AlertTriangle size={12} /> Safety Abstention (Sentinel = 0)
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerOOD}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500"
                    title="Injects non-physiological outlier values to demonstrate OOD rejection"
                  >
                    <AlertCircle size={12} /> Out-of-Distribution (OOD Outlier)
                  </button>
                </div>
              </div>

              {/* Categorized Clinical Biomarkers */}
              <div className="space-y-6">
                {featureGroups.map((group, gIdx) => (
                  <div key={group.groupName || gIdx} className="space-y-3">
                    <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <h3 className="text-xs font-bold text-teal-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        {group.groupName}
                      </h3>
                      {group.description && (
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          {group.description}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {group.features.map((feature) => {
                        const catOptions = activeConfig?.categoricalOptions?.[feature.name];
                        if (catOptions && catOptions.length > 0) {
                          return (
                            <div key={feature.name} className="col-span-1 md:col-span-2">
                              <SegmentedButtonGroup
                                name={feature.name}
                                label={feature.label || feature.name}
                                value={formData[feature.name] ?? 0}
                                options={catOptions}
                                description={feature.description}
                                unit={feature.unit}
                                onChange={(val) => handleInputChange(feature.name, val)}
                              />
                            </div>
                          );
                        }

                        const min = feature.min_val ?? feature.min ?? 0;
                        const max = feature.max_val ?? feature.max ?? 100;
                        const refMedian = activeConfig?.medians?.[feature.name];

                        return (
                          <BiomarkerField
                            key={feature.name}
                            name={feature.name}
                            label={feature.label || feature.name}
                            value={formData[feature.name] ?? refMedian ?? getDefaultValue(feature.name, min, max)}
                            min={min}
                            max={max}
                            unit={feature.unit}
                            description={feature.description}
                            referenceValue={refMedian}
                            onChange={(val) => handleInputChange(feature.name, val)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right 1 Col: Pipeline execution */}
          <div className="space-y-5">
            <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <PipelineExecutor
                mode={mode}
                onModeChange={setMode}
                onExecute={handlePredict}
                isLoading={predictLoading}
                errorMessage={error}
                onSimulatedPreview={handleSimulatedPreview}
              />
            </Card>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <Info size={14} className="text-teal-400" /> Clinical Pipeline Method
              </div>
              <p className="leading-relaxed">
                Biomarkers are min-max standardized into radians \([0, \pi]\) for angle embedding on a 6-qubit register.
                The saved hybrid ensemble combines classical and quantum outputs using its stored fusion and calibration state.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
