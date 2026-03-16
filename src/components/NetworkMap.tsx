"use client";

import { motion } from "framer-motion";
import React, { useState, useMemo } from "react";
import type { AzureRegion } from "../hooks/useAzureStatus";
import { REGION_CONNECTIONS } from "../hooks/useAzureStatus";
import { getWorldPaths, project, MAP_W, MAP_H } from "../data/worldMapPaths";
import { useTheme } from "../hooks/useTheme";
import type { ThemePalette } from "../data/themes";

interface NetworkMapProps {
  regions: AzureRegion[];
}

function getStatusColors(t: ThemePalette) {
  return {
    healthy: t.success,
    degraded: t.warning,
    outage: t.error,
  } as const;
}

function getStatusGlow(t: ThemePalette) {
  return {
    healthy: `${t.success}80`,
    degraded: `${t.warning}80`,
    outage: `${t.error}80`,
  } as const;
}

/* ── Connection line with animated dashes ── */
function ConnectionLine({
  x1, y1, x2, y2, delay, statusA, statusB, theme,
}: {
  x1: number; y1: number; x2: number; y2: number; delay: number;
  statusA: AzureRegion["status"]; statusB: AzureRegion["status"];
  theme: ThemePalette;
}) {
  const midX = (x1 + x2) / 2;
  const midY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.06 - 12;
  const d = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

  const worst = statusA === "outage" || statusB === "outage"
    ? "outage"
    : statusA === "degraded" || statusB === "degraded"
    ? "degraded"
    : "healthy";

  const lineColor = worst === "outage" ? theme.error : worst === "degraded" ? theme.warning : theme.accent;
  const lineOpacity = worst === "healthy" ? 0.12 : 0.2;
  const dashOpacity = worst === "healthy" ? 0.35 : 0.55;

  return (
    <g>
      <path d={d} fill="none" stroke={lineColor} strokeWidth={2.5} strokeOpacity={lineOpacity * 0.5} />
      <path d={d} fill="none" stroke={lineColor} strokeWidth={0.8} strokeOpacity={lineOpacity} />
      <path
        d={d}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.2}
        strokeOpacity={dashOpacity}
        strokeDasharray="3 9"
        className="animate-[dash_4s_linear_infinite]"
        style={{ animationDelay: `${delay}s` }}
      />
    </g>
  );
}

/* ── Data packet traveling along connection ── */
function DataPacket({
  x1, y1, x2, y2, duration, delay, index, color,
}: {
  x1: number; y1: number; x2: number; y2: number;
  duration: number; delay: number; index: number; color: string;
}) {
  const midX = (x1 + x2) / 2;
  const midY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.06 - 12;
  const pathId = `pkt-${index}`;

  return (
    <g>
      <defs>
        <path id={pathId} d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`} />
      </defs>
      <circle r="5" fill={color} opacity={0.15}>
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
      <circle r="2" fill={color} opacity={0.8}>
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
      <circle r="0.8" fill="white" opacity={0.9}>
        <animateMotion dur={`${duration}s`} repeatCount="indefinite" begin={`${delay}s`}>
          <mpath href={`#${pathId}`} />
        </animateMotion>
      </circle>
    </g>
  );
}

/* ── Region dot with hover area ── */
function RegionDot({
  region,
  onHover,
  onLeave,
  statusColors,
  statusGlow,
}: {
  region: AzureRegion;
  onHover: (r: AzureRegion, pos: { x: number; y: number }) => void;
  onLeave: () => void;
  statusColors: Record<AzureRegion["status"], string>;
  statusGlow: Record<AzureRegion["status"], string>;
}) {
  const { x, y } = project(region.lat, region.lng);
  const color = statusColors[region.status];
  const glow = statusGlow[region.status];

  return (
    <g
      onMouseEnter={() => onHover(region, { x, y })}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      <circle cx={x} cy={y} r={8} fill={color} opacity={0.1}>
        <animate attributeName="r" values="6;16;6" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.12;0.02;0.12" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={5} fill={glow} opacity={0.25}>
        <animate attributeName="r" values="4;7;4" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.08;0.2" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={3.5} fill={color} opacity={0.9} />
      <circle cx={x} cy={y} r={1.5} fill="white" opacity={0.7} />
      <circle cx={x} cy={y} r={14} fill="transparent" />
    </g>
  );
}

