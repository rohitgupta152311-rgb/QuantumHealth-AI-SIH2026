import React from 'react';
import { motion } from 'framer-motion';
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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 22 } },
};

export const DiseaseSelector: React.FC<DiseaseSelectorProps> = ({ diseases, selectedId, onSelect }) => {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {diseases.map((disease) => {
        const isSelected = disease.id === selectedId;
        const Icon = iconMap[disease.id] || Activity;
        const colors = colorMap[disease.id] || colorMap.diabetes;

        return (
          <motion.div
            key={disease.id}
            variants={item}
            whileHover={{
              scale: 1.03,
              y: -6,
              rotateX: 2,
              rotateY: -2,
              transition: { type: 'spring', stiffness: 300, damping: 20 },
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(disease.id)}
            className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all duration-300 overflow-hidden ${
              isSelected
                ? `${colors.border} ${colors.glow} bg-gray-900/80`
                : 'border-gray-800/80 bg-gray-950/60 hover:border-gray-700'
            }`}
            style={{ transformStyle: 'preserve-3d', perspective: '600px' }}
          >
            {/* Active gradient glow background */}
            {isSelected && (
              <motion.div
                layoutId="disease-active-bg"
                className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-[0.07] rounded-2xl`}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  className={`p-2.5 rounded-xl transition-colors duration-300 ${
                    isSelected ? `bg-gradient-to-br ${colors.gradient} text-white` : 'bg-gray-900 text-gray-500'
                  }`}
                  animate={isSelected ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                >
                  <Icon size={22} />
                </motion.div>
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

              {/* Active pill indicator */}
              {isSelected && (
                <motion.div
                  layoutId="disease-active-pill"
                  className="mt-3 flex items-center gap-1.5"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Selected</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
