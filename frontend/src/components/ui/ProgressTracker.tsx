import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2,Loader2,Clock } from 'lucide-react';
import { TrainingProgress } from '../../types';

interface ProgressTrackerProps {
  progress: TrainingProgress;
}

const PIPELINE_STEPS = [
  'Data Loading',
  'Preprocessing',
  'Classical Training',
  'Quantum VQC',
  'Hybrid Ensemble',
  'Evaluation'
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ progress }) => {
  const currentStepIndex = PIPELINE_STEPS.indexOf(progress.stage) !== -1 
    ? PIPELINE_STEPS.indexOf(progress.stage) 
    : 0;

  return (
    <div className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Training Pipeline Progress</h3>
        {progress.elapsed_seconds !== undefined && (
          <div className="flex items-center text-slate-400 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            <span>{Math.floor(progress.elapsed_seconds / 60)}:{(progress.elapsed_seconds % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step} className="relative">
              {/* Connector Line */}
              {index < PIPELINE_STEPS.length - 1 && (
                <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-white/5">
                  <motion.div 
                    className="w-full bg-blue-500 origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`relative z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                  isCompleted ? 'bg-green-500/20 text-green-400' :
                  isCurrent ? 'bg-blue-500/20 text-blue-400' :
                  'bg-white/5 text-slate-500'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className={`font-medium ${isCurrent ? 'text-white' : 'text-slate-400'}`}>
                    {step}
                  </div>
                  
                  {isCurrent && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <div className="text-sm text-slate-400 mb-2">{progress.message}</div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