/* ── Lat/Lng graticule grid ── */
function Graticule({ gridColor }: { gridColor: string }) {
  const lines: React.ReactElement[] = [];
  for (let lng = -180; lng <= 180; lng += 30) {
    const p1 = project(75, lng);
    const p2 = project(-55, lng);
    lines.push(
      <line
        key={`v${lng}`}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={gridColor} strokeWidth={0.4} strokeOpacity={0.3}
        strokeDasharray="2 4"
      />
    );
  }
  for (let lat = -40; lat <= 70; lat += 20) {
    const p1 = project(lat, -170);
    const p2 = project(lat, 180);
    lines.push(
      <line
        key={`h${lat}`}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={gridColor} strokeWidth={0.4} strokeOpacity={0.3}
        strokeDasharray="2 4"
      />
    );
  }
  const eq1 = project(0, -170);
  const eq2 = project(0, 180);
  lines.push(
    <line
      key="equator"
      x1={eq1.x} y1={eq1.y} x2={eq2.x} y2={eq2.y}
      stroke={gridColor} strokeWidth={0.6} strokeOpacity={0.4}
      strokeDasharray="4 6"
    />
  );
  return <>{lines}</>;
}

/* ── Main component ── */
export default function NetworkMap({ regions }: NetworkMapProps) {
  const { theme } = useTheme();
  const statusColors = useMemo(() => getStatusColors(theme), [theme]);
  const statusGlow = useMemo(() => getStatusGlow(theme), [theme]);

  const [tooltip, setTooltip] = useState<{
    region: AzureRegion;
    x: number;
    y: number;
  } | null>(null);

  const healthyCount = regions.filter((r) => r.status === "healthy").length;
  const degradedCount = regions.filter((r) => r.status === "degraded").length;
  const outageCount = regions.filter((r) => r.status === "outage").length;

  const worldPaths = useMemo(() => getWorldPaths(), []);

  const regionStatusMap = useMemo(() => {
    const m = new Map<number, AzureRegion["status"]>();
    regions.forEach((r, i) => m.set(i, r.status));
    return m;
  }, [regions]);

  const ttX = tooltip ? (tooltip.x > MAP_W - 200 ? tooltip.x - 175 : tooltip.x + 15) : 0;
  const ttY = tooltip ? (tooltip.y < 60 ? tooltip.y + 10 : tooltip.y - 50) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      className="col-span-1 lg:col-span-3 rounded-2xl border border-azure-card hover:border-azure-accent/20 bg-azure-card/50 backdrop-blur-xl p-5 relative overflow-hidden transition-all duration-300"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 40% 40%, ${theme.accentMuted} 0%, transparent 50%)` }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative">
        <div>
          <h2 className="text-base font-semibold" style={{ color: theme.textPrimary }}>
            Global Azure Regions
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: theme.textMuted }}>
            {regions.length} regions monitored &middot;{" "}
            {REGION_CONNECTIONS.length} network links
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.success, boxShadow: `0 0 6px ${theme.success}` }} />
            <span style={{ color: theme.textSecondary }}>{healthyCount} Healthy</span>
          </div>
          {degradedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.warning, boxShadow: `0 0 6px ${theme.warning}` }} />
              <span style={{ color: theme.textSecondary }}>{degradedCount} Degraded</span>
            </div>
          )}
          {outageCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.error, boxShadow: `0 0 6px ${theme.error}` }} />
              <span style={{ color: theme.textSecondary }}>{outageCount} Outage</span>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: `${MAP_W}/${MAP_H}` }}>
        <svg
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          className="w-full h-full"
          style={{ background: `linear-gradient(180deg, ${theme.mapBg[0]} 0%, ${theme.mapBg[1]} 40%, ${theme.mapBg[2]} 100%)` }}
        >
          <defs>
            <radialGradient id="ocean-glow-1" cx="30%" cy="50%" r="40%">
              <stop offset="0%" stopColor={theme.mapOceanGlow1} stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ocean-glow-2" cx="75%" cy="45%" r="35%">
              <stop offset="0%" stopColor={theme.mapOceanGlow2} stopOpacity="1" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="land-fill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.mapLand[0]} />
              <stop offset="100%" stopColor={theme.mapLand[1]} />
            </linearGradient>
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <filter id="line-glow" x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>

          <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#ocean-glow-1)" />
          <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#ocean-glow-2)" />

          <Graticule gridColor={theme.mapGrid} />

          {/* ── World landmasses ── */}
          <g>
            {worldPaths.countries.map((country) => (
              <path
                key={country.id}
                d={country.path}
                fill="url(#land-fill)"
                stroke={theme.mapLandStroke}
                strokeWidth={0.5}
                strokeOpacity={0.5}
                strokeLinejoin="round"
                opacity={0.85}
              />
            ))}
            <path
              d={worldPaths.land}
              fill="none"
              stroke={theme.accent}
              strokeWidth={0.3}
              strokeOpacity={0.12}
              strokeLinejoin="round"
            />
          </g>

          {/* ── Connection lines ── */}
          <g filter="url(#line-glow)" opacity={0.5}>
            {regions.length > 0 &&
              REGION_CONNECTIONS.map(([from, to], i) => {
                if (from >= regions.length || to >= regions.length) return null;
                const a = project(regions[from].lat, regions[from].lng);
                const b = project(regions[to].lat, regions[to].lng);
                return (
                  <ConnectionLine
                    key={`glow-${i}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    delay={i * 0.3}
                    statusA={regionStatusMap.get(from) ?? "healthy"}
                    statusB={regionStatusMap.get(to) ?? "healthy"}
                    theme={theme}
                  />
                );
              })}
          </g>
          <g>
            {regions.length > 0 &&
              REGION_CONNECTIONS.map(([from, to], i) => {
                if (from >= regions.length || to >= regions.length) return null;
                const a = project(regions[from].lat, regions[from].lng);
                const b = project(regions[to].lat, regions[to].lng);
                return (
                  <ConnectionLine
                    key={`conn-${i}`}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    delay={i * 0.3}
                    statusA={regionStatusMap.get(from) ?? "healthy"}
                    statusB={regionStatusMap.get(to) ?? "healthy"}
                    theme={theme}
                  />
                );
              })}
          </g>

          {/* ── Data packets ── */}
          <g>
            {regions.length > 0 &&
              REGION_CONNECTIONS.map(([from, to], i) => {
                if (from >= regions.length || to >= regions.length) return null;
                const a = project(regions[from].lat, regions[from].lng);
                const b = project(regions[to].lat, regions[to].lng);
                return (
                  <g key={`pkts-${i}`}>
                    <DataPacket
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      duration={3 + (i % 5) * 0.8}
                      delay={i * 0.5}
                      index={i * 2}
                      color={theme.accent}
                    />
                    <DataPacket
                      x1={b.x} y1={b.y} x2={a.x} y2={a.y}
                      duration={4 + (i % 4) * 0.6}
                      delay={i * 0.5 + 1.5}
                      index={i * 2 + 1}
                      color={theme.accent}
                    />
                  </g>
                );
              })}
          </g>

          {/* ── Region dots ── */}
          <g filter="url(#node-glow)" opacity={0.6}>
            {regions.map((r) => {
              const { x, y } = project(r.lat, r.lng);
              return (
                <circle
                  key={`glow-${r.name}`}
                  cx={x}
                  cy={y}
                  r={6}
                  fill={statusColors[r.status]}
                />
              );
            })}
          </g>
          <g>
            {regions.map((r) => (
              <RegionDot
                key={r.name}
                region={r}
                onHover={(region, pos) => setTooltip({ region, x: pos.x, y: pos.y })}
                onLeave={() => setTooltip(null)}
                statusColors={statusColors}
                statusGlow={statusGlow}
              />
            ))}
          </g>

          {/* ── Region labels ── */}
          <g>
            {regions.map((r) => {
              const { x, y } = project(r.lat, r.lng);
              return (
                <text
                  key={`label-${r.name}`}
                  x={x}
                  y={y + 14}
                  textAnchor="middle"
                  fill={theme.textMuted}
                  fontSize={7}
                  fontFamily="ui-monospace, monospace"
                  opacity={0.7}
                >
                  {r.displayName}
                </text>
              );
            })}
          </g>

          {/* ── Tooltip ── */}
          {tooltip && (
            <g>
              <rect
                x={ttX + 2} y={ttY + 2} width={165} height={62} rx={8}
                fill="black" opacity={0.4}
              />
              <rect
                x={ttX} y={ttY} width={165} height={62} rx={8}
                fill={theme.tooltipBg} stroke={theme.tooltipBorder}
                strokeWidth={1} opacity={0.97}
              />
              <text
                x={ttX + 12} y={ttY + 18}
                fill={theme.textPrimary} fontSize={11} fontWeight={600}
                fontFamily="ui-sans-serif, system-ui, sans-serif"
              >
                {tooltip.region.displayName}
              </text>
              <circle
                cx={ttX + 152} cy={ttY + 15} r={4}
                fill={statusColors[tooltip.region.status]}
              />
              <text
                x={ttX + 12} y={ttY + 34}
                fill={theme.textSecondary} fontSize={9}
                fontFamily="ui-monospace, monospace"
              >
                Status: {tooltip.region.status.toUpperCase()}
              </text>
              <rect
                x={ttX + 12} y={ttY + 42} width={141} height={4} rx={2}
                fill={theme.border}
              />
              <rect
                x={ttX + 12} y={ttY + 42}
                width={Math.max(2, (tooltip.region.load / 100) * 141)}
                height={4} rx={2}
                fill={
                  tooltip.region.load > 80
                    ? theme.error
                    : tooltip.region.load > 60
                    ? theme.warning
                    : theme.success
                }
              />
              <text
                x={ttX + 12} y={ttY + 56}
                fill={theme.textMuted} fontSize={8}
                fontFamily="ui-monospace, monospace"
              >
                Load: {tooltip.region.load}%
              </text>
            </g>
          )}
        </svg>
      </div>
    </motion.div>
  );
}
