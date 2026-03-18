"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Github, Chrome, Shield, Cloud, ArrowLeft } from "lucide-react";
import Link from "next/link";

const providers = [
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    color: "#333",
    hoverColor: "#555",
    description: "Sign in with your GitHub account",
  },
  {
    id: "google",
    name: "Google",
    icon: Chrome,
    color: "#4285f4",
    hoverColor: "#5a9bf4",
    description: "Sign in with your Google account",
  },
  {
    id: "microsoft-entra-id",
    name: "Microsoft Entra ID",
    icon: Shield,
    color: "#0078d4",
    hoverColor: "#1a8ae8",
    description: "Sign in with your Azure AD account",
  },
];

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = (providerId: string) => {
    setLoading(providerId);
    signIn(providerId, { callbackUrl: "/" });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0f1c 0%, #0f172a 50%, #0a0f1c 100%)" }}
    >
      {/* Background grid effect */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(56,189,248,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: "#38bdf8", top: "10%", left: "20%" }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-8"
        style={{ background: "#8b5cf6", bottom: "15%", right: "15%" }}
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Back to dashboard */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 backdrop-blur-xl"
          style={{
            borderColor: "rgba(56,189,248,0.15)",
            backgroundColor: "rgba(15,23,42,0.8)",
            boxShadow:
              "0 25px 50px rgba(0,0,0,0.4), 0 0 80px rgba(56,189,248,0.05)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(139,92,246,0.2))",
                border: "1px solid rgba(56,189,248,0.3)",
              }}
            >
              <Cloud className="w-7 h-7 text-sky-400" />
            </motion.div>
            <h1 className="text-xl font-bold text-white mb-1">
              Cloud Live Ops
            </h1>
            <p className="text-sm text-slate-400">
              Sign in to connect your cloud accounts and view real data
            </p>
          </div>

          {/* Provider buttons */}
          <div className="space-y-3">
            {providers.map((provider, i) => (
              <motion.button
                key={provider.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSignIn(provider.id)}
                disabled={loading !== null}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                style={{
                  borderColor: "rgba(148,163,184,0.15)",
                  backgroundColor: "rgba(30,41,59,0.5)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${provider.color}25`,
                    border: `1px solid ${provider.color}40`,
                  }}
                >
                  {loading === provider.id ? (
                    <motion.div
                      className="w-4 h-4 border-2 rounded-full"
                      style={{
                        borderColor: `${provider.color}40`,
                        borderTopColor: provider.color,
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  ) : (
                    <provider.icon
                      className="w-4.5 h-4.5"
                      style={{ color: provider.color }}
                    />
                  )}
                </div>
                <div className="text-left flex-1">
                  <span className="text-sm font-semibold text-white block">
                    {provider.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {provider.description}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-slate-500 text-center mt-6 leading-relaxed">
            No cloud credentials are shared during sign-in.
            <br />
            You&apos;ll configure cloud connections after signing in.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
