import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ModelMetrics } from '../../types';

export const ROCCurveChart: React.FC<{ models: ModelMetrics[] }> = ({ models }) => {
  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'];
  const data = models.map((model) => ({
    name: model.name,
    auc: model.auc,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} interval={0} />
          <YAxis domain={[0, 1]} tick={{ fill: '#9ca3af' }} label={{ value: 'ROC-AUC', angle: -90, position: 'left', fill: '#9ca3af' }} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
          <Bar dataKey="auc" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
