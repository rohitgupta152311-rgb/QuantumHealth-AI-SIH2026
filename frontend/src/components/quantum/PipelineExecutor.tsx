import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Cpu, Atom, Layers, Sparkles, AlertCircle } from 'lucide-react';
import { ProcessingPipeline } from '../quantum/ProcessingPipeline';

interface PipelineExecutorProps {
  mode: 'hybrid' | 'classical' | 'quantum';
  onModeChange: (mode: 'hybrid' | 'classical' | 'quantum') => void;
  onExecute: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
  onSimulatedPreview?: () => void;
}

const modes = [
  {
    id: 'hybrid' as const,
    label: 'Hybrid Mode',
    tag: 'Recommended',
    desc: 'Saved classical–quantum ensemble',
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
    desc: 'RF + SVM + Logistic Regression',
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Cpu size={16} className="text-teal-400" /> Pipeline Mode
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Quantum Execution</span>
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
