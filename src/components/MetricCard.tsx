"use client";

import { motion, useMotionValue, useSpring, useMotionTemplate, AnimatePresence } from "framer-motion";
import { LucideIcon, ChevronDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReactNode, useEffect, useState, useRef, useMemo } from "react";
import Sparkline from "./Sparkline";
import { useTheme } from "../hooks/useTheme";

/**
 * Convert a hex color (#rrggbb) to an rgba() string at the given alpha.
 */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface MetricCardProps {
  title: string;
  value: number;
  format?: (v: number) => string;
  unit?: string;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
  trendIsGood?: boolean;
  icon: LucideIcon;
  sparklineData?: number[];
  sparklineColor?: string;
  delay?: number;
  children?: ReactNode;
}

function AnimatedValue({ value, format }: { value: number; format?: (v: number) => string }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 80, damping: 22, restDelta: 0.5 });
  const [display, setDisplay] = useState(format ? format(value) : value.toLocaleString());

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  useEffect(() => {
    const unsub = spring.on("change", v => {
      setDisplay(format ? format(v) : Math.round(v).toLocaleString());
    });
    return unsub;
  }, [spring, format]);

  return <span>{display}</span>;
}

/* ── Drill-down stats from sparkline data ── */
function DrillDownPanel({
  sparklineData,
  sparklineColor,
  unit,
  format,
  trend,
}: {
  sparklineData: number[];
  sparklineColor: string;
  unit?: string;
  format?: (v: number) => string;
  trend: "up" | "down" | "neutral";
}) {
  const stats = useMemo(() => {
    if (sparklineData.length === 0) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const avg = sparklineData.reduce((a, b) => a + b, 0) / sparklineData.length;
    const latest = sparklineData[sparklineData.length - 1];
    const first = sparklineData[0];
    const change = first !== 0 ? ((latest - first) / first) * 100 : 0;
    return { min, max, avg, latest, change };
  }, [sparklineData]);

  if (!stats) return null;

  const fmt = (v: number) => (format ? format(v) : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
      className="overflow-hidden"
    >
      <div className="pt-3 mt-1 border-t border-azure-card-hover/60">
        {/* Larger sparkline */}
        <div className="mb-3">
          <Sparkline data={sparklineData} color={sparklineColor} width={280} height={48} responsive />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-azure-bg/60 rounded-lg px-2.5 py-1.5 border border-azure-card-hover/40">
            <p className="text-[9px] text-azure-text-muted uppercase tracking-wider font-semibold">Min</p>
            <p className="text-xs text-azure-text-primary font-mono font-semibold">{fmt(stats.min)}{unit ? ` ${unit}` : ""}</p>
          </div>
          <div className="bg-azure-bg/60 rounded-lg px-2.5 py-1.5 border border-azure-card-hover/40">
            <p className="text-[9px] text-azure-text-muted uppercase tracking-wider font-semibold">Avg</p>
            <p className="text-xs text-azure-text-primary font-mono font-semibold">{fmt(stats.avg)}{unit ? ` ${unit}` : ""}</p>
          </div>
          <div className="bg-azure-bg/60 rounded-lg px-2.5 py-1.5 border border-azure-card-hover/40">
            <p className="text-[9px] text-azure-text-muted uppercase tracking-wider font-semibold">Max</p>
            <p className="text-xs text-azure-text-primary font-mono font-semibold">{fmt(stats.max)}{unit ? ` ${unit}` : ""}</p>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="flex items-center gap-1.5 text-[10px] text-azure-text-secondary">
          <TrendIcon className="w-3 h-3" />
          <span>
            {stats.change >= 0 ? "+" : ""}{stats.change.toFixed(1)}% over window
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function MetricCard({
  title,
  value,
  format,
  unit,
  changeLabel,
  trend,
  trendIsGood = false,
  icon: Icon,
  sparklineData,
  sparklineColor,
  delay = 0,
  children,
}: MetricCardProps) {
  const { theme } = useTheme();
  const resolvedSparklineColor = sparklineColor ?? theme.accent;
  const [expanded, setExpanded] = useState(false);
  const isGood = trendIsGood
    ? trend === "up"
    : trend === "down";
  const isBad = trendIsGood
    ? trend === "down"
    : trend === "up";

  /* ── Mouse-follow highlight ── */
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const accentGlow = useMemo(() => hexToRgba(theme.accent, 0.06), [theme.accent]);
  const highlightBackground = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, ${accentGlow}, transparent 80%)`;

  /* ── Trend badge inline styles (uses theme status colors) ── */
  const trendStyle = useMemo(() => {
    if (isGood) return {
      backgroundColor: hexToRgba(theme.success, 0.15),
      color: theme.success,
    };
    if (isBad) return {
      backgroundColor: hexToRgba(theme.error, 0.15),
      color: theme.error,
    };
    return {
      backgroundColor: hexToRgba(theme.textMuted, 0.15),
      color: theme.textMuted,
    };
  }, [isGood, isBad, theme.success, theme.error, theme.textMuted]);

  function handleMouseMove(e: React.MouseEvent) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={() => setExpanded(prev => !prev)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" as const }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden rounded-2xl border border-azure-card hover:border-azure-accent/30 bg-azure-card/50 backdrop-blur-xl p-4 sm:p-5 transition-colors duration-300 cursor-pointer select-none"
    >
      {/* Mouse-follow highlight */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: highlightBackground }}
      />

      {/* Decorative glow */}
      <div className="absolute -right-8 -top-8 w-28 h-28 bg-azure-accent/8 rounded-full blur-2xl group-hover:bg-azure-accent/15 transition-colors duration-500" />
      <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-azure-accent/5 rounded-full blur-xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <h3 className="text-xs font-semibold text-azure-text-secondary uppercase tracking-wider">{title}</h3>
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="opacity-0 group-hover:opacity-60 transition-opacity duration-200"
          >
            <ChevronDown className="w-3 h-3 text-azure-text-secondary" />
          </motion.div>
          <div className="p-1.5 rounded-lg bg-azure-bg/80 border border-azure-card-hover group-hover:border-azure-accent/30 group-hover:bg-azure-accent/10 transition-all duration-300">
            <Icon className="w-4 h-4 text-azure-accent group-hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </div>

      {/* Value + Change */}
      <div className="flex items-end justify-between mb-1 relative">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-azure-text-primary font-[family-name:var(--font-geist-mono)]">
            <AnimatedValue value={value} format={format} />
          </span>
          {unit && <span className="text-xs text-azure-text-muted font-medium">{unit}</span>}
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300"
          style={trendStyle}
        >
          {changeLabel}
        </span>
      </div>

      {/* Sparkline (collapsed view) */}
      <AnimatePresence>
        {!expanded && sparklineData && sparklineData.length > 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 mb-1 relative"
          >
            <Sparkline data={sparklineData} color={resolvedSparklineColor} width={220} height={32} responsive />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children slot */}
      {children && (
        <div className="mt-3 pt-3 border-t border-azure-card-hover/60">
          {children}
        </div>
      )}

      {/* Drill-down panel (expanded view) */}
      <AnimatePresence>
        {expanded && sparklineData && sparklineData.length > 2 && (
          <DrillDownPanel
            sparklineData={sparklineData}
            sparklineColor={resolvedSparklineColor}
            unit={unit}
            format={format}
            trend={trend}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
