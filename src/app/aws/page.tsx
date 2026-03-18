"use client";

import { motion, type Variants } from "framer-motion";
import {
  Server,
  Gauge,
  Timer,
  AlertTriangle,
  Cloud,
} from "lucide-react";
import MetricCard from "../../components/MetricCard";
import UsageChart from "../../components/UsageChart";
import AwsCostChart from "../../components/AwsCostChart";
import NetworkMap from "../../components/NetworkMap";
import ServiceStatusGrid from "../../components/ServiceStatusGrid";
import ActivityFeed from "../../components/ActivityFeed";
import IncidentsFeed from "../../components/IncidentsFeed";
import ResourceHealthPanel from "../../components/ResourceHealthPanel";
import ThemeSelector from "../../components/ThemeSelector";
import NavBar from "../../components/NavBar";
import UserMenu from "../../components/UserMenu";
import DataSourceBadge from "../../components/DataSourceBadge";
import ClientOnly from "../../components/ClientOnly";
import DashboardSkeleton from "../../components/DashboardSkeleton";
import { useLiveClock } from "../../hooks/useLiveClock";
import { useAwsMetrics } from "../../hooks/useAwsMetrics";
import { useAwsStatus, AWS_REGION_CONNECTIONS } from "../../hooks/useAwsStatus";
import { useAwsActivityFeed } from "../../hooks/useAwsActivityFeed";
import { useAwsIncidents } from "../../hooks/useAwsIncidents";
import { useAwsResourceHealth } from "../../hooks/useAwsResourceHealth";
import { ThemeProvider, useTheme } from "../../hooks/useTheme";

/* ── Formatters ── */
const fmtInt = (v: number) => Math.round(v).toLocaleString();
const fmtReqS = (v: number) => Math.round(v).toLocaleString();
const fmtMs = (v: number) => v.toFixed(1);
const fmtPct = (v: number) => v.toFixed(2);

