"use client";

import { useState, useEffect } from "react";
import type { ResourceType, HealthState, ResourceHealth, ResourceHealthSummary } from "./useResourceHealth";

export type { ResourceType, HealthState, ResourceHealth, ResourceHealthSummary };

const RESOURCE_NAMES: Record<ResourceType, string[]> = {
  vm: ["i-web-01", "i-web-02", "i-api-01", "i-api-02", "i-worker-01", "i-worker-02", "i-analytics-01", "i-bastion-01"],
  database: ["rds-prod-primary", "rds-prod-replica", "dynamo-users", "dynamo-sessions", "redis-session", "redshift-dw"],
  app: ["ecs-frontend", "ecs-api-gateway", "ecs-auth-svc", "ecs-payment", "ecs-notifications"],
  storage: ["s3-prod-assets", "s3-data-lake", "s3-backups", "efs-shared"],
  function: ["lambda-resize", "lambda-email", "lambda-etl", "lambda-webhook"],
  container: ["fargate-batch", "eks-web-pool", "eks-api-pool", "eks-worker-pool"],
};

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-northeast-1", "ap-southeast-1", "eu-central-1", "sa-east-1"];

const ISSUES: Record<ResourceType, string[]> = {
  vm: ["High CPU utilization (>95%)", "EBS I/O bottleneck", "Memory pressure detected", "Instance status check failed"],
  database: ["High CPU on RDS instance", "Connection pool exhaustion", "Replication lag elevated", "DynamoDB throttling active"],
  app: ["Task restart loop detected", "Memory limit exceeded", "Deployment rollback triggered", "Health check failing"],
  storage: ["S3 request throttling", "Cross-region replication lag", "Storage class transition pending", "Bucket policy error"],
  function: ["Invocation timeout exceeded", "Cold start latency >5s", "Out of memory errors", "Dead letter queue growing"],
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

export function useAwsResourceHealth(pollIntervalMs = 10000): ResourceHealthSummary {
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
