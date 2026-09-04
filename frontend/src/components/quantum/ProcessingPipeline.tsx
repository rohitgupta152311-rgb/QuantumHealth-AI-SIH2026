import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Loader2, Atom } from 'lucide-react';
import type { ProcessingStep } from '../../types';

export const ProcessingPipeline: React.FC<{ steps: ProcessingStep[] }> = ({ steps }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    const iv = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= steps.length) {
          clearInterval(iv);
          return prev;
        }
        return prev + 1;
      });
    }, 350);
    return () => clearInterval(iv);
  }, [steps.length]);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedCount / Math.max(steps.length, 1)) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15 }}
        />
        <motion.div
          className="absolute inset-y-0 rounded-full bg-white/20 blur-sm"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 15, delay: 0.1 }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1 relative">
        {/* Vertical connector line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-gray-800/60 rounded-full" />

        <AnimatePresence>
          {steps.map((step, index) => {
            if (index >= visibleCount) return null;

            const isQuantum = step.name.toLowerCase().includes('quantum') ||
              step.name.toLowerCase().includes('vqc') ||
              step.name.toLowerCase().includes('angle');

            return (
              <motion.div
                key={`${step.step}-${step.name}`}
                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 22,
                }}
                className={`flex items-center gap-3 relative z-10 py-1.5 px-2 rounded-lg transition-colors ${
                  step.status === 'in_progress' ? 'bg-indigo-500/5' : ''
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 bg-gray-950 rounded-full">
                  {step.status === 'completed' && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <CheckCircle className="text-emerald-400" size={22} />
                    </motion.div>
                  )}
                  {step.status === 'in_progress' && (
                    <motion.div
                      animate={{ boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 12px rgba(99,102,241,0.5)', '0 0 0px rgba(99,102,241,0)'] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="rounded-full"
                    >
                      {isQuantum ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                          <Atom className="text-purple-400" size={22} />
                        </motion.div>
                      ) : (
                        <Loader2 className="text-indigo-400 animate-spin" size={22} />
                      )}
                    </motion.div>
                  )}
                  {step.status === 'pending' && (
                    <Circle className="text-gray-700" size={22} />
                  )}
                  {step.status === 'failed' && (
                    <Circle className="text-red-500" size={22} />
                  )}
                </div>

                {/* Step label */}
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium truncate block ${
                    step.status === 'in_progress'
                      ? isQuantum ? 'text-purple-300' : 'text-indigo-300'
                      : step.status === 'completed'
                        ? 'text-gray-300'
                        : 'text-gray-600'
                  }`}>
                    {step.name}
                  </span>
                </div>

                {/* Step number */}
                <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${
                  step.status === 'completed' ? 'text-emerald-500' : 'text-gray-600'
                }`}>
                  {step.status === 'completed' ? '✓' : `${step.step}`}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
