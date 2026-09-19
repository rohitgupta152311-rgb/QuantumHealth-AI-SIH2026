import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Cpu, Atom, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { ProcessingPipeline } from '../quantum/ProcessingPipeline';

interface PipelineExecutorProps {
  mode: 'hybrid' | 'classical' | 'quantum';
  onModeChange: (mode: 'hybrid' | 'classical' | 'quantum') => void;
  quantumWeight?: number;
  onQuantumWeightChange?: (weight: number) => void;
  quantumBackend?: string;
  onQuantumBackendChange?: (backend: string) => void;
  onExecute: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
  onSimulatedPreview?: () => void;
}

const QUANTUM_SIMULATORS = [
  { id: 'numpy:statevector', label: 'NumPy Exact Statevector', tag: 'Fastest', desc: 'Sub-millisecond matrix tensor contraction kernel' },
  { id: 'pennylane:default.qubit', label: 'PennyLane Default.Qubit', tag: 'Reference', desc: 'Pure-Python official statevector simulator' },
  { id: 'pennylane:lightning.qubit', label: 'PennyLane Lightning C++', tag: 'HPC', desc: 'C++ multithreaded accelerated simulator' },
  { id: 'pennylane:qiskit.aer', label: 'IBM Qiskit Aer', tag: 'IBM Q', desc: 'Qiskit simulation engine with OpenQASM export' },
  { id: 'pennylane:braket.local.qubit', label: 'Amazon Braket Local', tag: 'AWS', desc: 'Amazon Braket quantum circuit execution runtime' },
  { id: 'pennylane:default.mixed', label: 'PennyLane Default.Mixed', tag: 'Noise', desc: 'Density matrix noise and decoherence simulator' },
];

const modes = [
  {
    id: 'hybrid' as const,
    label: 'Hybrid Mode',
    tag: 'Recommended',
    desc: 'Calibrated classical–quantum ensemble',
    icon: Layers,
    color: 'teal',
    borderActive: 'border-teal-500',
    bgActive: 'bg-teal-950/40',
    shadowActive: 'shadow-sm',
  },
  {
    id: 'quantum' as const,
    label: 'Quantum Only',
    tag: 'VQC',
    desc: 'PennyLane Variational Circuit',
    icon: Atom,
    color: 'cyan',
    borderActive: 'border-cyan-500',
    bgActive: 'bg-cyan-950/40',
    shadowActive: 'shadow-sm',
  },
  {
    id: 'classical' as const,
    label: 'Classical Only',
    tag: 'Ensemble',
    desc: 'RF + SVM + Logistic Regression + XGBoost',
    icon: Cpu,
    color: 'sky',
    borderActive: 'border-sky-500',
    bgActive: 'bg-sky-950/40',
    shadowActive: 'shadow-sm',
  },
];

