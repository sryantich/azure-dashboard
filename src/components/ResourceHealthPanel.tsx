"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { ResourceHealthSummary, ResourceHealth, ResourceType, HealthState } from "../hooks/useResourceHealth";
import {
  Server,
  Database,
  Globe,
  HardDrive,
  Zap,
  Container,
  HeartPulse,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface ResourceHealthPanelProps {
  data: ResourceHealthSummary;
}

const TYPE_CONFIG: Record<ResourceType, { icon: typeof Server; label: string; color: string }> = {
  vm: { icon: Server, label: "Virtual Machines", color: "#38bdf8" },
  database: { icon: Database, label: "Databases", color: "#a78bfa" },
  app: { icon: Globe, label: "App Services", color: "#34d399" },
  storage: { icon: HardDrive, label: "Storage", color: "#fbbf24" },
  function: { icon: Zap, label: "Functions", color: "#f472b6" },
  container: { icon: Container, label: "Containers", color: "#fb923c" },
};

const HEALTH_COLORS: Record<HealthState, string> = {
  available: "#34d399",
  degraded: "#fbbf24",
  unavailable: "#ef4444",
  unknown: "#64748b",
};

const HEALTH_BG: Record<HealthState, string> = {
  available: "bg-emerald-500/10 border-emerald-500/20",
  degraded: "bg-amber-500/10 border-amber-500/20",
  unavailable: "bg-red-500/10 border-red-500/20",
  unknown: "bg-slate-500/10 border-slate-500/20",
};

const HEALTH_TEXT: Record<HealthState, string> = {
  available: "text-emerald-400",
  degraded: "text-amber-400",
  unavailable: "text-red-400",
  unknown: "text-slate-400",
};

function AvailabilityRing({ percentage, size = 80 }: { percentage: number; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isGood = percentage >= 99.5;
  const isWarn = percentage >= 95 && percentage < 99.5;
  const color = isGood ? "#34d399" : isWarn ? "#fbbf24" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        {/* Value ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
        {/* Glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth + 4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          opacity={0.15}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-100" style={{ color }}>
          {percentage.toFixed(1)}
        </span>
        <span className="text-[9px] text-slate-500 -mt-0.5">% SLA</span>
      </div>
    </div>
  );
}

function ResourceTypeRow({
  type,
  total,
  healthy,
  unhealthyResources,
}: {
  type: ResourceType;
  total: number;
  healthy: number;
  unhealthyResources: ResourceHealth[];
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  const pct = total > 0 ? (healthy / total) * 100 : 100;
  const hasIssues = unhealthyResources.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${
          hasIssues
            ? "hover:bg-amber-500/5 cursor-pointer"
            : "hover:bg-azure-card-hover/30"
        }`}
        onClick={() => hasIssues && setExpanded(!expanded)}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${cfg.color}15` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-300">{cfg.label}</span>
            <span className="text-[10px] font-mono text-slate-500">
              {healthy}/{total}
            </span>
          </div>
          {/* Health bar */}
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                backgroundColor: pct >= 100 ? "#34d399" : pct >= 80 ? "#fbbf24" : "#ef4444",
              }}
            />
          </div>
        </div>
        {hasIssues && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400">{unhealthyResources.length}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        )}
      </div>

      {/* Expanded unhealthy resources */}
      {expanded && unhealthyResources.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="ml-8 mr-2 mb-1 space-y-1"
        >
          {unhealthyResources.map((r) => (
            <div
              key={r.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] border ${HEALTH_BG[r.healthState]}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: HEALTH_COLORS[r.healthState] }}
              />
              <span className="font-mono text-slate-300 flex-shrink-0">{r.name}</span>
              <span className={`capitalize ${HEALTH_TEXT[r.healthState]} font-semibold flex-shrink-0`}>
                {r.healthState}
              </span>
              {r.issue && (
                <span className="text-slate-500 truncate ml-auto">{r.issue}</span>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function ResourceHealthPanel({ data }: ResourceHealthPanelProps) {
  const { summary, byType, overallAvailability, resources } = data;

  const totalResources = Object.values(summary).reduce((a, b) => a + b, 0);
  const unhealthyByType: Record<ResourceType, ResourceHealth[]> = {
    vm: [], database: [], app: [], storage: [], function: [], container: [],
  };
  for (const r of resources) {
    if (r.healthState !== "available") {
      unhealthyByType[r.type].push(r);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
      className="col-span-1 lg:col-span-2 rounded-2xl border border-azure-card hover:border-azure-accent/20 bg-azure-card/50 backdrop-blur-xl p-5 relative overflow-hidden transition-all duration-300"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.02)_0%,transparent_50%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-emerald-400" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">Resource Health</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{totalResources} resources monitored</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">{summary.available}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">{summary.degraded}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-slate-400">{summary.unavailable}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-5 relative">
        {/* Availability ring */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <AvailabilityRing percentage={overallAvailability} size={88} />
          <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider mt-1">
            Availability
          </span>
        </div>

        {/* Resource type breakdown */}
        <div className="flex-1 space-y-0.5 min-w-0">
          {(Object.keys(byType) as ResourceType[]).map((type) => (
            <ResourceTypeRow
              key={type}
              type={type}
              total={byType[type].total}
              healthy={byType[type].healthy}
              unhealthyResources={unhealthyByType[type]}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
