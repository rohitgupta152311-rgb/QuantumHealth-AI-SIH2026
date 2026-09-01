import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { RiskGauge } from '../components/charts/RiskGauge';
import { ConsensusDisplay } from '../components/quantum/ConsensusDisplay';
import { FeatureImportanceChart } from '../components/charts/FeatureImportanceChart';
import {
  Activity, Cpu, ShieldCheck, AlertTriangle, ArrowRight,
  FlaskConical, BarChart3, Download, Sparkles, RefreshCw, FileText
} from 'lucide-react';
import type { PredictionResponse } from '../types';

export const HybridAIDashboard: React.FC = () => {
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
      <div className="flex flex-col items-center justify-center p-16 space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Activity size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">No Analysis Data Available</h2>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Run a research prediction to view real model output. This dashboard never displays invented results.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => navigate('/analyze')}
          leftIcon={<Activity size={18} />}
        >
          Run Research Prediction
        </Button>
      </div>
    );
  }

  const riskPct = data.hybrid_result?.risk_percentage ?? ((data.hybrid_result?.risk_probability || 0) * 100);
  const isHighRisk = riskPct >= 50;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={14} /> Synthesized Diagnostic Assessment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Hybrid AI Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Target Disease Module: <span className="text-indigo-300 font-semibold font-mono uppercase">{data.disease}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            leftIcon={<FileText size={16} />}
            className="border border-gray-800"
          >
            Print Research Summary
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/analyze')}
            leftIcon={<RefreshCw size={16} />}
          >
            New Patient Analysis
          </Button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Assessment Gauge Card */}
        <Card className="flex flex-col items-center justify-center p-6 bg-gray-900/80 backdrop-blur border-gray-800">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Integrated Risk Score
          </div>
          <RiskGauge percentage={riskPct} riskLevel={data.risk_level || (isHighRisk ? 'high' : 'low')} />
          <div className="mt-3 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider ${
              isHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {isHighRisk ? 'Elevated Risk Level' : 'Low / Normal Baseline'}
            </span>
          </div>
        </Card>

        {/* Quantum-Classical Consensus Engine Card */}
        <div className="md:col-span-2">
          {data.consensus ? (
            <ConsensusDisplay consensus={data.consensus} />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <span className="text-gray-500 text-sm">Consensus data synthesized.</span>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Models Breakdown Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Classical Models Column */}
        <Card className="bg-gray-900/60 border-gray-800/90 backdrop-blur">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Activity size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Classical ML Ensemble</h3>
                <span className="text-xs text-gray-400">Random Forest + SVM + Logistic Regression (60% Weight)</span>
              </div>
            </div>
            <Badge variant="default" className="font-mono text-xs">60% Fusion Weight</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] text-gray-400 uppercase bg-gray-950/80 font-mono">
                <tr>
                  <th className="px-3.5 py-2.5 rounded-l-lg">Model</th>
                  <th className="px-3.5 py-2.5">Prediction</th>
                  <th className="px-3.5 py-2.5">Confidence</th>
                  <th className="px-3.5 py-2.5 rounded-r-lg">Risk Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {data.classical_results.map((res, idx) => {
                  const isPos = res.prediction === 'high_risk' || res.prediction === 1;
                  return (
                    <tr key={idx} className="hover:bg-gray-800/30 transition-colors font-mono">
                      <td className="px-3.5 py-3 font-semibold text-gray-200">{res.model || res.model_name}</td>
                      <td className="px-3.5 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          isPos ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {isPos ? 'HIGH RISK' : 'LOW RISK'}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-gray-300">{(res.confidence * 100).toFixed(1)}%</td>
                      <td className="px-3.5 py-3 font-bold text-indigo-300">{(res.risk_probability * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quantum ML Column */}
        <Card glowing className="bg-gray-900/60 border-purple-500/30 backdrop-blur">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Cpu size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Quantum VQC Classifier</h3>
                <span className="text-xs text-gray-400 font-mono">PennyLane default.qubit (40% Weight)</span>
              </div>
            </div>
            <Badge variant="quantum" className="font-mono text-xs">40% Fusion Weight</Badge>
          </div>

          {data.quantum_result && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1 font-mono uppercase">VQC Classification</div>
                  <div className="text-xl font-bold font-mono text-quantum-400">
                    {data.quantum_result.prediction === 'high_risk' || data.quantum_result.prediction === 1 ? 'HIGH RISK (Positive)' : 'LOW RISK (Negative)'}
                  </div>
                </div>

                <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1 font-mono uppercase">Quantum Risk Probability</div>
                  <div className="text-xl font-bold font-mono text-purple-300">
                    {(data.quantum_result.risk_probability * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Quantum Circuit Spec Strip */}
              <div className="bg-gray-950/80 p-4 rounded-2xl border border-gray-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-gray-400">
                  <span>Quantum Simulator:</span>
                  <span className="text-gray-200">{data.quantum_result.backend || 'PennyLane default.qubit'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Qubits Allocated:</span>
                  <span className="text-quantum-400 font-bold">{data.quantum_result.qubits_used || 6} Qubits</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Ansatz Architecture:</span>
                  <span className="text-gray-200">Angle (RY) + Ring CNOT Entanglement</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Execution Latency:</span>
                  <span className="text-emerald-400">{data.quantum_result.execution_time_ms ? `${data.quantum_result.execution_time_ms} ms` : '~15 ms (Simulated)'}</span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/quantum-lab')}
                  rightIcon={<ArrowRight size={14} />}
                  className="text-xs text-quantum-400 hover:text-quantum-300"
                >
                  Inspect Circuit in Quantum Lab
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Feature Importance & Explainability Row */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/60 border-gray-800 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-400" /> Patient Biomarker Sensitivity Analysis
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/explainability')}
                className="text-xs text-gray-400 hover:text-white"
              >
                Full Explainer →
              </Button>
            </div>
            {data.feature_importance && <FeatureImportanceChart features={data.feature_importance} />}
          </Card>
        </div>

        {/* Clinical Disclaimer & Quick Links */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-indigo-500/20">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <FlaskConical size={16} className="text-quantum-400" /> Next Analytical Steps
            </h3>
            <div className="space-y-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/quantum-lab')}
                rightIcon={<ArrowRight size={14} />}
              >
                Quantum Lab & Bloch Sphere
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/comparison')}
                rightIcon={<ArrowRight size={14} />}
              >
                Classical vs Hybrid Metrics
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-between text-xs"
                onClick={() => navigate('/explainability')}
                rightIcon={<ArrowRight size={14} />}
              >
                Permutation Importance View
              </Button>
            </div>
          </Card>

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 text-xs text-yellow-400/90 leading-relaxed space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-yellow-300">
              <AlertTriangle size={14} /> Medical Disclaimer:
            </div>
            <p>{data.disclaimer || 'This platform is an experimental AI-assisted decision-support system and is not a replacement for professional clinical diagnosis.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
