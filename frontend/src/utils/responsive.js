/**
 * Responsive Design Utilities
 * Ensures consistent UI across all device sizes
 * Based on React Native best practices
 */

import { Dimensions, Platform } from "react-native";

// Base dimensions (iPhone 11 Pro - common reference)
const BASE_HEIGHT = 812;

const isIOS = Platform.OS === "ios";

const getWindowDimensions = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

const isSmallDevice = () => {
  const { width } = getWindowDimensions();
  return width < 375;
};

const isMediumDevice = () => {
  const { width } = getWindowDimensions();
  return width >= 375 && width < 768;
};

// Scale size based on screen height
export const verticalScale = (size) => {
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

// Responsive border radius
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 24,
};

// Touch targets
export const touchTargets = {
  small: 44,
  medium: 48,
  large: 56,
};

export const getScreenPadding = () => {
  if (isSmallDevice()) return 12;
  if (isMediumDevice()) return 16;
  return 24;
};

export const getSafeAreaEdges = (screen = "default") => {
  const configs = {
    default: ["top", "left", "right", "bottom"],
    withTabBar: ["top", "left", "right"],
    modal: ["top"],
    none: [],
  };
  return configs[screen] || configs.default;
};

export const getKeyboardConfig = () => ({
  behavior: isIOS ? "padding" : "height",
  keyboardVerticalOffset: isIOS ? 64 : 0,
});

export const getButtonHeight = (size = "medium") => {
  const heights = {
    small: 36,
    medium: 48,
    large: 56,
  };
  return heights[size] || heights.medium;
};

export const getInputHeight = (multiline = false) => {
  if (multiline) return verticalScale(100);
  return 48;
};

// Export all utilities
export default {
          verticalScale,
  borderRadius,
  touchTargets,
  getScreenPadding,
  getSafeAreaEdges,
  getKeyboardConfig,
  getInputHeight,
  getButtonHeight,
};
