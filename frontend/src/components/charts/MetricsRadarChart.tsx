import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { ModelMetrics } from '../../types';

export const MetricsRadarChart: React.FC<{ metrics: ModelMetrics[] }> = ({ metrics }) => {
  const data = ['accuracy', 'precision', 'recall', 'f1', 'auc'].map(metric => {
    const row: any = { subject: metric.toUpperCase() };
    metrics.forEach(m => {
      row[m.name] = (m as any)[metric];
    });
    return row;
  });

  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: '#6b7280' }} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
          <Legend />
          {metrics.map((m, i) => (
            <Radar
              key={m.name}
              name={m.name}
              dataKey={m.name}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.3}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
