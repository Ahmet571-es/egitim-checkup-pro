'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarChartSectionProps {
  data: Array<{ test: string; skor: number; fullMark: 100 }>;
}

export default function RadarChartSection({ data }: RadarChartSectionProps) {
  if (data.length < 3) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Radar grafiği için en az 3 test sonucu gerekli. Şu an {data.length} test mevcut.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="test"
            tick={{ fontSize: 11, fill: '#475569' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
          />
          <Radar
            name="Skor"
            dataKey="skor"
            stroke="#7c3aed"
            fill="#7c3aed"
            fillOpacity={0.25}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255,255,255,0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [`${value} / 100`, 'Skor']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
