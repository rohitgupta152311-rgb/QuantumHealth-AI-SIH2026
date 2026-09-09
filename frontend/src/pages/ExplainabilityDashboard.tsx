import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { Button } from '../components/ui/Button';
import {
  ShieldAlert, Sparkles, Activity, Info, BarChart3,
  HelpCircle, ArrowRight, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import type { PredictionResponse } from '../types';
import { predict } from '../services/api';

export const ExplainabilityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qhai_last_prediction');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch {
        localStorage.removeItem('qhai_last_prediction');
      }
    }
  }, []);

  const handleLoadDemo = async () => {
    setIsLoadingDemo(true);
    try {
      const demoResult = await predict({
        disease: 'diabetes',
        features: {
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
        mode: 'hybrid',
      });
      if (demoResult) {
        setData(demoResult);
        localStorage.setItem('qhai_last_prediction', JSON.stringify(demoResult));
      }
    } catch (err) {
      console.error('Failed to load demo:', err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-5 text-center max-w-xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <BarChart3 size={26} />
        </div>
        <div className="text-xl font-bold text-gray-100">Model Interpretability Ready</div>
        <p className="max-w-md text-sm text-gray-400">
          Global feature importance and local SHAP-style attribution require an active patient analysis. Load a verified high-risk patient to view attribution rankings.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={handleLoadDemo}
            isLoading={isLoadingDemo}
            leftIcon={<Sparkles size={16} className="text-amber-300" />}
            className="bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20"
          >
            ⚡ Load Live Demo Patient
          </Button>
          <Button variant="secondary" onClick={() => navigate('/analyze')} leftIcon={<Activity size={16} />}>
            Configure Custom Patient
          </Button>
        </div>
      </div>
    );
  }

  const topFeatures = (data.feature_importance || []).slice(0, 5);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Info size={14} /> Model Interpretability & Attribution
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Model Explainability</h1>
          <p className="text-gray-400 text-sm mt-1">
            Permutation feature importance and quantum sensitivity analysis for AI-driven clinical transparency.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Activity size={16} />}
        >
          View Dashboard Results
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Global Feature Importance Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/[0.03] border-white/[0.06] backdrop-blur">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-indigo-400" /> Relative Feature Attribution
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Evaluated via Permutation Importance and Tree-Based Ensembles on normalized inputs.
                </p>
              </div>
            </div>

            {data.feature_importance && <FeatureImportanceChart features={data.feature_importance} />}
          </Card>

          {/* Clinical Insights Card */}
          <Card className="bg-white/[0.03] border-white/[0.06] backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Layers size={18} className="text-purple-400" /> Cohort-Level Biomarker Importance
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Mean permutation importance across the unaugmented validation split.
            </p>
            
            <div className="space-y-3">
              {topFeatures.map((f, idx) => (
                <div key={idx} className="bg-black p-4 rounded-xl border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{f.label || f.feature}</div>
                      <div className="text-xs text-gray-500 font-mono">Feature: {f.feature}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-quantum-400">
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-gray-500 block font-mono">Cohort Weight</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Local Case Sensitivity Drivers (if available) */}
          {data.explanations?.classical?.top_drivers && data.explanations.classical.top_drivers.length > 0 && (
            <Card className="bg-white/[0.03] border-white/[0.06] backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-cyan-400" /> Patient-Specific Local Drivers
                </h3>
                <span className="text-[11px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20">
                  Local Perturbation
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Local sensitivity computed via ±0.1σ input perturbation around this patient's values:
              </p>

              <div className="space-y-3">
                {data.explanations.classical.top_drivers.map((driver, idx) => (
                  <div key={idx} className="bg-black p-3.5 rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {driver.label || driver.feature}
                        <span className="text-xs font-mono text-gray-400 font-normal">
                          (Value: {driver.input_value})
                        </span>
                      </div>
                      <div className="text-xs text-indigo-300 font-mono mt-0.5">
                        Effect on model score: {driver.effect_on_model_score}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        Sensitivity: {driver.contribution}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {data.explanations.scope && (
                <p className="text-[11px] text-gray-400 italic mt-3 border-t border-white/[0.06] pt-2">
                  ℹ️ {data.explanations.scope}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Right 1 Col: Quantum Sensitivity & Clinical Disclaimer */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm mb-2">
              <Sparkles size={16} className="text-yellow-400" />
              <span>Quantum Angle-Encoding Sensitivity</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              In the VQC layer, normalized features map to continuous rotation angles $R_y(x_i)$ and $R_z(x_i)$ on qubit $q_i$. Entangling CNOT gates create state superposition across features, capturing high-order correlations.
            </p>
            <div className="bg-black/80 p-3 rounded-xl border border-white/[0.06] font-mono text-[11px] text-quantum-300 mb-3">
              ∂⟨Z₀⟩ / ∂θ_i = 1/2 [⟨Z(θ_i + π/2)⟩ - ⟨Z(θ_i - π/2)⟩]
            </div>

            {data.explanations?.quantum?.qubit_mapping && (
              <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                <div className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">Qubit Feature Mapping:</div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                  {data.explanations.quantum.qubit_mapping.map((feat, qIdx) => (
                    <div key={qIdx} className="bg-black/60 px-2 py-1 rounded border border-white/[0.06] text-purple-300">
                      q[{qIdx}] → {feat}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="bg-indigo-500/5 border-indigo-500/20">
            <div className="flex items-start gap-3">
              <Info className="text-indigo-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-bold text-indigo-200 text-sm mb-1">Statistical Attribution vs. Medical Causality</h4>
                <p className="text-xs text-indigo-300/80 leading-relaxed">
                  Feature attributions reflect statistical associations and loss gradient response within the predictive model. They do <strong>not</strong> establish biological causation, etiology, or specific clinical intervention targets.
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-yellow-500/5 border-yellow-500/20">
            <div className="flex items-start gap-3">
              <ShieldAlert className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="font-bold text-yellow-200 text-sm mb-1">MedTech Safety & Ethics</h4>
                <p className="text-xs text-yellow-400/80 leading-relaxed">
                  QuantumHealth AI is developed strictly for research, educational, and decision-support purposes under Smart India Hackathon 2026. Machine learning and quantum simulation outputs must always be validated by qualified healthcare clinicians before making diagnostic or treatment decisions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
