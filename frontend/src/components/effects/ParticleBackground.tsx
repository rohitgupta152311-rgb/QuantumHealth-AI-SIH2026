import React, { useMemo } from 'react';

export const ParticleBackground: React.FC = () => {
  const particles = useMemo(() => {
    const colors = [
      'rgba(129, 140, 248, 0.5)',
      'rgba(232, 121, 249, 0.4)',
      'rgba(56, 189, 248, 0.4)',
      'rgba(167, 139, 250, 0.35)',
      'rgba(244, 114, 182, 0.3)',
    ];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 12,
      delay: Math.random() * 12,
      color: colors[i % colors.length],
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Grid */}
      <div className="absolute inset-0 quantum-grid" />

      {/* Aurora Orbs */}
      <div className="aurora-orb w-[700px] h-[700px] bg-indigo-500 top-[-10%] left-[10%]" style={{ animationDelay: '0s' }} />
      <div className="aurora-orb w-[600px] h-[600px] bg-fuchsia-500 top-[30%] right-[-5%]" style={{ animationDelay: '5s' }} />
      <div className="aurora-orb w-[500px] h-[500px] bg-sky-500 bottom-[-10%] left-[30%]" style={{ animationDelay: '10s' }} />
      <div className="aurora-orb w-[400px] h-[400px] bg-violet-500 top-[60%] left-[-5%]" style={{ animationDelay: '15s' }} />

      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
