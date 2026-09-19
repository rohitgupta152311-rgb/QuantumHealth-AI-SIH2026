import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface FeatureImpactChartProps {
  drivers: Array<{
    feature: string;
    label?: string;
    contribution: number;
    effect_on_model_score: string;
    input_value: number;
    unit?: string;
  }>;
}

export const FeatureImpactChart: React.FC<FeatureImpactChartProps> = ({ drivers }) => {
  if (!drivers || drivers.length === 0) return null;

  const data = drivers.map(d => {
    const isIncrease = d.effect_on_model_score.toLowerCase().includes('increase');
    const val = isIncrease ? Math.abs(d.contribution) : -Math.abs(d.contribution);
    return {
      name: d.label || d.feature,
      value: val * 100,
      rawValue: d.input_value,
      unit: d.unit || '',
      isIncrease
    };
  }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="h-[300px] w-full">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
        Biomarker Risk Impact Analysis
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={{ stroke: '#4b5563' }} tickFormatter={(val) => `${val > 0 ? '+' : ''}${val}%`} />
          <YAxis dataKey="name" type="category" tick={{ fill: '#e5e7eb', fontSize: 11 }} axisLine={{ stroke: '#4b5563' }} width={80} />
          <Tooltip
            cursor={{ fill: '#374151', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6', fontSize: '12px' }}
            formatter={(val: number, name: string, props: any) => {
              return [
                `${val > 0 ? '+' : ''}${val.toFixed(1)}% (Input: ${props.payload.rawValue} ${props.payload.unit})`,
                'Impact'
              ];
            }}
          />
          <ReferenceLine x={0} stroke="#9ca3af" />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.isIncrease ? '#f43f5e' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
