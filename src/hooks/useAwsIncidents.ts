"use client";

import { useState, useEffect, useRef } from "react";

/* Re-use the same incident shape for component compatibility */
export interface AwsIncident {
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

const INCIDENT_TEMPLATES: Omit<AwsIncident, "id" | "startTime" | "lastUpdate">[] = [
  {
    title: "EC2 API errors - us-east-1",
    description: "We are investigating elevated API error rates for EC2 RunInstances and DescribeInstances calls in the US-EAST-1 Region. Existing instances are not affected.",
    status: "monitoring",
    severity: "warning",
    impactedServices: ["EC2", "ECS / Fargate", "Lambda"],
    region: "us-east-1",
  },
  {
    title: "S3 increased latency - eu-west-1",
    description: "A subset of S3 requests in EU-WEST-1 are experiencing increased latency. PUT and GET operations may see elevated error rates.",
    status: "active",
    severity: "warning",
    impactedServices: ["S3", "CloudFront"],
    region: "eu-west-1",
  },
  {
    title: "CodePipeline execution delays",
    description: "Pipeline executions may experience delays up to 20 minutes due to increased load on the build infrastructure in multiple regions.",
    status: "monitoring",
    severity: "info",
    impactedServices: ["CodePipeline"],
  },
  {
    title: "Planned maintenance - ap-northeast-1",
    description: "Scheduled network maintenance for the ap-northeast-1 Region. Some resources may experience brief connectivity interruptions during the maintenance window.",
    status: "advisory",
    severity: "info",
    impactedServices: ["VPC", "ELB / ALB", "Route 53"],
    region: "ap-northeast-1",
  },
  {
    title: "DynamoDB throttling - ap-southeast-1",
    description: "Increased read/write throttling observed for DynamoDB tables in ap-southeast-1. On-demand tables may also see elevated reject rates.",
    status: "resolved",
    severity: "warning",
    impactedServices: ["DynamoDB"],
    region: "ap-southeast-1",
  },
  {
    title: "KMS key creation failures",
    description: "CreateKey API calls in AWS KMS may fail intermittently for a subset of customers. Existing keys are not affected.",
    status: "monitoring",
    severity: "warning",
    impactedServices: ["KMS"],
  },
  {
    title: "CloudWatch metrics delay",
    description: "Custom metrics may appear delayed by up to 15 minutes in CloudWatch dashboards. Alarms based on custom metrics may also be delayed.",
    status: "resolved",
    severity: "info",
    impactedServices: ["CloudWatch"],
  },
  {
    title: "EKS control plane degradation - us-west-2",
    description: "EKS API server may respond slowly for clusters in us-west-2. Running workloads are not affected.",
    status: "active",
    severity: "critical",
    impactedServices: ["ECS / Fargate"],
    region: "us-west-2",
  },
  {
    title: "CloudFront distribution update delays",
    description: "CloudFront distribution configuration changes may take longer than expected to propagate. Content delivery is not impacted.",
    status: "resolved",
    severity: "info",
    impactedServices: ["CloudFront"],
  },
  {
    title: "ElastiCache node replacement - eu-central-1",
    description: "An automatic node replacement event affected a subset of ElastiCache Redis clusters in eu-central-1. Brief connection drops may have occurred.",
    status: "resolved",
    severity: "warning",
    impactedServices: ["ElastiCache"],
    region: "eu-central-1",
  },
];

function generateIncidents(): AwsIncident[] {
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

export interface AwsIncidentData {
  incidents: AwsIncident[];
  isLoading: boolean;
  lastFetched: Date | null;
  activeCount: number;
  rssAvailable: boolean;
}

export function useAwsIncidents(pollIntervalMs = 60000): AwsIncidentData {
  const [incidents, setIncidents] = useState<AwsIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // All simulated for AWS (no public API)
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
