"use client";

import { motion } from "framer-motion";

function Pulse({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-azure-card-hover/50 ${className}`} />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-azure-card bg-azure-card/50 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <Pulse className="h-3 w-24" />
        <Pulse className="h-7 w-7 rounded-lg" />
      </div>
      <div className="flex items-end justify-between mb-2">
        <Pulse className="h-8 w-28" />
        <Pulse className="h-5 w-14 rounded-full" />
      </div>
      <Pulse className="h-8 w-full mt-2" />
      <div className="mt-3 pt-3 border-t border-azure-card-hover/60 flex justify-between">
        <Pulse className="h-3 w-20" />
        <Pulse className="h-3 w-20" />
      </div>
    </div>
  );
}

function SkeletonChart({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-azure-card bg-azure-card/50 backdrop-blur-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <Pulse className="h-5 w-40 mb-1.5" />
          <Pulse className="h-3 w-24" />
        </div>
        <div className="flex gap-5">
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16" />
          <Pulse className="h-4 w-16" />
        </div>
      </div>
      <div className="h-64 w-full flex items-end gap-1 px-4">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className="flex-1 animate-pulse rounded-t bg-azure-card-hover/40"
            style={{
              height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonServiceGrid() {
  return (
    <div className="col-span-1 lg:col-span-2 rounded-2xl border border-azure-card bg-azure-card/50 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Pulse className="h-5 w-40 mb-1.5" />
          <Pulse className="h-3 w-28" />
        </div>
        <Pulse className="h-6 w-14 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map(g => (
          <div key={g}>
            <Pulse className="h-2.5 w-20 mb-2" />
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: g === 1 ? 3 : 2 }, (_, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-azure-bg/50 border border-azure-card-hover/40">
                  <div className="flex items-center gap-2">
                    <Pulse className="h-1.5 w-1.5 rounded-full" />
                    <Pulse className="h-3 w-24" />
                  </div>
                  <Pulse className="h-3 w-10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonFeed() {
  return (
    <div className="col-span-1 rounded-2xl border border-azure-card bg-azure-card/50 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Pulse className="h-5 w-28 mb-1.5" />
          <Pulse className="h-3 w-32" />
        </div>
        <Pulse className="h-4 w-12" />
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-azure-bg/30 border border-azure-card-hover/30"
            style={{ opacity: 1 - i * 0.12 }}
          >
            <Pulse className="h-3.5 w-3.5 mt-0.5 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Pulse className="h-3 w-full" />
              <Pulse className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonMap() {
  return (
    <div className="col-span-1 lg:col-span-3 rounded-2xl border border-azure-card bg-azure-card/50 backdrop-blur-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Pulse className="h-5 w-44 mb-1.5" />
          <Pulse className="h-3 w-28" />
        </div>
        <Pulse className="h-4 w-24" />
      </div>
      <div className="w-full relative" style={{ aspectRatio: "2/1" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Pulsing globe-like circle */}
            <div className="w-32 h-32 rounded-full border border-azure-card-hover/30 animate-pulse" />
            <div className="absolute inset-4 rounded-full border border-azure-card-hover/20 animate-pulse" style={{ animationDelay: "300ms" }} />
            <div className="absolute inset-8 rounded-full border border-azure-card-hover/10 animate-pulse" style={{ animationDelay: "600ms" }} />
            {/* Scattered dots */}
            {[
              { top: "10%", left: "30%" },
              { top: "25%", left: "60%" },
              { top: "40%", left: "20%" },
              { top: "35%", left: "75%" },
              { top: "60%", left: "45%" },
              { top: "70%", left: "70%" },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-azure-accent/20 animate-pulse"
                style={{ ...pos, animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pb-12 pt-6 px-4 md:px-8 lg:px-16 max-w-[1440px] mx-auto"
    >
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Pulse className="h-8 w-8 rounded" />
            <Pulse className="h-8 w-48" />
          </div>
          <Pulse className="h-4 w-72 mt-1" />
        </div>
        <div className="flex items-center gap-4">
          <Pulse className="h-8 w-28 rounded-lg" />
          <Pulse className="h-8 w-32 rounded-full" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <SkeletonChart className="col-span-1 lg:col-span-2" />
        <SkeletonChart />
      </div>

      {/* Status + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <SkeletonServiceGrid />
        <SkeletonFeed />
      </div>

      {/* Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonMap />
      </div>
    </motion.div>
  );
}
