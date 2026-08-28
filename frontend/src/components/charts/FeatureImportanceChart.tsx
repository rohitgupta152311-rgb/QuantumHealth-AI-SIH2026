import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FeatureImportance } from '../../types';

export const FeatureImportanceChart: React.FC<{ features: FeatureImportance[] }> = ({ features }) => {
  const data = [...features].sort((a, b) => b.importance - a.importance).slice(0, 10);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fill: '#9ca3af' }} axisLine={{ stroke: '#4b5563' }} />
          <YAxis dataKey="feature" type="category" tick={{ fill: '#e5e7eb', fontSize: 12 }} axisLine={{ stroke: '#4b5563' }} width={100} />
          <Tooltip
            cursor={{ fill: '#374151' }}
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
            formatter={(val: number) => [val.toFixed(4), 'Importance']}
          />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? '#8193f8' : '#4f46e5'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
