import React from 'react';
import { clsx,type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowing?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glowing, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl border border-slate-800 p-6 bg-slate-900/80 backdrop-blur-md transition-all duration-200 shadow-sm',
          glowing && 'border-teal-500/30 bg-slate-900 shadow-[0_0_15px_rgba(20,184,166,0.08)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
