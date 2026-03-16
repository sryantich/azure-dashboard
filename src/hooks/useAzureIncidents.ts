"use client";

import { useState, useEffect, useRef } from "react";

export interface AzureIncident {
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

const INCIDENT_TEMPLATES: Omit<AzureIncident, "id" | "startTime" | "lastUpdate">[] = [
  {
    title: "Intermittent connectivity issues - East US",
    description: "We are investigating reports of intermittent connectivity to resources in the East US region. Customers may experience increased latency or timeouts when accessing Azure services.",
    status: "monitoring",
    severity: "warning",
    impactedServices: ["Virtual Machines", "App Service", "SQL Database"],
    region: "East US",
  },
  {
    title: "Storage account access degradation - West Europe",
    description: "A subset of customers in West Europe may experience elevated error rates when performing operations on Storage accounts. Our engineering team is actively working on mitigation.",
    status: "active",
    severity: "warning",
    impactedServices: ["Blob Storage", "Table Storage"],
    region: "West Europe",
  },
  {
    title: "Azure DevOps pipeline delays",
    description: "Pipeline runs may experience delays up to 15 minutes due to increased demand on the build infrastructure. We are scaling up resources.",
    status: "monitoring",
    severity: "info",
    impactedServices: ["Azure DevOps"],
  },
  {
    title: "Planned maintenance - Japan East datacenter",
    description: "Scheduled network maintenance window for Japan East datacenter. Some resources may experience brief interruptions during the maintenance window.",
    status: "advisory",
    severity: "info",
    impactedServices: ["Virtual Network", "Load Balancer", "Application Gateway"],
    region: "Japan East",
  },
  {
    title: "Cosmos DB throttling in SE Asia",
    description: "Increased request throttling observed for Cosmos DB accounts in the Southeast Asia region. RU consumption may appear higher than normal.",
    status: "resolved",
    severity: "warning",
    impactedServices: ["Cosmos DB"],
    region: "SE Asia",
  },
  {
    title: "Key Vault certificate renewal failures",
    description: "Auto-renewal for certificates in Key Vault may be failing for a subset of customers. Manual renewal is available as a workaround.",
    status: "monitoring",
    severity: "warning",
    impactedServices: ["Key Vault"],
  },
  {
    title: "Azure Monitor - Delayed metric ingestion",
    description: "Metrics may appear delayed by up to 10 minutes in Azure Monitor dashboards. Alerting based on metrics may also be delayed.",
    status: "resolved",
    severity: "info",
    impactedServices: ["Azure Monitor"],
  },
  {
    title: "AKS node pool scaling issues - Central US",
    description: "Customers may experience failures when attempting to scale AKS node pools in the Central US region. Existing workloads are not affected.",
    status: "active",
    severity: "critical",
    impactedServices: ["Kubernetes Service"],
    region: "Central US",
  },
  {
    title: "CDN cache invalidation delays",
    description: "Cache purge operations for Azure CDN may take longer than expected. Content delivery is not impacted.",
    status: "resolved",
    severity: "info",
    impactedServices: ["Azure CDN"],
  },
  {
    title: "Redis Cache failover event - Australia East",
    description: "An unexpected failover event affected a subset of Redis Cache instances in Australia East. Connections may have been briefly dropped.",
    status: "resolved",
    severity: "warning",
    impactedServices: ["Cache for Redis"],
    region: "Australia East",
  },
];

function generateIncidents(): AzureIncident[] {
  const now = Date.now();
  // Pick 3-5 incidents randomly
  const count = 3 + Math.floor(Math.random() * 3);
  const shuffled = [...INCIDENT_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map((tpl, i) => ({
    ...tpl,
    id: `inc-${i}-${Date.now()}`,
    startTime: new Date(now - (i + 1) * (15 + Math.random() * 60) * 60 * 1000), // 15min - 75min ago
    lastUpdate: new Date(now - i * (5 + Math.random() * 20) * 60 * 1000), // 0-25min ago
  }));
}

export interface AzureIncidentData {
  incidents: AzureIncident[];
  isLoading: boolean;
  lastFetched: Date | null;
  activeCount: number;
  rssAvailable: boolean;
}

export function useAzureIncidents(pollIntervalMs = 60000): AzureIncidentData {
  const [incidents, setIncidents] = useState<AzureIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [rssAvailable, setRssAvailable] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function fetchIncidents() {
      setIsLoading(true);
      try {
        // Try fetching real Azure Status RSS
        const res = await fetch("/api/azure-incidents", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.incidents && data.incidents.length > 0) {
            setIncidents(data.incidents.map((inc: AzureIncident) => ({
              ...inc,
              startTime: new Date(inc.startTime),
              lastUpdate: new Date(inc.lastUpdate),
            })));
            setRssAvailable(true);
            setLastFetched(new Date());
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // RSS not available, fall through to simulation
      }

      // Simulated incidents as fallback
      setRssAvailable(false);
      setIncidents(generateIncidents());
      setLastFetched(new Date());
      setIsLoading(false);
    }

    fetchIncidents();
    intervalRef.current = setInterval(fetchIncidents, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollIntervalMs]);

  // Occasionally update incident statuses to simulate progression
  useEffect(() => {
    const id = setInterval(() => {
      setIncidents(prev => prev.map(inc => {
        if (Math.random() > 0.15) return inc;
        // Progress the incident status
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

  return { incidents, isLoading, lastFetched, activeCount, rssAvailable };
}
