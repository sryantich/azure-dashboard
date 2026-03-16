"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { AzureIncident, AzureIncidentData } from "../hooks/useAzureIncidents";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  Eye,
  ChevronDown,
  Rss,
  Shield,
} from "lucide-react";

interface IncidentsFeedProps {
  data: AzureIncidentData;
}

const STATUS_CONFIG = {
  active: {
    icon: AlertOctagon,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    badge: "bg-red-500/20 text-red-300",
    label: "Active",
  },
  monitoring: {
    icon: Eye,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500/20 text-amber-300",
    label: "Monitoring",
  },
  resolved: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/20 text-emerald-300",
    label: "Resolved",
  },
  advisory: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    badge: "bg-blue-500/20 text-blue-300",
    label: "Advisory",
  },
};

const SEVERITY_ICON = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
};

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function IncidentCard({ incident }: { incident: AzureIncident }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[incident.status];
  const SevIcon = SEVERITY_ICON[incident.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg ${cfg.bg} border ${cfg.border} transition-all duration-200 cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-3 py-2.5">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <SevIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${cfg.color}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.badge}`}>
                {cfg.label}
              </span>
              {incident.region && (
                <span className="text-[9px] text-slate-500 font-mono">{incident.region}</span>
              )}
            </div>
            <p className="text-xs text-slate-200 font-medium leading-snug line-clamp-2">{incident.title}</p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* Timing */}
        <div className="flex items-center gap-3 mt-1.5 ml-5.5">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-slate-600" />
            <span className="text-[10px] text-slate-500">Started {timeAgo(incident.startTime)}</span>
          </div>
          <span className="text-[10px] text-slate-600">Updated {timeAgo(incident.lastUpdate)}</span>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t border-white/5">
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{incident.description}</p>
              {incident.impactedServices.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {incident.impactedServices.map((svc) => (
                    <span
                      key={svc}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-azure-card-hover/50 text-slate-400 border border-azure-card-hover"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function IncidentsFeed({ data }: IncidentsFeedProps) {
  const [showResolved, setShowResolved] = useState(false);

  const { incidents, activeCount, rssAvailable, isLoading } = data;

  const displayed = showResolved
    ? incidents
    : incidents.filter((i) => i.status !== "resolved");

  const resolvedCount = incidents.filter((i) => i.status === "resolved").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="col-span-1 rounded-2xl border border-azure-card hover:border-azure-accent/20 bg-azure-card/50 backdrop-blur-xl p-5 relative overflow-hidden transition-all duration-300"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(239,68,68,0.02)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-azure-accent" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">Incidents & Advisories</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {rssAvailable ? "Live from Azure Status" : "Simulated data"} &middot; {incidents.length} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rssAvailable && (
            <Rss className="w-3 h-3 text-azure-accent animate-pulse" />
          )}
          {activeCount > 0 ? (
            <span className="flex items-center gap-1 bg-red-500/15 border border-red-500/25 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-red-300">{activeCount} Active</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-300">All Clear</span>
            </span>
          )}
        </div>
      </div>

      {/* Incident list */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 relative">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-azure-card-hover/30 animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No active incidents</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {displayed.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Toggle resolved */}
      {resolvedCount > 0 && (
        <button
          onClick={() => setShowResolved(!showResolved)}
          className="mt-2 w-full text-center text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-1"
        >
          {showResolved ? "Hide" : "Show"} {resolvedCount} resolved incident{resolvedCount > 1 ? "s" : ""}
        </button>
      )}
    </motion.div>
  );
}
