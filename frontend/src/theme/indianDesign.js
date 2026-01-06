/**
 * Indian Design System
 * Optimized for Indian users - all ages, all devices
 * Based on patterns from Paytm, Swiggy, Aarogya Setu, WhatsApp
 */

import { Dimensions, Platform } from 'react-native';
import { 
    scale, 
    verticalScale, 
    moderateScale, 
    scaledFontSize,
    touchTargets as responsiveTouchTargets,
    iconSizes as responsiveIconSizes,
    spacing as responsiveSpacing,
    borderRadius as responsiveBorderRadius,
} from '../utils/responsive';

const { width, height } = Dimensions.get('window');

export const indianDesign = {
    // Touch Targets - Large for easy tapping (responsive)
    touchTarget: {
        small: responsiveTouchTargets.small,
        medium: responsiveTouchTargets.medium,
        large: responsiveTouchTargets.large,
        extraLarge: Math.max(64, moderateScale(64)),
    },

    // Font Sizes - Very readable (responsive)
    fontSize: {
        tiny: scaledFontSize(12),
        small: scaledFontSize(14),
        medium: scaledFontSize(16),
        large: scaledFontSize(18),
        xlarge: scaledFontSize(20),
        xxlarge: scaledFontSize(24),
        huge: scaledFontSize(28),
        title: scaledFontSize(32),
    },

    // Font Weights
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Spacing - Generous and breathable (responsive)
    spacing: {
        xs: moderateScale(4),
        sm: moderateScale(8),
        md: moderateScale(12),
        lg: moderateScale(16),
        xl: moderateScale(20),
        xxl: moderateScale(24),
        xxxl: moderateScale(32),
        huge: moderateScale(40),
    },

    // Border Radius - Friendly and modern (responsive)
    borderRadius: {
        small: responsiveBorderRadius.small,
        medium: responsiveBorderRadius.medium,
        large: responsiveBorderRadius.large,
        xlarge: responsiveBorderRadius.xlarge,
        round: moderateScale(50),
        pill: 999,
    },

    // Card Styles (responsive)
    card: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderRadius: responsiveBorderRadius.large,
        padding: moderateScale(16),
    },

    // Large Action Card (for dashboards) (responsive)
    actionCard: {
        minHeight: verticalScale(100),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        borderRadius: responsiveBorderRadius.xlarge,
        padding: moderateScale(20),
    },

    // Button Styles (responsive)
    button: {
        height: responsiveTouchTargets.medium,
        borderRadius: responsiveBorderRadius.medium,
        paddingHorizontal: moderateScale(24),
    },

    largeButton: {
        height: responsiveTouchTargets.large,
        borderRadius: responsiveBorderRadius.large,
        paddingHorizontal: moderateScale(32),
    },

    // Input Styles (responsive)
    input: {
        height: responsiveTouchTargets.medium,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },

    // Icon Sizes (responsive)
    iconSize: {
        tiny: responsiveIconSizes.tiny,
        small: responsiveIconSizes.small,
        medium: responsiveIconSizes.medium,
        large: responsiveIconSizes.large,
        xlarge: responsiveIconSizes.xlarge,
        huge: scaledFontSize(48),
    },

    // Animation Durations
    animation: {
        fast: 150,
        normal: 300,
        slow: 500,
    },

    // Screen Dimensions
    screen: {
        width,
        height,
        isSmallDevice: width < 375,
        isMediumDevice: width >= 375 && width < 414,
        isLargeDevice: width >= 414,
    },

    // Grid Layout
    grid: {
        columns: 2,
    },

    // Bottom Tab Bar
    tabBar: {
        height: 60,
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        elevation: 8,
    },

    // Header
    header: {
        height: Platform.OS === 'ios' ? 88 : 56,
        elevation: 4,
    },

    // List Item
    listItem: {
        minHeight: 72,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },

    // Avatar Sizes
    avatar: {
        small: 32,
        medium: 40,
        large: 56,
        xlarge: 80,
    },

    // Z-Index Layers
    zIndex: {
        base: 1,
        dropdown: 10,
        modal: 100,
        overlay: 1000,
        toast: 10000,
    },
};

// Helper Functions - using elevation system from elevation.js for consistency
// Re-exporting createShadow for backward compatibility with proper naming
export { createShadow } from './elevation';

// Shadow presets with semantic naming for backward compatibility
export const shadows = {
    none: require('./elevation').elevation.level0,
    small: require('./elevation').elevation.level1,
    medium: require('./elevation').elevation.level2,
    large: require('./elevation').elevation.level4,
    xlarge: require('./elevation').elevation.level6,
};

export const isSmallScreen = () => width < 375;
export const isMediumScreen = () => width >= 375 && width < 414;
export const isLargeScreen = () => width >= 414;

export default indianDesign;
