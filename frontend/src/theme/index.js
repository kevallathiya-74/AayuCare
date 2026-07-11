/**
 * AayuCare Theme System â€” Single Source of Truth
 * Premium Healthcare SaaS Design Tokens
 *
 * USAGE:
 *   import { theme } from '@/theme';
 *   color: theme.colors.primary
 *   fontSize: theme.typography.sizes.body
 *   padding: theme.spacing.md
 */

import { healthColors, withOpacity } from "./healthColors";
import {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  textStyles,
} from "./typography";
import {
  spacing,
  componentSpacing,
  layout,
  breakpoints,
  grid,
  safeAreaConfig,
} from "./spacing";

const typographySizes = {
  ...fontSizes,
  // legacy short aliases
  xs: fontSizes.bodySmall, // 12
  sm: fontSizes.bodyMedium, // 14
  md: fontSizes.bodyLarge, // 16
  lg: fontSizes.h5, // 18
  xl: fontSizes.h4, // 20
  xxl: fontSizes.h3, // 24
  xxxl: fontSizes.h2, // 28
  xxxxl: fontSizes.h1, // 32
  base: fontSizes.bodyLarge, // 16
  body: fontSizes.bodyMedium, // 14
};

const typographyWeights = {
  ...fontWeights,
  semiBold: fontWeights.semibold, // camelCase alias
};

