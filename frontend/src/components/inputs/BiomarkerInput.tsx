import React from 'react';
import { motion } from 'framer-motion';
import type { FeatureInfo } from '../../types';

interface BiomarkerInputProps {
  feature: FeatureInfo;
  value: number;
  onChange: (name: string, value: number) => void;
}

/* ─── Helpers ──────────────────────────────────── */
const catLabel = (name: string, opt: number): string => {
  const map: Record<string, string[]> = {
    cp: ['Typical', 'Atypical', 'Non-Anginal', 'Asymptomatic'],
    thal: ['Normal', 'Fixed', 'Reversible', 'Other'],
    restecg: ['Normal', 'ST-T Abn', 'LV Hyper'],
    slope: ['Upsloping', 'Flat', 'Downsloping'],
  };
  return map[name.toLowerCase()]?.[opt] ?? `Grade ${opt}`;
};

/* ─── Sub-components ───────────────────────────── */

const SexToggle: React.FC<BiomarkerInputProps> = ({ feature, value, onChange }) => (
  <Wrapper label={feature.label || 'Biological Sex'} badge={value === 1 ? 'Male' : 'Female'} badgeColor="indigo">
    <div className="grid grid-cols-2 gap-2">
      {[{ v: 0, icon: '♀', label: 'Female', color: 'fuchsia' }, { v: 1, icon: '♂', label: 'Male', color: 'indigo' }].map(
        (opt) => (
          <motion.button
            key={opt.v}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(feature.name, opt.v)}
            className={`py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 ${
              value === opt.v
                ? `bg-${opt.color}-500/20 text-${opt.color}-300 border-${opt.color}-500/50 shadow-[0_0_14px_rgba(var(--glow),0.3)]`
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
            }`}
            style={{ '--glow': opt.color === 'fuchsia' ? '217,70,239' : '99,102,241' } as React.CSSProperties}
          >
            {opt.icon} {opt.label}
          </motion.button>
        ),
      )}
    </div>
  </Wrapper>
);

const BinaryToggle: React.FC<BiomarkerInputProps> = ({ feature, value, onChange }) => (
  <Wrapper
    label={feature.label || feature.name}
    badge={value === 1 ? 'Yes' : 'No'}
    badgeColor={value === 1 ? 'rose' : 'emerald'}
  >
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(feature.name, value === 1 ? 0 : 1)}
        className="relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none"
        style={{ background: value === 1 ? 'rgba(244,63,94,0.35)' : 'rgba(75,85,99,0.5)' }}
      >
        <motion.div
          className="absolute top-0.5 w-6 h-6 rounded-full shadow-lg"
          animate={{ left: value === 1 ? '1.75rem' : '0.125rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          style={{
            background: value === 1
              ? 'linear-gradient(135deg, #f43f5e, #fb7185)'
              : 'linear-gradient(135deg, #6b7280, #9ca3af)',
            boxShadow: value === 1 ? '0 0 12px rgba(244,63,94,0.5)' : 'none',
          }}
        />
      </button>
      <span className={`text-xs font-semibold ${value === 1 ? 'text-rose-300' : 'text-gray-400'}`}>
        {value === 1 ? 'Positive / Elevated' : 'Negative / Normal'}
      </span>
    </div>
  </Wrapper>
);

const CategorySelector: React.FC<BiomarkerInputProps> = ({ feature, value, onChange }) => {
  const min = feature.min_val ?? feature.min ?? 0;
  const max = feature.max_val ?? feature.max ?? 3;
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <Wrapper label={feature.label || feature.name} badge={`${catLabel(feature.name, value)} (${value})`} badgeColor="indigo">
      <div className={`grid gap-1.5 ${options.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {options.map((opt) => (
          <motion.button
            key={opt}
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(feature.name, opt)}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition-all duration-200 truncate ${
              value === opt
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                : 'bg-gray-900/90 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-300'
            }`}
          >
            {catLabel(feature.name, opt)}
          </motion.button>
        ))}
      </div>
    </Wrapper>
  );
};

