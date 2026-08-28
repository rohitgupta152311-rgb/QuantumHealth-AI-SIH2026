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
  color = 'bg-quantum-500',
  showPercentage = true,
}) => {
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="mb-1 flex justify-between items-center text-sm">
          {label && <span className="text-gray-300">{label}</span>}
          {showPercentage && <span className="text-gray-400">{Math.round(value)}%</span>}
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
