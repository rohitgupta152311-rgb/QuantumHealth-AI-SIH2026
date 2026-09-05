import React from 'react';
import type { ClassicalResult, QuantumResult, HybridResult } from '../../types';
import { Cpu, Activity, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface ProbabilityBreakdownProps {
  classicalResults: ClassicalResult[];
  quantumResult?: QuantumResult;
  hybridResult?: HybridResult;
}

export const ProbabilityBreakdown: React.FC<ProbabilityBreakdownProps> = ({
  classicalResults,
  quantumResult,
  hybridResult,
}) => {
  const getBarColor = (score: number) => {
    if (score < 0.35) return 'bg-emerald-500';
    if (score < 0.60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getScoreTextColor = (score: number) => {
    if (score < 0.35) return 'text-emerald-400';
    if (score < 0.60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-4">
      {/* Hybrid Synthesized Score Card */}
      {hybridResult ? (
        <div className="bg-slate-950 p-4 rounded-xl border border-teal-500/40 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Sparkles size={16} />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Hybrid Synthesized Risk Probability
                </span>
                <span className="text-[11px] text-slate-400">
                  {hybridResult.method || 'Weighted Quantum-Classical Fusion (60% Classical Ensemble + 40% VQC)'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-base font-bold font-mono ${getScoreTextColor(hybridResult.risk_probability)}`}>
                {(hybridResult.risk_probability * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">Synthesized Score</span>
            </div>
          </div>

          <div
            className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(hybridResult.risk_probability * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Hybrid Risk Score"
          >
            <div
              className={`h-full rounded-full transition-all duration-700 ${getBarColor(hybridResult.risk_probability)}`}
              style={{ width: `${Math.min(Math.max(hybridResult.risk_probability * 100, 2), 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
            <span>
              Reported Confidence Metric: <strong>{(hybridResult.confidence * 100).toFixed(1)}%</strong>
            </span>
            <Badge
              variant={hybridResult.risk_probability >= 0.5 ? 'danger' : 'success'}
              className="text-[10px]"
            >
              {hybridResult.risk_probability >= 0.5 ? 'Classified: Elevated Risk' : 'Classified: Baseline / Low Risk'}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-500 flex items-center gap-2">
          <HelpCircle size={15} />
          <span>Hybrid synthesized assessment not available for this run.</span>
        </div>
      )}

      {/* Grid of Individual Models (Rendered ONLY from backend returned values) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Classical Models */}
        {classicalResults && classicalResults.length > 0 ? (
          classicalResults.map((res, idx) => {
            const isHighRisk = res.prediction === 'high_risk' || res.prediction === 1;
            const score = res.risk_probability;

            return (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity size={14} className="text-sky-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      {res.model || res.model_name || 'Classical Classifier'}
                    </span>
                  </div>
                  <Badge variant={isHighRisk ? 'danger' : 'success'} className="text-[10px]">
                    {isHighRisk ? 'High Risk' : 'Low Risk'}
                  </Badge>
                </div>

                <div
                  className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(score * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${res.model} output`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
                    style={{ width: `${Math.min(Math.max(score * 100, 2), 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>
                    Output Score: <strong className={getScoreTextColor(score)}>{(score * 100).toFixed(1)}%</strong>
                  </span>
                  {res.confidence != null ? (
                    <span>Confidence: {(res.confidence * 100).toFixed(0)}%</span>
                  ) : (
                    <span className="text-slate-600">Uncalibrated</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-500 flex items-center gap-2">
            <AlertCircle size={15} />
            <span>Classical model results unavailable</span>
          </div>
        )}

        {/* Quantum VQC Simulator Result */}
        {quantumResult ? (
          <div className="bg-slate-950 p-3.5 rounded-xl border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu size={14} className="text-teal-400" />
                <span className="text-xs font-semibold text-teal-300">
                  Quantum VQC Simulator
                </span>
              </div>
              <Badge
                variant={quantumResult.prediction === 'high_risk' || quantumResult.prediction === 1 ? 'danger' : 'success'}
                className="text-[10px]"
              >
                {quantumResult.prediction === 'high_risk' || quantumResult.prediction === 1 ? 'High Risk' : 'Low Risk'}
              </Badge>
            </div>

            <div
              className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(quantumResult.risk_probability * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Quantum VQC Output Score"
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(quantumResult.risk_probability)}`}
                style={{ width: `${Math.min(Math.max(quantumResult.risk_probability * 100, 2), 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
              <span>
                ⟨Z₀⟩ Derived Score: <strong className={getScoreTextColor(quantumResult.risk_probability)}>{(quantumResult.risk_probability * 100).toFixed(1)}%</strong>
              </span>
              <span>
                {quantumResult.execution_time_ms ? `${quantumResult.execution_time_ms}ms` : 'Simulator Mode'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-500 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-slate-600" />
              <span>Quantum VQC output: <strong>Not available</strong> for this execution</span>
            </div>
            <span className="text-[10px] text-slate-600 font-mono">Classical Only</span>
          </div>
        )}
      </div>
    </div>
  );
};
