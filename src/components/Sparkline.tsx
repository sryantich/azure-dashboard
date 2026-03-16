"use client";

import { memo } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  filled?: boolean;
}

function SparklineInner({ data, color = "#38bdf8", width = 80, height = 28, filled = true }: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const fillPath = `M ${pad},${height - pad} ${points.map((p, i) => (i === 0 ? `L ${p}` : `L ${p}`)).join(" ")} L ${width - pad},${height - pad} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {filled && (
        <defs>
          <linearGradient id={`spark-fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}
      {filled && (
        <path d={fillPath} fill={`url(#spark-fill-${color.replace("#", "")})`} />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={pad + ((data.length - 1) / (data.length - 1)) * (width - pad * 2)}
          cy={pad + (1 - (data[data.length - 1] - min) / range) * (height - pad * 2)}
          r={2.5}
          fill={color}
          className="animate-pulse"
        />
      )}
    </svg>
  );
}

const Sparkline = memo(SparklineInner);
export default Sparkline;
