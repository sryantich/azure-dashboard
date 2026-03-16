"use client";

import { useState, useEffect, useRef } from "react";

/* ── Types (reuse the same shape as Azure for component compatibility) ── */

export interface AwsService {
  name: string;
  category: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  latency: number;
}

export interface AwsRegion {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  status: "healthy" | "degraded" | "outage";
  load: number;
}

export interface AwsStatusData {
  services: AwsService[];
  regions: AwsRegion[];
  lastUpdated: Date | null;
}

/* ── Static data ── */

const SERVICE_DEFS: { name: string; category: string }[] = [
  { name: "EC2", category: "Compute" },
  { name: "Lambda", category: "Compute" },
  { name: "ECS / Fargate", category: "Compute" },
  { name: "Elastic Beanstalk", category: "Compute" },
  { name: "S3", category: "Storage" },
  { name: "EBS", category: "Storage" },
  { name: "EFS", category: "Storage" },
  { name: "RDS", category: "Databases" },
  { name: "DynamoDB", category: "Databases" },
  { name: "ElastiCache", category: "Databases" },
  { name: "Redshift", category: "Databases" },
  { name: "CloudFront", category: "Networking" },
  { name: "Route 53", category: "Networking" },
  { name: "ELB / ALB", category: "Networking" },
  { name: "VPC", category: "Networking" },
  { name: "API Gateway", category: "Networking" },
  { name: "IAM", category: "Security" },
  { name: "KMS", category: "Security" },
  { name: "CloudWatch", category: "Management" },
  { name: "CloudFormation", category: "Management" },
  { name: "CodePipeline", category: "DevOps" },
  { name: "SageMaker", category: "AI + ML" },
  { name: "Bedrock", category: "AI + ML" },
  { name: "SNS / SQS", category: "Messaging" },
];

const REGION_DEFS: Omit<AwsRegion, "status" | "load">[] = [
  { name: "us-east-1", displayName: "N. Virginia", lat: 38.95, lng: -77.45 },
  { name: "us-east-2", displayName: "Ohio", lat: 40.42, lng: -82.91 },
  { name: "us-west-1", displayName: "N. California", lat: 37.35, lng: -121.96 },
  { name: "us-west-2", displayName: "Oregon", lat: 45.84, lng: -119.7 },
  { name: "eu-west-1", displayName: "Ireland", lat: 53.35, lng: -6.26 },
  { name: "eu-west-2", displayName: "London", lat: 51.51, lng: -0.13 },
  { name: "eu-central-1", displayName: "Frankfurt", lat: 50.12, lng: 8.68 },
  { name: "ap-southeast-1", displayName: "Singapore", lat: 1.35, lng: 103.82 },
  { name: "ap-southeast-2", displayName: "Sydney", lat: -33.87, lng: 151.21 },
  { name: "ap-northeast-1", displayName: "Tokyo", lat: 35.68, lng: 139.65 },
  { name: "ap-northeast-2", displayName: "Seoul", lat: 37.57, lng: 126.98 },
  { name: "ap-south-1", displayName: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "sa-east-1", displayName: "São Paulo", lat: -23.55, lng: -46.63 },
  { name: "ca-central-1", displayName: "Canada", lat: 45.5, lng: -73.6 },
  { name: "me-south-1", displayName: "Bahrain", lat: 26.07, lng: 50.56 },
  { name: "af-south-1", displayName: "Cape Town", lat: -33.92, lng: 18.42 },
];

/* Connections between regions (indexes into REGION_DEFS) */
export const AWS_REGION_CONNECTIONS: [number, number][] = [
  [0, 1],   // N. Virginia ↔ Ohio
  [0, 13],  // N. Virginia ↔ Canada
  [0, 4],   // N. Virginia ↔ Ireland
  [0, 12],  // N. Virginia ↔ São Paulo
  [2, 3],   // N. California ↔ Oregon
  [3, 9],   // Oregon ↔ Tokyo
  [4, 5],   // Ireland ↔ London
  [4, 6],   // Ireland ↔ Frankfurt
  [6, 14],  // Frankfurt ↔ Bahrain
  [6, 11],  // Frankfurt ↔ Mumbai
  [7, 8],   // Singapore ↔ Sydney
  [7, 11],  // Singapore ↔ Mumbai
  [7, 10],  // Singapore ↔ Seoul
  [9, 10],  // Tokyo ↔ Seoul
  [15, 4],  // Cape Town ↔ Ireland
];

/* ── Hook ── */

export function useAwsStatus(pollIntervalMs = 30000): AwsStatusData {
  const [services, setServices] = useState<AwsService[]>([]);
  const [regions, setRegions] = useState<AwsRegion[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const prevServices = useRef<Map<string, AwsService["status"]>>(new Map());
  const prevRegions = useRef<Map<string, AwsRegion["status"]>>(new Map());

  useEffect(() => {
    function tick() {
      const svc: AwsService[] = SERVICE_DEFS.map(def => {
        const prev = prevServices.current.get(def.name) ?? "operational";
        let status: AwsService["status"] = prev;
        if (Math.random() < 0.02) {
          const r = Math.random();
          status = r > 0.93 ? "outage" : r > 0.82 ? "degraded" : r > 0.72 ? "maintenance" : "operational";
        }
        if (status !== "operational" && Math.random() < 0.15) status = "operational";
        prevServices.current.set(def.name, status);
        return { ...def, status, latency: Math.round(3 + Math.random() * 42) };
      });

      const reg: AwsRegion[] = REGION_DEFS.map(def => {
        const prev = prevRegions.current.get(def.name) ?? "healthy";
        let status: AwsRegion["status"] = prev;
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
