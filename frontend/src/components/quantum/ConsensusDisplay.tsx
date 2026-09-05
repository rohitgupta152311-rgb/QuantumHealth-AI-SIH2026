import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { ConsensusResult } from '../../types';

export const ConsensusDisplay: React.FC<{ consensus?: ConsensusResult }> = ({ consensus }) => {
  if (!consensus) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-xs text-slate-500">
        Consensus assessment data not available.
      </div>
    );
  }

  const getLevelColor = (level: string) => {
    if (level === 'high' || level === 'strong_agreement') return 'text-emerald-400';
    if (level === 'medium' || level === 'moderate_agreement') return 'text-amber-400';
    return 'text-rose-400';
  };

  const classicalCount = typeof consensus.classical_votes === 'number'
    ? consensus.classical_votes
    : Object.values(consensus.classical_votes || {}).filter(v => String(v) === 'high_risk' || String(v) === '1').length;

  const totalClassical = typeof consensus.classical_votes === 'number'
    ? 3
    : Math.max(Object.keys(consensus.classical_votes || {}).length, 3);

  const quantumVoteCount = consensus.quantum_votes ?? (consensus.quantum_vote === 'high_risk' || consensus.quantum_vote === 1 ? 1 : 0);

  const isReviewAdvised = consensus.clinical_review_advised || consensus.disagreement_detected;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
          <Shield size={16} className="text-teal-400" />
          Quantum-Classical Multi-Model Consensus
        </h3>
        <span className={`text-xs font-bold font-mono uppercase tracking-wider ${getLevelColor(consensus.agreement_level || consensus.agreement || 'high')}`}>
          {(consensus.agreement || consensus.agreement_level || 'ALIGNED').replace(/_/g, ' ')}
        </span>
      </div>
      
      <div className="p-5 space-y-5">
        <div className="flex justify-between items-center gap-4">
          <div className="text-center min-w-[100px]">
            <div className="text-2xl font-mono font-bold text-sky-400">{classicalCount} / {totalClassical}</div>
            <div className="text-[11px] text-slate-400 uppercase mt-0.5 font-medium">Classical Models Positive</div>
          </div>

          <div className="flex-1 px-4">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(classicalCount / totalClassical) * 60}%` }}
                className="bg-sky-500 transition-all duration-500"
              />
              <div
                style={{ width: `${quantumVoteCount * 40}%` }}
                className="bg-teal-500 transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>Classical Weight (60%)</span>
              <span>Quantum Weight (40%)</span>
            </div>
          </div>

          <div className="text-center min-w-[100px]">
            <div className="text-2xl font-mono font-bold text-teal-400">{quantumVoteCount} / 1</div>
            <div className="text-[11px] text-slate-400 uppercase mt-0.5 font-medium">Quantum VQC Positive</div>
          </div>
        </div>

        {/* Suggested review priority / Decision-support guidance */}
        <div className={`rounded-xl p-3.5 border ${
          isReviewAdvised
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-start gap-3">
            {isReviewAdvised ? (
              <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
            ) : (
              <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={18} />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-slate-400">
                  Suggested review priority:
                </span>
                <span className={`text-xs font-bold uppercase tracking-wide ${
                  isReviewAdvised ? 'text-amber-300' : 'text-emerald-300'
                }`}>
                  {isReviewAdvised ? 'Elevated Clinical Review Recommended' : 'Routine Standard Clinical Corroboration'}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed">
                {consensus.recommendation || (isReviewAdvised
                  ? 'Classical ensemble and quantum VQC simulator yielded diverging risk determinations. Corroboration by a clinician is suggested.'
                  : 'Both classical models and simulated quantum VQC demonstrate consistent classification output for this patient record.')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
