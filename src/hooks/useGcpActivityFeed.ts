"use client";

import { useState, useEffect, useRef } from "react";
import { ActivityEvent } from "./useActivityFeed";

export type { ActivityEvent };

const REGIONS = ["us-central1", "us-east1", "europe-west1", "asia-northeast1", "asia-southeast1", "southamerica-east1", "europe-west3", "asia-south1", "northamerica-northeast1", "us-west1"];
const VMS = ["gce-web-01", "gce-web-02", "gce-api-01", "gce-worker-01", "gce-batch-01", "gce-gpu-01"];
const DBS = ["cloudsql-prod", "cloudsql-replica", "spanner-main", "firestore-users", "bigtable-events", "memorystore-cache"];
const FUNCTIONS = ["process-orders", "resize-images", "auth-webhook", "etl-pipeline", "notify-users", "pdf-generator"];
const BUCKETS = ["gs-prod-assets", "gs-data-lake", "gs-backups", "gs-ml-models", "gs-logs"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type Template = { msg: string; severity: ActivityEvent["severity"] };

const TEMPLATES: Template[] = [
  { msg: `GKE cluster autoscaler: +${"{n}"} nodes in ${"{region}"}`, severity: "info" },
  { msg: `Cloud Function cold start: ${"{fn}"} (${"{ms}"}ms) in ${"{region}"}`, severity: "info" },
  { msg: `Cloud Run revision deployed: ${"{fn}"}:v${"{ver}"} → ${"{region}"}`, severity: "success" },
  { msg: `Cloud Monitoring alert resolved: CPU on ${"{vm}"}`, severity: "success" },
  { msg: `Cloud Storage lifecycle: ${"{size}"} GB → Nearline in ${"{bucket}"}`, severity: "info" },
  { msg: `Cloud SQL automated backup: ${"{db}"} completed`, severity: "success" },
  { msg: `Managed SSL certificate renewed: *.${"{domain}"}`, severity: "success" },
  { msg: `Cloud Armor: ${"{n}"} requests blocked (SQLi attempt from ${"{region}"})`, severity: "warning" },
  { msg: `GKE pod OOMKilled: ${"{fn}"} in ${"{region}"}`, severity: "error" },
  { msg: `Cloud Load Balancing health check failed: ${"{vm}"}`, severity: "warning" },
  { msg: `Firestore throttle: ${"{db}"} (quota exceeded)`, severity: "warning" },
  { msg: `Secret Manager rotation: ${"{secret}"}`, severity: "info" },
  { msg: `VPC firewall rule updated: allow-${"{region}"} (port 443)`, severity: "info" },
  { msg: `Memorystore failover: ${"{db}"}`, severity: "success" },
  { msg: `Cloud Function timeout: ${"{fn}"} (${"{ms}"}ms > 540s limit)`, severity: "error" },
  { msg: `GKE node pool scaled: pool-${"{tier}"} → ${"{n}"} nodes`, severity: "info" },
  { msg: `Cloud Monitoring alert: Memory pressure on ${"{vm}"}`, severity: "error" },
  { msg: `Cloud CDN cache invalidated: ${"{fn}"}`, severity: "info" },
  { msg: `BigQuery slot utilization: ${"{n}"}% in ${"{region}"}`, severity: "warning" },
  { msg: `Pub/Sub dead-letter: ${"{n}"} messages in ${"{fn}"}-dlq`, severity: "warning" },
];

const SECRETS = ["cloudsql-password", "api-key-prod", "stripe-secret", "jwt-signing-key", "firebase-admin-key"];
const DOMAINS = ["example-corp.com", "startup-io.dev", "enterprise.cloud", "saas-platform.com"];

function generateEvent(): ActivityEvent {
  const tpl = pick(TEMPLATES);
  const msg = tpl.msg
    .replace("{region}", pick(REGIONS))
    .replace("{n}", String(randInt(2, 10)))
    .replace("{tier}", String(randInt(1, 3)))
    .replace("{fn}", pick(FUNCTIONS))
    .replace("{ver}", `${randInt(1, 5)}.${randInt(0, 12)}.${randInt(0, 30)}`)
    .replace("{vm}", pick(VMS))
    .replace("{db}", pick(DBS))
    .replace("{size}", String(randInt(1, 64)))
    .replace("{domain}", pick(DOMAINS))
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

export function useGcpActivityFeed(maxEvents = 50) {
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
