import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

interface PresetSelectorProps {
  activePreset: string | null;
  onSelect: (preset: 'healthy' | 'moderate' | 'high_risk') => void;
}

const presets = [
  {
    id: 'healthy' as const,
    label: 'Low Risk',
    sub: 'Healthy baseline values',
    icon: ShieldCheck,
    gradient: 'from-emerald-600 to-teal-500',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    dot: 'bg-emerald-400',
  },
  {
    id: 'moderate' as const,
    label: 'Moderate',
    sub: 'Borderline risk factors',
    icon: AlertTriangle,
    gradient: 'from-yellow-500 to-amber-500',
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-300',
    glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
    dot: 'bg-yellow-400',
  },
  {
    id: 'high_risk' as const,
    label: 'High Risk',
    sub: 'Elevated clinical markers',
    icon: Flame,
    gradient: 'from-rose-600 to-red-500',
    border: 'border-rose-500/50',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    dot: 'bg-rose-400',
  },
];

export const PresetSelector: React.FC<PresetSelectorProps> = ({ activePreset, onSelect }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {presets.map((p, i) => {
        const Icon = p.icon;
        const isActive = activePreset === p.id;

        return (
          <motion.button
            key={p.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 22 }}
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(p.id)}
            className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
              isActive
                ? `${p.border} ${p.bg} ${p.glow}`
                : 'border-gray-800 bg-gray-950/60 hover:border-gray-700'
            }`}
          >
            {/* Active glow orb background */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0.15 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={`absolute w-16 h-16 rounded-full bg-gradient-to-br ${p.gradient} blur-xl`}
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={isActive ? { rotate: [0, -8, 8, 0] } : {}}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className={`relative z-10 p-2 rounded-xl ${isActive ? p.bg : 'bg-gray-900'}`}
            >
              <Icon size={20} className={isActive ? p.text : 'text-gray-500'} />
            </motion.div>

            <div className="relative z-10 text-center">
              <div className={`text-xs font-bold ${isActive ? p.text : 'text-gray-400'}`}>
                {p.label}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">{p.sub}</div>
            </div>

            {/* Active indicator dot */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${p.dot}`}
                />
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
};
