import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDisease } from '../hooks/useDisease';
import { usePrediction } from '../hooks/usePrediction';
import { DiseaseSelector } from '../features/disease/DiseaseSelector';
import { diseaseConfigs, getDiseaseConfig } from '../features/disease/diseaseConfig';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BiomarkerField } from '../components/forms/BiomarkerField';
import { ProcessingPipeline } from '../components/quantum/ProcessingPipeline';
import {
  Play, AlertCircle, Cpu, Stethoscope, RotateCcw,
  Sparkles, CheckCircle2, Info
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';

export const DiseaseAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { diseases, selectedDisease, selectDisease, isLoading: diseaseLoading } = useDisease();
  const { predict, isLoading: predictLoading, result, error } = usePrediction();

  const [formData, setFormData] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<'hybrid' | 'classical' | 'quantum'>('hybrid');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Sync disease selection with URL search param "?disease=..."
  useEffect(() => {
    const diseaseParam = searchParams.get('disease');
    if (diseaseParam && diseases.some(d => d.id === diseaseParam) && diseaseParam !== selectedDisease) {
      selectDisease(diseaseParam);
    }
  }, [searchParams, diseases, selectedDisease, selectDisease]);

  const activeDisease = diseases.find(d => d.id === selectedDisease);
  const activeConfig = getDiseaseConfig(selectedDisease);

  const handleDiseaseChange = (id: string) => {
    selectDisease(id);
    setSearchParams({ disease: id });
    setActivePresetId(null);
  };

  // Reset to dataset median/midpoint
  const resetToMedian = () => {
    if (activeDisease) {
      const initial: Record<string, number> = {};
      activeDisease.features.forEach(f => {
        const min = f.min_val ?? f.min ?? 0;
        const max = f.max_val ?? f.max ?? 100;
        initial[f.name] = Number(((min + max) / 2).toFixed(2));
      });
      setFormData(initial);
      setActivePresetId(null);
    }
  };

  // Initialize form defaults whenever active disease changes
  useEffect(() => {
    resetToMedian();
  }, [activeDisease]);

  const handleApplyPreset = (presetId: 'lower' | 'intermediate' | 'higher') => {
    if (!activeConfig) return;
    const preset = activeConfig.presets.find(p => p.id === presetId);
    if (preset) {
      setActivePresetId(presetId);
      setFormData(prev => ({
        ...prev,
        ...preset.values,
      }));
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
      }, 700);
    }
  }, [result, predictLoading, navigate]);

  // Data-driven feature groups from diseaseConfig
  const featureGroups = useMemo(() => {
    if (!activeDisease) return [];

    if (activeConfig && activeConfig.featureGroups.length > 0) {
      const assignedFeatureNames = new Set<string>();

      const groups = activeConfig.featureGroups.map(group => {
        const matchingFeatures = activeDisease.features.filter(f =>
          group.featureKeys.includes(f.name)
        );
        matchingFeatures.forEach(f => assignedFeatureNames.add(f.name));
        return {
          groupName: group.groupName,
          description: group.description,
          features: matchingFeatures,
        };
      }).filter(g => g.features.length > 0);

      // Collect any features not explicitly categorized
      const remainingFeatures = activeDisease.features.filter(f => !assignedFeatureNames.has(f.name));
      if (remainingFeatures.length > 0) {
        groups.push({
          groupName: 'Additional Clinical Biomarkers',
          description: 'Complementary clinical parameters and laboratory measurements.',
          features: remainingFeatures,
        });
      }

      return groups;
    }

    // Fallback if no specific config exists
    return [
      {
        groupName: 'Clinical Parameters',
        description: 'Dataset input features.',
        features: activeDisease.features,
      },
    ];
  }, [activeDisease, activeConfig]);

  if (diseaseLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <div className="w-10 h-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin"></div>
        <div className="text-base font-semibold text-slate-200">Loading Clinical Models...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Stethoscope size={14} /> Diagnostic Clinical Intake
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {activeConfig?.name || activeDisease?.name || 'Disease Risk Assessment'}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Configure clinical biomarkers to execute the hybrid classical-quantum classification pipeline.
          </p>
        </div>

        {/* Quantum Hardware Specs Indicator */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl self-start md:self-auto">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Cpu size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">Quantum Simulator Register</div>
            <div className="text-xs font-mono font-bold text-slate-200">6 Qubits (Angle Encoding RY)</div>
          </div>
        </div>
      </div>

      {/* Disease Selection Tabs */}
      <DiseaseSelector
        diseases={diseases}
        selectedId={selectedDisease}
        onSelect={handleDiseaseChange}
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-rose-400 flex-shrink-0" />
            <span>Pipeline error: {error}</span>
          </div>
          <button
            type="button"
            onClick={handlePredict}
            className="text-xs px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-rose-200 font-semibold border border-rose-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Parameters Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Data-Driven Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-800 bg-slate-900/90">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Stethoscope size={18} className="text-teal-400" /> Patient Biomarker Profiler
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust patient values or load demonstrative synthetic test profiles.
                </p>
              </div>

              {/* Demo Case Presets (Properly labeled as demo cases) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('lower')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer ${
                    activePresetId === 'lower'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-emerald-300 hover:border-emerald-500/30'
                  }`}
                  title="Demo profile with values in lower-risk ranges"
                >
                  Demo — Lower Risk Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('intermediate')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer ${
                    activePresetId === 'intermediate'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-300 hover:border-amber-500/30'
                  }`}
                  title="Demo profile with values in borderline ranges"
                >
                  Demo — Intermediate Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('higher')}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer ${
                    activePresetId === 'higher'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-rose-300 hover:border-rose-500/30'
                  }`}
                  title="Demo profile with values in elevated ranges"
                >
                  Demo — Higher Risk Profile
                </button>
                <button
                  type="button"
                  onClick={resetToMedian}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-slate-950 text-slate-400 border border-slate-800 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                  title="Reset all inputs to dataset median"
                >
                  <RotateCcw size={12} /> Reset to Median
                </button>
              </div>
            </div>

            {/* Categorized Clinical Biomarker Fields */}
            <div className="space-y-6">
              {featureGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-3">
                  <div className="border-b border-slate-800/80 pb-2">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      {group.groupName}
                    </h3>
                    <p className="text-[11px] text-slate-500">{group.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {group.features.map((feature) => {
                      const min = feature.min_val ?? feature.min ?? 0;
                      const max = feature.max_val ?? feature.max ?? 100;
                      const val = formData[feature.name] ?? min;

                      return (
                        <BiomarkerField
                          key={feature.name}
                          name={feature.name}
                          label={feature.label || feature.name}
                          value={val}
                          min={min}
                          max={max}
                          unit={feature.unit}
                          description={feature.description}
                          onChange={(newVal) => setFormData(prev => ({ ...prev, [feature.name]: newVal }))}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Execution Settings & Pipeline Preview */}
        <div className="space-y-5">
          <Card className="border-slate-800 bg-slate-900/90">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu size={16} className="text-teal-400" /> Pipeline Execution Mode
            </h2>

            <div className="space-y-2.5 mb-5" role="radiogroup" aria-label="Pipeline Mode">
              <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                mode === 'hybrid'
                  ? 'bg-teal-950/40 border-teal-500 text-white'
                  : 'border-slate-800 hover:bg-slate-800/50 text-slate-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'hybrid'}
                  onChange={() => setMode('hybrid')}
                  className="text-teal-500 mt-1 accent-teal-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Hybrid Ensemble + VQC (Recommended)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    60% Classical Ensemble + 40% PennyLane VQC expectation with consensus validation.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                mode === 'quantum'
                  ? 'bg-teal-950/40 border-teal-500 text-white'
                  : 'border-slate-800 hover:bg-slate-800/50 text-slate-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'quantum'}
                  onChange={() => setMode('quantum')}
                  className="text-teal-500 mt-1 accent-teal-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Quantum VQC Simulation Only</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Angle Encoding & Parameterized VQC on default.qubit simulator.
                  </div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                mode === 'classical'
                  ? 'bg-teal-950/40 border-teal-500 text-white'
                  : 'border-slate-800 hover:bg-slate-800/50 text-slate-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'classical'}
                  onChange={() => setMode('classical')}
                  className="text-teal-500 mt-1 accent-teal-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Classical ML Ensemble Only</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Random Forest + Support Vector Machine + Logistic Regression.
                  </div>
                </div>
              </label>
            </div>

            <Button
              className="w-full text-sm py-3 font-semibold shadow-sm"
              size="lg"
              onClick={handlePredict}
              isLoading={predictLoading}
              leftIcon={<Play size={16} />}
            >
              {predictLoading ? 'Simulating Pipeline...' : 'Generate Prediction'}
            </Button>
          </Card>

          {/* Interactive Pipeline Trace during execution */}
          {predictLoading && (
            <Card highlighted className="border-teal-500/40 bg-slate-950">
              <div className="text-xs font-mono font-semibold text-teal-300 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                <span>Live Execution Pipeline:</span>
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

          {/* Clinical Protocol Information Box */}
          <div className="bg-slate-900/70 rounded-xl p-3.5 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Info size={14} className="text-teal-400" /> Decision-Support Protocol:
            </div>
            <p className="leading-relaxed text-[11px]">
              Upon clicking <strong>Generate Prediction</strong>, your parameters will be scaled and evaluated. Results and suggested review priority will render in the <strong>Clinical AI Dashboard</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
