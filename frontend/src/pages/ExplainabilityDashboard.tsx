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
        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <BarChart3 size={22} />
        </div>
        <div className="text-lg font-semibold text-gray-200">No Research Prediction Available</div>
        <p className="max-w-md text-sm text-gray-400">Run a prediction first. Explainability is shown only for a real saved response.</p>
        <Button onClick={() => navigate('/analyze')} leftIcon={<Activity size={16} />}>Run Research Prediction</Button>
      </div>
    );
  }

  const topFeatures = (data.feature_importance || []).slice(0, 5);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
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
          <Card className="bg-gray-900/70 border-gray-800 backdrop-blur">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
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
          <Card className="bg-gray-900/70 border-gray-800 backdrop-blur">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers size={18} className="text-purple-400" /> Clinical Interpretation Breakdown
            </h3>
            
            <div className="space-y-3">
              {topFeatures.map((f, idx) => (
                <div key={idx} className="bg-gray-950 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{f.label || f.feature}</div>
                      <div className="text-xs text-gray-500 font-mono">Biomarker Feature Code: {f.feature}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-quantum-400">
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-gray-500 block font-mono">Attribution</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quantum Sensitivity & Clinical Disclaimer */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm mb-2">
              <Sparkles size={16} className="text-yellow-400" />
              <span>Quantum Gradient Sensitivity</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-3">
              In the quantum layer, each feature $x_i$ acts as a continuous rotation angle on qubit $q_i$. The circuit’s gradient with respect to $x_i$ captures non-linear cross-qubit entanglements via CNOT operators, enabling the detection of subtle multi-variate risk signals that single decision trees may under-weight.
            </p>
            <div className="bg-gray-950/80 p-3 rounded-xl border border-gray-800 font-mono text-[11px] text-quantum-300">
              Sensitivity: ∂⟨Z₀⟩ / ∂θ_i = 1/2 [⟨Z(θ_i + π/2)⟩ - ⟨Z(θ_i - π/2)⟩]
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
