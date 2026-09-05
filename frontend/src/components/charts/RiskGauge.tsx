import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface RiskGaugeProps {
  percentage: number;
  riskLevel: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ percentage, riskLevel }) => {
  const clampedPercent = Math.min(Math.max(percentage, 0), 100);

  const getRiskColor = (level: string, pct: number) => {
    if (pct < 25) return '#10b981'; // emerald-500
    if (pct < 50) return '#f59e0b'; // amber-500
    if (pct < 75) return '#f97316'; // orange-500
    return '#ef4444'; // rose-500
  };

  const color = getRiskColor(riskLevel, clampedPercent);

  const data = [
    { name: 'Risk Score', value: clampedPercent },
    { name: 'Residual', value: 100 - clampedPercent }
  ];

  return (
    <div className="relative h-48 w-48 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="55%"
            startAngle={195}
            endAngle={-15}
            innerRadius={62}
            outerRadius={82}
            paddingAngle={2}
            dataKey="value"
            stroke="#0f172a"
            strokeWidth={2}
          >
            <Cell fill={color} />
            <Cell fill="#1e293b" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="absolute flex flex-col items-center justify-center text-center mt-2">
        <span className="text-3xl font-bold font-mono tracking-tight text-white">
          {Math.round(clampedPercent)}%
        </span>
        <span
          className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 border"
          style={{
            color: color,
            borderColor: `${color}40`,
            backgroundColor: `${color}15`,
          }}
        >
          {riskLevel.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};
