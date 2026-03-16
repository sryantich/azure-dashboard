"use client";

import { useState, useEffect, useRef } from "react";

/* ── Types ── */

export interface AzureService {
  name: string;
  category: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  latency: number; // ms
}

export interface AzureRegion {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  status: "healthy" | "degraded" | "outage";
  load: number; // 0-100
}

export interface AzureStatusData {
  services: AzureService[];
  regions: AzureRegion[];
  devOpsHealth: "healthy" | "degraded" | "unhealthy" | null;
  lastUpdated: Date | null;
}

/* ── Static data ── */

const SERVICE_DEFS: { name: string; category: string }[] = [
  { name: "Virtual Machines", category: "Compute" },
  { name: "App Service", category: "Compute" },
  { name: "Azure Functions", category: "Compute" },
  { name: "Container Instances", category: "Containers" },
  { name: "Kubernetes Service", category: "Containers" },
  { name: "SQL Database", category: "Databases" },
  { name: "Cosmos DB", category: "Databases" },
  { name: "Cache for Redis", category: "Databases" },
  { name: "Blob Storage", category: "Storage" },
  { name: "Table Storage", category: "Storage" },
  { name: "Azure CDN", category: "Networking" },
  { name: "Load Balancer", category: "Networking" },
  { name: "Application Gateway", category: "Networking" },
  { name: "Azure DNS", category: "Networking" },
  { name: "Virtual Network", category: "Networking" },
  { name: "Key Vault", category: "Security" },
  { name: "Azure AD / Entra", category: "Identity" },
  { name: "Azure Monitor", category: "Management" },
  { name: "Azure DevOps", category: "DevOps" },
  { name: "Azure OpenAI", category: "AI + ML" },
];

const REGION_DEFS: Omit<AzureRegion, "status" | "load">[] = [
  { name: "eastus", displayName: "East US", lat: 37.37, lng: -79.82 },
  { name: "eastus2", displayName: "East US 2", lat: 36.67, lng: -78.38 },
  { name: "westus2", displayName: "West US 2", lat: 47.23, lng: -119.85 },
  { name: "centralus", displayName: "Central US", lat: 41.59, lng: -93.6 },
  { name: "westeurope", displayName: "West Europe", lat: 52.37, lng: 4.9 },
  { name: "northeurope", displayName: "North Europe", lat: 53.35, lng: -6.26 },
  { name: "uksouth", displayName: "UK South", lat: 51.51, lng: -0.13 },
  { name: "southeastasia", displayName: "SE Asia", lat: 1.35, lng: 103.82 },
  { name: "eastasia", displayName: "East Asia", lat: 22.32, lng: 114.17 },
  { name: "japaneast", displayName: "Japan East", lat: 35.68, lng: 139.65 },
  { name: "australiaeast", displayName: "Australia East", lat: -33.87, lng: 151.21 },
  { name: "brazilsouth", displayName: "Brazil South", lat: -23.55, lng: -46.63 },
  { name: "centralindia", displayName: "Central India", lat: 18.52, lng: 73.86 },
  { name: "southafricanorth", displayName: "South Africa N", lat: -26.2, lng: 28.05 },
  { name: "uaenorth", displayName: "UAE North", lat: 25.2, lng: 55.27 },
  { name: "koreacentral", displayName: "Korea Central", lat: 37.57, lng: 126.98 },
  { name: "canadacentral", displayName: "Canada Central", lat: 43.65, lng: -79.38 },
];

/* Connections between regions (indexes into REGION_DEFS) */
export const REGION_CONNECTIONS: [number, number][] = [
  [0, 4], // East US ↔ West Europe
  [0, 3], // East US ↔ Central US
  [0, 16], // East US ↔ Canada Central
  [0, 11], // East US ↔ Brazil South
  [2, 3], // West US 2 ↔ Central US
  [4, 5], // West Europe ↔ North Europe
  [4, 6], // West Europe ↔ UK South
  [4, 12], // West Europe ↔ Central India
  [4, 13], // West Europe ↔ South Africa N
  [7, 8], // SE Asia ↔ East Asia
  [8, 9], // East Asia ↔ Japan East
  [7, 10], // SE Asia ↔ Australia East
  [7, 12], // SE Asia ↔ Central India
  [12, 14], // Central India ↔ UAE North
  [8, 15], // East Asia ↔ Korea Central
];

/* ── Hook ── */

export function useAzureStatus(pollIntervalMs = 30000): AzureStatusData {
  const [services, setServices] = useState<AzureService[]>([]);
  const [regions, setRegions] = useState<AzureRegion[]>([]);
  const [devOpsHealth, setDevOpsHealth] = useState<AzureStatusData["devOpsHealth"]>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Persist statuses across ticks so they don't randomly flip every poll
  const prevServices = useRef<Map<string, AzureService["status"]>>(new Map());
  const prevRegions = useRef<Map<string, AzureRegion["status"]>>(new Map());

  // Fetch real Azure DevOps status
  useEffect(() => {
    let cancelled = false;
    async function fetchDevOps() {
      try {
        const r = await fetch("/api/azure-status", { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (!cancelled) {
          const h = d?.status?.health;
          setDevOpsHealth(h === 0 ? "healthy" : h === 1 ? "degraded" : h === 2 ? "unhealthy" : null);
        }
      } catch {
        /* silent */
      }
    }
    fetchDevOps();
    const id = setInterval(fetchDevOps, pollIntervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [pollIntervalMs]);

  // Generate realistic service + region statuses
  useEffect(() => {
    function tick() {
      const svc: AzureService[] = SERVICE_DEFS.map(def => {
        const prev = prevServices.current.get(def.name) ?? "operational";
        // ~2% chance to change status each tick
        let status: AzureService["status"] = prev;
        if (Math.random() < 0.02) {
          const r = Math.random();
          status = r > 0.92 ? "outage" : r > 0.8 ? "degraded" : r > 0.7 ? "maintenance" : "operational";
        }
        // Degraded/outage statuses auto-resolve after a while
        if (status !== "operational" && Math.random() < 0.15) status = "operational";
        prevServices.current.set(def.name, status);
        return { ...def, status, latency: Math.round(4 + Math.random() * 48) };
      });

      const reg: AzureRegion[] = REGION_DEFS.map(def => {
        const prev = prevRegions.current.get(def.name) ?? "healthy";
        let status: AzureRegion["status"] = prev;
        if (Math.random() < 0.015) {
          status = Math.random() > 0.85 ? "degraded" : "healthy";
        }
        if (status !== "healthy" && Math.random() < 0.2) status = "healthy";
        prevRegions.current.set(def.name, status);
        return { ...def, status, load: Math.round(25 + Math.random() * 65) };
      });

      setServices(svc);
      setRegions(reg);
      setLastUpdated(new Date());
    }

    tick();
    const id = setInterval(tick, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs]);

  return { services, regions, devOpsHealth, lastUpdated };
}
