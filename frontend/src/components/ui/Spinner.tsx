import React from 'react';
import { Atom } from 'lucide-react';

export const Spinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Atom className="animate-spin-slow text-quantum-500" size={size} />
    </div>
  );
};
