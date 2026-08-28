import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { QuantumCircuitViz } from '../components/quantum/QuantumCircuitViz';
import { QuantumReadinessCard } from '../components/quantum/QuantumReadinessCard';
import { getQuantumConfig, getMockPrediction } from '../services/api';
import {
  Cpu, Binary, Sparkles, Copy, Check, Terminal,
  Maximize2, Zap, Layers, RefreshCw, Activity
} from 'lucide-react';
import type { QuantumCircuitInfo, QuantumReadiness } from '../types';

export const QuantumLaboratory: React.FC = () => {
  const [config, setConfig] = useState<QuantumCircuitInfo | null>(null);
  const [readiness, setReadiness] = useState<QuantumReadiness | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedQubit, setSelectedQubit] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(0.65); // normalized [0, 1]

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getQuantumConfig('diabetes');
        setConfig(data);
      } catch {
        // Fallback
      }
      const mock = getMockPrediction();
      if (mock.quantum_readiness) setReadiness(mock.quantum_readiness);
    };
    fetchConfig();
  }, []);

  const pennylaneCode = `# QuantumHealth AI — PennyLane Variational Quantum Circuit (VQC)
import pennylane as qml
import numpy as np

n_qubits = 6
n_layers = 2
dev = qml.device("default.qubit", wires=n_qubits)

@qml.qnode(dev, interface="autograd")
def vqc_circuit(weights, features):
    # 1. State Preparation: Angle Encoding RY(π · x_i)
    for i in range(n_qubits):
        qml.Hadamard(wires=i)
        qml.RY(np.pi * features[i], wires=i)
    
    # 2. Variational Entangling Ansatz
    for l in range(n_layers):
        # Ring CNOT Entanglement
        for i in range(n_qubits):
            qml.CNOT(wires=[i, (i + 1) % n_qubits])
        
        # Parameterized Rotations
        for i in range(n_qubits):
            qml.RY(weights[l, i, 0], wires=i)
            qml.RZ(weights[l, i, 1], wires=i)
            
    # 3. Measurement: Pauli-Z Expectation on primary register
    return qml.expval(qml.PauliZ(0))`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pennylaneCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Bloch Sphere Coordinates calculation for theta = pi * rotationAngle
  const theta = Math.PI * rotationAngle;
  const phi = 0; // for purely real angle encoding RY
  const sphereR = 80;
  const cx = 110;
  const cy = 110;
  const vecX = cx + sphereR * Math.sin(theta) * Math.cos(phi);
  const vecY = cy - sphereR * Math.cos(theta);

  // State amplitude calculation
  const prob0 = Math.cos(theta / 2) ** 2;
  const prob1 = Math.sin(theta / 2) ** 2;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-quantum-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Cpu size={14} /> Quantum Machine Learning Simulator
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Quantum Laboratory</h1>
          <p className="text-gray-400 text-sm mt-1">
            Deep-dive inspection of parameterized quantum circuits, Hilbert space state encodings, and readiness metrics.
          </p>
        </div>

        <Badge variant="quantum" className="text-xs px-3.5 py-1.5 self-start md:self-auto">
          PennyLane default.qubit (6-Wires)
        </Badge>
      </div>

      {/* Quantum Readiness Card */}
      {readiness && <QuantumReadinessCard readiness={readiness} />}

      {/* Bloch Sphere Interactive Visualizer & Qubit State Vector */}
      <Card className="bg-gray-900/70 border-gray-800 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Binary size={18} className="text-quantum-400" /> Interactive Qubit State & Bloch Sphere Visualizer
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Simulating angle rotation $\theta = \pi \cdot x_i$ for normalized biomedical feature inputs.
            </p>
          </div>

          {/* Qubit Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQubit(q)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                  selectedQubit === q
                    ? 'bg-quantum-600 text-white border-quantum-400 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                    : 'bg-gray-950 text-gray-400 border-gray-800 hover:text-white'
                }`}
              >
                q[{q}]
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* 3D Bloch Sphere SVG Widget */}
          <div className="flex flex-col items-center justify-center p-4 bg-gray-950 rounded-2xl border border-gray-800">
            <svg width="220" height="220" className="select-none">
              {/* Outer Sphere Rim */}
              <circle cx={cx} cy={cy} r={sphereR} fill="#030712" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
              {/* Equator Ellipse */}
              <ellipse cx={cx} cy={cy} rx={sphereR} ry="24" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              {/* Vertical Meridian */}
              <ellipse cx={cx} cy={cy} rx="24" ry={sphereR} fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              
              {/* Axes */}
              <line x1={cx} y1="15" x2={cx} y2="205" stroke="#4b5563" strokeWidth="1.5" />
              <line x1="15" y1={cy} x2="205" y2={cy} stroke="#4b5563" strokeWidth="1.5" />

              {/* State |0> (North Pole) and |1> (South Pole) */}
              <text x={cx + 10} y="22" fill="#34d399" fontSize="12" fontWeight="bold" fontFamily="monospace">|0⟩</text>
              <text x={cx + 10} y="202" fill="#f87171" fontSize="12" fontWeight="bold" fontFamily="monospace">|1⟩</text>
              <text x="195" y={cy - 8} fill="#9ca3af" fontSize="10" fontFamily="monospace">|+⟩</text>

              {/* State Vector Arrow */}
              <line x1={cx} y1={cy} x2={vecX} y2={vecY} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
              <circle cx={vecX} cy={vecY} r="5" fill="#f59e0b" className="animate-pulse" />
            </svg>
            <div className="text-[11px] font-mono text-gray-400 mt-2 text-center">
              State Vector $|\psi\rangle$ on Wire <span className="text-quantum-400 font-bold">q[{selectedQubit}]</span>
            </div>
          </div>

          {/* Interactive Parameter Slider & State Vector Info */}
          <div className="md:col-span-2 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-gray-300">Biomedical Feature Value x[{selectedQubit}]</span>
                <span className="font-mono text-quantum-400 font-bold bg-gray-950 px-2.5 py-1 rounded-md border border-gray-800">
                  x = {rotationAngle.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={rotationAngle}
                onChange={(e) => setRotationAngle(parseFloat(e.target.value))}
                className="w-full accent-quantum-500 cursor-pointer h-2 bg-gray-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                <span>0.0 (|0⟩ State)</span>
                <span className="text-quantum-300">θ = {(rotationAngle * Math.PI).toFixed(3)} rad</span>
                <span>1.0 (|1⟩ State)</span>
              </div>
            </div>

            {/* State Decomposition Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                <span className="text-gray-500 text-[10px] block mb-1">State Amplitude $|0\rangle$</span>
                <div className="text-emerald-400 font-bold text-lg">{(prob0 * 100).toFixed(1)}%</div>
                <div className="text-gray-500 text-[10px] mt-0.5">cos²(θ/2) probability</div>
              </div>
              <div className="bg-gray-950 p-3.5 rounded-xl border border-gray-800">
                <span className="text-gray-500 text-[10px] block mb-1">State Amplitude $|1\rangle$</span>
                <div className="text-rose-400 font-bold text-lg">{(prob1 * 100).toFixed(1)}%</div>
                <div className="text-gray-500 text-[10px] mt-0.5">sin²(θ/2) probability</div>
              </div>
            </div>

            <div className="p-3 bg-gray-950/80 rounded-xl border border-gray-800 font-mono text-[11px] text-gray-300">
              State Vector $|\psi\rangle = {Math.cos(theta / 2).toFixed(3)}|0\rangle + {Math.sin(theta / 2).toFixed(3)}|1\rangle$
            </div>
          </div>
        </div>
      </Card>

      {/* Circuit Architecture Visualizer */}
      <Card className="bg-gray-900/70 border-gray-800 backdrop-blur">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu size={18} className="text-quantum-400" /> Variational Quantum Classifier (VQC) Circuit
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              6-Qubit parameterized ansatz with Angle Encoding and Ring Topology CNOT Entanglement.
            </p>
          </div>
          <Badge variant="quantum" className="font-mono text-xs">Depth: 5</Badge>
        </div>

        {config && <QuantumCircuitViz circuitInfo={config} />}
      </Card>

      {/* PennyLane Source Code & Execution Specs */}
      <Card className="bg-gray-900/70 border-gray-800 backdrop-blur">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-indigo-400" />
            <h3 className="text-lg font-bold text-white">PennyLane Implementation Blueprint</h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            className="text-xs font-mono"
          >
            {copied ? 'Copied to Clipboard!' : 'Copy Code'}
          </Button>
        </div>

        <pre className="bg-gray-950 p-5 rounded-2xl border border-gray-800/90 font-mono text-xs text-quantum-200 overflow-x-auto leading-relaxed shadow-inner">
          {pennylaneCode}
        </pre>
      </Card>
    </div>
  );
};
