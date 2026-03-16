"use client";

import { useState, useEffect } from "react";
import type { ResourceType, HealthState, ResourceHealth, ResourceHealthSummary } from "./useResourceHealth";

export type { ResourceType, HealthState, ResourceHealth, ResourceHealthSummary };

const RESOURCE_NAMES: Record<ResourceType, string[]> = {
  vm: ["gce-web-01", "gce-web-02", "gce-api-01", "gce-api-02", "gce-worker-01", "gce-worker-02", "gce-gpu-01", "gce-bastion-01"],
  database: ["cloudsql-prod", "cloudsql-replica", "spanner-main", "firestore-users", "bigtable-events", "memorystore-01"],
  app: ["cloudrun-frontend", "cloudrun-api", "cloudrun-auth", "appengine-web", "cloudrun-payments"],
  storage: ["gs-prod-assets", "gs-data-lake", "gs-backups", "gs-ml-models"],
  function: ["gcf-resize", "gcf-email", "gcf-etl", "gcf-webhook"],
  container: ["gke-web-pool", "gke-api-pool", "gke-worker-pool", "gke-batch-pool"],
};

const REGIONS = ["us-central1", "us-east1", "europe-west1", "asia-northeast1", "asia-southeast1", "europe-west3", "southamerica-east1"];

const ISSUES: Record<ResourceType, string[]> = {
  vm: ["High CPU utilization (>95%)", "Persistent Disk I/O bottleneck", "Memory pressure detected", "Instance health check failed"],
  database: ["High CPU on Cloud SQL", "Connection pool exhaustion", "Replication lag elevated", "Spanner hotspot detected"],
  app: ["Container restart loop", "Memory limit exceeded", "Revision rollback triggered", "Readiness probe failing"],
  storage: ["Cloud Storage request throttling", "Cross-region replication lag", "Lifecycle transition pending", "IAM policy error"],
  function: ["Invocation timeout exceeded", "Cold start latency >5s", "Out of memory errors", "Dead letter topic growing"],
  container: ["Pod CrashLoopBackOff", "Node resource pressure", "Image pull backoff", "Liveness probe failing"],
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
        lastChecked: new Date(now.getTime() - Math.random() * 120000),
        issue,
      });
    }
  }

  return resources;
}

export function useGcpResourceHealth(pollIntervalMs = 10000): ResourceHealthSummary {
  const [resources, setResources] = useState<ResourceHealth[]>([]);

  useEffect(() => {
    setResources(generateResources());

    const id = setInterval(() => {
      setResources(prev => prev.map(r => {
        if (Math.random() > 0.08) {
          return { ...r, lastChecked: new Date() };
        }

        const rnd = Math.random();
        let healthState: HealthState;
        let issue: string | undefined;

        if (r.healthState === "unavailable" && rnd > 0.4) {
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
