"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export type DataSource = "simulated" | "live";

export interface CloudConnectionInfo {
  id: string;
  provider: string;
  name: string;
  verified: boolean;
  lastUsedAt: string | null;
}

/**
 * Hook to determine the active data source for a given cloud provider.
 *
 * Returns:
 * - `dataSource`: "live" if user is authenticated and has a verified connection,
 *   "simulated" otherwise (demo mode).
 * - `connections`: Array of the user's connections for this provider.
 * - `loading`: Whether we're still fetching connection status.
 * - `refresh`: Re-fetch connections.
 */
export function useCloudConnection(provider: "azure" | "aws" | "gcp") {
  const { data: session, status: authStatus } = useSession();
  const [connections, setConnections] = useState<CloudConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!session?.user) {
      setConnections([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const all: CloudConnectionInfo[] = await res.json();
        setConnections(all.filter((c) => c.provider === provider));
      }
    } catch {
      // ignore network errors
    } finally {
      setLoading(false);
    }
  }, [session, provider]);

  useEffect(() => {
    if (authStatus === "loading") return;
    fetchConnections();
  }, [authStatus, fetchConnections]);

  const hasVerified = connections.some((c) => c.verified);
  const dataSource: DataSource =
    session && hasVerified ? "live" : "simulated";

  return {
    dataSource,
    connections,
    loading: authStatus === "loading" || loading,
    isAuthenticated: !!session,
    refresh: fetchConnections,
  };
}
