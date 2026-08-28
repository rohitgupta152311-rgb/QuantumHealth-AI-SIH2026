import React from 'react';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 bg-gray-800/50 border-b border-gray-800 flex justify-between items-center">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
          <Shield size={18} className="text-indigo-400" />
          Quantum-Classical Consensus Engine
        </h3>
        <span className={`text-sm font-bold uppercase tracking-wider ${getLevelColor(consensus.agreement_level || consensus.agreement || 'high')}`}>
          {(consensus.agreement || consensus.agreement_level || 'CONSISTENT').replace('_', ' ')}
        </span>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <div className="text-3xl font-mono text-blue-400">{classicalCount} / {totalClassical}</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Classical High-Risk Votes</div>
          </div>
          <div className="flex-1 px-8">
            <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${(classicalCount / totalClassical) * 75}%` }} className="bg-blue-500 transition-all duration-500" />
              <div style={{ width: `${quantumVoteCount * 25}%` }} className="bg-purple-500 transition-all duration-500" />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
              <span>Classical (60% weight)</span>
              <span>Quantum (40% weight)</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-mono text-purple-400">{quantumVoteCount} / 1</div>
            <div className="text-xs text-gray-400 uppercase mt-1">Quantum VQC Vote</div>
          </div>
        </div>

        {consensus.clinical_review_advised || consensus.disagreement_detected ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3.5 flex items-start gap-3">
            <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-medium text-yellow-200 text-sm">Model Disagreement Detected — Clinical Review Advised</div>
              <div className="text-xs text-yellow-400/80 mt-1">
                {consensus.recommendation || 'Classical models and quantum circuit produced divergent risk outputs. Further clinical investigation recommended.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3.5 flex items-start gap-3">
            <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-medium text-green-200 text-sm">Strong Quantum-Classical Agreement</div>
              <div className="text-xs text-green-400/80 mt-1">
                {consensus.recommendation || 'Both classical and simulated quantum models strongly agree on the diagnostic risk classification.'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
