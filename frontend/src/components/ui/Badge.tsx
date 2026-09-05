import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'low' | 'moderate' | 'high' | 'very_high' | 'classical' | 'quantum' | 'hybrid' | 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border',
          {
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30': variant === 'low' || variant === 'success',
            'bg-amber-500/15 text-amber-300 border-amber-500/30': variant === 'moderate' || variant === 'warning',
            'bg-orange-500/15 text-orange-300 border-orange-500/30': variant === 'high',
            'bg-rose-500/15 text-rose-300 border-rose-500/30': variant === 'very_high' || variant === 'danger',
            'bg-sky-500/15 text-sky-300 border-sky-500/30': variant === 'classical' || variant === 'info',
            'bg-teal-500/15 text-teal-300 border-teal-500/30': variant === 'quantum',
            'bg-cyan-500/15 text-cyan-300 border-cyan-500/30': variant === 'hybrid',
            'bg-slate-800/90 text-slate-200 border-slate-700': variant === 'default',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
