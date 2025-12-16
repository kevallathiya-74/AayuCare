/**
 * AayuCare Design System - Elevation & Shadows
 * 
 * Platform-specific shadows that work consistently across iOS and Android
 * Following Material Design 3 elevation system
 */

import { Platform } from 'react-native';

/**
 * Elevation system for cards, buttons, and surfaces
 * Provides consistent depth perception across platforms
 */
export const elevation = {
  // Level 0 - No elevation (flat surfaces)
  level0: Platform.select({
    ios: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    android: {
      elevation: 0,
    },
    default: {},
  }),

  // Level 1 - Cards, list items (subtle elevation)
  level1: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
    },
    android: {
      elevation: 1,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
    },
  }),

  // Level 2 - Raised buttons, app bars
  level2: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20,
      shadowRadius: 1.41,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20,
      shadowRadius: 1.41,
    },
  }),

  // Level 3 - Menus, dropdowns
  level3: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
  }),

  // Level 4 - FABs, dialogs
  level4: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
    },
  }),

  // Level 6 - Modals, popovers
  level6: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.27,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.27,
      shadowRadius: 3.84,
    },
  }),

  // Level 8 - Navigation drawer, full-screen modals
  level8: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
    },
  }),

  // Level 12 - High-priority dialogs
  level12: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
    },
    android: {
      elevation: 12,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
    },
  }),

  // Level 16 - Critical overlays
  level16: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
    },
    android: {
      elevation: 16,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.44,
      shadowRadius: 10.32,
    },
  }),

  // Level 24 - System overlays (rare)
  level24: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.58,
      shadowRadius: 16.00,
    },
    android: {
      elevation: 24,
    },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.58,
      shadowRadius: 16.00,
    },
  }),
};

/**
 * Semantic shadow helpers for common use cases
 */
export const shadows = {
  // Card shadow (subtle)
  card: elevation.level1,

  // Button shadow (slightly more prominent)
  button: elevation.level2,

  // FAB shadow (prominent)
  fab: elevation.level6,

  // Modal shadow (very prominent)
  modal: elevation.level8,

  // Dropdown/Menu shadow
  dropdown: elevation.level3,

  // Navigation drawer
  drawer: elevation.level16,

  // Dialog/Alert
  dialog: elevation.level24,

  // None
  none: elevation.level0,
};

/**
 * Custom shadow generator for precise control
 * @param {number} height - Shadow offset height
 * @param {number} radius - Shadow blur radius
 * @param {number} opacity - Shadow opacity (0-1)
 * @param {string} color - Shadow color (hex)
 * @returns {object} Platform-specific shadow style
 */
export const createShadow = (height = 2, radius = 3.84, opacity = 0.25, color = '#000') => {
  // Validate and sanitize inputs to prevent NaN
  const safeHeight = typeof height === 'number' && !isNaN(height) && isFinite(height) ? height : 2;
  const safeRadius = typeof radius === 'number' && !isNaN(radius) && isFinite(radius) ? radius : 3.84;
  const safeOpacity = typeof opacity === 'number' && !isNaN(opacity) && isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 0.25;
  const safeColor = typeof color === 'string' && color.length > 0 ? color : '#000';
  
  return Platform.select({
    ios: {
      shadowColor: safeColor,
      shadowOffset: { width: 0, height: safeHeight },
      shadowOpacity: safeOpacity,
      shadowRadius: safeRadius,
    },
    android: {
      elevation: Math.max(0, Math.min(24, safeHeight * 2)), // Clamp between 0-24, approximate elevation based on height
    },
    default: {
      shadowColor: safeColor,
      shadowOffset: { width: 0, height: safeHeight },
      shadowOpacity: safeOpacity,
      shadowRadius: safeRadius,
    },
  });
};

/**
 * Shadow with custom color (useful for colored shadows)
 */
export const coloredShadow = (color, opacity = 0.3) => {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: opacity,
      shadowRadius: 3.84,
    },
    android: {
      elevation: 4,
      // Note: Android doesn't support colored shadows natively
    },
    default: {
      shadowColor: color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: opacity,
      shadowRadius: 3.84,
    },
  });
};

/**
 * Inner shadow effect (using border as workaround)
 * Note: True inner shadows require custom implementation or image
 */
export const innerShadow = {
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.05)',
  backgroundColor: '#FAFAFA',
};

/**
 * Usage examples:
 * 
 * // Card with shadow
 * <View style={[styles.card, shadows.card]}>
 *   <Text>Card content</Text>
 * </View>
 * 
 * // Custom shadow
 * <View style={[styles.container, createShadow(4, 5.0, 0.3)]}>
 *   <Text>Custom shadow</Text>
 * </View>
 * 
 * // Colored shadow (iOS only)
 * <View style={[styles.box, coloredShadow('#00ACC1', 0.4)]}>
 *   <Text>Colored shadow</Text>
 * </View>
 */

export default {
  elevation,
  shadows,
  createShadow,
  coloredShadow,
  innerShadow,
};