export const PipelineExecutor: React.FC<PipelineExecutorProps> = ({
  mode,
  onModeChange,
  quantumWeight = 0.40,
  onQuantumWeightChange,
  quantumBackend = 'numpy:statevector',
  onQuantumBackendChange,
  onExecute,
  isLoading,
  errorMessage,
  onSimulatedPreview,
}) => {
  const pipelineSteps = [
    { name: 'Feature Normalization (Min-Max to [0, π])', status: isLoading ? 'in_progress' as const : 'completed' as const },
    { name: 'Classical Baseline Ensemble', status: isLoading ? 'in_progress' as const : 'completed' as const },
    { name: '6-Qubit Quantum VQC Circuit', status: isLoading ? 'in_progress' as const : 'completed' as const },
    { name: 'Confidence Fusion & Consensus', status: isLoading ? 'pending' as const : 'completed' as const },
  ];

  const qWeightPct = Math.round(quantumWeight * 100);
  const cWeightPct = 100 - qWeightPct;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Cpu size={16} className="text-teal-400" /> Pipeline Configuration
        </h3>
        <span className="text-[11px] font-mono text-teal-400 font-semibold">6 Simulators Ready</span>
      </div>

      {/* Mode selection radio cards */}
      <div className="space-y-2" role="radiogroup" aria-label="Pipeline execution mode">
        {modes.map((m) => {
          const isSelected = mode === m.id;
          const Icon = m.icon;

          return (
            <div
              key={m.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onModeChange(m.id)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  onModeChange(m.id);
                }
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                isSelected
                  ? `${m.borderActive} ${m.bgActive} ${m.shadowActive}`
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-teal-400 bg-teal-500/20'
                        : 'border-slate-700'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    )}
                  </div>
                  <Icon
                    size={16}
                    className={isSelected ? 'text-teal-400' : 'text-slate-400'}
                  />
                  <span className="text-xs font-semibold text-slate-200">{m.label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {m.tag}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 ml-6">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Hybrid Weighting Slider (Visible when mode === 'hybrid') */}
      {mode === 'hybrid' && onQuantumWeightChange && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-slate-950/70 border border-teal-500/30 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles size={14} className="text-teal-400" />
              <span>Hybrid Prediction Ratio:</span>
            </div>
            <span className="text-xs font-mono font-bold text-teal-300">
              {cWeightPct}% Classic • {qWeightPct}% Quantum
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={qWeightPct}
            onChange={(e) => onQuantumWeightChange(Number(e.target.value) / 100)}
            className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          {/* Dual-color bar */}
          <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-800">
            <div
              style={{ width: `${cWeightPct}%` }}
              className="bg-indigo-500 transition-all duration-200"
              title={`Classical weight: ${cWeightPct}%`}
            />
            <div
              style={{ width: `${qWeightPct}%` }}
              className="bg-teal-400 transition-all duration-200"
              title={`Quantum weight: ${qWeightPct}%`}
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {[
              { q: 0.40, label: '40/60 Standard' },
              { q: 0.50, label: '50/50 Equal' },
              { q: 0.70, label: '70/30 Quantum' },
              { q: 0.20, label: '20/80 Classic' },
            ].map((p) => (
              <button
                key={p.q}
                type="button"
                onClick={() => onQuantumWeightChange(p.q)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  Math.abs(quantumWeight - p.q) < 0.02
                    ? 'bg-teal-500/30 text-teal-200 font-bold border border-teal-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quantum Simulator Backend Selection */}
      {(mode === 'hybrid' || mode === 'quantum') && onQuantumBackendChange && (
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="quantum-backend-select" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Atom size={14} className="text-cyan-400" />
              <span>Quantum Simulator:</span>
            </label>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              Active Simulation
            </span>
          </div>

          <select
            id="quantum-backend-select"
            value={quantumBackend}
            onChange={(e) => onQuantumBackendChange(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg p-2 font-mono focus:outline-none focus:border-cyan-500"
          >
            {QUANTUM_SIMULATORS.map((sim) => (
              <option key={sim.id} value={sim.id}>
                {sim.label} [{sim.tag}]
              </option>
            ))}
          </select>

          <p className="text-[10px] text-slate-400 leading-tight">
            {QUANTUM_SIMULATORS.find((s) => s.id === quantumBackend)?.desc || 'Universal quantum circuit simulator'}
          </p>
        </div>
      )}

      {/* Execute button */}
      <motion.button
        type="button"
        onClick={onExecute}
        disabled={isLoading}
        whileHover={isLoading ? {} : { scale: 1.01 }}
        whileTap={isLoading ? {} : { scale: 0.99 }}
        className="w-full group cursor-pointer disabled:cursor-not-allowed"
      >
        <div className="relative w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-sm transition-colors overflow-hidden disabled:opacity-50">
          {isLoading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Atom size={18} />
              </motion.div>
              <span>Simulating Quantum Pipeline...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Execute Disease Analysis</span>
              <Sparkles size={14} className="text-teal-200 opacity-80" />
            </>
          )}
        </div>
      </motion.button>

      {/* Inline Error and Simulated Preview Action */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2.5"
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-semibold text-rose-200 block mb-0.5">Execution Failed</span>
              <span className="text-rose-300/90 text-[11px] line-clamp-3">{errorMessage}</span>
            </div>
          </div>
          {onSimulatedPreview && (
            <button
              type="button"
              onClick={onSimulatedPreview}
              className="w-full py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Launch Simulated Demonstration Preview</span>
            </button>
          )}
        </motion.div>
      )}

      {/* Live pipeline trace during execution */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/90 rounded-xl border border-teal-500/30 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-teal-400 mb-2">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-2 h-2 rounded-full bg-teal-400"
                />
                Live Execution Trace
              </div>
              <ProcessingPipeline steps={pipelineSteps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
