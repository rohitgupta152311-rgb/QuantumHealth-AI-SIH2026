import React from 'react';

interface ModelAgreementChartProps {
  classicalResults: Array<{
    model?: string;
    model_name?: string;
    risk_probability: number;
  }>;
  quantumProbability?: number;
  hybridProbability?: number;
  disagreementRange?: {
    lower: number;
    upper: number;
    spread: number;
    label: string;
  };
}

export const ModelAgreementChart: React.FC<ModelAgreementChartProps> = ({
  classicalResults,
  quantumProbability,
  hybridProbability,
  disagreementRange
}) => {
  const models = classicalResults.map(r => ({
    name: r.model || r.model_name || 'Classical',
    prob: r.risk_probability * 100,
    color: '#4f46e5' // indigo
  }));

  if (quantumProbability !== undefined) {
    models.push({
      name: 'Quantum',
      prob: quantumProbability * 100,
      color: '#7c3aed' // purple
    });
  }

  if (models.length === 0) return null;

  // If disagreement range isn't provided, calculate it
  let lower = disagreementRange?.lower !== undefined ? disagreementRange.lower * 100 : Math.min(...models.map(m => m.prob));
  let upper = disagreementRange?.upper !== undefined ? disagreementRange.upper * 100 : Math.max(...models.map(m => m.prob));
  let spread = disagreementRange?.spread !== undefined ? disagreementRange.spread * 100 : (upper - lower);

  const getSpreadColor = (s: number) => {
    if (s < 15) return 'rgba(16, 185, 129, 0.2)'; // emerald
    if (s < 30) return 'rgba(245, 158, 11, 0.2)'; // amber
    return 'rgba(244, 63, 94, 0.2)'; // rose
  };

  const getSpreadBorder = (s: number) => {
    if (s < 15) return '#10b981'; 
    if (s < 30) return '#f59e0b'; 
    return '#f43f5e'; 
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 text-center">
        Model Agreement Spectrum
      </div>
      <div className="relative w-full h-16 max-w-2xl mx-auto mb-8 mt-4 px-4">
        {/* Track */}
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-700 -translate-y-1/2 rounded" />
        
        {/* Spread Band */}
        <div 
          className="absolute top-1/2 h-4 -translate-y-1/2 rounded border"
          style={{ 
            left: `calc(1rem + ${lower}% * ((100% - 2rem) / 100))`, 
            width: `calc(${spread}% * ((100% - 2rem) / 100))`,
            backgroundColor: getSpreadColor(spread),
            borderColor: getSpreadBorder(spread)
          }}
        />

        {/* 50% Threshold Line */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-500/50 border-r border-dashed border-red-500/50"
          style={{ left: `calc(1rem + 50% * ((100% - 2rem) / 100))` }}
        />

        {/* Hybrid Consensus Line */}
        {hybridProbability !== undefined && (
          <div 
            className="absolute top-0 bottom-0 w-1 bg-emerald-500 rounded-full z-10 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
            style={{ 
              left: `calc(1rem + ${hybridProbability * 100}% * ((100% - 2rem) / 100))`, 
              transform: 'translateX(-50%)' 
            }}
          />
        )}

        {/* Model Dots */}
        {models.map((m, idx) => (
          <div 
            key={idx}
            className="absolute top-1/2 w-3 h-3 rounded-full border-2 border-slate-900 z-20 group cursor-pointer"
            style={{ 
              left: `calc(1rem + ${m.prob}% * ((100% - 2rem) / 100))`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: m.color
            }}
          >
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block whitespace-nowrap bg-slate-800 text-xs px-2 py-1 rounded shadow-lg z-30 pointer-events-none">
              {m.name}: {m.prob.toFixed(1)}%
            </div>
          </div>
        ))}
        
        {/* Axis Labels */}
        <div className="absolute top-full left-4 -translate-x-1/2 mt-2 text-[10px] text-slate-500">0%</div>
        <div className="absolute top-full left-[calc(1rem+50%*((100%-2rem)/100))] -translate-x-1/2 mt-2 text-[10px] text-red-500/70">50%</div>
        <div className="absolute top-full right-4 translate-x-1/2 mt-2 text-[10px] text-slate-500">100%</div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#4f46e5]" /> <span className="text-slate-400">Classical Models</span>
        </div>
        {quantumProbability !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#7c3aed]" /> <span className="text-slate-400">Quantum VQC</span>
          </div>
        )}
        {hybridProbability !== undefined && (
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3 rounded-full bg-[#10b981]" /> <span className="text-slate-400">Hybrid Consensus</span>
          </div>
        )}
      </div>
    </div>
  );
};
