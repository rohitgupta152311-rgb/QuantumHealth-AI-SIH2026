import React from 'react';
import { Activity, HeartPulse, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { DiseaseInfo } from '../../types';
import { diseaseConfigs } from './diseaseConfig';

interface DiseaseSelectorProps {
  diseases: DiseaseInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const icons: Record<string, React.ReactNode> = {
  heart: <HeartPulse size={20} className="text-rose-400" />,
  breast_cancer: <ShieldAlert size={20} className="text-amber-400" />,
  diabetes: <Activity size={20} className="text-teal-400" />,
};

export const DiseaseSelector: React.FC<DiseaseSelectorProps> = ({ diseases, selectedId, onSelect }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Select Clinical Diagnostic Module
        </span>
        <span className="text-xs text-slate-500 font-mono">
          {diseases.length} Supported Models
        </span>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        role="tablist"
        aria-label="Disease prediction modules"
      >
        {diseases.map((disease) => {
          const isSelected = disease.id === selectedId;
          const config = diseaseConfigs[disease.id];
          const icon = icons[disease.id] || <Activity size={20} className="text-teal-400" />;

          return (
            <button
              key={disease.id}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => onSelect(disease.id)}
              className={`text-left rounded-xl p-4 border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-slate-900 border-teal-500 shadow-sm ring-1 ring-teal-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-slate-800' : 'bg-slate-950 border border-slate-800'}`}>
                    {icon}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {config?.name || disease.name}
                    </h3>
                    <span className="text-[11px] text-teal-400 font-medium block">
                      {config?.specialty || 'Biomedical Diagnostic'}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <span className="text-teal-400 flex items-center gap-1 text-[11px] font-semibold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
                    <CheckCircle2 size={12} /> Active
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                {config?.clinicalFocus || disease.description}
              </p>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Cohort: {config?.cohort || `${disease.dataset_size || 500}+ Patients`}</span>
                <span className="text-slate-300 font-semibold">6-Qubit VQC</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
