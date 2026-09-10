import React from 'react';
import { clsx,type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'quantum';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          {
            'bg-teal-600 text-white hover:bg-teal-500 shadow-sm shadow-teal-900/20 focus-visible:ring-teal-500': variant === 'primary',
            'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/80 focus-visible:ring-slate-400': variant === 'secondary',
            'bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white': variant === 'ghost',
            'bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-rose-500': variant === 'danger',
            'border border-slate-700 hover:border-teal-500/50 bg-slate-900/60 text-slate-200 hover:bg-slate-800/80 hover:text-white': variant === 'outline',
            'bg-teal-700 text-teal-100 hover:bg-teal-600 border border-teal-500/30 shadow-sm focus-visible:ring-teal-400': variant === 'quantum',
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base font-semibold': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = 'Button';
