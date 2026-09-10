import React from 'react';

export const ParticleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Subtle Clinical Slate Grid */}
      <div className="absolute inset-0 quantum-grid opacity-75" />

      {/* Very subtle ambient teal radial glow in header and corners */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-teal-500/[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-slate-700/[0.05] rounded-full blur-[120px]" />
    </div>
  );
};
