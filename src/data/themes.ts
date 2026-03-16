/**
 * Theme color palettes — all dark mode variants.
 *
 * Each theme defines:
 * - bg / card / cardHover: structural background/surface colors
 * - accent: primary highlight (buttons, active states, chart primary)
 * - accentMuted: lower-opacity version for glows/backgrounds
 * - chart1 / chart2 / chart3: three-color chart palette (CPU/Mem/Net or equivalent)
 * - success / warning / error: semantic status colors
 * - textPrimary / textSecondary / textMuted: text hierarchy
 * - border: default card/divider border
 * - mapBg / mapLand / mapLandStroke / mapGrid: NetworkMap SVG palette
 * - tooltipBg / tooltipBorder: chart/map tooltip
 * - scanline: scanline overlay accent (rgba)
 * - bodyGradients: array of 3 radial gradient rgba strings for body background
 */

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  // Structural
  bg: string;
  card: string;
  cardHover: string;
  border: string;
  // Accent
  accent: string;
  accentMuted: string;
  // Charts (3 line/area colors)
  chart1: string;
  chart2: string;
  chart3: string;
  // Status semantics
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // Map
  mapBg: [string, string, string]; // gradient stops (top, mid, bottom)
  mapLand: [string, string]; // gradient fill (from, to)
  mapLandStroke: string;
  mapGrid: string;
  mapOceanGlow1: string;
  mapOceanGlow2: string;
  // Tooltips
  tooltipBg: string;
  tooltipBorder: string;
  // Scrollbar
  scrollThumb: string;
  scrollThumbHover: string;
  // Scanline
  scanlineColor: string;
  // Body background gradients (3 radial accent glows)
  bodyGlow1: string;
  bodyGlow2: string;
  bodyGlow3: string;
}

