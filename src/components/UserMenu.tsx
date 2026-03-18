"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, LogIn, Cloud } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

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

  if (status === "loading") {
    return (
      <div
        className="w-8 h-8 rounded-full animate-pulse"
        style={{ backgroundColor: `${theme.border}50` }}
      />
    );
  }

  if (!session) {
    return (
      <Link href="/auth/signin">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 cursor-pointer"
          style={{
            borderColor: `${theme.accent}40`,
            backgroundColor: `${theme.accent}10`,
            color: theme.accent,
          }}
        >
          <LogIn className="w-3.5 h-3.5" />
          Sign In
        </motion.button>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative z-50">
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-200 cursor-pointer"
        style={{
          borderColor: open ? theme.accent : theme.border,
        }}
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: `${theme.accent}20` }}
          >
            <User className="w-4 h-4" style={{ color: theme.accent }} />
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-56 rounded-xl border overflow-hidden backdrop-blur-xl shadow-2xl"
            style={{
              borderColor: theme.border,
              backgroundColor: `${theme.card}f0`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
            }}
          >
            {/* User info */}
            <div
              className="px-3 py-3 border-b"
              style={{ borderColor: theme.border }}
            >
              <p
                className="text-xs font-semibold truncate"
                style={{ color: theme.textPrimary }}
              >
                {session.user?.name || "User"}
              </p>
              <p
                className="text-[10px] truncate mt-0.5"
                style={{ color: theme.textMuted }}
              >
                {session.user?.email}
              </p>
            </div>

            {/* Menu items */}
            <div className="p-1.5">
              <Link href="/settings" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                  style={{ color: theme.textPrimary }}
                >
                  <Cloud className="w-4 h-4" style={{ color: theme.accent }} />
                  <span className="text-xs font-medium">Cloud Connections</span>
                </motion.div>
              </Link>

              <Link href="/settings" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                  style={{ color: theme.textPrimary }}
                >
                  <Settings className="w-4 h-4" style={{ color: theme.textMuted }} />
                  <span className="text-xs font-medium">Settings</span>
                </motion.div>
              </Link>

              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ color: theme.textPrimary }}
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium">Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
