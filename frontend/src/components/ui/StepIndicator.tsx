import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface StepItem {
  step: number;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const STEPS: StepItem[] = [
  { step: 1, title: 'Select Disease', description: 'Choose clinical cohort' },
  { step: 2, title: 'Enter Patient Data', description: 'Input biomarker values' },
  { step: 3, title: 'View Result', description: 'Quantum-classical synthesis' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  return (
    <nav aria-label="Progress" className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 sm:p-4">
      <ol className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {STEPS.map((s, idx) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isClickable = onStepClick && (isCompleted || s.step <= currentStep);

          return (
            <li
              key={s.step}
              className={clsx(
                'flex-1 flex items-center gap-3 w-full',
                idx < STEPS.length - 1 && 'sm:after:content-[""] sm:after:flex-1 sm:after:h-[1px] sm:after:bg-slate-800 sm:after:mx-2'
              )}
            >
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick && onStepClick(s.step)}
                className={clsx(
                  'flex items-center gap-2.5 text-left focus:outline-none rounded-lg p-1 transition-colors',
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                )}
              >
                <span
                  className={clsx(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 flex-shrink-0',
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : isCurrent
                      ? 'bg-teal-500 text-slate-950 ring-4 ring-teal-500/20 font-bold'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  )}
                >
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : s.step}
                </span>

                <div className="flex flex-col min-w-0">
                  <span
                    className={clsx(
                      'text-xs font-semibold leading-tight truncate',
                      isCurrent ? 'text-teal-300' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                    )}
                  >
                    {s.title}
                  </span>
                  {s.description && (
                    <span className="text-[10px] text-slate-400 hidden md:block">
                      {s.description}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
