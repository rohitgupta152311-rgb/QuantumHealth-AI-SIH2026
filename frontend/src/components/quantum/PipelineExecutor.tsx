import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Cpu, Atom, Layers, Sparkles } from 'lucide-react';
import { ProcessingPipeline } from '../quantum/ProcessingPipeline';

interface PipelineExecutorProps {
  mode: 'hybrid' | 'classical' | 'quantum';
  onModeChange: (mode: 'hybrid' | 'classical' | 'quantum') => void;
  onExecute: () => void;
  isLoading: boolean;
}

const modes = [
  {
    id: 'hybrid' as const,
    label: 'Hybrid Mode',
    tag: 'Recommended',
    desc: '60% Classical Ensemble + 40% VQC',
    icon: Layers,
    color: 'indigo',
    borderActive: 'border-indigo-500',
    bgActive: 'bg-indigo-950/40',
    shadowActive: 'shadow-[0_0_14px_rgba(99,102,241,0.15)]',
  },
  {
    id: 'quantum' as const,
    label: 'Quantum Only',
    tag: 'VQC',
    desc: 'PennyLane Variational Circuit',
    icon: Atom,
    color: 'purple',
    borderActive: 'border-purple-500',
    bgActive: 'bg-purple-950/40',
    shadowActive: 'shadow-[0_0_14px_rgba(168,85,247,0.15)]',
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
    shadowActive: 'shadow-[0_0_14px_rgba(56,189,248,0.15)]',
  },
];

const pipelineSteps = [
  { step: 1, name: 'Data Cleaning & Imputation', status: 'completed' as const },
  { step: 2, name: 'Feature Scaling & Selection', status: 'completed' as const },
  { step: 3, name: 'Classical Ensemble Inference', status: 'completed' as const },
  { step: 4, name: 'Quantum Angle Encoding', status: 'in_progress' as const },
  { step: 5, name: 'VQC Circuit Simulation', status: 'in_progress' as const },
  { step: 6, name: 'Consensus Aggregation', status: 'pending' as const },
];

export const PipelineExecutor: React.FC<PipelineExecutorProps> = ({
  mode,
  onModeChange,
  onExecute,
  isLoading,
}) => {
  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2 mb-3">
          <Cpu size={15} className="text-indigo-400" /> Pipeline Mode
        </h3>
        {modes.map((m, i) => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <motion.button
              key={m.id}
              type="button"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 22 }}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onModeChange(m.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 ${
                isActive
                  ? `${m.borderActive} ${m.bgActive} ${m.shadowActive} text-white`
                  : 'border-gray-800 hover:bg-gray-800/40 text-gray-400'
              }`}
            >
              {/* Radio dot */}
              <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                isActive ? `border-${m.color}-400` : 'border-gray-600'
              }`}>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className={`w-2 h-2 rounded-full bg-${m.color}-400`}
                    />
                  )}
                </AnimatePresence>
              </div>

              <Icon size={16} className={isActive ? `text-${m.color}-400` : 'text-gray-500'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{m.label}</span>
                  {m.tag === 'Recommended' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      ★ {m.tag}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500">{m.desc}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Execute button */}
      <motion.button
        type="button"
        onClick={onExecute}
        disabled={isLoading}
        whileHover={isLoading ? {} : { scale: 1.02, y: -1 }}
        whileTap={isLoading ? {} : { scale: 0.98 }}
        className="gradient-border w-full group"
      >
        <div className="relative w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-[1.15rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_rgba(99,102,241,0.6)] transition-shadow overflow-hidden">
          {/* Shine sweep */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </div>

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
              <Sparkles size={14} className="text-yellow-300 opacity-70" />
            </>
          )}
        </div>
      </motion.button>

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
            <div className="bg-gray-950 rounded-2xl border border-indigo-500/30 p-4">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-indigo-400 mb-2">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-2 h-2 rounded-full bg-indigo-400"
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
