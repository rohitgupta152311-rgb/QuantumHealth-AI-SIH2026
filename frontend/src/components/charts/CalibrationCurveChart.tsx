import React from 'react';
import type { ModelMetrics } from '../../types';

interface CalibrationCurveChartProps {
  models: ModelMetrics[];
}

const MODEL_COLORS: Record<string, string> = {
  'Hybrid QML (VQC + Ensemble)': '#a855f7',
  'RandomForest': '#3b82f6',
  'SVM': '#10b981',
  'LogisticRegression': '#f59e0b',
  'Variational Quantum Classifier (VQC)': '#ec4899',
};

export const CalibrationCurveChart: React.FC<CalibrationCurveChartProps> = ({ models }) => {
  const modelsWithCurves = models.filter(
    (m) => m.calibration_curve && m.calibration_curve.length > 0
  );

  const width = 360;
  const height = 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const toX = (val: number) => padding.left + val * plotW;
  const toY = (val: number) => padding.top + (1 - val) * plotH;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="font-mono">Observed Positive Fraction vs Predicted Risk</span>
        <span className="text-[11px] text-indigo-300 font-mono">Dashed = Perfectly Calibrated</span>
      </div>

      <div className="relative w-full flex justify-center bg-black/60 rounded-2xl p-3 border border-white/[0.06]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[420px] overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={toY(tick)}
                x2={width - padding.right}
                y2={toY(tick)}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 8}
                y={toY(tick)}
                fontSize="9"
                fontFamily="monospace"
                fill="#6b7280"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {tick.toFixed(2)}
              </text>

              <line
                x1={toX(tick)}
                y1={padding.top}
                x2={toX(tick)}
                y2={height - padding.bottom}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2,2"
              />
              <text
                x={toX(tick)}
                y={height - padding.bottom + 14}
                fontSize="9"
                fontFamily="monospace"
                fill="#6b7280"
                textAnchor="middle"
              >
                {tick.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Perfect Calibration Diagonal */}
          <line
            x1={toX(0)}
            y1={toY(0)}
            x2={toX(1)}
            y2={toY(1)}
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeDasharray="4,4"
            opacity={0.4}
          />

          {/* Model Calibration Curves */}
          {modelsWithCurves.map((m) => {
            const name = m.model_name || m.name || 'Model';
            const color = MODEL_COLORS[name] || '#6366f1';
            const pts = m.calibration_curve!;
            if (pts.length === 0) return null;

            const pathD = pts
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(p.predicted)} ${toY(p.observed)}`)
              .join(' ');

            return (
              <g key={name}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
                {pts.map((p, pIdx) => (
                  <circle
                    key={pIdx}
                    cx={toX(p.predicted)}
                    cy={toY(p.observed)}
                    r="3.5"
                    fill="#000000"
                    stroke={color}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padding.left + plotW / 2}
            y={height - 6}
            fontSize="10"
            fontFamily="monospace"
            fill="#9ca3af"
            textAnchor="middle"
          >
            Mean Predicted Probability
          </text>
          <text
            x={-height / 2 + 10}
            y={14}
            transform="rotate(-90)"
            fontSize="10"
            fontFamily="monospace"
            fill="#9ca3af"
            textAnchor="middle"
          >
            Observed Positive Fraction
          </text>
        </svg>
      </div>

      {/* Legend & Brier Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
        {modelsWithCurves.map((m) => {
          const name = m.model_name || m.name || 'Model';
          const color = MODEL_COLORS[name] || '#6366f1';
          return (
            <div
              key={name}
              className="bg-black/40 border border-white/[0.04] p-2 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-gray-300 truncate text-[11px]">{name}</span>
              </div>
              {m.brier_score !== undefined && (
                <span className="text-[10px] text-gray-500 shrink-0 font-mono ml-1.5" title="Brier Score (lower is better)">
                  Brier: <strong className="text-gray-300">{m.brier_score.toFixed(3)}</strong>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
