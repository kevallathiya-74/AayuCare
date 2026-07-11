/**
 * AayuCare Health Colors — Premium Healthcare SaaS Palette
 *
 * Design Philosophy:
 *   - Trustworthy, calm, clinical precision
 *   - Primary: Teal (#14B8A6) — healing, technology, trust
 *   - Secondary: Blue (#0EA5E9) — care, clarity, digital-first
 *   - Neutral: Slate-based scale — modern, premium, readable
 *
 */

const healthColors = {
  // ─── Core Neutrals ─────────────────────────────────────────────────
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  neutral: {
    white: "#FFFFFF",
    gray50: "#F8FAFC",
    gray100: "#F1F5F9",
    gray200: "#E2E8F0",
    gray300: "#CBD5E1",
    gray400: "#94A3B8",
    gray500: "#64748B",
    gray600: "#475569",
    gray700: "#334155",
    gray800: "#1E293B",
    gray900: "#0F172A",
    black: "#000000",
  },

  // ─── Primary — Teal (Trust, Healing, Healthcare) ───────────────────
  primary: {
    50: "#F0FDFA",
    100: "#CCFBF1",
    200: "#99F6E4",
    300: "#5EEAD4",
    400: "#2DD4BF",
    main: "#14B8A6",
    600: "#0D9488",
    dark: "#0F9488",
    700: "#0F766E",
    800: "#115E59",
    900: "#134E4A",
    light: "#5EEAD4",
    gradient: ["#14B8A6", "#0EA5E9"],
    surface: "#F0FDFA",
  },

  // ─── Secondary — Sky Blue (Digital, Precision, Innovation) ─────────
  secondary: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    main: "#0EA5E9",
    600: "#0284C7",
    dark: "#0369A1",
    light: "#BAE6FD",
    gradient: ["#0EA5E9", "#38BDF8"],
    surface: "#F0F9FF",
  },

  // ─── Semantic: Success ──────────────────────────────────────────────
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    main: "#22C55E",
    dark: "#16A34A",
    light: "#86EFAC",
    background: "#F0FDF4",
    surface: "#DCFCE7",
  },

  // ─── Semantic: Warning ──────────────────────────────────────────────
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    main: "#F59E0B",
    dark: "#D97706",
    light: "#FCD34D",
    background: "#FFFBEB",
    surface: "#FEF3C7",
  },

  // ─── Semantic: Error ────────────────────────────────────────────────
  error: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    main: "#EF4444",
    dark: "#DC2626",
    light: "#FCA5A5",
    background: "#FEF2F2",
    surface: "#FEE2E2",
  },

  // ─── Semantic: Info ─────────────────────────────────────────────────
  info: {
    50: "#EFF6FF",
    100: "#DBEAFE",
    main: "#3B82F6",
    dark: "#2563EB",
    light: "#93C5FD",
    background: "#EFF6FF",
    surface: "#DBEAFE",
  },

  // ─── Background / Surface ───────────────────────────────────────────
  background: {
    main: "#FFFFFF",
    primary: "#FFFFFF",
    secondary: "#F8FAFC",
    tertiary: "#F1F5F9",
    card: "#FFFFFF",
    overlay: "rgba(15, 23, 42, 0.5)",
    glass: "rgba(255, 255, 255, 0.85)",
    glassDark: "rgba(15, 23, 42, 0.6)",
  },

  // ─── Text ───────────────────────────────────────────────────────────
  text: {
    primary: "#0F172A",
    secondary: "#475569",
    tertiary: "#94A3B8",
    white: "#FFFFFF",
    link: "#14B8A6",
    disabled: "#CBD5E1",
    inverse: "#FFFFFF",
    onPrimary: "#FFFFFF",
  },

  // ─── Border ─────────────────────────────────────────────────────────
  border: {
    light: "#F1F5F9",
    main: "#E2E8F0",
    medium: "#CBD5E1",
    dark: "#94A3B8",
    focus: "#14B8A6",
    error: "#EF4444",
  },

  // ─── Input ──────────────────────────────────────────────────────────
  input: {
    background: "#FFFFFF",
    backgroundDisabled: "#F8FAFC",
    border: "#E2E8F0",
    borderFocused: "#14B8A6",
    borderError: "#EF4444",
    borderDisabled: "#E2E8F0",
    placeholder: "#94A3B8",
    text: "#0F172A",
    textDisabled: "#CBD5E1",
    focusGlow: "rgba(20, 184, 166, 0.15)",
  },

  // ─── Button ─────────────────────────────────────────────────────────
  button: {
    disabled: "#E2E8F0",
    disabledText: "#94A3B8",
  },

  // ─── Shadows ────────────────────────────────────────────────────────
  shadows: {
    light: "rgba(15, 23, 42, 0.04)",
    medium: "rgba(15, 23, 42, 0.08)",
    dark: "rgba(15, 23, 42, 0.16)",
    color: "#0F172A",
  },

  // ─── Status (Appointment / Records) ─────────────────────────────────
  status: {
    pending: "#F59E0B",
    pendingBg: "#FFFBEB",
    confirmed: "#22C55E",
    confirmedBg: "#F0FDF4",
    cancelled: "#EF4444",
    cancelledBg: "#FEF2F2",
    completed: "#64748B",
    completedBg: "#F8FAFC",
    inProgress: "#14B8A6",
    inProgressBg: "#F0FDFA",
    urgent: "#DC2626",
    urgentBg: "#FEF2F2",
  },

  // ─── Healthcare Vitals ──────────────────────────────────────────────
  health: {
    heartRate: "#E11D48",
    bloodPressure: "#7C3AED",
    temperature: "#D97706",
    glucose: "#16A34A",
    oxygen: "#0EA5E9",
    weight: "#DC2626",
    steps: "#14B8A6",
    sleep: "#6366F1",
    hydration: "#0891B2",
    stress: "#F59E0B",
  },

  // ─── Role-based Accent Colors ────────────────────────────────────────
  roles: {
    admin: { main: "#7C3AED", bg: "#F5F3FF", light: "#C4B5FD" },
    doctor: { main: "#14B8A6", bg: "#F0FDFA", light: "#5EEAD4" },
    patient: { main: "#0EA5E9", bg: "#F0F9FF", light: "#7DD3FC" },
    nurse: { main: "#EC4899", bg: "#FDF2F8", light: "#F9A8D4" },
  },

  // ─── Hospital Professional ────────────────────────────────────────────
  hospital: {
    teal: "#14B8A6",
    navy: "#1E293B",
    gradient: ["#14B8A6", "#0EA5E9"],
    dark: ["#0F766E", "#0369A1"],
  },

  // ─── Accent / Decorative ──────────────────────────────────────────────
  accent: {
    coral: "#F43F5E",
    green: "#22C55E",
    lavender: "#A78BFA",
    aqua: "#2DD4BF",
    purple: "#8B5CF6",
    pink: "#EC4899",
    cyan: "#06B6D4",
    orange: "#F97316",
    indigo: "#6366F1",
  },

  // ─── Card ─────────────────────────────────────────────────────────────
  card: {
    background: "#FFFFFF",
    border: "#F1F5F9",
    shadow: "rgba(15, 23, 42, 0.06)",
    hover: "#F8FAFC",
  },

  // ─── Dashboard / Analytics ────────────────────────────────────────────
  dashboard: {
    background: "#F8FAFC",
    primaryButton: "#14B8A6",
    secondaryButton: "#0EA5E9",
    alert: "#EF4444",
    safe: "#22C55E",
    stat1: "#14B8A6",
    stat2: "#0EA5E9",
    stat3: "#F59E0B",
    stat4: "#8B5CF6",
  },

  // ─── Gradients ────────────────────────────────────────────────────────
  gradients: {
    primary: ["#14B8A6", "#0EA5E9"],
    primaryV: ["#0F766E", "#14B8A6"],
    secondary: ["#0EA5E9", "#38BDF8"],
    health: ["#22C55E", "#14B8A6"],
    warm: ["#F59E0B", "#F97316"],
    cool: ["#14B8A6", "#6366F1"],
    hero: ["#0F172A", "#1E293B"],
    glass: ["rgba(255,255,255,0.9)", "rgba(255,255,255,0.6)"],
  },

  // ─── Border Radius (backward compat) ──────────────────────────────────
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 24,
    round: 9999,
  },

  // ─── Fitness & Wellness ───────────────────────────────────────────────
  fitness: {
    aqua: "#2DD4BF",
    green: "#22C55E",
    coral: "#F43F5E",
    gradient: ["#2DD4BF", "#22C55E", "#F43F5E"],
  },

  // ─── AI / Assistant ───────────────────────────────────────────────────
  ai: {
    teal: "#14B8A6",
    white: "#FFFFFF",
    coral: "#F43F5E",
    gradient: ["#14B8A6", "#6366F1"],
  },
};

// ─── Dev Validation ───────────────────────────────────────────────────────
if (__DEV__) {
  const required = [
    "primary",
    "secondary",
    "background",
    "text",
    "border",
    "neutral",
    "status",
  ];
  required.forEach((k) => {
    if (!healthColors[k])
      console.warn(`[healthColors] Missing required key: ${k}`);
  });
}

/**
 * Returns an rgba string from a hex color + opacity value (0–1)
 */
const withOpacity = (color, opacity) => {
  if (!color || typeof color !== "string") return `rgba(0,0,0,${opacity ?? 0})`;
  const hex = color.replace("#", "");
  if (hex.length !== 6) return `rgba(0,0,0,${opacity ?? 0})`;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

export { healthColors, withOpacity };
export default healthColors;
