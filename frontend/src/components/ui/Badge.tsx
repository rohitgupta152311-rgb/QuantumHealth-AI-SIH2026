import React from 'react';
import { clsx,type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'low' | 'moderate' | 'high' | 'very_high' | 'classical' | 'quantum' | 'hybrid' | 'default' | 'success' | 'danger' | 'warning' | 'info' | 'medical' | 'outline';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-transparent',
          {
            'bg-emerald-500/10 text-emerald-300 border-emerald-500/25': variant === 'low' || variant === 'success',
            'bg-amber-500/10 text-amber-300 border-amber-500/25': variant === 'moderate' || variant === 'warning',
            'bg-orange-500/10 text-orange-300 border-orange-500/25': variant === 'high',
            'bg-rose-500/10 text-rose-300 border-rose-500/25': variant === 'very_high' || variant === 'danger',
            'bg-sky-500/10 text-sky-300 border-sky-500/25': variant === 'classical',
            'bg-teal-500/10 text-teal-300 border-teal-500/25': variant === 'quantum',
            'bg-cyan-500/10 text-cyan-300 border-cyan-500/25': variant === 'hybrid' || variant === 'medical' || variant === 'info',
            'bg-transparent border-slate-700 text-slate-300': variant === 'outline',
            'bg-slate-800 text-slate-300 border-slate-700': variant === 'default',
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
