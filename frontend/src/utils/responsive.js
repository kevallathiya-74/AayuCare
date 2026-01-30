/**
 * Responsive Design Utilities
 * Ensures consistent UI across all device sizes
 * Based on React Native best practices
 */

import { Dimensions, Platform, PixelRatio } from "react-native";

// Base dimensions (iPhone 11 Pro - common reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Platform detection
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Get current window dimensions
export const getWindowDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

// Get screen dimensions (full physical screen)
export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('screen');
  return { width, height };
};

// Device size detection
export const isSmallDevice = () => {
  const { width } = getWindowDimensions();
  return width < 375;
};

export const isMediumDevice = () => {
  const { width } = getWindowDimensions();
  return width >= 375 && width < 768;
};

export const isLargeDevice = () => {
  const { width } = getWindowDimensions();
  return width >= 768;
};

// Check if device is a tablet
export const isTablet = () => {
  const { width } = getWindowDimensions();
  return width >= 768;
};

// Scale size based on screen width
export const scale = (size) => {
  // Validate input
  if (typeof size !== "number" || isNaN(size) || !isFinite(size)) {
    return 0;
  }

  const { width } = getWindowDimensions();
  const scaleFactor = width / BASE_WIDTH;

  if (!isFinite(scaleFactor)) {
    return Math.round(size);
  }

  return Math.round(size * scaleFactor);
};

// Scale size based on screen height
export const verticalScale = (size) => {
  // Validate input
  if (typeof size !== "number" || isNaN(size) || !isFinite(size)) {
    return 0;
  }

  const { height } = getWindowDimensions();
  const scaleFactor = height / BASE_HEIGHT;

  if (!isFinite(scaleFactor)) {
    return Math.round(size);
  }

  return Math.round(size * scaleFactor);
};

// Normalize font sizes across different pixel densities
export const normalize = (size) => {
  const pixelRatio = PixelRatio.get();
  return Math.round(size * pixelRatio) / pixelRatio;
};

// Responsive spacing - static values
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Responsive border radius - static values
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 24,
};

// Touch targets (minimum 44x44 for accessibility) - static values
export const touchTargets = {
  small: 44,
  medium: 48,
  large: 56,
};

// Icon sizes - static values
export const iconSizes = {
  tiny: 16,
  small: 20,
  medium: 24,
  large: 32,
  xlarge: 40,
};

// Grid column calculation for responsive layouts
export const getGridColumns = () => {
  const { width } = getWindowDimensions();

  if (width < 375) return 1; // Very small phones
  if (width < 768) return 2; // Phones
  if (width < 1024) return 3; // Tablets portrait
  return 4; // Tablets landscape / large screens
};

// Calculate item width for grid
export const getScreenPadding = () => {
  if (isSmallDevice()) return 12;
  if (isMediumDevice()) return 16;
  return 24; // Large devices
};

// Status bar height
export const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    return isIOS ? 44 : 20; // iPhone X+ vs older models
  }
  return 24; // Android
};

// Tab bar height
export const getTabBarHeight = () => {
  if (Platform.OS === "ios") {
    return 83; // With safe area
  }
  return 60;
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: 0,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Check if current width matches breakpoint
export const matchesBreakpoint = (breakpoint) => {
  const { width } = getWindowDimensions();
  return width >= breakpoints[breakpoint];
};

// Calculate card height
export const getCardHeight = (variant = 'default') => {
  const heights = {
    compact: verticalScale(120),
    default: verticalScale(160),
    expanded: verticalScale(200),
  };
  return heights[variant] || heights.default;
};

// Calculate grid item width
export const getGridItemWidth = (columns = 2, spacing = 16) => {
  const { width } = getWindowDimensions();
  const totalSpacing = spacing * (columns + 1);
  return (width - totalSpacing) / columns;
};

// Card dimensions for consistent layouts
export const getSafeAreaEdges = (screen = "default") => {
  const configs = {
    default: ["top", "left", "right", "bottom"],
    withTabBar: ["top", "left", "right"], // Bottom handled by tab bar
    modal: ["top"],
    none: [],
  };
  return configs[screen] || configs.default;
};

// KeyboardAvoidingView configuration
export const getKeyboardConfig = () => ({
  behavior: isIOS ? "padding" : "height",
  keyboardVerticalOffset: isIOS ? getStatusBarHeight() : 0,
});

// Input field height - static values
export const getInputHeight = (multiline = false) => {
  if (multiline) return verticalScale(100);
  return 48; // Minimum 48px for accessibility
};

// Button height - static values
export const getButtonHeight = (size = "medium") => {
  const heights = {
    small: 36,
    medium: 48,
    large: 56,
  };
  return heights[size] || heights.medium;
};

// Responsive container width
export const getContainerWidth = (maxWidth = 600) => {
  const { width } = getWindowDimensions();
  if (isTablet()) {
    return Math.min(width * 0.85, maxWidth);
  }
  return width - getScreenPadding() * 2;
};

// List item height
export const getListItemHeight = (variant = "default") => {
  const heights = {
    compact: verticalScale(56),
    default: verticalScale(72),
    comfortable: verticalScale(88),
  };
  return heights[variant] || heights.default;
};

// Export all utilities
export default {
  getWindowDimensions,
  getScreenDimensions,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  scale,
  verticalScale,
  spacing,
  borderRadius,
  touchTargets,
  iconSizes,
  getGridColumns,
  getGridItemWidth,
  getScreenPadding,
  getStatusBarHeight,
  getTabBarHeight,
  getCardHeight,
  breakpoints,
  matchesBreakpoint,
  isIOS,
  isAndroid,
  normalize,
  getSafeAreaEdges,
  getKeyboardConfig,
  getInputHeight,
  getButtonHeight,
  getContainerWidth,
  getListItemHeight,
};
