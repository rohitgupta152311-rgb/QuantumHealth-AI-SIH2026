import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}) => {
  const baseClass = 'bg-white/5 rounded animate-pulse';
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    );
  }

  const variantClasses = {
    text: 'h-4 w-full',
    circular: 'rounded-full',
    rectangular: '',
    card: 'h-48 w-full rounded-xl',
  };

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4 ${className}`}>
    <Skeleton variant="text" width="60%" height={20} />
    <Skeleton variant="text" lines={3} />
    <div className="flex gap-3 pt-2">
      <Skeleton width={80} height={32} className="rounded-lg" />
      <Skeleton width={80} height={32} className="rounded-lg" />
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/[0.03] border border-white/10 rounded-2xl p-6 ${className}`}>
    <Skeleton variant="text" width="40%" height={20} className="mb-4" />
    <div className="flex items-end gap-2 h-48">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          width="12%"
          height={`${30 + Math.random() * 70}%`}
          className="rounded-t-md"
        />
      ))}
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => (
  <div className={`bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden ${className}`}>
    <div className="grid gap-px bg-white/5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={`h-${i}`} className="bg-white/[0.05] p-3">
          <Skeleton variant="text" height={16} />
        </div>
      ))}
      {Array.from({ length: rows * cols }).map((_, i) => (
        <div key={`c-${i}`} className="bg-slate-900/50 p-3">
          <Skeleton variant="text" height={14} width={`${50 + Math.random() * 50}%`} />
        </div>
      ))}
    </div>
  </div>
);
