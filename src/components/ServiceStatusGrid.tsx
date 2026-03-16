"use client";

import { motion } from "framer-motion";
import type { AzureService } from "../hooks/useAzureStatus";

interface ServiceStatusGridProps {
  services: AzureService[];
}

const STATUS_CONFIG = {
  operational: { color: "bg-emerald-500", glow: "shadow-[0_0_6px_#34d399]", label: "Operational", textColor: "text-emerald-400" },
  degraded: { color: "bg-amber-500", glow: "shadow-[0_0_6px_#fbbf24]", label: "Degraded", textColor: "text-amber-400" },
  outage: { color: "bg-red-500", glow: "shadow-[0_0_6px_#ef4444]", label: "Outage", textColor: "text-red-400" },
  maintenance: { color: "bg-blue-500", glow: "shadow-[0_0_6px_#3b82f6]", label: "Maintenance", textColor: "text-blue-400" },
};

function groupByCategory(services: AzureService[]): Record<string, AzureService[]> {
  const groups: Record<string, AzureService[]> = {};
  for (const s of services) {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  }
  return groups;
}

export default function ServiceStatusGrid({ services }: ServiceStatusGridProps) {
  const groups = groupByCategory(services);
  const operationalCount = services.filter(s => s.status === "operational").length;
  const issueCount = services.length - operationalCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="col-span-1 lg:col-span-2 group/card rounded-2xl border border-azure-card hover:border-azure-accent/20 bg-azure-card/50 backdrop-blur-xl p-5 relative overflow-hidden transition-all duration-300"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.03)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Azure Service Health</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{services.length} services monitored</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
            {operationalCount} OK
          </span>
          {issueCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold animate-pulse">
              {issueCount} Issue{issueCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Service grid by category */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 relative">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{category}</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map(service => {
                const cfg = STATUS_CONFIG[service.status];
                const isIssue = service.status !== "operational";
                return (
                  <div
                    key={service.name}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg bg-azure-bg/50 border transition-all duration-200 cursor-default ${
                      isIssue
                        ? "border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/5"
                        : "border-azure-card-hover/40 hover:border-azure-accent/30 hover:bg-azure-accent/5"
                    } hover:scale-[1.02] hover:shadow-lg hover:shadow-azure-accent/5`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.color} ${cfg.glow}`} />
                      <span className="text-xs text-slate-300 truncate">{service.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono flex-shrink-0 ml-2 ${
                      service.latency > 40 ? "text-amber-400" : "text-slate-500"
                    }`}>
                      {service.latency}ms
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
