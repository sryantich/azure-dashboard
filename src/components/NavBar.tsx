"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cloud, Server, Cpu } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

interface CloudProvider {
  id: string;
  name: string;
  shortName: string;
  href: string;
  icon: typeof Cloud;
  color: string;
  description: string;
}

const PROVIDERS: CloudProvider[] = [
  {
    id: "azure",
    name: "Microsoft Azure",
    shortName: "Azure",
    href: "/",
    icon: Cloud,
    color: "#38bdf8",
    description: "Azure infrastructure & DevOps",
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    shortName: "AWS",
    href: "/aws",
    icon: Server,
    color: "#f59e0b",
    description: "AWS cloud infrastructure",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    shortName: "GCP",
    href: "/gcp",
    icon: Cpu,
    color: "#34d399",
    description: "GCP services & compute",
  },
];

function getActiveProvider(pathname: string): CloudProvider {
  if (pathname.startsWith("/aws")) return PROVIDERS[1];
  if (pathname.startsWith("/gcp")) return PROVIDERS[2];
  return PROVIDERS[0];
}

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const active = getActiveProvider(pathname);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={ref} className="relative z-50">
      {/* Trigger button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer"
        style={{
          borderColor: open ? `${active.color}60` : theme.border,
          backgroundColor: open ? `${active.color}10` : `${theme.card}80`,
          color: theme.textPrimary,
        }}
      >
        <active.icon className="w-4 h-4" style={{ color: active.color }} />
        <span className="text-xs font-semibold">{active.shortName}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-3.5 h-3.5" style={{ color: theme.textMuted }} />
        </motion.span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 mt-2 w-64 rounded-xl border overflow-hidden backdrop-blur-xl shadow-2xl"
            style={{
              borderColor: theme.border,
              backgroundColor: `${theme.card}f0`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${active.color}10`,
            }}
          >
            <div className="p-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5"
                style={{ color: theme.textMuted }}>
                Cloud Provider
              </p>
              {PROVIDERS.map((provider) => {
                const isActive = provider.id === active.id;
                return (
                  <motion.button
                    key={provider.id}
                    whileHover={{ x: 2 }}
                    onClick={() => {
                      router.push(provider.href);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer"
                    style={{
                      backgroundColor: isActive ? `${provider.color}15` : "transparent",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: `${provider.color}20`,
                        border: `1px solid ${provider.color}30`,
                      }}
                    >
                      <provider.icon className="w-4 h-4" style={{ color: provider.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold truncate"
                          style={{ color: isActive ? provider.color : theme.textPrimary }}
                        >
                          {provider.name}
                        </span>
                        {isActive && (
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: provider.color }}
                          />
                        )}
                      </div>
                      <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>
                        {provider.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
