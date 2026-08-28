import React, { useState } from 'react';
import type { QuantumCircuitInfo } from '../../types';
import { Info, Sparkles, Binary, Cpu } from 'lucide-react';

export const QuantumCircuitViz: React.FC<{ circuitInfo: QuantumCircuitInfo }> = ({ circuitInfo }) => {
  const qubits = circuitInfo.n_qubits ?? circuitInfo.qubits ?? 6;
  const [selectedGate, setSelectedGate] = useState<{ name: string; desc: string; math: string } | null>(null);

  const gateInfoMap: Record<string, { desc: string; math: string }> = {
    H: {
      desc: 'Hadamard Gate: Creates equal quantum superposition (|0⟩ + |1⟩)/√2.',
      math: 'H = 1/√2 [[1, 1], [1, -1]]'
    },
    RY: {
      desc: 'Angle Encoding Rotation: Rotates qubit around Y-axis by angle θ = π · x_normalized.',
      math: 'RY(θ) = [[cos(θ/2), -sin(θ/2)], [sin(θ/2), cos(θ/2)]]'
    },
    CNOT: {
      desc: 'Controlled-NOT Gate: Entangles adjacent qubits in a closed-ring topology.',
      math: '|00⟩→|00⟩, |01⟩→|01⟩, |10⟩→|11⟩, |11⟩→|10⟩'
    },
    RZ: {
      desc: 'Parameterized Phase Rotation: Variational gate optimized during training.',
      math: 'RZ(φ) = [[exp(-iφ/2), 0], [0, exp(iφ/2)]]'
    },
    Measure: {
      desc: 'Expectation Measurement: Evaluates Pauli-Z operator ⟨Z₀⟩ yielding risk expectation in [-1, +1].',
      math: '⟨Z₀⟩ = ⟨ψ|σ_z|ψ⟩ → sigmoid(⟨Z₀⟩)'
    }
  };

  const featureMap = circuitInfo.feature_to_qubit_map || {
    "Glucose": 0, "BMI": 1, "Age": 2, "BloodPressure": 3, "Insulin": 4, "Pedigree": 5
  };

  const qubitFeatureNames = Object.entries(featureMap).sort((a, b) => a[1] - b[1]).map(e => e[0]);

  return (
    <div className="space-y-4">
      {/* Interactive Circuit Canvas */}
      <div className="overflow-x-auto rounded-2xl bg-gray-950 p-6 border border-gray-800/90 font-mono text-xs shadow-inner">
        <div className="min-w-[760px]">
          <svg width={qubits * 110 + 260} height={qubits * 65 + 30} className="mx-auto select-none">
            <defs>
              <linearGradient id="wireGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {Array.from({ length: qubits }).map((_, q) => {
              const y = q * 65 + 35;
              const featName = qubitFeatureNames[q] || `Feature_${q}`;

              return (
                <g key={`qubit-wire-${q}`}>
                  {/* Qubit & Feature Label */}
                  <text x="10" y={y - 8} fill="#9ca3af" fontSize="10" fontWeight="bold">
                    q[{q}]
                  </text>
                  <text x="10" y={y + 16} fill="#6366f1" fontSize="9" fontWeight="medium">
                    {featName.length > 11 ? featName.substring(0, 11) + '..' : featName}
                  </text>

                  {/* Wire line */}
                  <line x1="85" y1={y} x2={qubits * 110 + 190} y2={y} stroke="#374151" strokeWidth="2" />

                  {/* Layer 1: Hadamard Superposition */}
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedGate({ name: 'Hadamard Gate (H)', ...gateInfoMap.H })}
                  >
                    <rect x="105" y={y - 16} width="32" height="32" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" rx="6" className="hover:fill-indigo-900 transition-colors" />
                    <text x="121" y={y + 4} fill="#fff" textAnchor="middle" fontSize="12" fontWeight="bold">H</text>
                  </g>

                  {/* Layer 2: Angle Encoding RY */}
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedGate({ name: 'Angle Encoding RY(θ)', ...gateInfoMap.RY })}
                  >
                    <rect x="160" y={y - 16} width="46" height="32" fill="#451a03" stroke="#f59e0b" strokeWidth="1.5" rx="6" className="hover:fill-amber-900 transition-colors" />
                    <text x="183" y={y + 4} fill="#fbbf24" textAnchor="middle" fontSize="10" fontWeight="bold">RY(θ)</text>
                  </g>

                  {/* Layer 3: Ring Entanglement (CNOTs) */}
                  {q < qubits - 1 ? (
                    <g
                      className="cursor-pointer group"
                      onClick={() => setSelectedGate({ name: 'CNOT Entanglement', ...gateInfoMap.CNOT })}
                    >
                      <circle cx="235" cy={y} r="5" fill="#06b6d4" />
                      <line x1="235" y1={y} x2="235" y2={y + 65} stroke="#06b6d4" strokeWidth="2" strokeDasharray="3 3" />
                      <circle cx="235" cy={y + 65} r="11" fill="#083344" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="235" y1={y + 58} x2="235" y2={y + 72} stroke="#06b6d4" strokeWidth="2" />
                      <line x1="228" y1={y + 65} x2="242" y2={y + 65} stroke="#06b6d4" strokeWidth="2" />
                    </g>
                  ) : (
                    // Closed ring CNOT from last qubit back to q0
                    <g
                      className="cursor-pointer group"
                      onClick={() => setSelectedGate({ name: 'CNOT Ring Entanglement (q_last → q_0)', ...gateInfoMap.CNOT })}
                    >
                      <circle cx="280" cy={y} r="5" fill="#06b6d4" />
                      <circle cx="280" cy={35} r="11" fill="#083344" stroke="#06b6d4" strokeWidth="2" />
                      <line x1="280" y1={28} x2="280" y2={42} stroke="#06b6d4" strokeWidth="2" />
                      <line x1="273" y1={35} x2="287" y2={35} stroke="#06b6d4" strokeWidth="2" />
                    </g>
                  )}

                  {/* Layer 4: Parameterized Variational RZ */}
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedGate({ name: 'Variational Parameter RZ(φ)', ...gateInfoMap.RZ })}
                  >
                    <rect x="325" y={y - 16} width="46" height="32" fill="#3b0764" stroke="#c084fc" strokeWidth="1.5" rx="6" className="hover:fill-purple-900 transition-colors" />
                    <text x="348" y={y + 4} fill="#e9d5ff" textAnchor="middle" fontSize="10" fontWeight="bold">RZ(φ)</text>
                  </g>

                  {/* Layer 5: Layer 2 Repeat Indicator */}
                  <g
                    className="cursor-pointer group"
                    onClick={() => setSelectedGate({ name: 'Ansatz Layer 2 [RY, RZ]', ...gateInfoMap.RY })}
                  >
                    <rect x="395" y={y - 16} width="46" height="32" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" rx="6" className="hover:fill-indigo-950 transition-colors" />
                    <text x="418" y={y + 4} fill="#c7d2fe" textAnchor="middle" fontSize="10" fontWeight="bold">L2(θ,φ)</text>
                  </g>

                  {/* Measurement Gate on Wire 0 or All Wires */}
                  {q === 0 ? (
                    <g
                      className="cursor-pointer group"
                      onClick={() => setSelectedGate({ name: 'Expectation Value ⟨Z₀⟩ Measurement', ...gateInfoMap.Measure })}
                    >
                      <rect x={qubits * 110 + 135} y={y - 18} width="42" height="36" fill="#111827" stroke="#34d399" strokeWidth="2" rx="8" className="hover:fill-emerald-950 transition-colors" />
                      <text x={qubits * 110 + 156} y={y + 4} fill="#34d399" textAnchor="middle" fontSize="11" fontWeight="bold">⟨Z₀⟩</text>
                    </g>
                  ) : (
                    <g>
                      <rect x={qubits * 110 + 135} y={y - 14} width="32" height="28" fill="#111827" stroke="#4b5563" strokeWidth="1" rx="6" opacity="0.6" />
                      <text x={qubits * 110 + 151} y={y + 4} fill="#6b7280" textAnchor="middle" fontSize="9">wire</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Interactive Gate Inspector Modal / Drawer */}
      {selectedGate ? (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-2xl p-5 space-y-2.5 transition-all shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles size={16} className="text-yellow-400" />
              <span>Gate Inspector: {selectedGate.name}</span>
            </div>
            <button
              onClick={() => setSelectedGate(null)}
              className="text-xs text-gray-400 hover:text-white font-mono bg-gray-900 px-2 py-0.5 rounded border border-gray-800"
            >
              Close ✕
            </button>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed">{selectedGate.desc}</p>
          <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/80 font-mono text-[11px] text-quantum-300">
            {selectedGate.math}
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5 flex items-center gap-2 text-xs text-gray-400">
          <Info size={16} className="text-indigo-400 flex-shrink-0" />
          <span>Tip: Click on any quantum gate (<strong>H</strong>, <strong>RY</strong>, <strong>CNOT</strong>, <strong>RZ</strong>, <strong>⟨Z₀⟩</strong>) above to inspect its unitary transformation and mathematical formula.</span>
        </div>
      )}
    </div>
  );
};
