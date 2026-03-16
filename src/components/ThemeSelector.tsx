"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

/** Small color swatch previewing a theme's key colors */
function ThemeSwatch({ colors }: { colors: [string, string, string] }) {
  return (
    <div className="flex gap-0.5">
      {colors.map((c, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export default function ThemeSelector() {
  const { theme, themeId, setThemeId, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer"
        style={{
          backgroundColor: `${theme.card}cc`,
          borderColor: open ? theme.accent : theme.border,
          color: theme.textSecondary,
        }}
      >
        <Palette className="w-3.5 h-3.5" style={{ color: theme.accent }} />
        <span className="hidden sm:inline">{theme.name}</span>
        <ThemeSwatch colors={[theme.chart1, theme.chart2, theme.chart3]} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 min-w-[220px] rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: `${theme.card}f5`,
              borderColor: theme.border,
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: theme.border }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: theme.textMuted }}>
                Color Theme
              </p>
            </div>
            <div className="py-1">
              {themes.map((t) => {
                const isActive = t.id === themeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setThemeId(t.id);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 cursor-pointer"
                    style={{
                      backgroundColor: isActive ? `${t.accent}18` : "transparent",
                      color: isActive ? t.accent : theme.textSecondary,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = `${theme.cardHover}80`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = isActive ? `${t.accent}18` : "transparent";
                    }}
                  >
                    {/* Preview swatch */}
                    <div
                      className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: t.bg,
                        borderColor: t.accent + "40",
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: t.accent,
                          boxShadow: `0 0 8px ${t.accent}80`,
                        }}
                      />
                    </div>
                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: isActive ? t.accent : theme.textPrimary }}>
                        {t.name}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>
                        {t.description}
                      </p>
                    </div>
                    {/* Chart colors preview */}
                    <ThemeSwatch colors={[t.chart1, t.chart2, t.chart3]} />
                    {/* Active check */}
                    {isActive && (
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: t.accent }} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
