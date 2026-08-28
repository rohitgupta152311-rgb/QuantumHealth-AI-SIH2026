import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'low' | 'moderate' | 'high' | 'very_high' | 'classical' | 'quantum' | 'hybrid' | 'default';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
          {
            'bg-green-500/10 text-green-400': variant === 'low',
            'bg-yellow-500/10 text-yellow-400': variant === 'moderate',
            'bg-orange-500/10 text-orange-400': variant === 'high',
            'bg-red-500/10 text-red-400': variant === 'very_high',
            'bg-blue-500/10 text-blue-400': variant === 'classical',
            'bg-purple-500/10 text-purple-400': variant === 'quantum',
            'bg-indigo-500/10 text-indigo-400': variant === 'hybrid',
            'bg-gray-800 text-gray-300': variant === 'default',
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
