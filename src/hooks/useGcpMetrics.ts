"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MetricPoint, DashboardMetrics } from "./useStreamingMetrics";

/* Re-export shared types so the GCP page can import from here */
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
  const cpuTarget = spike ? 78 : 44;
  const netTarget = spike ? 68 : 35;
  const tputTarget = spike ? 5500 : 3400;
  const errTarget = spike ? 1.8 : 0.12;

  const cpu = clamp(drift(s.cpu, cpuTarget, spike ? 14 : 7), 10, 97);
  const memory = clamp(drift(s.memory, 58, 4), 28, 92);
  const network = clamp(drift(s.network, netTarget, spike ? 18 : 10), 5, 95);
  const instances = clamp(drift(s.instances, 1420, 8), 1200, 1650);
  const running = clamp(instances - Math.round(5 + Math.random() * 22), 1180, instances);
  const throughput = clamp(drift(s.throughput, tputTarget, spike ? 600 : 320), 600, 7500);
  const avgLatency = clamp(drift(s.avgLatency, spike ? 58 : 24, spike ? 9 : 3.5), 5, 110);
  const errorRate = clamp(drift(s.errorRate, errTarget, spike ? 0.6 : 0.08), 0.01, 4.5);

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
    p50Latency: Math.round(s.avgLatency * 0.6 * 10) / 10,
    p99Latency: Math.round(s.avgLatency * 2.6 * 10) / 10,
    avgLatency: Math.round(s.avgLatency * 10) / 10,
    errorRate: Math.round(s.errorRate * 100) / 100,
    errors4xx: Math.round(s.errorRate * 65),
    errors5xx: Math.round(s.errorRate * 20),
    cpu: Math.round(s.cpu * 10) / 10,
    memory: Math.round(s.memory * 10) / 10,
    network: Math.round(s.network * 10) / 10,
  };
}

export function useGcpMetrics(initialPoints = 60, intervalMs = 2000): DashboardMetrics {
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
      cpu: 38 + Math.random() * 18,
      memory: 50 + Math.random() * 16,
      network: 28 + Math.random() * 20,
      instances: 1380 + Math.random() * 80,
      running: 1360,
      throughput: 3000 + Math.random() * 800,
      avgLatency: 20 + Math.random() * 10,
      errorRate: 0.08 + Math.random() * 0.15,
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
