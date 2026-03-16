"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import type { ActivityEvent } from "../hooks/useActivityFeed";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Filter,
} from "lucide-react";

interface ActivityFeedProps {
  events: ActivityEvent[];
}

type Severity = ActivityEvent["severity"];

const SEVERITY_CONFIG = {
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", activeBtn: "bg-blue-500/25 text-blue-300 border-blue-500/40" },
  success: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", activeBtn: "bg-emerald-500/25 text-emerald-300 border-emerald-500/40" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", activeBtn: "bg-amber-500/25 text-amber-300 border-amber-500/40" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", activeBtn: "bg-red-500/25 text-red-300 border-red-500/40" },
};

const SEVERITY_ORDER: Severity[] = ["error", "warning", "success", "info"];

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  // Use a record of booleans instead of Set for reliable React reactivity
  const [activeFilters, setActiveFilters] = useState<Record<Severity, boolean>>({
    error: true,
    warning: true,
    success: true,
    info: true,
  });

  const activeCount = Object.values(activeFilters).filter(Boolean).length;
  const allActive = activeCount === SEVERITY_ORDER.length;

  const filteredEvents = useMemo(() => {
    return events.filter(evt => activeFilters[evt.severity]);
  }, [events, activeFilters]);

  function toggleFilter(sev: Severity) {
    setActiveFilters(prev => {
      const count = Object.values(prev).filter(Boolean).length;
      // If this is the only active filter and we click it again, reset to all
      if (count === 1 && prev[sev]) {
        return { error: true, warning: true, success: true, info: true };
      }
      // If all are active, switch to showing only this severity
      if (count === SEVERITY_ORDER.length) {
        return { error: false, warning: false, success: false, info: false, [sev]: true };
      }
      // Otherwise toggle this severity
      const next = { ...prev };
      if (next[sev]) {
        if (count > 1) next[sev] = false;
      } else {
        next[sev] = true;
      }
      return next;
    });
  }

  function resetFilters() {
    setActiveFilters({ error: true, warning: true, success: true, info: true });
  }

  // Count events by severity
  const counts = useMemo(() => {
    const c: Record<Severity, number> = { info: 0, success: 0, warning: 0, error: 0 };
    for (const evt of events) c[evt.severity]++;
    return c;
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
      className="col-span-1 rounded-2xl border border-azure-card hover:border-azure-accent/20 bg-azure-card/50 backdrop-blur-xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.03)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Activity Feed</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Live operational events</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Severity filter bar */}
      <div className="flex items-center gap-1.5 mb-3 relative flex-wrap">
        <button
          onClick={resetFilters}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border transition-all duration-200 ${
            allActive
              ? "bg-azure-accent/15 text-azure-accent border-azure-accent/30"
              : "text-slate-500 border-azure-card-hover/50 hover:text-slate-300 hover:border-azure-card-hover"
          }`}
        >
          <Filter className="w-2.5 h-2.5" />
          All
        </button>
        {SEVERITY_ORDER.map(sev => {
          const cfg = SEVERITY_CONFIG[sev];
          const isActive = activeFilters[sev];
          const IconComp = cfg.icon;
          return (
            <button
              key={sev}
              onClick={() => toggleFilter(sev)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-all duration-200 ${
                isActive
                  ? cfg.activeBtn
                  : "text-slate-600 border-azure-card-hover/30 hover:text-slate-400 hover:border-azure-card-hover/60"
              }`}
            >
              <IconComp className="w-2.5 h-2.5" />
              <span className="font-mono">{counts[sev]}</span>
            </button>
          );
        })}
      </div>

      {/* Event list */}
      <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 relative">
        <AnimatePresence initial={false}>
          {filteredEvents.slice(0, 20).map(evt => {
            const cfg = SEVERITY_CONFIG[evt.severity];
            const IconComp = cfg.icon;
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg ${cfg.bg} border ${cfg.border} transition-colors`}
              >
                <IconComp className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-300 leading-relaxed break-words">{evt.message}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatTime(evt.timestamp)}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredEvents.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            No events match the selected filters
          </div>
        )}
      </div>
    </motion.div>
  );
}
