import React from 'react';
import { Activity, HeartPulse, ShieldAlert, Droplets, type LucideIcon } from 'lucide-react';
import type { DiseaseInfo } from '../../types';

interface DiseaseSelectorProps {
  diseases: DiseaseInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const iconMap: Record<string, LucideIcon> = {
  diabetes: Activity,
  heart: HeartPulse,
  breast_cancer: ShieldAlert,
  kidney: Droplets,
};

const colorMap: Record<string, { gradient: string; glow: string; border: string }> = {
  diabetes: {
    gradient: 'from-blue-500 to-indigo-600',
    glow: 'shadow-[0_0_25px_rgba(99,102,241,0.35)]',
    border: 'border-indigo-500/60',
  },
  heart: {
    gradient: 'from-rose-500 to-pink-600',
    glow: 'shadow-[0_0_25px_rgba(244,63,94,0.35)]',
    border: 'border-rose-500/60',
  },
  breast_cancer: {
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-[0_0_25px_rgba(168,85,247,0.35)]',
    border: 'border-purple-500/60',
  },
  kidney: {
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-[0_0_25px_rgba(16,185,129,0.35)]',
    border: 'border-emerald-500/60',
  },
};

export const DiseaseSelector: React.FC<DiseaseSelectorProps> = ({ diseases, selectedId, onSelect }) => {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {diseases.map((disease) => {
        const isSelected = disease.id === selectedId;
        const Icon = iconMap[disease.id] || Activity;
        const colors = colorMap[disease.id] || colorMap.diabetes;

        return (
          <button
            type="button"
            aria-label={disease.name}
            aria-pressed={isSelected}
            key={disease.id}
            onClick={() => onSelect(disease.id)}
            className={`relative text-left cursor-pointer rounded-2xl p-5 border-2 transition-none overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-400 ${
              isSelected
                ? `${colors.border} ${colors.glow} bg-gray-900/80`
                : 'border-gray-800/80 bg-gray-950/60 hover:border-gray-700'
            }`}
          >
            {/* Active gradient glow background */}
            {isSelected && (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-[0.07] rounded-2xl`}
              />
            )}

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2.5 rounded-xl ${
                    isSelected ? `bg-gradient-to-br ${colors.gradient} text-white` : 'bg-white/[0.03] text-gray-500'
                  }`}
                >
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {disease.name}
                  </h3>
                  <span className="text-[10px] font-mono text-gray-500">
                    {((disease.dataset_size || 0) / 1000).toFixed(0)}K records
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                {disease.description}
              </p>

              {/* Reserve the indicator's space so selecting a card does not shift the layout. */}
              <div className="mt-3 flex h-4 items-center gap-1.5">
                {isSelected && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Selected</span>
                  </>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
