import React from 'react';
import { motion } from 'framer-motion';
import { Activity, HeartPulse, ShieldAlert } from 'lucide-react';
import type { DiseaseInfo } from '../../types';

interface DiseaseSelectorProps {
  diseases: DiseaseInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const DiseaseSelector: React.FC<DiseaseSelectorProps> = ({ diseases, selectedId, onSelect }) => {
  const icons: Record<string, React.ReactNode> = {
    diabetes: <Activity size={24} />,
    heart: <HeartPulse size={24} />,
    heart_disease: <HeartPulse size={24} />,
    breast_cancer: <ShieldAlert size={24} />,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {diseases.map((disease) => {
        const isSelected = disease.id === selectedId;
        return (
          <motion.div
            key={disease.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(disease.id)}
            className={`cursor-pointer rounded-xl p-5 border transition-all ${
              isSelected
                ? 'bg-quantum-900/40 border-quantum-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'bg-gray-900 border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className={`flex items-center gap-3 mb-2 ${isSelected ? 'text-quantum-400' : 'text-gray-400'}`}>
              {icons[disease.id] || <Activity size={24} />}
              <h3 className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                {disease.name}
              </h3>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">{disease.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
};
