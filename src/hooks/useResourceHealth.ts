"use client";

import { useState, useEffect } from "react";

export type ResourceType = "vm" | "database" | "app" | "storage" | "function" | "container";
export type HealthState = "available" | "degraded" | "unavailable" | "unknown";

export interface ResourceHealth {
  id: string;
  name: string;
  type: ResourceType;
  healthState: HealthState;
  region: string;
  uptime: number; // 0-100 percentage
  lastChecked: Date;
  issue?: string;
}

export interface ResourceHealthSummary {
  resources: ResourceHealth[];
  summary: Record<HealthState, number>;
  byType: Record<ResourceType, { total: number; healthy: number }>;
  overallAvailability: number; // percentage
}

const RESOURCE_NAMES: Record<ResourceType, string[]> = {
  vm: ["vm-web-01", "vm-web-02", "vm-api-01", "vm-api-02", "vm-worker-01", "vm-worker-02", "vm-analytics-01", "vm-cache-01"],
  database: ["sql-prod-primary", "sql-prod-replica", "cosmos-users", "cosmos-telemetry", "redis-session", "redis-cache"],
  app: ["app-frontend", "app-api-gateway", "app-auth-service", "app-payment", "app-notifications"],
  storage: ["st-blob-prod", "st-blob-backups", "st-table-logs", "st-queue-events"],
  function: ["fn-image-resize", "fn-email-sender", "fn-data-pipeline", "fn-webhook-handler"],
  container: ["aci-batch-proc", "aks-web-pool", "aks-api-pool", "aks-worker-pool"],
};

const REGIONS = ["East US", "West Europe", "SE Asia", "Japan East", "Australia East", "Central US", "UK South"];

const ISSUES: Record<ResourceType, string[]> = {
  vm: ["High CPU utilization (>95%)", "Disk I/O bottleneck", "Memory pressure detected", "Network connectivity intermittent"],
  database: ["High DTU consumption", "Connection pool exhaustion", "Replication lag elevated", "RU throttling active"],
  app: ["Frequent cold starts", "Memory leak detected", "SSL cert expiring soon", "Deployment slot swap pending"],
  storage: ["Throttling on blob operations", "Geo-replication lag", "Capacity threshold reached", "CORS policy misconfigured"],
  function: ["Execution timeout exceeded", "Cold start latency >5s", "Out of memory errors", "Binding connection failure"],
  container: ["Pod restart loop detected", "Node resource pressure", "Image pull backoff", "Liveness probe failing"],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateResources(): ResourceHealth[] {
  const resources: ResourceHealth[] = [];
  const now = new Date();

  for (const [type, names] of Object.entries(RESOURCE_NAMES) as [ResourceType, string[]][]) {
    for (const name of names) {
      const r = Math.random();
      let healthState: HealthState;
      let uptime: number;
      let issue: string | undefined;

      if (r > 0.92) {
        healthState = "unavailable";
        uptime = 85 + Math.random() * 10;
        issue = pick(ISSUES[type]);
      } else if (r > 0.82) {
        healthState = "degraded";
        uptime = 95 + Math.random() * 4;
        issue = pick(ISSUES[type]);
      } else if (r > 0.80) {
        healthState = "unknown";
        uptime = 99 + Math.random();
      } else {
        healthState = "available";
        uptime = 99.5 + Math.random() * 0.5;
      }

      resources.push({
        id: `${type}-${name}`,
        name,
        type,
        healthState,
        region: pick(REGIONS),
        uptime: parseFloat(uptime.toFixed(2)),
        lastChecked: new Date(now.getTime() - Math.random() * 120000), // Within last 2 min
        issue,
      });
    }
  }

  return resources;
}

export function useResourceHealth(pollIntervalMs = 10000): ResourceHealthSummary {
  const [resources, setResources] = useState<ResourceHealth[]>([]);

  useEffect(() => {
    setResources(generateResources());

    const id = setInterval(() => {
      setResources(prev => prev.map(r => {
        // ~8% chance to change health state each tick
        if (Math.random() > 0.08) {
          return { ...r, lastChecked: new Date() };
        }

        const rnd = Math.random();
        let healthState: HealthState;
        let issue: string | undefined;

        if (r.healthState === "unavailable" && rnd > 0.4) {
          // Tend to recover
          healthState = rnd > 0.7 ? "degraded" : "available";
          issue = healthState === "degraded" ? pick(ISSUES[r.type]) : undefined;
        } else if (r.healthState === "degraded" && rnd > 0.3) {
          healthState = rnd > 0.8 ? "unavailable" : "available";
          issue = healthState !== "available" ? pick(ISSUES[r.type]) : undefined;
        } else if (r.healthState === "available" && rnd > 0.85) {
          healthState = rnd > 0.95 ? "unavailable" : "degraded";
          issue = pick(ISSUES[r.type]);
        } else {
          return { ...r, lastChecked: new Date() };
        }

        const uptime = healthState === "available"
          ? 99.5 + Math.random() * 0.5
          : healthState === "degraded"
          ? 95 + Math.random() * 4
          : 85 + Math.random() * 10;

        return {
          ...r,
          healthState,
          uptime: parseFloat(uptime.toFixed(2)),
          lastChecked: new Date(),
          issue,
        };
      }));
    }, pollIntervalMs);

    return () => clearInterval(id);
  }, [pollIntervalMs]);

  const summary: Record<HealthState, number> = { available: 0, degraded: 0, unavailable: 0, unknown: 0 };
  const byType: Record<ResourceType, { total: number; healthy: number }> = {
    vm: { total: 0, healthy: 0 },
    database: { total: 0, healthy: 0 },
    app: { total: 0, healthy: 0 },
    storage: { total: 0, healthy: 0 },
    function: { total: 0, healthy: 0 },
    container: { total: 0, healthy: 0 },
  };

  for (const r of resources) {
    summary[r.healthState]++;
    byType[r.type].total++;
    if (r.healthState === "available") byType[r.type].healthy++;
  }

  const overallAvailability = resources.length > 0
    ? parseFloat((resources.reduce((sum, r) => sum + r.uptime, 0) / resources.length).toFixed(2))
    : 100;

  return { resources, summary, byType, overallAvailability };
}
