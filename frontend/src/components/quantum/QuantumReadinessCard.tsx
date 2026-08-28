import React from 'react';
import { Card } from '../ui/Card';
import { Cpu, Maximize2, Zap, Share2, Server } from 'lucide-react';
import type { QuantumReadiness } from '../../types';

export const QuantumReadinessCard: React.FC<{ readiness: QuantumReadiness }> = ({ readiness }) => {
  return (
    <Card className="bg-gray-900 border-quantum-500/30 quantum-glow">
      <div className="flex items-center gap-2 mb-6">
        <Cpu className="text-quantum-400" />
        <h3 className="text-lg font-bold text-gray-100">Quantum Readiness Analyzer</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Maximize2 size={16} /> Dimensionality
          </div>
          <div className="text-2xl font-mono text-gray-100">{readiness.original_features} → {readiness.selected_features}</div>
          <div className="text-xs text-green-400 mt-1">PCA Reduction applied</div>
        </div>

        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Zap size={16} /> Qubits Required
          </div>
          <div className="text-2xl font-mono text-quantum-400">{readiness.qubits}</div>
          <div className="text-xs text-gray-500 mt-1">Optimal mapping</div>
        </div>

        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Share2 size={16} /> Encoding
          </div>
          <div className="text-lg font-medium text-gray-200 mt-1">{readiness.encoding_method}</div>
          <div className="text-xs text-gray-500 mt-1">Depth: {readiness.circuit_depth}</div>
        </div>

        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Server size={16} /> Target Backend
          </div>
          <div className="text-lg font-medium text-gray-200 mt-1">{readiness.backend}</div>
          <div className="text-xs text-quantum-400 mt-1">{readiness.simulation_status}</div>
        </div>
      </div>
    </Card>
  );
};