/* ── Stagger entrance variants ── */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function AwsDashboard() {
  const clock = useLiveClock();
  const metrics = useAwsMetrics(40, 2000);
  const aws = useAwsStatus(30000);
  const events = useAwsActivityFeed(50);
  const incidents = useAwsIncidents(60000);
  const resourceHealth = useAwsResourceHealth(10000);
  const { theme } = useTheme();

  const c = metrics.current;
  const hasData = metrics.chartData.length > 0;

  if (!hasData) return <DashboardSkeleton />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen pb-12 pt-6 px-4 md:px-8 lg:px-16 max-w-[1440px] mx-auto selection:bg-azure-accent/30 relative scanline"
    >
      {/* ── Header ── */}
      <motion.header
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-2.5">
            <Cloud className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: "#f59e0b" }} />
            AWS Live Ops
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm font-medium tracking-wide">
            Real-time AWS infrastructure & performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Cloud provider selector */}
          <NavBar />
          {/* Theme selector */}
          <ThemeSelector />
          {/* User menu */}
          <UserMenu />
          {/* Data source indicator */}
          <DataSourceBadge provider="aws" />
          {/* Live clock */}
          {clock && (
            <div className="text-xs font-mono bg-azure-bg/60 border border-azure-card-hover/50 rounded-lg px-3 py-1.5"
              style={{ color: theme.textMuted }}>
              <span style={{ color: theme.textSecondary }}>UTC </span>
              <span style={{ color: theme.textPrimary }}>
                {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          )}
          {/* Status badge */}
          <div className="flex items-center gap-2 bg-azure-card/40 border border-azure-card-hover/50 rounded-full px-3.5 py-1.5 backdrop-blur-md">
            <div className="relative">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.success }} />
              <div className="absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-75" style={{ backgroundColor: theme.success }} />
            </div>
            <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: theme.success }}>
              Operational
            </span>
          </div>
        </div>
      </motion.header>

      {/* ── Metrics Row ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="EC2 Instances"
          value={c.activeResources}
          format={fmtInt}
          changeLabel={c.runningResources > 830 ? `+${c.activeResources - 840}` : `${c.activeResources - 840}`}
          trend={c.activeResources >= 840 ? "up" : "down"}
          trendIsGood={true}
          icon={Server}
          sparklineData={metrics.sparklines.resources}
          sparklineColor={theme.chart1}
          delay={0}
        >
          <div className="flex justify-between text-[11px]" style={{ color: theme.textMuted }}>
            <span>Running: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.runningResources.toLocaleString()}</span></span>
            <span>Stopped: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.stoppedResources}</span></span>
          </div>
        </MetricCard>

        <MetricCard
          title="Throughput"
          value={c.throughput}
          format={fmtReqS}
          unit="req/s"
          changeLabel={c.throughput > 2800 ? `+${((c.throughput / 2800 - 1) * 100).toFixed(1)}%` : `${((c.throughput / 2800 - 1) * 100).toFixed(1)}%`}
          trend={c.throughput > 2800 ? "up" : c.throughput < 2200 ? "down" : "neutral"}
          trendIsGood={true}
          icon={Gauge}
          sparklineData={metrics.sparklines.throughput}
          sparklineColor={theme.chart2}
          delay={0.05}
        >
          <div className="flex justify-between text-[11px]" style={{ color: theme.textMuted }}>
            <span>P50: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.p50Latency}ms</span></span>
            <span>P99: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.p99Latency}ms</span></span>
          </div>
        </MetricCard>

        <MetricCard
          title="Avg Latency"
          value={c.avgLatency}
          format={fmtMs}
          unit="ms"
          changeLabel={c.avgLatency > 35 ? `+${(c.avgLatency - 28).toFixed(0)}ms` : `${(c.avgLatency - 28).toFixed(0)}ms`}
          trend={c.avgLatency > 40 ? "up" : c.avgLatency < 22 ? "down" : "neutral"}
          trendIsGood={false}
          icon={Timer}
          sparklineData={metrics.sparklines.latency}
          sparklineColor={theme.chart3}
          delay={0.1}
        >
          <div className="flex justify-between text-[11px]" style={{ color: theme.textMuted }}>
            <span>CPU: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.cpu}%</span></span>
            <span>Mem: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.memory}%</span></span>
          </div>
        </MetricCard>

        <MetricCard
          title="Error Rate"
          value={c.errorRate}
          format={fmtPct}
          unit="%"
          changeLabel={c.errorRate > 0.5 ? "Elevated" : "Normal"}
          trend={c.errorRate > 1 ? "up" : c.errorRate < 0.2 ? "down" : "neutral"}
          trendIsGood={false}
          icon={AlertTriangle}
          sparklineData={metrics.sparklines.errorRate}
          sparklineColor={c.errorRate > 1 ? theme.error : theme.warning}
          delay={0.15}
        >
          <div className="flex justify-between text-[11px]" style={{ color: theme.textMuted }}>
            <span>4xx: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.errors4xx}</span></span>
            <span>5xx: <span className="font-medium" style={{ color: theme.textPrimary }}>{c.errors5xx}</span></span>
          </div>
        </MetricCard>
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <UsageChart
          data={metrics.chartData}
          cpu={c.cpu}
          memory={c.memory}
          network={c.network}
        />
        <AwsCostChart />
      </motion.div>

      {/* ── Status + Feed Row ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <ServiceStatusGrid services={aws.services as never} title="AWS Service Health" />
        <ActivityFeed events={events} />
      </motion.div>

      {/* ── Incidents + Resource Health Row ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <IncidentsFeed data={incidents as never} />
        <ResourceHealthPanel data={resourceHealth} />
      </motion.div>

      {/* ── Network Map ── */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">
        <NetworkMap
          regions={aws.regions}
          connections={AWS_REGION_CONNECTIONS}
          title="Global AWS Regions"
          subtitle={`${aws.regions.length} regions monitored \u00b7 ${AWS_REGION_CONNECTIONS.length} network links`}
        />
      </motion.div>
    </motion.div>
  );
}

export default function AwsPage() {
  return (
    <ThemeProvider>
      <ClientOnly fallback={<DashboardSkeleton />}>
        <AwsDashboard />
      </ClientOnly>
    </ThemeProvider>
  );
}
