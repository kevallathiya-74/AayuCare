/**
 * Indian Design System
 * Optimized for Indian users - all ages, all devices
 * Based on patterns from Paytm, Swiggy, Aarogya Setu, WhatsApp
 */

import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const indianDesign = {
    // Touch Targets - Large for easy tapping
    touchTarget: {
        small: 44,
        medium: 48,
        large: 56,
        extraLarge: 64,
    },

    // Font Sizes - Very readable
    fontSize: {
        tiny: 12,
        small: 14,
        medium: 16,
        large: 18,
        xlarge: 20,
        xxlarge: 24,
        huge: 28,
        title: 32,
    },

    // Font Weights
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Spacing - Generous and breathable
    spacing: {
        xs: 4,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 20,
        xxl: 24,
        xxxl: 32,
        huge: 40,
    },

    // Border Radius - Friendly and modern
    borderRadius: {
        small: 4,
        medium: 8,
        large: 12,
        xlarge: 16,
        round: 50,
        pill: 999,
    },

    // Card Styles
    card: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderRadius: 12,
        padding: 16,
    },

    // Large Action Card (for dashboards)
    actionCard: {
        minHeight: 100,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        borderRadius: 16,
        padding: 20,
    },

    // Button Styles
    button: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 24,
    },

    largeButton: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 32,
    },

    // Input Styles
    input: {
        height: 48,
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1,
    },

    // Icon Sizes
    iconSize: {
        tiny: 16,
        small: 20,
        medium: 24,
        large: 32,
        xlarge: 40,
        huge: 48,
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
        gap: 16,
        cardWidth: (width - 48) / 2, // 2 columns with padding
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

// Helper Functions
export const createShadow = (elevation = 2) => {
    if (Platform.OS === 'web') {
        const opacity = 0.1 + elevation * 0.02;
        const blur = elevation * 2;
        return {
            boxShadow: `0px ${elevation}px ${blur}px rgba(0, 0, 0, ${opacity})`,
        };
    }
    if (Platform.OS === 'ios') {
        return {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: elevation },
            shadowOpacity: 0.1 + elevation * 0.02,
            shadowRadius: elevation * 2,
        };
    }
    return {
        elevation,
    };
};

export const isSmallScreen = () => width < 375;
export const isMediumScreen = () => width >= 375 && width < 414;
export const isLargeScreen = () => width >= 414;

export default indianDesign;
