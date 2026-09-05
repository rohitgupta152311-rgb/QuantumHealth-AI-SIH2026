import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  color?: string; // Tailwind color class e.g. 'bg-quantum-500'
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  color = 'bg-teal-500',
  showPercentage = true,
}) => {
  const safeVal = Math.min(Math.max(value, 0), 100);
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-1 flex justify-between items-center text-xs font-medium">
          {label && <span className="text-slate-300">{label}</span>}
          {showPercentage && <span className="text-slate-400 font-mono">{Math.round(safeVal)}%</span>}
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={Math.round(safeVal)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${safeVal}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
