"use client";

import { useState, useEffect, useRef } from "react";

/* Re-use the same incident shape for component compatibility */
export interface GcpIncident {
  id: string;
  title: string;
  description: string;
  status: "active" | "monitoring" | "resolved" | "advisory";
  severity: "critical" | "warning" | "info";
  impactedServices: string[];
  startTime: Date;
  lastUpdate: Date;
  region?: string;
}

const INCIDENT_TEMPLATES: Omit<GcpIncident, "id" | "startTime" | "lastUpdate">[] = [
  {
    title: "Compute Engine API errors - us-central1",
    description: "We are investigating elevated API error rates for Compute Engine instance creation in us-central1. Existing instances are not affected.",
    status: "monitoring",
    severity: "warning",
    impactedServices: ["Compute Engine", "GKE", "Cloud Run"],
    region: "us-central1",
  },
  {
    title: "Cloud Storage increased latency - europe-west1",
    description: "A subset of Cloud Storage requests in europe-west1 are experiencing increased latency. Object reads and writes may see elevated error rates.",
    status: "active",
    severity: "warning",
    impactedServices: ["Cloud Storage", "Cloud CDN"],
    region: "europe-west1",
  },
  {
    title: "Cloud Build execution delays",
    description: "Cloud Build triggers may experience delays up to 15 minutes due to increased queue depth across multiple regions.",
    status: "monitoring",
    severity: "info",
    impactedServices: ["Cloud Build"],
  },
  {
    title: "Planned maintenance - asia-northeast1",
    description: "Scheduled network maintenance in asia-northeast1. Some VMs may experience brief connectivity interruptions during the maintenance window.",
    status: "advisory",
    severity: "info",
    impactedServices: ["VPC", "Cloud Load Balancing", "Cloud DNS"],
    region: "asia-northeast1",
  },
  {
    title: "Spanner transaction aborts - asia-southeast1",
    description: "Increased transaction abort rates observed for Cloud Spanner instances in asia-southeast1. Retries should succeed automatically.",
    status: "resolved",
    severity: "warning",
    impactedServices: ["Cloud Spanner"],
    region: "asia-southeast1",
  },
  {
    title: "Cloud KMS key creation failures",
    description: "CreateCryptoKey requests in Cloud KMS may fail intermittently. Existing keys and encryption/decryption operations are not affected.",
    status: "monitoring",
    severity: "warning",
    impactedServices: ["Cloud KMS"],
  },
  {
    title: "Cloud Monitoring metrics delay",
    description: "Custom metrics may appear delayed by up to 10 minutes in Cloud Monitoring dashboards. Alerting policies based on custom metrics may also be delayed.",
    status: "resolved",
    severity: "info",
    impactedServices: ["Cloud Monitoring"],
  },
  {
    title: "GKE control plane degradation - us-east1",
    description: "GKE API server may respond slowly for clusters in us-east1. Running workloads and pods are not affected.",
    status: "active",
    severity: "critical",
    impactedServices: ["GKE"],
    region: "us-east1",
  },
  {
    title: "BigQuery query processing delays",
    description: "BigQuery queries in US multi-region may experience longer queue times. Streaming inserts are not impacted.",
    status: "resolved",
    severity: "info",
    impactedServices: ["BigQuery"],
  },
  {
    title: "Pub/Sub message delivery lag - europe-west3",
    description: "Pub/Sub subscriptions in europe-west3 may experience increased end-to-end delivery latency. No message loss has been observed.",
    status: "resolved",
    severity: "warning",
    impactedServices: ["Pub/Sub"],
    region: "europe-west3",
  },
];

function generateIncidents(): GcpIncident[] {
  const now = Date.now();
  const count = 3 + Math.floor(Math.random() * 3);
  const shuffled = [...INCIDENT_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((tpl, i) => ({
    ...tpl,
    id: `inc-${i}-${Date.now()}`,
    startTime: new Date(now - (i + 1) * (15 + Math.random() * 60) * 60 * 1000),
    lastUpdate: new Date(now - i * (5 + Math.random() * 20) * 60 * 1000),
  }));
}

export interface GcpIncidentData {
  incidents: GcpIncident[];
  isLoading: boolean;
  lastFetched: Date | null;
  activeCount: number;
  rssAvailable: boolean;
}

export function useGcpIncidents(pollIntervalMs = 60000): GcpIncidentData {
  const [incidents, setIncidents] = useState<GcpIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIncidents(generateIncidents());
    setLastFetched(new Date());
    setIsLoading(false);

    intervalRef.current = setInterval(() => {
      setIncidents(generateIncidents());
      setLastFetched(new Date());
    }, pollIntervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollIntervalMs]);

  // Status progression
  useEffect(() => {
    const id = setInterval(() => {
      setIncidents(prev => prev.map(inc => {
        if (Math.random() > 0.15) return inc;
        if (inc.status === "active" && Math.random() > 0.5) {
          return { ...inc, status: "monitoring" as const, lastUpdate: new Date() };
        }
        if (inc.status === "monitoring" && Math.random() > 0.6) {
          return { ...inc, status: "resolved" as const, lastUpdate: new Date() };
        }
        return inc;
      }));
    }, 15000);
    return () => clearInterval(id);
  }, []);

  const activeCount = incidents.filter(
    (i) => i.status === "active" || i.status === "monitoring"
  ).length;

  return { incidents, isLoading, lastFetched, activeCount, rssAvailable: false };
}
