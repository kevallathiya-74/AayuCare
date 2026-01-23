/**
 * AayuCare Unified Theme System
 * Single Source of Truth for ALL UI/UX Values
 * Production-Grade Healthcare Application
 *
 * USAGE:
 * import { theme } from '../theme';
 *
 * Example:
 * color: theme.colors.primary
 * fontSize: theme.typography.sizes.body
 * padding: theme.spacing.md
 */

import { healthColors } from "./healthColors";

// ===================================================================
// UNIFIED THEME OBJECT - Single Export for Entire App
// ===================================================================

export const theme = {
  // =================================================================
  // COLORS - Complete Color System
  // =================================================================
  colors: {
    // Primary Brand Colors
    primary: healthColors.primary.main,
    primaryLight: healthColors.primary.light,
    primaryDark: healthColors.primary.dark,

    // Secondary Colors
    secondary: healthColors.secondary.main,
    secondaryLight: healthColors.secondary.light,
    secondaryDark: healthColors.secondary.dark,

    // Semantic Colors
    success: {
      main: healthColors.success.main,
      light: healthColors.success.light,
      dark: healthColors.success.dark,
      background: healthColors.success.background,
    },

    error: {
      main: healthColors.error.main,
      light: healthColors.error.light,
      dark: healthColors.error.dark,
      background: healthColors.error.background,
    },

    warning: {
      main: healthColors.warning.main,
      light: healthColors.warning.light,
      dark: healthColors.warning.dark,
      background: healthColors.warning.background,
    },

    info: {
      main: healthColors.info.main,
      light: healthColors.info.light,
      dark: healthColors.info.dark,
      background: healthColors.info.background,
    },

    // Background Colors
    background: {
      primary: healthColors.background.primary,
      secondary: healthColors.background.secondary,
      card: healthColors.background.card,
      overlay: healthColors.background.overlay,
    },

    // Text Colors
    text: {
      primary: healthColors.text.primary,
      secondary: healthColors.text.secondary,
      tertiary: healthColors.text.tertiary,
      white: healthColors.text.white,
      disabled: healthColors.text.disabled,
    },

    // Border Colors
    border: {
      main: healthColors.border.main,
      light: healthColors.border.light,
      dark: healthColors.border.dark,
    },

    // Neutral Colors
    white: healthColors.white,
    black: healthColors.black,
    transparent: healthColors.transparent,

    // Grays
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

    // Healthcare Specific
    healthcare: {
      heartRate: healthColors.health.heartRate,
      bloodPressure: healthColors.health.bloodPressure,
      temperature: healthColors.health.temperature,
      glucose: healthColors.health.glucose,
      oxygen: healthColors.health.oxygen,
      weight: healthColors.health.weight,
      steps: healthColors.health.steps,
      teal: healthColors.hospital.teal,
      navy: healthColors.hospital.navy,
      purple: "#7E57C2",
      pink: "#EC4899",
      cyan: "#00BCD4",
    },

    // Status Colors
    status: {
      pending: healthColors.status.pending,
      confirmed: healthColors.status.confirmed,
      cancelled: healthColors.status.cancelled,
      completed: healthColors.status.completed,
      inProgress: healthColors.status.inProgress,
    },
  },

  // =================================================================
  // TYPOGRAPHY - All Font Sizes, Weights, Line Heights
  // =================================================================
  typography: {
    // Font Families
    fontFamily: {
      regular: "System",
      medium: "System",
      bold: "System",
    },

    // Font Sizes
    sizes: {
      xs: 10,
      sm: 12,
      base: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
      xxxxl: 32,
      xxxxxl: 40,

      // Semantic Sizes
      caption: 11,
      body: 14,
      bodyLarge: 16,
      subtitle: 14,
      title: 18,
      headline: 24,
      display: 32,
    },

    // Font Weights
    weights: {
      light: "300",
      regular: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },

    // Line Heights
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // =================================================================
  // SPACING - All Margins, Paddings, Gaps
  // =================================================================
  spacing: {
    // Base Spacing Scale
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    xxxxxl: 48,

    // Screen Padding
    screenPadding: 16,
    screenPaddingHorizontal: 16,
    screenPaddingVertical: 16,

    // Component Spacing
    cardPadding: 16,
    cardMargin: 12,
    buttonPadding: 14,
    inputPadding: 12,

    // Gaps
    gapXs: 4,
    gapSm: 8,
    gapMd: 12,
    gapLg: 16,
    gapXl: 24,
  },

  // =================================================================
  // BORDER RADIUS - All Rounded Corners
  // =================================================================
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,

    // Semantic Radius
    button: 12,
    card: 16,
    input: 10,
    modal: 20,
    badge: 12,
  },

  // =================================================================
  // SHADOWS & ELEVATION (iOS & Android Compatible)
  // =================================================================
  shadows: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },

    sm: {
      shadowColor: healthColors.shadows.light,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },

    md: {
      shadowColor: healthColors.shadows.medium,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    lg: {
      shadowColor: healthColors.shadows.medium,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },

    xl: {
      shadowColor: healthColors.shadows.dark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },

    // Semantic Shadows
    card: {
      shadowColor: healthColors.shadows.medium,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    button: {
      shadowColor: healthColors.shadows.medium,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 1,
    },
  },

  // =================================================================
  // TOUCH TARGETS - Minimum Sizes for Accessibility
  // =================================================================
  touchTargets: {
    min: 44,
    sm: 36,
    md: 44,
    lg: 56,
    xl: 64,
  },

  // =================================================================
  // ICON SIZES
  // =================================================================
  iconSizes: {
    xs: 14,
    sm: 18,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
  },

  // =================================================================
  // ANIMATION DURATIONS (Consistent Timing)
  // =================================================================
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },

  // =================================================================
  // GRADIENTS (Pre-configured)
  // =================================================================
  gradients: {
    primary: ["#00ACC1", "#4DD0E1"],
    secondary: ["#81D4FA", "#4FC3F7"],
    success: ["#66BB6A", "#43A047"],
    error: ["#FF7043", "#F4511E"],
    warm: ["#FF9800", "#FFB74D"],
    cool: ["#00ACC1", "#81D4FA"],
  },

  // =================================================================
  // UTILITY FUNCTIONS (as methods)
  // =================================================================

  /**
   * Get color with opacity
   * @param {string} color - Hex color
   * @param {number} opacity - 0 to 1
   * @returns {string} rgba color
   */
  withOpacity: (color, opacity) => {
    // Defensive checks
    if (!color || typeof color !== "string") {
      console.warn("[Theme] withOpacity: Invalid color provided:", color);
      return `rgba(0, 0, 0, ${opacity || 0})`;
    }

    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  /**
   * Create shadow with specific elevation
   * @param {number} elevation - 0 to 8
   * @returns {object} shadow style object
   */
  createShadow: function (elevation) {
    // Use 'this' to access shadows from the theme object
    if (elevation === 0) return this.shadows.none;
    if (elevation <= 1) return this.shadows.sm;
    if (elevation <= 2) return this.shadows.md;
    if (elevation <= 4) return this.shadows.lg;
    return this.shadows.xl;
  },
};

export default theme;
export { healthColors };


