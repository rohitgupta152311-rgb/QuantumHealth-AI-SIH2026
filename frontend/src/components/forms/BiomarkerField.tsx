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
  referenceRange?: string; // Only shown when verified configuration exists
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
  referenceRange,
  onChange,
}) => {
  const calculatedStep = step ?? ((max - min) > 10 ? 1 : 0.01);

  return (
    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <label htmlFor={`field-${name}`} className="text-xs font-semibold text-slate-200 block truncate">
            {label || name}
          </label>
          {description && (
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={description}>
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
            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right font-mono font-bold text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
          {unit && (
            <span className="text-[11px] text-slate-400 font-mono min-w-[24px]">{unit}</span>
          )}
        </div>
      </div>

      {/* Synchronized Range Slider */}
      <div className="pt-0.5">
        <input
          type="range"
          min={min}
          max={max}
          step={calculatedStep}
          value={value}
          aria-label={`${label || name} range slider`}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
        <span>Min: {min}</span>
        {referenceRange ? (
          <span className="text-slate-400 font-sans">Reference: {referenceRange}</span>
        ) : (
          <span className="text-slate-500">Scale: [{min} – {max}]</span>
        )}
        <span>Max: {max}</span>
      </div>
    </div>
  );
};
