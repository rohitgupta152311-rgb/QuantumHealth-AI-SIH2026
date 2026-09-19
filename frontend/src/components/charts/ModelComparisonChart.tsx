import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface ModelComparisonChartProps {
  classicalResults: Array<{
    model?: string;
    model_name?: string;
    risk_probability: number;
    confidence?: number;
  }>;
  quantumResult?: {
    risk_probability: number;
  };
  hybridResult?: {
    risk_probability: number;
  };
}

export const ModelComparisonChart: React.FC<ModelComparisonChartProps> = ({
  classicalResults,
  quantumResult,
  hybridResult
}) => {
  const data = classicalResults.map((r) => ({
    name: r.model || r.model_name || 'Classical',
    probability: r.risk_probability * 100,
    type: 'classical'
  }));

  if (quantumResult) {
    data.push({
      name: 'Quantum VQC',
      probability: quantumResult.risk_probability * 100,
      type: 'quantum'
    });
  }

  if (hybridResult) {
    data.push({
      name: 'Hybrid Consensus',
      probability: hybridResult.risk_probability * 100,
      type: 'hybrid'
    });
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'classical': return '#4f46e5';
      case 'quantum': return '#7c3aed';
      case 'hybrid': return '#10b981';
      default: return '#4f46e5';
    }
  };

  if (data.length === 0) return null;

  return (
    <div className="h-[300px] w-full">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
        Model Risk Probability Comparison
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#4b5563' }} angle={-45} textAnchor="end" height={60} />
          <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#4b5563' }} tickFormatter={(val) => `${val}%`} />
          <Tooltip
            cursor={{ fill: '#374151', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6' }}
            formatter={(val: number) => [`${val.toFixed(1)}%`, 'Probability']}
          />
          <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: '50% Threshold', fill: '#ef4444', fontSize: 10 }} />
          <Bar dataKey="probability" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
