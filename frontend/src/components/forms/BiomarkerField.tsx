import React from 'react';

interface BiomarkerFieldProps {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string | null;
  description?: string;
  referenceValue?: number | string;
  referenceRange?: string;
  onChange: (value: number) => void;
}

export const BiomarkerField: React.FC<BiomarkerFieldProps> = ({
  name,
  label,
  value,
  min,
  max,
  step,
  unit,
  description,
  referenceValue,
  referenceRange,
  onChange,
}) => {
  const calculatedStep = step ?? ((max - min) > 10 ? 1 : 0.01);
  
  // Calculate percentage within the dataset range [0, 100]
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));

  return (
    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors space-y-2.5">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <label htmlFor={`field-${name}`} className="text-xs font-semibold text-slate-200 block leading-snug">
            {label || name}
          </label>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5 leading-tight" title={description}>
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            id={`field-${name}`}
            type="number"
            min={min}
            max={max}
            step={calculatedStep}
            value={value}
            aria-label={`${label || name} numeric value`}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) {
                onChange(num);
              }
            }}
            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
          />
          {unit && (
            <span className="text-[11px] text-slate-400 font-mono font-medium min-w-[28px]">{unit}</span>
          )}
        </div>
      </div>

      {/* Synchronized Range Slider with Dataset Gradient Track */}
      <div className="space-y-1.5 pt-0.5">
        <div className="relative flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            step={calculatedStep}
            value={value}
            aria-label={`${label || name} range slider`}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-dataset-track accent-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Min, Reference, Max Metrics */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>Min: {min}</span>
          {referenceValue !== undefined ? (
            <span className="text-teal-400 font-sans font-medium">
              Reference (Median): {referenceValue} {unit || ''}
            </span>
          ) : referenceRange ? (
            <span className="text-slate-400 font-sans">Reference: {referenceRange}</span>
          ) : (
            <span className="text-slate-400 font-sans">Pos: {percentage.toFixed(0)}%</span>
          )}
          <span>Max: {max}</span>
        </div>

        {/* Range Disclaimer */}
        <div className="text-[10px] text-slate-400 italic text-right font-sans">
          Range indicator only; not a medical diagnosis.
        </div>
      </div>
    </div>
  );
};
