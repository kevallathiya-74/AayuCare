/**
 * Responsive Design Utilities
 * Ensures consistent UI across all device sizes
 * Based on React Native best practices
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

// Base dimensions (iPhone 11 Pro - common reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Get current window dimensions
export const getWindowDimensions = () => {
    const { width, height } = Dimensions.get('window');
    const scale = Dimensions.get('window').scale;
    const fontScale = Dimensions.get('window').fontScale;
    
    return { width, height, scale, fontScale };
};

// Get screen dimensions
export const getScreenDimensions = () => {
    const { width, height } = Dimensions.get('screen');
    return { width, height };
};

// Check device type
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

export const isTablet = () => {
    const { width } = getWindowDimensions();
    return width >= 768;
};

// Scale size based on screen width
export const scale = (size) => {
    // Validate input
    if (typeof size !== 'number' || isNaN(size) || !isFinite(size)) {
        return 0;
    }
    
    const { width } = getWindowDimensions();
    const scaleFactor = width / BASE_WIDTH;
    
    if (!isFinite(scaleFactor)) {
        return Math.round(size);
    }
    
    return Math.round(size * scaleFactor);
};

// Scale vertically based on screen height
export const verticalScale = (size) => {
    // Validate input
    if (typeof size !== 'number' || isNaN(size) || !isFinite(size)) {
        return 0;
    }
    
    const { height } = getWindowDimensions();
    const scaleFactor = height / BASE_HEIGHT;
    
    if (!isFinite(scaleFactor)) {
        return Math.round(size);
    }
    
    return Math.round(size * scaleFactor);
};

// Moderate scale - less aggressive scaling
export const moderateScale = (size, factor = 0.5) => {
    // Validate inputs
    if (typeof size !== 'number' || isNaN(size) || !isFinite(size)) {
        return 0;
    }
    if (typeof factor !== 'number' || isNaN(factor) || !isFinite(factor)) {
        factor = 0.5;
    }
    
    const { width } = getWindowDimensions();
    const scaleFactor = width / BASE_WIDTH;
    
    if (!isFinite(scaleFactor)) {
        return Math.round(size);
    }
    
    return Math.round(size + (scaleFactor - 1) * size * factor);
};

// Font scale with device font scale consideration
export const scaledFontSize = (size) => {
    // Validate input
    if (typeof size !== 'number' || isNaN(size) || !isFinite(size)) {
        return 14; // Default fallback font size
    }
    
    const { fontScale } = getWindowDimensions();
    const scaled = moderateScale(size, 0.3); // Less aggressive for fonts
    
    // Validate fontScale
    if (typeof fontScale !== 'number' || isNaN(fontScale) || !isFinite(fontScale) || fontScale === 0) {
        return Math.round(scaled); // Return scaled size without fontScale adjustment
    }
    
    return Math.round(scaled / fontScale) * fontScale; // Respect user's font size setting
};

// Responsive spacing
export const spacing = {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(16),
    lg: moderateScale(24),
    xl: moderateScale(32),
    xxl: moderateScale(48),
};

// Responsive border radius
export const borderRadius = {
    small: moderateScale(4),
    medium: moderateScale(8),
    large: moderateScale(12),
    xlarge: moderateScale(16),
    round: moderateScale(24),
};

// Responsive touch targets (minimum 44x44 for accessibility)
export const touchTargets = {
    small: Math.max(44, moderateScale(44)),
    medium: Math.max(48, moderateScale(48)),
    large: Math.max(56, moderateScale(56)),
};

// Responsive icon sizes
export const iconSizes = {
    tiny: scaledFontSize(16),
    small: scaledFontSize(20),
    medium: scaledFontSize(24),
    large: scaledFontSize(32),
    xlarge: scaledFontSize(40),
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
export const getGridItemWidth = (columns = null, gap = 16) => {
    const { width } = getWindowDimensions();
    const cols = columns || getGridColumns();
    const totalGap = gap * (cols + 1);
    return (width - totalGap) / cols;
};

// Responsive padding for screens
export const getScreenPadding = () => {
    if (isSmallDevice()) return 12;
    if (isMediumDevice()) return 16;
    return 24; // Large devices
};

// Status bar height
export const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
        return Platform.Version >= 11 ? 44 : 20;
    }
    return 0; // Android handles automatically
};

// Bottom tab bar height
export const getTabBarHeight = () => {
    if (Platform.OS === 'ios') {
        return 83; // With safe area
    }
    return 60;
};

// Card dimensions for consistent layouts
export const getCardHeight = (variant = 'default') => {
    const heights = {
        small: verticalScale(80),
        default: verticalScale(120),
        large: verticalScale(160),
        xlarge: verticalScale(200),
    };
    return heights[variant] || heights.default;
};

// Responsive breakpoints
export const breakpoints = {
    small: 375,
    medium: 768,
    large: 1024,
    xlarge: 1280,
};

// Check if current device matches breakpoint
export const matchesBreakpoint = (breakpoint) => {
    const { width } = getWindowDimensions();
    return width >= breakpoints[breakpoint];
};

// Platform-specific helper
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';

// Normalize pixel density differences
export const normalize = (size) => {
    const { scale } = getWindowDimensions();
    const newSize = size * scale;
    
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) / scale;
    }
    
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) / scale;
};

// SafeAreaView edges configuration
export const getSafeAreaEdges = (screen = 'default') => {
    const configs = {
        default: ['top', 'left', 'right', 'bottom'],
        withTabBar: ['top', 'left', 'right'], // Bottom handled by tab bar
        modal: ['top'],
        none: [],
    };
    return configs[screen] || configs.default;
};

// KeyboardAvoidingView configuration
export const getKeyboardConfig = () => ({
    behavior: isIOS ? 'padding' : 'height',
    keyboardVerticalOffset: isIOS ? getStatusBarHeight() : 0,
});

// Input field height
export const getInputHeight = (multiline = false) => {
    if (multiline) return verticalScale(100);
    return Math.max(48, moderateScale(48)); // Minimum 48px for accessibility
};

// Button height
export const getButtonHeight = (size = 'medium') => {
    const heights = {
        small: Math.max(36, moderateScale(36)),
        medium: Math.max(48, moderateScale(48)),
        large: Math.max(56, moderateScale(56)),
    };
    return heights[size] || heights.medium;
};

// Responsive container width
export const getContainerWidth = (maxWidth = 600) => {
    const { width } = getWindowDimensions();
    if (isTablet()) {
        return Math.min(width * 0.85, maxWidth);
    }
    return width - (getScreenPadding() * 2);
};

// List item height
export const getListItemHeight = (variant = 'default') => {
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
    moderateScale,
    scaledFontSize,
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
    isWeb,
    normalize,
    getSafeAreaEdges,
    getKeyboardConfig,
    getInputHeight,
    getButtonHeight,
    getContainerWidth,
    getListItemHeight,
};