export const THEMES: ThemePalette[] = [
  {
    id: "midnight",
    name: "Midnight Azure",
    description: "Classic Azure blue",
    bg: "#030712",
    card: "#111827",
    cardHover: "#1f2937",
    border: "#1e293b",
    accent: "#38bdf8",
    accentMuted: "rgba(56, 189, 248, 0.15)",
    chart1: "#38bdf8",
    chart2: "#34d399",
    chart3: "#a78bfa",
    success: "#34d399",
    successLight: "#6ee7b7",
    warning: "#fbbf24",
    warningLight: "#fde68a",
    error: "#ef4444",
    errorLight: "#fca5a5",
    textPrimary: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    mapBg: ["#020617", "#0a1628", "#0c1a30"],
    mapLand: ["#0f2847", "#0a1e3a"],
    mapLandStroke: "#1e4976",
    mapGrid: "#1e3a5f",
    mapOceanGlow1: "rgba(3, 105, 161, 0.06)",
    mapOceanGlow2: "rgba(14, 116, 144, 0.04)",
    tooltipBg: "#0f172a",
    tooltipBorder: "#1e293b",
    scrollThumb: "#1e293b",
    scrollThumbHover: "#334155",
    scanlineColor: "rgba(56, 189, 248, 0.015)",
    bodyGlow1: "rgba(56, 189, 248, 0.12)",
    bodyGlow2: "rgba(139, 92, 246, 0.06)",
    bodyGlow3: "rgba(16, 185, 129, 0.04)",
  },
  {
    id: "emerald",
    name: "Emerald Terminal",
    description: "Hacker green",
    bg: "#040d07",
    card: "#0a1f10",
    cardHover: "#132e1a",
    border: "#1a3d24",
    accent: "#34d399",
    accentMuted: "rgba(52, 211, 153, 0.15)",
    chart1: "#34d399",
    chart2: "#38bdf8",
    chart3: "#fbbf24",
    success: "#4ade80",
    successLight: "#86efac",
    warning: "#fbbf24",
    warningLight: "#fde68a",
    error: "#f87171",
    errorLight: "#fca5a5",
    textPrimary: "#d1fae5",
    textSecondary: "#6ee7b7",
    textMuted: "#4aba7a",
    mapBg: ["#020a04", "#061a0c", "#081f10"],
    mapLand: ["#0a3015", "#071f0e"],
    mapLandStroke: "#1a5c2e",
    mapGrid: "#134022",
    mapOceanGlow1: "rgba(5, 150, 80, 0.06)",
    mapOceanGlow2: "rgba(16, 185, 129, 0.04)",
    tooltipBg: "#071a0c",
    tooltipBorder: "#1a3d24",
    scrollThumb: "#1a3d24",
    scrollThumbHover: "#2d5a38",
    scanlineColor: "rgba(52, 211, 153, 0.02)",
    bodyGlow1: "rgba(52, 211, 153, 0.12)",
    bodyGlow2: "rgba(16, 185, 129, 0.06)",
    bodyGlow3: "rgba(56, 189, 248, 0.03)",
  },
  {
    id: "amber",
    name: "Amber Ops",
    description: "Warm NOC center",
    bg: "#0c0804",
    card: "#1a1208",
    cardHover: "#2a1e0c",
    border: "#3d2c12",
    accent: "#f59e0b",
    accentMuted: "rgba(245, 158, 11, 0.15)",
    chart1: "#f59e0b",
    chart2: "#fb923c",
    chart3: "#38bdf8",
    success: "#34d399",
    successLight: "#6ee7b7",
    warning: "#fbbf24",
    warningLight: "#fde68a",
    error: "#ef4444",
    errorLight: "#fca5a5",
    textPrimary: "#fef3c7",
    textSecondary: "#d97706",
    textMuted: "#92710a",
    mapBg: ["#0a0602", "#14100a", "#1a1408"],
    mapLand: ["#2a1e08", "#1a1406"],
    mapLandStroke: "#5c4420",
    mapGrid: "#3d2c12",
    mapOceanGlow1: "rgba(180, 120, 20, 0.05)",
    mapOceanGlow2: "rgba(245, 158, 11, 0.03)",
    tooltipBg: "#1a1208",
    tooltipBorder: "#3d2c12",
    scrollThumb: "#3d2c12",
    scrollThumbHover: "#5c4420",
    scanlineColor: "rgba(245, 158, 11, 0.015)",
    bodyGlow1: "rgba(245, 158, 11, 0.10)",
    bodyGlow2: "rgba(251, 146, 60, 0.06)",
    bodyGlow3: "rgba(234, 179, 8, 0.03)",
  },
  {
    id: "violet",
    name: "Cyber Violet",
    description: "Cyberpunk purple",
    bg: "#080416",
    card: "#130d24",
    cardHover: "#1e1535",
    border: "#2e2050",
    accent: "#a78bfa",
    accentMuted: "rgba(167, 139, 250, 0.15)",
    chart1: "#a78bfa",
    chart2: "#f472b6",
    chart3: "#38bdf8",
    success: "#34d399",
    successLight: "#6ee7b7",
    warning: "#fbbf24",
    warningLight: "#fde68a",
    error: "#f87171",
    errorLight: "#fca5a5",
    textPrimary: "#ede9fe",
    textSecondary: "#a78bfa",
    textMuted: "#7c6db5",
    mapBg: ["#05021a", "#0d0830", "#100a3a"],
    mapLand: ["#1a1050", "#120a38"],
    mapLandStroke: "#3b2a80",
    mapGrid: "#2a1e5c",
    mapOceanGlow1: "rgba(100, 60, 200, 0.06)",
    mapOceanGlow2: "rgba(167, 139, 250, 0.04)",
    tooltipBg: "#100a28",
    tooltipBorder: "#2e2050",
    scrollThumb: "#2e2050",
    scrollThumbHover: "#4a3580",
    scanlineColor: "rgba(167, 139, 250, 0.015)",
    bodyGlow1: "rgba(167, 139, 250, 0.12)",
    bodyGlow2: "rgba(244, 114, 182, 0.06)",
    bodyGlow3: "rgba(56, 189, 248, 0.03)",
  },
  {
    id: "slate",
    name: "Slate Minimal",
    description: "Muted professional",
    bg: "#09090b",
    card: "#18181b",
    cardHover: "#27272a",
    border: "#3f3f46",
    accent: "#a1a1aa",
    accentMuted: "rgba(161, 161, 170, 0.15)",
    chart1: "#a1a1aa",
    chart2: "#71717a",
    chart3: "#d4d4d8",
    success: "#4ade80",
    successLight: "#86efac",
    warning: "#fbbf24",
    warningLight: "#fde68a",
    error: "#f87171",
    errorLight: "#fca5a5",
    textPrimary: "#e4e4e7",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    mapBg: ["#09090b", "#111114", "#141418"],
    mapLand: ["#27272a", "#1c1c1f"],
    mapLandStroke: "#52525b",
    mapGrid: "#3f3f46",
    mapOceanGlow1: "rgba(100, 100, 110, 0.04)",
    mapOceanGlow2: "rgba(80, 80, 90, 0.03)",
    tooltipBg: "#18181b",
    tooltipBorder: "#3f3f46",
    scrollThumb: "#3f3f46",
    scrollThumbHover: "#52525b",
    scanlineColor: "rgba(161, 161, 170, 0.01)",
    bodyGlow1: "rgba(161, 161, 170, 0.06)",
    bodyGlow2: "rgba(113, 113, 122, 0.04)",
    bodyGlow3: "rgba(82, 82, 91, 0.03)",
  },
];

export const DEFAULT_THEME_ID = "midnight";

export function getThemeById(id: string): ThemePalette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
