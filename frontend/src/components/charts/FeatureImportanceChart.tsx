import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FeatureImportance } from '../../types';

export const FeatureImportanceChart: React.FC<{ features: FeatureImportance[] }> = ({ features }) => {
  const data = [...features].sort((a, b) => b.importance - a.importance).slice(0, 10);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
          <YAxis
            dataKey="feature"
            type="category"
            tick={{ fill: '#cbd5e1', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            width={110}
          />
          <Tooltip
            cursor={{ fill: '#1e293b' }}
            contentStyle={{ backgroundColor: '#0b1120', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            formatter={(val: number) => [val.toFixed(4), 'Sensitivity Weight']}
          />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#14b8a6' : index < 3 ? '#0d9488' : '#0f766e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