const ContinuousSlider: React.FC<BiomarkerInputProps> = ({ feature, value, onChange }) => {
  const min = feature.min_val ?? feature.min ?? 0;
  const max = feature.max_val ?? feature.max ?? 100;
  const nameLower = feature.name.toLowerCase();

  const isInt = Number.isInteger(min) && Number.isInteger(max) && (max - min) >= 2;
  let step = 1;
  if (nameLower === 'sg') step = 0.005;
  else if (['sc', 'pot', 'oldpeak'].includes(nameLower)) step = 0.1;
  else if (!isInt) step = (max - min) > 20 ? 0.5 : 0.01;

  const ratio = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const trackColor =
    ratio < 0.35 ? 'from-emerald-500 to-emerald-400'
      : ratio < 0.65 ? 'from-emerald-400 via-yellow-400 to-yellow-500'
        : 'from-yellow-500 via-orange-500 to-rose-500';

  return (
    <Wrapper label={feature.label || feature.name} badgeColor="indigo">
      <div className="flex items-center justify-between mb-2">
        <motion.input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            if (!isNaN(num)) onChange(feature.name, isInt ? Math.round(num) : num);
          }}
          className="w-24 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-sm text-right font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
        {feature.unit && <span className="text-[10px] text-gray-500 font-mono ml-1.5">{feature.unit}</span>}
      </div>

      {/* Animated gradient slider */}
      <div className="relative h-2 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${trackColor}`}
          initial={false}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const num = parseFloat(e.target.value);
            onChange(feature.name, isInt ? Math.round(num) : num);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        {/* Thumb indicator */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.5)] pointer-events-none"
          initial={false}
          animate={{ left: `calc(${ratio * 100}% - 8px)` }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      </div>

      <div className="flex justify-between items-center mt-1.5 text-[10px] text-gray-500 font-mono">
        <span>{min}</span>
        <motion.span
          key={ratio > 0.7 ? 'elevated' : 'normal'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={ratio > 0.7 ? 'text-rose-400 font-semibold' : 'text-emerald-400/80'}
        >
          {ratio > 0.7 ? '⚠ Elevated' : '✓ Normal'}
        </motion.span>
        <span>{max}</span>
      </div>
    </Wrapper>
  );
};

/* ─── Shared card wrapper ──────────────────────── */
const Wrapper: React.FC<{
  label: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}> = ({ label, badge, badgeColor = 'indigo', children }) => (
  <motion.div
    whileHover={{ scale: 1.015, y: -2 }}
    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    className="bg-gray-950/70 p-4 rounded-2xl border border-gray-800/80 hover:border-gray-700 transition-colors space-y-3"
  >
    <div className="flex justify-between items-center">
      <label className="text-xs font-semibold text-gray-200">{label}</label>
      {badge && (
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-${badgeColor}-500/10 text-${badgeColor}-300 border border-${badgeColor}-500/20`}>
          {badge}
        </span>
      )}
    </div>
    {children}
  </motion.div>
);

/* ─── Main export ──────────────────────────────── */
export const BiomarkerInput: React.FC<BiomarkerInputProps> = (props) => {
  const { feature, value } = props;
  const min = feature.min_val ?? feature.min ?? 0;
  const max = feature.max_val ?? feature.max ?? 100;
  const nameLower = feature.name.toLowerCase();

  // 1. Sex / Gender
  if (nameLower === 'sex' || nameLower === 'gender') return <SexToggle {...props} />;

  // 2. Binary flags (0/1)
  if (min === 0 && max === 1) return <BinaryToggle {...props} />;

  // 3. Small categorical (0-5 integer)
  if (min === 0 && max <= 5 && Number.isInteger(max)) return <CategorySelector {...props} />;

  // 4. Continuous / numerical
  return <ContinuousSlider {...props} />;
};
