import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ModelMetrics } from '../../types';

export const ROCCurveChart: React.FC<{ models: ModelMetrics[] }> = ({ models }) => {
  // Simulate ROC curve points based on AUC
  const generateCurve = (auc: number) => {
    const points = [];
    for (let i = 0; i <= 10; i++) {
      const fpr = i / 10;
      // Simple math hack to generate a curve roughly matching AUC
      const tpr = Math.min(1, Math.pow(fpr, (1 - auc) / auc));
      points.push({ fpr, tpr });
    }
    return points;
  };

  const curves = models.map(m => ({ name: m.name, points: generateCurve(m.auc) }));
  
  const data = Array.from({ length: 11 }, (_, i) => {
    const fpr = i / 10;
    const row: any = { fpr, baseline: fpr };
    curves.forEach(c => {
      row[c.name] = c.points[i].tpr;
    });
    return row;
  });

  const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: '#9ca3af' }} label={{ value: 'False Positive Rate', position: 'bottom', fill: '#9ca3af' }} />
          <YAxis type="number" domain={[0, 1]} tick={{ fill: '#9ca3af' }} label={{ value: 'True Positive Rate', angle: -90, position: 'left', fill: '#9ca3af' }} />
          <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }} />
          <Legend verticalAlign="top" height={36}/>
          <Line type="monotone" dataKey="baseline" stroke="#6b7280" strokeDasharray="5 5" dot={false} name="Random Guess" />
          {models.map((m, i) => (
            <Line key={m.name} type="monotone" dataKey={m.name} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
