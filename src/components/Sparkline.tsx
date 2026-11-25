import React from 'react';

interface SparklineProps {
  data: number[];
  positive: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, positive }) => {
  if (data.length < 2) {
    return (
      <svg className="w-16 h-6 shrink-0" viewBox="0 0 64 24" aria-hidden="true">
        <line x1="2" y1="12" x2="62" y2="12" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 24;
  const pad = 3;

  const points = data
    .map((val, idx) => {
      const x = pad + (idx / (data.length - 1)) * (width - pad * 2);
      const y = height - pad - ((val - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = positive ? '#34d399' : '#f87171';

  return (
    <svg className="w-16 h-6 shrink-0" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};
