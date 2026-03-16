"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MetricPoint, DashboardMetrics } from "./useStreamingMetrics";

/* Re-export shared types so the AWS page can import from here */
export type { MetricPoint, DashboardMetrics };

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function drift(current: number, target: number, volatility: number) {
  const noise = (Math.random() - 0.5) * volatility;
  const pull = (target - current) * 0.08;
  return current + pull + noise;
}

interface InternalState {
  cpu: number;
  memory: number;
  network: number;
  instances: number;
  running: number;
  throughput: number;
  avgLatency: number;
  errorRate: number;
}

function tickState(s: InternalState, spike: boolean): InternalState {
  const cpuTarget = spike ? 82 : 48;
  const netTarget = spike ? 72 : 38;
  const tputTarget = spike ? 4200 : 2800;
  const errTarget = spike ? 2.1 : 0.15;

  const cpu = clamp(drift(s.cpu, cpuTarget, spike ? 16 : 8), 10, 97);
  const memory = clamp(drift(s.memory, 62, 4), 30, 94);
  const network = clamp(drift(s.network, netTarget, spike ? 20 : 11), 5, 95);
  const instances = clamp(drift(s.instances, 856, 5), 780, 940);
  const running = clamp(instances - Math.round(4 + Math.random() * 18), 760, instances);
  const throughput = clamp(drift(s.throughput, tputTarget, spike ? 500 : 280), 500, 6000);
  const avgLatency = clamp(drift(s.avgLatency, spike ? 65 : 28, spike ? 10 : 4), 6, 120);
  const errorRate = clamp(drift(s.errorRate, errTarget, spike ? 0.7 : 0.1), 0.01, 5.0);

  return { cpu, memory, network, instances, running, throughput, avgLatency, errorRate };
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const MAX_SPARKLINE = 24;
const MAX_HISTORY = 1800;

const EMPTY_CURRENT = {
  activeResources: 0,
  runningResources: 0,
  stoppedResources: 0,
  throughput: 0,
  p50Latency: 0,
  p99Latency: 0,
  avgLatency: 0,
  errorRate: 0,
  errors4xx: 0,
  errors5xx: 0,
  cpu: 0,
  memory: 0,
  network: 0,
};

const EMPTY: DashboardMetrics = {
  chartData: [],
  current: EMPTY_CURRENT,
  sparklines: { resources: [], throughput: [], latency: [], errorRate: [] },
};

function snapshotCurrent(s: InternalState) {
  return {
    activeResources: Math.round(s.instances),
    runningResources: Math.round(s.running),
    stoppedResources: Math.round(s.instances - s.running),
    throughput: Math.round(s.throughput),
    p50Latency: Math.round(s.avgLatency * 0.65 * 10) / 10,
    p99Latency: Math.round(s.avgLatency * 2.8 * 10) / 10,
    avgLatency: Math.round(s.avgLatency * 10) / 10,
    errorRate: Math.round(s.errorRate * 100) / 100,
    errors4xx: Math.round(s.errorRate * 70),
    errors5xx: Math.round(s.errorRate * 25),
    cpu: Math.round(s.cpu * 10) / 10,
    memory: Math.round(s.memory * 10) / 10,
    network: Math.round(s.network * 10) / 10,
  };
}

export function useAwsMetrics(initialPoints = 60, intervalMs = 2000): DashboardMetrics {
  const stateRef = useRef<InternalState | null>(null);
  const [data, setData] = useState<DashboardMetrics>(EMPTY);

  const buildPoint = useCallback((s: InternalState, t: Date): MetricPoint => ({
    time: formatTime(t),
    cpu: Math.round(s.cpu * 10) / 10,
    memory: Math.round(s.memory * 10) / 10,
    network: Math.round(s.network * 10) / 10,
  }), []);

  useEffect(() => {
    stateRef.current = {
      cpu: 42 + Math.random() * 20,
      memory: 55 + Math.random() * 15,
      network: 30 + Math.random() * 22,
      instances: 840 + Math.random() * 32,
      running: 820,
      throughput: 2500 + Math.random() * 700,
      avgLatency: 24 + Math.random() * 12,
      errorRate: 0.1 + Math.random() * 0.18,
    };

    const now = Date.now();
    const chart: MetricPoint[] = [];
    const sp = { resources: [] as number[], throughput: [] as number[], latency: [] as number[], errorRate: [] as number[] };

    for (let i = initialPoints - 1; i >= 0; i--) {
      const spike = Math.random() > 0.92;
      stateRef.current = tickState(stateRef.current, spike);
      const s = stateRef.current;
      chart.push(buildPoint(s, new Date(now - i * intervalMs)));
      if (i < MAX_SPARKLINE) {
        sp.resources.push(Math.round(s.instances));
        sp.throughput.push(Math.round(s.throughput));
        sp.latency.push(Math.round(s.avgLatency * 10) / 10);
        sp.errorRate.push(Math.round(s.errorRate * 100) / 100);
      }
    }

    setData({
      chartData: chart,
      current: snapshotCurrent(stateRef.current),
      sparklines: sp,
    });

    const id = setInterval(() => {
      if (!stateRef.current) return;
      const spike = Math.random() > 0.93;
      stateRef.current = tickState(stateRef.current, spike);
      const s = stateRef.current;
      const point = buildPoint(s, new Date());

      setData(prev => ({
        chartData: [...prev.chartData.slice(-(MAX_HISTORY - 1)), point],
        current: snapshotCurrent(s),
        sparklines: {
          resources: [...prev.sparklines.resources.slice(-(MAX_SPARKLINE - 1)), Math.round(s.instances)],
          throughput: [...prev.sparklines.throughput.slice(-(MAX_SPARKLINE - 1)), Math.round(s.throughput)],
          latency: [...prev.sparklines.latency.slice(-(MAX_SPARKLINE - 1)), Math.round(s.avgLatency * 10) / 10],
          errorRate: [...prev.sparklines.errorRate.slice(-(MAX_SPARKLINE - 1)), Math.round(s.errorRate * 100) / 100],
        },
      }));
    }, intervalMs);

    return () => clearInterval(id);
  }, [initialPoints, intervalMs, buildPoint]);

  return data;
}
