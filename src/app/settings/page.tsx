"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Cloud,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Shield,
  Server,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ThemeProvider, useTheme } from "../../hooks/useTheme";

/* ── Types ── */
interface Connection {
  id: string;
  provider: string;
  name: string;
  verified: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type Provider = "azure" | "aws" | "gcp";

interface ProviderConfig {
  label: string;
  color: string;
  icon: string;
  fields: { key: string; label: string; placeholder: string; sensitive?: boolean }[];
}

const PROVIDERS: Record<Provider, ProviderConfig> = {
  azure: {
    label: "Azure",
    color: "#3b82f6",
    icon: "☁️",
    fields: [
      { key: "tenantId", label: "Tenant ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "clientId", label: "Client (App) ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
      { key: "clientSecret", label: "Client Secret", placeholder: "Your client secret", sensitive: true },
      { key: "subscriptionId", label: "Subscription ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" },
    ],
  },
  aws: {
    label: "AWS",
    color: "#f59e0b",
    icon: "🔶",
    fields: [
      { key: "accessKeyId", label: "Access Key ID", placeholder: "AKIA..." },
      { key: "secretAccessKey", label: "Secret Access Key", placeholder: "Your secret key", sensitive: true },
      { key: "region", label: "Default Region", placeholder: "us-east-1" },
    ],
  },
  gcp: {
    label: "GCP",
    color: "#34d399",
    icon: "🟢",
    fields: [
      { key: "projectId", label: "Project ID", placeholder: "my-project-123" },
      { key: "serviceAccountKey", label: "Service Account Key (JSON)", placeholder: '{"type": "service_account", ...}', sensitive: true },
    ],
  },
};

/* ── Settings content (inside ThemeProvider) ── */
function SettingsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formProvider, setFormProvider] = useState<Provider>("azure");
  const [formName, setFormName] = useState("");
  const [formCreds, setFormCreds] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) fetchConnections();
  }, [session, fetchConnections]);

  // Reset form
  const resetForm = () => {
    setShowForm(false);
    setFormProvider("azure");
    setFormName("");
    setFormCreds({});
    setFormError("");
    setShowSecrets({});
  };

  // Submit new connection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Connection name is required.");
      return;
    }

    const config = PROVIDERS[formProvider];
    for (const field of config.fields) {
      if (!formCreds[field.key]?.trim()) {
        setFormError(`${field.label} is required.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: formProvider,
          name: formName.trim(),
          credentials: formCreds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create connection.");
        return;
      }

      resetForm();
      fetchConnections();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Verify connection
  const handleVerify = async (id: string) => {
    setVerifying(id);
    try {
      const res = await fetch("/api/connections/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      await res.json();
      fetchConnections();
    } catch {
      // ignore
    } finally {
      setVerifying(null);
    }
  };

  // Delete connection
  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/connections?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.bg }}
      >
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: theme.accent }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 sm:p-6 md:p-8"
      style={{ backgroundColor: theme.bg, color: theme.textPrimary }}
    >
      <div className="max-w-4xl mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg border transition-colors cursor-pointer"
              style={{
                borderColor: theme.border,
                backgroundColor: `${theme.card}80`,
              }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: theme.textMuted }} />
            </motion.button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-6 h-6" style={{ color: theme.accent }} />
              Cloud Connections
            </h1>
            <p className="text-xs mt-0.5" style={{ color: theme.textMuted }}>
              Connect your cloud provider accounts to view live metrics. Credentials
              are encrypted with AES-256-GCM.
            </p>
          </div>
        </div>

        {/* ── Connection List ── */}
        <div className="space-y-3 mb-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: theme.accent }}
              />
            </div>
          ) : connections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 rounded-xl border"
              style={{
                borderColor: theme.border,
                backgroundColor: `${theme.card}40`,
              }}
            >
              <Server
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: `${theme.textMuted}50` }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: theme.textMuted }}
              >
                No cloud connections yet.
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: `${theme.textMuted}80` }}
              >
                Add one below to start viewing live metrics from your cloud
                infrastructure.
              </p>
            </motion.div>
          ) : (
            connections.map((conn, i) => {
              const config = PROVIDERS[conn.provider as Provider];
              return (
                <motion.div
                  key={conn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl border transition-colors"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: `${theme.card}60`,
                  }}
                >
                  {/* Provider icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                    style={{
                      backgroundColor: `${config?.color || theme.accent}15`,
                      border: `1px solid ${config?.color || theme.accent}30`,
                    }}
                  >
                    {config?.icon || "☁️"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {conn.name}
                      </p>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase"
                        style={{
                          backgroundColor: `${config?.color || theme.accent}20`,
                          color: config?.color || theme.accent,
                        }}
                      >
                        {conn.provider}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 mt-1 text-[10px]"
                      style={{ color: theme.textMuted }}
                    >
                      <span className="flex items-center gap-1">
                        {conn.verified ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-amber-400" />
                        )}
                        {conn.verified ? "Verified" : "Unverified"}
                      </span>
                      {conn.lastUsedAt && (
                        <span>
                          Last used:{" "}
                          {new Date(conn.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                      <span>
                        Added:{" "}
                        {new Date(conn.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleVerify(conn.id)}
                      disabled={verifying === conn.id}
                      className="p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
                      style={{
                        borderColor: `${theme.accent}30`,
                        backgroundColor: `${theme.accent}10`,
                      }}
                      title="Verify connection"
                    >
                      {verifying === conn.id ? (
                        <Loader2
                          className="w-4 h-4 animate-spin"
                          style={{ color: theme.accent }}
                        />
                      ) : (
                        <RefreshCw
                          className="w-4 h-4"
                          style={{ color: theme.accent }}
                        />
                      )}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(conn.id)}
                      disabled={deleting === conn.id}
                      className="p-2 rounded-lg border transition-colors cursor-pointer disabled:opacity-50"
                      style={{
                        borderColor: "rgba(239,68,68,0.3)",
                        backgroundColor: "rgba(239,68,68,0.1)",
                      }}
                      title="Delete connection"
                    >
                      {deleting === conn.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* ── Add Connection Button ── */}
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition-colors cursor-pointer"
              style={{
                borderColor: `${theme.accent}40`,
                color: theme.accent,
                backgroundColor: `${theme.accent}05`,
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">Add Cloud Connection</span>
            </motion.button>
          ) : (
            /* ── New Connection Form ── */
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleSubmit}
              className="rounded-xl border p-5"
              style={{
                borderColor: theme.border,
                backgroundColor: `${theme.card}80`,
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-lg font-bold flex items-center gap-2"
                  style={{ color: theme.textPrimary }}
                >
                  <Cloud className="w-5 h-5" style={{ color: theme.accent }} />
                  New Connection
                </h2>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetForm}
                  className="text-xs px-3 py-1 rounded-lg border cursor-pointer"
                  style={{
                    borderColor: theme.border,
                    color: theme.textMuted,
                  }}
                >
                  Cancel
                </motion.button>
              </div>

              {/* Provider tabs */}
              <div className="flex gap-2 mb-4">
                {(Object.entries(PROVIDERS) as [Provider, ProviderConfig][]).map(
                  ([key, cfg]) => (
                    <motion.button
                      key={key}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setFormProvider(key);
                        setFormCreds({});
                        setFormError("");
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
                      style={{
                        borderColor:
                          formProvider === key
                            ? `${cfg.color}60`
                            : theme.border,
                        backgroundColor:
                          formProvider === key
                            ? `${cfg.color}15`
                            : "transparent",
                        color:
                          formProvider === key ? cfg.color : theme.textMuted,
                      }}
                    >
                      <span>{cfg.icon}</span>
                      {cfg.label}
                    </motion.button>
                  )
                )}
              </div>

              {/* Connection name */}
              <div className="mb-4">
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: theme.textSecondary }}
                >
                  Connection Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Production Azure, Dev Account"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors"
                  style={{
                    borderColor: theme.border,
                    backgroundColor: `${theme.bg}80`,
                    color: theme.textPrimary,
                  }}
                />
              </div>

              {/* Credential fields */}
              {PROVIDERS[formProvider].fields.map((field) => (
                <div key={field.key} className="mb-3">
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: theme.textSecondary }}
                  >
                    {field.label}
                  </label>
                  <div className="relative">
                    {field.key === "serviceAccountKey" ? (
                      <textarea
                        value={formCreds[field.key] || ""}
                        onChange={(e) =>
                          setFormCreds((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors font-mono resize-y"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: `${theme.bg}80`,
                          color: theme.textPrimary,
                        }}
                      />
                    ) : (
                      <input
                        type={
                          field.sensitive && !showSecrets[field.key]
                            ? "password"
                            : "text"
                        }
                        value={formCreds[field.key] || ""}
                        onChange={(e) =>
                          setFormCreds((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors font-mono pr-10"
                        style={{
                          borderColor: theme.border,
                          backgroundColor: `${theme.bg}80`,
                          color: theme.textPrimary,
                        }}
                      />
                    )}
                    {field.sensitive && field.key !== "serviceAccountKey" && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowSecrets((prev) => ({
                            ...prev,
                            [field.key]: !prev[field.key],
                          }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded cursor-pointer"
                        style={{ color: theme.textMuted }}
                      >
                        {showSecrets[field.key] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Error */}
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg mb-4 text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                  }}
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </motion.div>
              )}

              {/* Security note */}
              <div
                className="flex items-start gap-2 p-3 rounded-lg mb-4 text-[10px]"
                style={{
                  backgroundColor: `${theme.accent}08`,
                  border: `1px solid ${theme.accent}20`,
                  color: theme.textMuted,
                }}
              >
                <Shield
                  className="w-3.5 h-3.5 shrink-0 mt-0.5"
                  style={{ color: theme.accent }}
                />
                <span>
                  Credentials are encrypted with AES-256-GCM before storage and
                  are only decrypted server-side when making API calls to your
                  cloud provider. They are never sent to the browser.
                </span>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                style={{
                  backgroundColor: PROVIDERS[formProvider].color,
                  color: "#fff",
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save Connection"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Info Section ── */}
        <div
          className="mt-8 rounded-xl border p-5"
          style={{
            borderColor: theme.border,
            backgroundColor: `${theme.card}30`,
          }}
        >
          <h3
            className="text-sm font-bold mb-3"
            style={{ color: theme.textPrimary }}
          >
            How it works
          </h3>
          <div className="space-y-3 text-xs" style={{ color: theme.textMuted }}>
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  backgroundColor: `${theme.accent}15`,
                  color: theme.accent,
                }}
              >
                1
              </div>
              <div>
                <p className="font-medium" style={{ color: theme.textSecondary }}>
                  Add a cloud connection
                </p>
                <p className="mt-0.5">
                  Enter your service principal or IAM credentials. For Azure,
                  create an App Registration with Reader role on your subscription.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  backgroundColor: `${theme.accent}15`,
                  color: theme.accent,
                }}
              >
                2
              </div>
              <div>
                <p className="font-medium" style={{ color: theme.textSecondary }}>
                  Verify the connection
                </p>
                <p className="mt-0.5">
                  Click the verify button to test your credentials. We{"'"}ll
                  attempt to authenticate and list your subscriptions/resources.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  backgroundColor: `${theme.accent}15`,
                  color: theme.accent,
                }}
              >
                3
              </div>
              <div>
                <p className="font-medium" style={{ color: theme.textSecondary }}>
                  View live metrics
                </p>
                <p className="mt-0.5">
                  Go back to the dashboard. If you have a verified connection,
                  the dashboard will automatically switch from simulated data to
                  live metrics from your cloud infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page wrapper ── */
export default function SettingsPage() {
  return (
    <ThemeProvider>
      <SettingsContent />
    </ThemeProvider>
  );
}
