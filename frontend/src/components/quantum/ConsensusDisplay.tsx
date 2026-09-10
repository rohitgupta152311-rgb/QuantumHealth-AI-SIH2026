import React from 'react';
import { Shield,AlertTriangle,CheckCircle2 } from 'lucide-react';
import type { ConsensusResult } from '../../types';

export const ConsensusDisplay: React.FC<{ consensus: ConsensusResult }> = ({ consensus }) => {
  const getLevelColor = (level: string) => {
    if (level === 'high' || level === 'strong_agreement') return 'text-green-400';
    if (level === 'medium' || level === 'moderate_agreement') return 'text-yellow-400';
    return 'text-red-400';
  };

  const classicalCount = typeof consensus.classical_votes === 'number'
    ? consensus.classical_votes
    : Object.values(consensus.classical_votes || {}).filter(v => String(v) === 'high_risk' || String(v) === '1').length;

  const totalClassical = typeof consensus.classical_votes === 'number'
    ? 3
    : Math.max(Object.keys(consensus.classical_votes || {}).length, 3);

  const quantumVoteCount = consensus.quantum_votes ?? (consensus.quantum_vote === 'high_risk' || consensus.quantum_vote === 1 ? 1 : 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Shield size={18} className="text-teal-400" />
          Quantum-Classical Consensus Engine
        </h3>
        <span className={`text-xs font-bold font-mono uppercase tracking-wider ${getLevelColor(consensus.agreement_level || consensus.agreement || 'high')}`}>
          {(consensus.agreement || consensus.agreement_level || 'CONSISTENT').replace('_', ' ')}
        </span>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <div className="text-3xl font-mono text-sky-400 font-bold">{classicalCount} / {totalClassical}</div>
            <div className="text-xs text-slate-400 uppercase mt-1">Classical High-Risk Votes</div>
          </div>
          <p className="flex-1 px-4 text-center text-xs text-slate-400">
            Votes describe agreement. The saved ensemble determines the combined risk.
          </p>
          <div className="text-center">
            <div className="text-3xl font-mono text-teal-300 font-bold">{quantumVoteCount} / 1</div>
            <div className="text-xs text-slate-400 uppercase mt-1">Quantum VQC Vote</div>
          </div>
        </div>

        {consensus.clinical_review_advised || consensus.disagreement_detected ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3.5 flex items-start gap-3">
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-medium text-amber-200 text-sm">Research Model Disagreement Detected</div>
              <div className="text-xs text-amber-300/80 mt-1">
                {consensus.recommendation || 'Classical and simulated quantum models produced different research outputs. Do not use this result for diagnosis.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3.5 flex items-start gap-3">
            <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-medium text-emerald-200 text-sm">Strong Quantum-Classical Agreement</div>
              <div className="text-xs text-emerald-300/80 mt-1">
                {consensus.recommendation || 'Both classical and simulated quantum models agree for this research input. Agreement is not clinical validation.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
