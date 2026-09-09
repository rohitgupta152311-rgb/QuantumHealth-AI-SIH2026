import React, { useMemo } from 'react';

export const ParticleBackground: React.FC = () => {
  const particles = useMemo(() => {
    const colors = [
      'rgba(99, 102, 241, 0.3)',
      'rgba(168, 85, 247, 0.25)',
      'rgba(56, 189, 248, 0.2)',
      'rgba(139, 92, 246, 0.2)',
      'rgba(236, 72, 153, 0.15)',
    ];
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      size: Math.random() * 2.5 + 0.5,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 15,
      color: colors[i % colors.length],
    }));
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Subtle Grid */}
      <div className="absolute inset-0 quantum-grid" />

      {/* Aurora Orbs — very subtle */}
      <div className="aurora-orb w-[800px] h-[800px] bg-indigo-600 top-[-15%] left-[5%]" style={{ animationDelay: '0s' }} />
      <div className="aurora-orb w-[600px] h-[600px] bg-purple-600 top-[40%] right-[-10%]" style={{ animationDelay: '8s' }} />
      <div className="aurora-orb w-[500px] h-[500px] bg-blue-600 bottom-[-15%] left-[35%]" style={{ animationDelay: '16s' }} />

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
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
