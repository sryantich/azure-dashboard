"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { THEMES, DEFAULT_THEME_ID, getThemeById, type ThemePalette } from "../data/themes";

interface ThemeContextValue {
  theme: ThemePalette;
  themeId: string;
  setThemeId: (id: string) => void;
  themes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "azure-dashboard-theme";

/**
 * Applies CSS custom properties from a theme palette onto <html>.
 * This lets Tailwind @theme and raw var() references pick up the values.
 */
function applyThemeToDOM(t: ThemePalette) {
  const root = document.documentElement;

  // Structural
  root.style.setProperty("--color-azure-bg", t.bg);
  root.style.setProperty("--color-azure-card", t.card);
  root.style.setProperty("--color-azure-card-hover", t.cardHover);
  root.style.setProperty("--color-azure-accent", t.accent);
  root.style.setProperty("--color-azure-accent-muted", t.accentMuted);
  root.style.setProperty("--color-azure-border", t.border);

  // Status
  root.style.setProperty("--color-azure-success", t.success);
  root.style.setProperty("--color-azure-warning", t.warning);
  root.style.setProperty("--color-azure-error", t.error);

  // Text
  root.style.setProperty("--color-azure-text-primary", t.textPrimary);
  root.style.setProperty("--color-azure-text-secondary", t.textSecondary);
  root.style.setProperty("--color-azure-text-muted", t.textMuted);

  // Tooltip
  root.style.setProperty("--color-azure-tooltip-bg", t.tooltipBg);
  root.style.setProperty("--color-azure-tooltip-border", t.tooltipBorder);

  // Scrollbar
  root.style.setProperty("--color-azure-scroll-thumb", t.scrollThumb);
  root.style.setProperty("--color-azure-scroll-thumb-hover", t.scrollThumbHover);

  // Body background glows
  root.style.setProperty("--color-body-glow-1", t.bodyGlow1);
  root.style.setProperty("--color-body-glow-2", t.bodyGlow2);
  root.style.setProperty("--color-body-glow-3", t.bodyGlow3);

  // Scanline
  root.style.setProperty("--color-scanline", t.scanlineColor);

  // Data attribute for any CSS selectors
  root.setAttribute("data-theme", t.id);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState(DEFAULT_THEME_ID);
  const theme = getThemeById(themeId);

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) {
      setThemeIdState(stored);
    }
  }, []);

  // Apply to DOM whenever theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setThemeId = useCallback((id: string) => {
    if (THEMES.some((t) => t.id === id)) {
      setThemeIdState(id);
      localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
