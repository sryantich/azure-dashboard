"use client";

import { useState, useEffect, useRef } from "react";

export interface ActivityEvent {
  id: string;
  timestamp: Date;
  message: string;
  severity: "info" | "warning" | "error" | "success";
}

const REGIONS = ["East US", "West Europe", "SE Asia", "Japan East", "Australia East", "Brazil South", "Central India", "UK South", "Canada Central", "West US 2"];
const VMS = ["vm-web-01", "vm-api-03", "vm-analytics-07", "vm-worker-12", "vm-cache-02", "vm-gateway-05"];
const DBS = ["db-prod-sql", "db-analytics", "cosmos-users", "cosmos-telemetry", "redis-session", "redis-cache"];
const SERVICES = ["api-service", "web-frontend", "auth-service", "payment-gateway", "notification-svc", "data-pipeline"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type Template = { msg: string; severity: ActivityEvent["severity"] };

const TEMPLATES: Template[] = [
  { msg: `VM scaled out in ${"{region}"} (+${"{n}"} instances)`, severity: "info" },
  { msg: `Auto-scale triggered: App Service Plan P${"{tier}"}v3`, severity: "info" },
  { msg: `Deployment completed: ${"{svc}"} v${"{ver}"} → ${"{region}"}`, severity: "success" },
  { msg: `Alert resolved: High CPU on ${"{vm}"}`, severity: "success" },
  { msg: `Storage blob archived: ${"{size}"} GB → Cool tier`, severity: "info" },
  { msg: `SQL Database backup completed: ${"{db}"}`, severity: "success" },
  { msg: `Certificate renewed: *.${"{domain}"}`, severity: "success" },
  { msg: `DDoS mitigation activated: ${"{gbps}"} Gbps blocked`, severity: "warning" },
  { msg: `Container restarted: ${"{svc}"} (OOMKilled)`, severity: "error" },
  { msg: `Health probe failed: LB → ${"{vm}"}`, severity: "warning" },
  { msg: `Cosmos DB RU/s threshold exceeded: ${"{db}"}`, severity: "warning" },
  { msg: `Key Vault secret rotated: ${"{secret}"}`, severity: "info" },
  { msg: `NSG rule updated: nsg-${"{region}"} (port 443)`, severity: "info" },
  { msg: `Redis failover completed: ${"{db}"}`, severity: "success" },
  { msg: `Function cold start: ${"{svc}"} (${"{ms}"}ms)`, severity: "info" },
  { msg: `AKS node pool scaled: pool-${"{tier}"} → ${"{n}"} nodes`, severity: "info" },
  { msg: `Alert fired: Memory pressure on ${"{vm}"}`, severity: "error" },
  { msg: `CDN cache purged: cdn-${"{svc}"}`, severity: "info" },
  { msg: `WAF blocked ${"{n}"} requests: SQL injection attempt`, severity: "warning" },
  { msg: `Managed disk snapshot: disk-${"{vm}"}`, severity: "success" },
];

const SECRETS = ["db-connection-string", "api-key-prod", "storage-sas-token", "jwt-signing-key", "smtp-password"];
const DOMAINS = ["contoso.com", "fabrikam.io", "northwind.dev", "adventure-works.com"];

function generateEvent(): ActivityEvent {
  const tpl = pick(TEMPLATES);
  const msg = tpl.msg
    .replace("{region}", pick(REGIONS))
    .replace("{n}", String(randInt(2, 12)))
    .replace("{tier}", String(randInt(1, 3)))
    .replace("{svc}", pick(SERVICES))
    .replace("{ver}", `${randInt(1, 5)}.${randInt(0, 12)}.${randInt(0, 30)}`)
    .replace("{vm}", pick(VMS))
    .replace("{db}", pick(DBS))
    .replace("{size}", String(randInt(1, 48)))
    .replace("{domain}", pick(DOMAINS))
    .replace("{gbps}", String((Math.random() * 4 + 0.5).toFixed(1)))
    .replace("{secret}", pick(SECRETS))
    .replace("{ms}", String(randInt(200, 3500)));

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    message: msg,
    severity: tpl.severity,
  };
}

export function useActivityFeed(maxEvents = 50) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate initial events on mount only (avoid hydration mismatch)
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
