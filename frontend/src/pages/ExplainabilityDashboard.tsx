import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import { Button } from '../components/ui/Button';
import {
  ShieldAlert, Sparkles, Activity, Info, BarChart3,
  HelpCircle, ArrowRight, CheckCircle2, AlertTriangle, Layers,
  ShieldCheck
} from 'lucide-react';
import type { PredictionResponse } from '../types';

export const ExplainabilityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PredictionResponse | null>(null);

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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <BarChart3 size={22} />
        </div>
        <div className="text-lg font-semibold text-slate-200">No Patient Prediction Available</div>
        <p className="max-w-md text-xs text-slate-400">Execute a patient analysis first to generate biomarker explainability and SHAP sensitivity profiles.</p>
        <Button size="sm" onClick={() => navigate('/analyze')} leftIcon={<Activity size={16} />}>Run Patient Diagnosis</Button>
      </div>
    );
  }

  const topFeatures = (data.feature_importance || []).slice(0, 5);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Info size={14} /> Model Interpretability & Attribution
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Biomarker Feature Explainability</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Permutation feature importance and quantum sensitivity analysis for clinical decision transparency.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/dashboard')}
          leftIcon={<Activity size={15} />}
        >
          View Clinical Dashboard
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Global Feature Importance Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 size={16} className="text-teal-400" /> Relative Biomarker Attribution Spectrum
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated via Permutation Importance on normalized patient inputs.
                </p>
              </div>
            </div>

            {data.feature_importance && <FeatureImportanceChart features={data.feature_importance} />}
          </Card>

          {/* Clinical Insights Card */}
          <Card className="bg-slate-900 border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Layers size={16} className="text-teal-400" /> Key Clinical Biomarkers Breakdown
            </h3>
            
            <div className="space-y-2.5">
              {topFeatures.map((f, idx) => (
                <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/15 text-teal-300 font-mono text-xs font-bold flex items-center justify-center border border-teal-500/30">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{f.label || f.feature}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Biomarker Feature: {f.feature}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-teal-300">
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">Attribution</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quantum Sensitivity & Clinical Disclaimer */}
        <div className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
              <Sparkles size={15} className="text-teal-400" />
              <span>Quantum Gradient Sensitivity</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In the quantum layer, each feature $x_i$ acts as a continuous rotation angle on qubit $q_i$. The circuit’s gradient with respect to $x_i$ captures non-linear cross-qubit entanglements via CNOT operators, enabling the detection of subtle multi-variate risk signals.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-teal-300">
              Sensitivity: ∂⟨Z₀⟩ / ∂θ_i = 1/2 [⟨Z(θ_i + π/2)⟩ - ⟨Z(θ_i - π/2)⟩]
            </div>
          </Card>

          <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-amber-200 font-semibold text-xs">
              <ShieldAlert className="text-amber-400 flex-shrink-0" size={16} />
              <span>Clinical Safety & Decision Ethics</span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              QuantumHealth AI is developed strictly for decision-support and research under Smart India Hackathon 2026. Algorithmic outputs must always be correlated with physical clinical examination and laboratory assays.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
