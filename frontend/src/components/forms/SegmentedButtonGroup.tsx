import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface SegmentedOption {
  label: string;
  value: number;
  description?: string;
}

export interface SegmentedButtonGroupProps {
  name: string;
  label: string;
  value: number;
  options: SegmentedOption[];
  description?: string;
  unit?: string | null;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export const SegmentedButtonGroup: React.FC<SegmentedButtonGroupProps> = ({
  name,
  label,
  value,
  options,
  description,
  unit,
  disabled = false,
  onChange,
}) => {
  return (
    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700/80 transition-colors space-y-2.5">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-xs font-semibold text-slate-200 block">
            {label || name}
          </label>
          {description && (
            <p className="text-[11px] text-slate-400 mt-0.5" title={description}>
              {description}
            </p>
          )}
        </div>
        {unit && (
          <span className="text-[11px] text-slate-400 font-mono flex-shrink-0">{unit}</span>
        )}
      </div>

      {/* Segmented Options Grid */}
      <div
        role="radiogroup"
        aria-label={label || name}
        className={clsx(
          'grid gap-1.5',
          options.length <= 2 ? 'grid-cols-2' : options.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 sm:grid-cols-5'
        )}
      >
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={clsx(
                'relative flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                isSelected
                  ? 'bg-teal-950/50 border-teal-500 text-teal-200 font-semibold shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200 hover:border-slate-700'
              )}
            >
              <span className="truncate leading-tight">{option.label}</span>
              {isSelected ? (
                <Check size={13} className="text-teal-400 flex-shrink-0" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
