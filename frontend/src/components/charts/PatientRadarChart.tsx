import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PatientRadarChartProps {
  features: Array<{
    name: string;
    label: string;
    patientValue: number;
    medianValue: number;
    min: number;
    max: number;
  }>;
  riskLevel?: string;
}

export const PatientRadarChart: React.FC<PatientRadarChartProps> = ({ features, riskLevel }) => {
  if (!features || features.length === 0) return null;

  const data = features.map(f => {
    const range = f.max - f.min || 1;
    return {
      subject: f.label.length > 10 ? f.label.substring(0, 10) + '...' : f.label,
      fullLabel: f.label,
      Patient: Math.max(0, Math.min(1, (f.patientValue - f.min) / range)),
      'Healthy Reference': Math.max(0, Math.min(1, (f.medianValue - f.min) / range)),
      patientRaw: f.patientValue,
      medianRaw: f.medianValue
    };
  });

  const getRiskColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return '#10b981'; // emerald
      case 'moderate': return '#f59e0b'; // amber
      case 'high': return '#f97316'; // orange
      case 'very_high': return '#f43f5e'; // rose
      default: return '#10b981';
    }
  };

  const patientColor = getRiskColor(riskLevel);

  return (
    <div className="h-[300px] w-full flex flex-col items-center justify-center p-4">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
        Patient Biomarker Profile
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
          <Radar name="Patient" dataKey="Patient" stroke={patientColor} fill={patientColor} fillOpacity={0.5} />
          <Radar name="Healthy Reference" dataKey="Healthy Reference" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeDasharray="3 3" />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#f3f4f6', fontSize: '12px' }}
            formatter={(val: number, name: string, props: any) => {
               const raw = name === 'Patient' ? props.payload.patientRaw : props.payload.medianRaw;
               return [raw, name];
            }}
            labelFormatter={(label, props) => {
               return props?.[0]?.payload?.fullLabel || label;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
