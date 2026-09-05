import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { QuantumCircuitViz } from '../components/quantum/QuantumCircuitViz';
import { QuantumReadinessCard } from '../components/quantum/QuantumReadinessCard';
import { getQuantumConfig } from '../services/api';
import {
  Cpu, Binary, Copy, Check, Terminal,
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
        setReadiness({
          original_features: Object.keys(data.feature_to_qubit_map || {}).length,
          selected_features: Object.keys(data.feature_to_qubit_map || {}).length,
          qubits: data.n_qubits ?? data.qubits,
          qubits_required: data.n_qubits ?? data.qubits,
          encoding_method: data.encoding_method ?? data.encoding,
          circuit_depth: data.circuit_depth ?? 0,
          layers: data.n_layers ?? data.layers,
          backend: data.backend,
          simulation_status: 'Simulated',
          feature_to_qubit_map: data.feature_to_qubit_map,
        });
      } catch {
        setConfig(null);
        setReadiness(null);
      }
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
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
            <Cpu size={14} /> Quantum Machine Learning Simulator
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Quantum VQC Laboratory</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Inspection of parameterized variational quantum circuits, state vector transformations, and qubit mappings.
          </p>
        </div>

        <Badge variant="quantum" className="text-xs px-3 py-1 self-start md:self-auto font-mono">
          PennyLane default.qubit (6-Wires)
        </Badge>
      </div>

      {/* Quantum Readiness Card */}
      {readiness && <QuantumReadinessCard readiness={readiness} />}

      {/* Bloch Sphere Interactive Visualizer & Qubit State Vector */}
      <Card className="bg-slate-900 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Binary size={16} className="text-teal-400" /> Interactive Qubit State & Bloch Sphere Visualizer
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulating angle rotation $\theta = \pi \cdot x_i$ for normalized biomedical feature inputs.
            </p>
          </div>

          {/* Qubit Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQubit(q)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  selectedQubit === q
                    ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                q[{q}]
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* 3D Bloch Sphere SVG Widget */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
            <svg width="220" height="220" className="select-none">
              {/* Outer Sphere Rim */}
              <circle cx={cx} cy={cy} r={sphereR} fill="#090d16" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.7" />
              {/* Equator Ellipse */}
              <ellipse cx={cx} cy={cy} rx={sphereR} ry="24" fill="none" stroke="#0e7490" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
              {/* Vertical Meridian */}
              <ellipse cx={cx} cy={cy} rx="24" ry={sphereR} fill="none" stroke="#155e75" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              
              {/* Axes */}
              <line x1={cx} y1="15" x2={cx} y2="205" stroke="#475569" strokeWidth="1.5" />
              <line x1="15" y1={cy} x2="205" y2={cy} stroke="#475569" strokeWidth="1.5" />

              {/* State |0> (North Pole) and |1> (South Pole) */}
              <text x={cx + 10} y="22" fill="#10b981" fontSize="12" fontWeight="bold" fontFamily="monospace">|0⟩</text>
              <text x={cx + 10} y="202" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">|1⟩</text>
              <text x="195" y={cy - 8} fill="#94a3b8" fontSize="10" fontFamily="monospace">|+⟩</text>

              {/* State Vector Arrow */}
              <line x1={cx} y1={cy} x2={vecX} y2={vecY} stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
              <circle cx={vecX} cy={vecY} r="4.5" fill="#f59e0b" />
            </svg>
            <div className="text-[11px] font-mono text-slate-400 mt-2 text-center">
              State Vector $|\psi\rangle$ on Wire <span className="text-teal-300 font-bold">q[{selectedQubit}]</span>
            </div>
          </div>

          {/* Interactive Parameter Slider & State Vector Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Normalized Biomarker Input x[{selectedQubit}]</span>
                <span className="font-mono text-teal-300 font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
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
                className="w-full accent-teal-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0.0 (|0⟩ Ground)</span>
                <span className="text-teal-300">θ = {(rotationAngle * Math.PI).toFixed(3)} rad</span>
                <span>1.0 (|1⟩ Excited)</span>
              </div>
            </div>

            {/* State Decomposition Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block mb-0.5">State Amplitude $|0\rangle$</span>
                <div className="text-emerald-400 font-bold text-base">{(prob0 * 100).toFixed(1)}%</div>
                <div className="text-slate-500 text-[10px] mt-0.5">cos²(θ/2) probability</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block mb-0.5">State Amplitude $|1\rangle$</span>
                <div className="text-rose-400 font-bold text-base">{(prob1 * 100).toFixed(1)}%</div>
                <div className="text-slate-500 text-[10px] mt-0.5">sin²(θ/2) probability</div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
              State Vector $|\psi\rangle = {Math.cos(theta / 2).toFixed(3)}|0\rangle + {Math.sin(theta / 2).toFixed(3)}|1\rangle$
            </div>
          </div>
        </div>
      </Card>

      {/* Circuit Architecture Visualizer */}
      <Card className="bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-teal-400" /> Variational Quantum Classifier (VQC) Circuit Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              6-Qubit parameterized ansatz with Angle Encoding and Ring Topology CNOT Entanglement.
            </p>
          </div>
          <Badge variant="quantum" className="font-mono text-xs">Depth: 5</Badge>
        </div>

        {config && <QuantumCircuitViz circuitInfo={config} />}
      </Card>

      {/* PennyLane Source Code & Execution Specs */}
      <Card className="bg-slate-900 border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-teal-400" />
            <h3 className="text-sm font-bold text-white">PennyLane Implementation Blueprint</h3>
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

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-teal-200 overflow-x-auto leading-relaxed">
          {pennylaneCode}
        </pre>
      </Card>
    </div>
  );
};
