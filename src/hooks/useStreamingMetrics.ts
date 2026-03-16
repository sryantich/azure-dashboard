"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface MetricPoint {
  time: string;
  cpu: number;
  memory: number;
  network: number;
}

export interface DashboardMetrics {
  chartData: MetricPoint[];
  current: {
    activeResources: number;
    runningResources: number;
    stoppedResources: number;
    throughput: number;
    p50Latency: number;
    p99Latency: number;
    avgLatency: number;
    errorRate: number;
    errors4xx: number;
    errors5xx: number;
    cpu: number;
    memory: number;
    network: number;
  };
  sparklines: {
    resources: number[];
    throughput: number[];
    latency: number[];
    errorRate: number[];
  };
}

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
  resources: number;
  running: number;
  throughput: number;
  avgLatency: number;
  errorRate: number;
}

function tickState(s: InternalState, spike: boolean): InternalState {
  const cpuTarget = spike ? 88 : 58;
  const netTarget = spike ? 68 : 32;
  const tputTarget = spike ? 3800 : 2200;
  const errTarget = spike ? 1.8 : 0.12;

  const cpu = clamp(drift(s.cpu, cpuTarget, spike ? 14 : 7), 12, 98);
  const memory = clamp(drift(s.memory, 68, 3.5), 35, 96);
  const network = clamp(drift(s.network, netTarget, spike ? 18 : 10), 4, 92);
  const resources = clamp(drift(s.resources, 1204, 4), 1150, 1260);
  const running = clamp(resources - Math.round(8 + Math.random() * 30), 1120, resources);
  const throughput = clamp(drift(s.throughput, tputTarget, spike ? 450 : 250), 400, 5200);
  const avgLatency = clamp(drift(s.avgLatency, spike ? 78 : 38, spike ? 12 : 5), 8, 150);
  const errorRate = clamp(drift(s.errorRate, errTarget, spike ? 0.6 : 0.08), 0.01, 4.5);

  return { cpu, memory, network, resources, running, throughput, avgLatency, errorRate };
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const MAX_SPARKLINE = 24;
/* Keep enough data for 1 hour at 2s intervals */
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
    activeResources: Math.round(s.resources),
    runningResources: Math.round(s.running),
    stoppedResources: Math.round(s.resources - s.running),
    throughput: Math.round(s.throughput),
    p50Latency: Math.round(s.avgLatency * 0.7 * 10) / 10,
    p99Latency: Math.round(s.avgLatency * 2.6 * 10) / 10,
    avgLatency: Math.round(s.avgLatency * 10) / 10,
    errorRate: Math.round(s.errorRate * 100) / 100,
    errors4xx: Math.round(s.errorRate * 80),
    errors5xx: Math.round(s.errorRate * 20),
    cpu: Math.round(s.cpu * 10) / 10,
    memory: Math.round(s.memory * 10) / 10,
    network: Math.round(s.network * 10) / 10,
  };
}

export function useStreamingMetrics(initialPoints = 60, intervalMs = 2000): DashboardMetrics {
  const stateRef = useRef<InternalState | null>(null);
  const [data, setData] = useState<DashboardMetrics>(EMPTY);

  const buildPoint = useCallback((s: InternalState, t: Date): MetricPoint => ({
    time: formatTime(t),
    cpu: Math.round(s.cpu * 10) / 10,
    memory: Math.round(s.memory * 10) / 10,
    network: Math.round(s.network * 10) / 10,
  }), []);

  // Generate initial data only on mount (client-side) to avoid hydration mismatch
  useEffect(() => {
    stateRef.current = {
      cpu: 52 + Math.random() * 18,
      memory: 62 + Math.random() * 12,
      network: 25 + Math.random() * 20,
      resources: 1190 + Math.random() * 28,
      running: 1170,
      throughput: 2000 + Math.random() * 600,
      avgLatency: 32 + Math.random() * 16,
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
        sp.resources.push(Math.round(s.resources));
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

    // Start streaming
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
          resources: [...prev.sparklines.resources.slice(-(MAX_SPARKLINE - 1)), Math.round(s.resources)],
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
