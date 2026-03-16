"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MetricPoint } from "../hooks/useStreamingMetrics";
import { useTheme } from "../hooks/useTheme";

interface UsageChartProps {
  data: MetricPoint[];
  cpu: number;
  memory: number;
  network: number;
}

const TIME_RANGES = [
  { label: "1m", points: 30 },
  { label: "5m", points: 150 },
  { label: "15m", points: 450 },
  { label: "1h", points: 1800 },
] as const;

export default function UsageChart({ data, cpu, memory, network }: UsageChartProps) {
  const [rangeIdx, setRangeIdx] = useState(0);
  const range = TIME_RANGES[rangeIdx];
  const { theme } = useTheme();

  const visibleData = useMemo(() => {
    return data.slice(-range.points);
  }, [data, range.points]);

  const minTickGap = range.points <= 30 ? 60 : range.points <= 150 ? 120 : 200;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      whileHover={{ borderColor: `${theme.accent}40` }}
      className="col-span-1 lg:col-span-2 group rounded-2xl border border-azure-card bg-azure-card/50 backdrop-blur-xl p-5 transition-all duration-300 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 transition-all duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at top right, ${theme.accentMuted} 0%, transparent 60%)`,
        }}
      />

      <div className="flex items-center justify-between mb-5 relative">
        <div>
          <h2 className="text-base font-semibold" style={{ color: theme.textPrimary }}>Live Resource Utilization</h2>
          <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
            Streaming every 2s &middot; {visibleData.length} points
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Time range selector */}
          <div className="flex items-center bg-azure-bg/60 border border-azure-card-hover/50 rounded-lg overflow-hidden">
            {TIME_RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRangeIdx(i)}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all duration-200 ${
                  i === rangeIdx
                    ? "bg-azure-accent/20 text-azure-accent border-azure-accent/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-azure-card-hover/50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.chart1, boxShadow: `0 0 6px ${theme.chart1}` }} />
              <span style={{ color: theme.textSecondary }}>CPU</span>
              <span className="font-mono font-semibold" style={{ color: theme.textPrimary }}>{cpu}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.chart2, boxShadow: `0 0 6px ${theme.chart2}` }} />
              <span style={{ color: theme.textSecondary }}>Mem</span>
              <span className="font-mono font-semibold" style={{ color: theme.textPrimary }}>{memory}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.chart3, boxShadow: `0 0 6px ${theme.chart3}` }} />
              <span style={{ color: theme.textSecondary }}>Net</span>
              <span className="font-mono font-semibold" style={{ color: theme.textPrimary }}>{network}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
            <defs>
              <linearGradient id="cpuGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.chart1} stopOpacity={0.15} />
                <stop offset="100%" stopColor={theme.chart1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={theme.textMuted}
              tick={{ fill: theme.textMuted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={minTickGap}
            />
            <YAxis
              stroke={theme.textMuted}
              tick={{ fill: theme.textMuted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.tooltipBg,
                borderColor: theme.tooltipBorder,
                borderRadius: "10px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                fontSize: "12px",
              }}
              itemStyle={{ color: theme.textPrimary }}
              labelStyle={{ color: theme.textSecondary, marginBottom: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke={theme.chart1}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: theme.chart1, stroke: theme.tooltipBg, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke={theme.chart2}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: theme.chart2, stroke: theme.tooltipBg, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="network"
              stroke={theme.chart3}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: theme.chart3, stroke: theme.tooltipBg, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