export const theme = {
  // COLORS
  colors: {
    // Brand
    primary: healthColors.primary.main,
    primaryLight: healthColors.primary.light,
    primaryDark: healthColors.primary.dark,
    primaryBg: healthColors.primary.surface,

    secondary: healthColors.secondary.main,
    secondaryLight: healthColors.secondary.light,
    secondaryDark: healthColors.secondary.dark,
    secondaryBg: healthColors.secondary.surface,

    // Semantic
    success: {
      main: healthColors.success.main,
      light: healthColors.success.light,
      dark: healthColors.success.dark,
      background: healthColors.success.background,
      surface: healthColors.success.surface,
    },
    error: {
      main: healthColors.error.main,
      light: healthColors.error.light,
      dark: healthColors.error.dark,
      background: healthColors.error.background,
      surface: healthColors.error.surface,
    },
    warning: {
      main: healthColors.warning.main,
      light: healthColors.warning.light,
      dark: healthColors.warning.dark,
      background: healthColors.warning.background,
      surface: healthColors.warning.surface,
    },
    info: {
      main: healthColors.info.main,
      light: healthColors.info.light,
      dark: healthColors.info.dark,
      background: healthColors.info.background,
      surface: healthColors.info.surface,
    },

    // Backgrounds
    background: {
      primary: healthColors.background.primary,
      secondary: healthColors.background.secondary,
      tertiary: healthColors.background.tertiary,
      card: healthColors.background.card,
      overlay: healthColors.background.overlay,
      glass: healthColors.background.glass,
      glassDark: healthColors.background.glassDark,
    },

    // Text
    text: {
      primary: healthColors.text.primary,
      secondary: healthColors.text.secondary,
      tertiary: healthColors.text.tertiary,
      white: healthColors.text.white,
      disabled: healthColors.text.disabled,
      link: healthColors.text.link,
      onPrimary: healthColors.text.onPrimary,
    },

    // Border
    border: {
      main: healthColors.border.main,
      light: healthColors.border.light,
      medium: healthColors.border.medium,
      dark: healthColors.border.dark,
      focus: healthColors.border.focus,
      error: healthColors.border.error,
    },

    // Neutrals
    white: healthColors.white,
    black: healthColors.black,
    transparent: healthColors.transparent,

    // Gray scale
    grays: {
      gray50: healthColors.neutral.gray50,
      gray100: healthColors.neutral.gray100,
      gray200: healthColors.neutral.gray200,
      gray300: healthColors.neutral.gray300,
      gray400: healthColors.neutral.gray400,
      gray500: healthColors.neutral.gray500,
      gray600: healthColors.neutral.gray600,
      gray700: healthColors.neutral.gray700,
      gray800: healthColors.neutral.gray800,
      gray900: healthColors.neutral.gray900,
      black: healthColors.neutral.black,
    },

    // Healthcare vitals
    healthcare: {
      heartRate: healthColors.health.heartRate,
      bloodPressure: healthColors.health.bloodPressure,
      temperature: healthColors.health.temperature,
      glucose: healthColors.health.glucose,
      oxygen: healthColors.health.oxygen,
      weight: healthColors.health.weight,
      steps: healthColors.health.steps,
      sleep: healthColors.health.sleep,
      teal: healthColors.primary.main,
      navy: healthColors.hospital.navy,
      purple: healthColors.accent.purple,
      pink: healthColors.accent.pink,
      cyan: healthColors.accent.cyan,
    },

    // Status (appointment / medical)
    status: {
      pending: healthColors.status.pending,
      pendingBg: healthColors.status.pendingBg,
      confirmed: healthColors.status.confirmed,
      confirmedBg: healthColors.status.confirmedBg,
      cancelled: healthColors.status.cancelled,
      cancelledBg: healthColors.status.cancelledBg,
      completed: healthColors.status.completed,
      completedBg: healthColors.status.completedBg,
      inProgress: healthColors.status.inProgress,
      inProgressBg: healthColors.status.inProgressBg,
      urgent: healthColors.status.urgent,
      urgentBg: healthColors.status.urgentBg,
    },

    // Role-based colors
    roles: healthColors.roles,

    // Accent
    accent: healthColors.accent,
  },

  // TYPOGRAPHY
  typography: {
    fontFamilies,
    fontFamily: fontFamilies, // backward compat
    sizes: typographySizes,
    fontSizes, // canonical scale export
    weights: typographyWeights,
    fontWeights,
    lineHeights,
    letterSpacing,
    textStyles,
  },

  // SPACING
  spacing,
  componentSpacing,
  layout,
  breakpoints,
  grid,
  safeAreaConfig,

  // BORDER RADIUS
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
    // Semantic
    button: 12,
    card: 16,
    input: 10,
    modal: 20,
    badge: 12,
    pill: 9999,
  },

  // SHADOWS & ELEVATION
  shadows: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: healthColors.shadows.color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: healthColors.shadows.color,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: healthColors.shadows.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: healthColors.shadows.color,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    xl: {
      shadowColor: healthColors.shadows.color,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
      elevation: 8,
    },
    // Semantic shadows
    card: {
      shadowColor: healthColors.shadows.color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    button: {
      shadowColor: healthColors.primary.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    modal: {
      shadowColor: healthColors.shadows.color,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 16,
    },
  },

  // TOUCH TARGETS (Accessibility â€” min 44dp)
  touchTargets: {
    min: 44,
    sm: 36,
    md: 44,
    lg: 56,
    xl: 64,
  },

  // ICON SIZES
  iconSizes: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
    nav: 24, // bottom tab icon
    fab: 28, // floating action button
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ANIMATION DURATIONS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  animation: {
    instant: 50,
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
    spring: { damping: 18, stiffness: 200, mass: 1 },
  },

  // GRADIENTS
  gradients: {
    primary: ["#14B8A6", "#0EA5E9"],
    primaryV: ["#0F766E", "#14B8A6"],
    secondary: ["#0EA5E9", "#38BDF8"],
    success: ["#22C55E", "#16A34A"],
    error: ["#EF4444", "#DC2626"],
    warm: ["#F59E0B", "#F97316"],
    cool: ["#14B8A6", "#6366F1"],
    hero: ["#0F172A", "#1E293B"],
    health: ["#22C55E", "#14B8A6"],
  },

  // UTILITY FUNCTIONS
  /**
   * Get color with opacity
   * @param {string} color - Hex color
   * @param {number} opacity - 0 to 1
   */
  withOpacity: (color, opacity) => withOpacity(color, opacity),

  /**
   * Get status color config (main + bg) for a given status string
   * @param {'pending'|'confirmed'|'cancelled'|'completed'|'inProgress'|'urgent'} status
   */
  getStatusColors: (status) => {
    const s = healthColors.status;
    const map = {
      pending: { color: s.pending, bg: s.pendingBg },
      confirmed: { color: s.confirmed, bg: s.confirmedBg },
      cancelled: { color: s.cancelled, bg: s.cancelledBg },
      completed: { color: s.completed, bg: s.completedBg },
      inProgress: { color: s.inProgress, bg: s.inProgressBg },
      urgent: { color: s.urgent, bg: s.urgentBg },
    };
    return map[status] ?? { color: s.completed, bg: s.completedBg };
  },

  /**
   * Create shadow by elevation level 0â€“8
   */
  createShadow: function (elevation) {
    if (elevation <= 0) return this.shadows.none;
    if (elevation <= 1) return this.shadows.xs;
    if (elevation <= 2) return this.shadows.sm;
    if (elevation <= 3) return this.shadows.md;
    if (elevation <= 5) return this.shadows.lg;
    return this.shadows.xl;
  },
};

export default theme;
export {
  withOpacity,
  healthColors,
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  textStyles,
  spacing,
  componentSpacing,
  layout,
  breakpoints,
  grid,
  safeAreaConfig,
};
