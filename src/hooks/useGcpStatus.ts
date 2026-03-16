"use client";

import { useState, useEffect, useRef } from "react";

/* ── Types (same shape as Azure/AWS for component compatibility) ── */

export interface GcpService {
  name: string;
  category: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  latency: number;
}

export interface GcpRegion {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  status: "healthy" | "degraded" | "outage";
  load: number;
}

export interface GcpStatusData {
  services: GcpService[];
  regions: GcpRegion[];
  lastUpdated: Date | null;
}

/* ── Static data ── */

const SERVICE_DEFS: { name: string; category: string }[] = [
  { name: "Compute Engine", category: "Compute" },
  { name: "Cloud Functions", category: "Compute" },
  { name: "Cloud Run", category: "Compute" },
  { name: "App Engine", category: "Compute" },
  { name: "GKE", category: "Compute" },
  { name: "Cloud Storage", category: "Storage" },
  { name: "Persistent Disk", category: "Storage" },
  { name: "Filestore", category: "Storage" },
  { name: "Cloud SQL", category: "Databases" },
  { name: "Cloud Spanner", category: "Databases" },
  { name: "Firestore", category: "Databases" },
  { name: "Bigtable", category: "Databases" },
  { name: "Memorystore", category: "Databases" },
  { name: "Cloud CDN", category: "Networking" },
  { name: "Cloud DNS", category: "Networking" },
  { name: "Cloud Load Balancing", category: "Networking" },
  { name: "VPC", category: "Networking" },
  { name: "Cloud IAM", category: "Security" },
  { name: "Cloud KMS", category: "Security" },
  { name: "Security Command Center", category: "Security" },
  { name: "Cloud Monitoring", category: "Operations" },
  { name: "Cloud Logging", category: "Operations" },
  { name: "Vertex AI", category: "AI + ML" },
  { name: "BigQuery", category: "Analytics" },
  { name: "Pub/Sub", category: "Messaging" },
  { name: "Cloud Build", category: "DevOps" },
];

const REGION_DEFS: Omit<GcpRegion, "status" | "load">[] = [
  { name: "us-central1", displayName: "Iowa", lat: 41.26, lng: -95.86 },
  { name: "us-east1", displayName: "S. Carolina", lat: 33.84, lng: -81.16 },
  { name: "us-east4", displayName: "N. Virginia", lat: 39.03, lng: -77.47 },
  { name: "us-west1", displayName: "Oregon", lat: 45.59, lng: -121.18 },
  { name: "europe-west1", displayName: "Belgium", lat: 50.45, lng: 3.73 },
  { name: "europe-west2", displayName: "London", lat: 51.51, lng: -0.13 },
  { name: "europe-west3", displayName: "Frankfurt", lat: 50.11, lng: 8.68 },
  { name: "asia-east1", displayName: "Taiwan", lat: 24.05, lng: 120.69 },
  { name: "asia-northeast1", displayName: "Tokyo", lat: 35.68, lng: 139.65 },
  { name: "asia-southeast1", displayName: "Singapore", lat: 1.35, lng: 103.82 },
  { name: "asia-south1", displayName: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "australia-southeast1", displayName: "Sydney", lat: -33.87, lng: 151.21 },
  { name: "southamerica-east1", displayName: "São Paulo", lat: -23.55, lng: -46.63 },
  { name: "northamerica-northeast1", displayName: "Montréal", lat: 45.50, lng: -73.57 },
  { name: "me-west1", displayName: "Tel Aviv", lat: 32.07, lng: 34.78 },
];

/* Connections between regions (indexes into REGION_DEFS) */
export const GCP_REGION_CONNECTIONS: [number, number][] = [
  [0, 1],   // Iowa ↔ S. Carolina
  [0, 3],   // Iowa ↔ Oregon
  [0, 13],  // Iowa ↔ Montréal
  [1, 2],   // S. Carolina ↔ N. Virginia
  [2, 4],   // N. Virginia ↔ Belgium
  [2, 12],  // N. Virginia ↔ São Paulo
  [4, 5],   // Belgium ↔ London
  [4, 6],   // Belgium ↔ Frankfurt
  [6, 14],  // Frankfurt ↔ Tel Aviv
  [6, 10],  // Frankfurt ↔ Mumbai
  [8, 7],   // Tokyo ↔ Taiwan
  [8, 9],   // Tokyo ↔ Singapore
  [9, 10],  // Singapore ↔ Mumbai
  [9, 11],  // Singapore ↔ Sydney
  [3, 8],   // Oregon ↔ Tokyo
];

/* ── Hook ── */

export function useGcpStatus(pollIntervalMs = 30000): GcpStatusData {
  const [services, setServices] = useState<GcpService[]>([]);
  const [regions, setRegions] = useState<GcpRegion[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const prevServices = useRef<Map<string, GcpService["status"]>>(new Map());
  const prevRegions = useRef<Map<string, GcpRegion["status"]>>(new Map());

  useEffect(() => {
    function tick() {
      const svc: GcpService[] = SERVICE_DEFS.map(def => {
        const prev = prevServices.current.get(def.name) ?? "operational";
        let status: GcpService["status"] = prev;
        if (Math.random() < 0.02) {
          const r = Math.random();
          status = r > 0.93 ? "outage" : r > 0.82 ? "degraded" : r > 0.72 ? "maintenance" : "operational";
        }
        if (status !== "operational" && Math.random() < 0.15) status = "operational";
        prevServices.current.set(def.name, status);
        return { ...def, status, latency: Math.round(3 + Math.random() * 42) };
      });

      const reg: GcpRegion[] = REGION_DEFS.map(def => {
        const prev = prevRegions.current.get(def.name) ?? "healthy";
        let status: GcpRegion["status"] = prev;
        if (Math.random() < 0.015) {
          status = Math.random() > 0.85 ? "degraded" : "healthy";
        }
        if (status !== "healthy" && Math.random() < 0.2) status = "healthy";
        prevRegions.current.set(def.name, status);
        return { ...def, status, load: Math.round(20 + Math.random() * 70) };
      });

      setServices(svc);
      setRegions(reg);
      setLastUpdated(new Date());
    }

    tick();
    const id = setInterval(tick, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs]);

  return { services, regions, lastUpdated };
}
