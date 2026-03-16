"use client";

import { useState, useEffect, useRef } from "react";
import { ActivityEvent } from "./useActivityFeed";

export type { ActivityEvent };

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "ap-northeast-1", "ap-southeast-1", "sa-east-1", "eu-central-1", "ap-south-1", "ca-central-1", "us-east-2"];
const INSTANCES = ["i-0a3b7c9e1", "i-0f8d2a4b6", "i-0c1e5g7h9", "i-02b4d6f8a", "i-09a1c3e5g", "i-04f6h8j2b"];
const DBS = ["prod-rds-primary", "prod-rds-replica", "dynamo-users", "dynamo-sessions", "elasticache-01", "redshift-analytics"];
const FUNCTIONS = ["order-processor", "image-resize", "auth-handler", "payment-webhook", "data-etl", "notification-sender"];
const BUCKETS = ["s3-prod-assets", "s3-data-lake", "s3-backups", "s3-logs-archive"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type Template = { msg: string; severity: ActivityEvent["severity"] };

const TEMPLATES: Template[] = [
  { msg: `EC2 Auto Scaling: +${"{n}"} instances in ${"{region}"}`, severity: "info" },
  { msg: `Lambda cold start: ${"{fn}"} (${"{ms}"}ms) in ${"{region}"}`, severity: "info" },
  { msg: `ECS task deployed: ${"{fn}"}:v${"{ver}"} → ${"{region}"}`, severity: "success" },
  { msg: `CloudWatch alarm resolved: CPU on ${"{inst}"}`, severity: "success" },
  { msg: `S3 lifecycle transition: ${"{size}"} GB → Glacier in ${"{bucket}"}`, severity: "info" },
  { msg: `RDS automated backup: ${"{db}"} completed`, severity: "success" },
  { msg: `ACM certificate renewed: *.${"{domain}"}`, severity: "success" },
  { msg: `AWS Shield: ${"{gbps}"} Gbps DDoS mitigated in ${"{region}"}`, severity: "warning" },
  { msg: `ECS container killed: ${"{fn}"} (OOMKilled)`, severity: "error" },
  { msg: `ALB health check failed: ${"{inst}"}`, severity: "warning" },
  { msg: `DynamoDB throttle: ${"{db}"} (provisioned WCU exceeded)`, severity: "warning" },
  { msg: `Secrets Manager rotation: ${"{secret}"}`, severity: "info" },
  { msg: `Security Group updated: sg-${"{region}"} (port 443)`, severity: "info" },
  { msg: `ElastiCache failover: ${"{db}"}`, severity: "success" },
  { msg: `Lambda timeout: ${"{fn}"} (${"{ms}"}ms > 30s limit)`, severity: "error" },
  { msg: `EKS node group scaled: ng-${"{tier}"} → ${"{n}"} nodes`, severity: "info" },
  { msg: `CloudWatch alarm: Memory pressure on ${"{inst}"}`, severity: "error" },
  { msg: `CloudFront cache invalidated: cf-${"{fn}"}`, severity: "info" },
  { msg: `WAF blocked ${"{n}"} requests: XSS attempt from ${"{region}"}`, severity: "warning" },
  { msg: `EBS snapshot: snap-${"{inst}"}`, severity: "success" },
];

const SECRETS = ["rds-master-password", "api-key-prod", "stripe-webhook-secret", "jwt-signing-key", "sendgrid-api-key"];
const DOMAINS = ["example-corp.com", "startup-io.dev", "enterprise.cloud", "saas-platform.com"];

function generateEvent(): ActivityEvent {
  const tpl = pick(TEMPLATES);
  const msg = tpl.msg
    .replace("{region}", pick(REGIONS))
    .replace("{n}", String(randInt(2, 10)))
    .replace("{tier}", String(randInt(1, 3)))
    .replace("{fn}", pick(FUNCTIONS))
    .replace("{ver}", `${randInt(1, 5)}.${randInt(0, 12)}.${randInt(0, 30)}`)
    .replace("{inst}", pick(INSTANCES))
    .replace("{db}", pick(DBS))
    .replace("{size}", String(randInt(1, 64)))
    .replace("{domain}", pick(DOMAINS))
    .replace("{gbps}", String((Math.random() * 5 + 0.8).toFixed(1)))
    .replace("{secret}", pick(SECRETS))
    .replace("{ms}", String(randInt(150, 4000)))
    .replace("{bucket}", pick(BUCKETS));

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    message: msg,
    severity: tpl.severity,
  };
}

export function useAwsActivityFeed(maxEvents = 50) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initial: ActivityEvent[] = [];
    const now = Date.now();
    for (let i = 7; i >= 0; i--) {
      const evt = generateEvent();
      evt.timestamp = new Date(now - i * randInt(3000, 8000));
      evt.id = `evt-init-${i}`;
      initial.push(evt);
    }
    setEvents(initial);
  }, []);

  useEffect(() => {
    function scheduleNext() {
      const delay = randInt(2500, 7000);
      timeoutRef.current = setTimeout(() => {
        setEvents(prev => {
          const next = [generateEvent(), ...prev];
          return next.slice(0, maxEvents);
        });
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [maxEvents]);

  return events;
}
