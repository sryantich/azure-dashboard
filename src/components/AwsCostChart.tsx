"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTheme } from "../hooks/useTheme";

const MONTHLY_DATA = [
  { name: "Aug", cost: 8200, budget: 9500 },
  { name: "Sep", cost: 8650, budget: 9500 },
  { name: "Oct", cost: 7980, budget: 9500 },
  { name: "Nov", cost: 9180, budget: 9500 },
  { name: "Dec", cost: 8400, budget: 10000 },
  { name: "Jan", cost: 9020, budget: 10000 },
  { name: "Feb", cost: 9490, budget: 10000 },
  { name: "Mar", cost: 10320, budget: 10500 },
  { name: "Apr", cost: 9750, budget: 10500 },
  { name: "May", cost: 10880, budget: 10500 },
  { name: "Jun", cost: 10250, budget: 11000 },
  { name: "Jul", cost: 11420, budget: 11000 },
];

export default function AwsCostChart() {
  const { theme } = useTheme();
  const latest = MONTHLY_DATA[MONTHLY_DATA.length - 1];
  const prev = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  const change = ((latest.cost - prev.cost) / prev.cost * 100).toFixed(1);
  const isOver = latest.cost > latest.budget;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="col-span-1 rounded-2xl border border-azure-card hover:border-azure-accent/20 bg-azure-card/50 backdrop-blur-xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300"
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(to bottom right, ${theme.accentMuted}, transparent, ${theme.chart3}10)` }}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h2 className="text-base font-semibold" style={{ color: theme.textPrimary }}>AWS Monthly Spend</h2>
          <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>12-month rolling • Cost Explorer</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: isOver ? `${theme.error}20` : `${theme.accent}20`,
            color: isOver ? theme.error : theme.accent,
          }}
        >
          {Number(change) >= 0 ? "+" : ""}{change}% MoM
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-4 relative z-10">
        <span className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-geist-mono)]" style={{ color: theme.textPrimary }}>
          ${latest.cost.toLocaleString()}
        </span>
        <span className="text-xs" style={{ color: theme.textMuted }}>
          / ${latest.budget.toLocaleString()} budget
        </span>
      </div>

      <div className="h-40 sm:h-48 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MONTHLY_DATA} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="awsCostGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accent} stopOpacity={0.25} />
                <stop offset="50%" stopColor={theme.accent} stopOpacity={0.08} />
                <stop offset="100%" stopColor={theme.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
            <XAxis
              dataKey="name"
              stroke={theme.textMuted}
              tick={{ fill: theme.textMuted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              stroke={theme.textMuted}
              tick={{ fill: theme.textMuted, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
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
              formatter={((value: unknown, name: unknown) => [
                `$${Number(value).toLocaleString()}`,
                String(name) === "cost" ? "Spend" : "Budget",
              ]) as never}
            />
            <ReferenceLine
              y={latest.budget}
              stroke={theme.warning}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="cost"
              stroke={theme.accent}
              strokeWidth={2}
              fill="url(#awsCostGradient)"
              isAnimationActive={true}
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
