import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export const RiskGauge: React.FC<{ percentage: number; riskLevel?: string }> = ({ percentage, riskLevel = 'low' }) => {
  const safePercentage = isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage));
  const data = [
    { name: 'Risk', value: safePercentage },
    { name: 'Safe', value: 100 - safePercentage }
  ];

  const getColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'high': return '#f97316';
      case 'very_high': return '#ef4444';
      default: return '#6366f1';
    }
  };

  const color = getColor(riskLevel);

  return (
    <div className="relative h-48 w-48 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#374151" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center text-center pb-8">
        <span className="text-3xl font-bold font-mono" style={{ color }}>{Math.round(safePercentage)}%</span>
        <span className="text-xs uppercase tracking-wider text-gray-400 mt-1">{(riskLevel || 'assessed').replace(/_/g, ' ')}</span>
      </div>
    </div>
  );
};
