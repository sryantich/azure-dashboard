"use client";

import { motion } from "framer-motion";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCloudConnection, type DataSource } from "@/hooks/useCloudConnection";
import Link from "next/link";

interface DataSourceBadgeProps {
  provider: "azure" | "aws" | "gcp";
}

/**
 * Shows a badge in the dashboard header indicating whether data is live or simulated.
 * - "Live": User is authenticated with a verified cloud connection
 * - "Demo": Simulated/streaming data (default, no login required)
 * Clicking the badge links to /settings to manage connections.
 */
export default function DataSourceBadge({ provider }: DataSourceBadgeProps) {
  const { theme } = useTheme();
  const { dataSource, loading, isAuthenticated } = useCloudConnection(provider);

  if (loading) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
        style={{
          borderColor: theme.border,
          backgroundColor: `${theme.card}40`,
          color: theme.textMuted,
        }}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Checking...</span>
      </div>
    );
  }

  const isLive = dataSource === "live";

  return (
    <Link href="/settings">
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition-colors"
        style={{
          borderColor: isLive ? `${theme.success}40` : `${theme.warning}30`,
          backgroundColor: isLive ? `${theme.success}10` : `${theme.warning}08`,
          color: isLive ? theme.success : theme.warning,
        }}
        title={
          isLive
            ? `Connected to ${provider.toUpperCase()} — live data`
            : isAuthenticated
            ? `No verified ${provider.toUpperCase()} connection — showing demo data`
            : "Not signed in — showing demo data"
        }
      >
        {isLive ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Live</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Demo</span>
          </>
        )}
      </motion.div>
    </Link>
  );
}
