/**
 * AayuCare Health Colors - Complete Color System
 * Professional, trustworthy, and healing color palette
 * Optimized for healthcare application
 */

export const healthColors = {
    // Common Colors - Quick Access
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Neutral Colors - Grayscale
    neutral: {
        white: '#FFFFFF',
        gray50: '#FAFAFA',
        gray100: '#F5F5F5',
        gray200: '#EEEEEE',
        gray300: '#E0E0E0',
        gray400: '#BDBDBD',
        gray500: '#9E9E9E',
        gray600: '#757575',
        gray700: '#616161',
        gray800: '#424242',
        gray900: '#212121',
        black: '#000000',
    },

    // Primary Colors - Healing & Trust
    primary: {
        main: '#00ACC1',        // Healing Teal
        light: '#4DD0E1',       // Fresh Aqua
        dark: '#00838F',        // Deep Teal
        gradient: ['#00ACC1', '#4DD0E1', '#81D4FA'], // Teal → Aqua → Sky Blue
    },

    // Secondary Colors - Wellness & Energy
    secondary: {
        main: '#81D4FA',        // Sky Wellness Blue
        light: '#B3E5FC',       // Light Sky
        dark: '#4FC3F7',        // Bright Blue
        gradient: ['#81D4FA', '#4FC3F7'],
    },

    // Hospital Professional - Teal + Navy
    hospital: {
        teal: '#00ACC1',        // Professional Teal
        navy: '#1A237E',        // Trustworthy Navy
        gradient: ['#00ACC1', '#1A237E'],
    },

    // Accent Colors
    accent: {
        coral: '#FF7043',       // Energy Coral (alerts, important)
        green: '#66BB6A',       // Herbal Green (vitals good/safe)
        lavender: '#CE93D8',    // Mild Lavender (women's health)
        aqua: '#4DD0E1',        // Fresh Aqua (fitness)
    },

    // Semantic Colors
    success: {
        main: '#66BB6A',        // Herbal Green
        light: '#C8E6C9',
        dark: '#43A047',
        background: '#E8F5E9',
    },

    error: {
        main: '#FF7043',        // Energy Coral
        light: '#FFCCBC',
        dark: '#F4511E',
        background: '#FBE9E7',
    },

    warning: {
        main: '#FFA726',        // Warm Orange
        light: '#FFE0B2',
        dark: '#FB8C00',
        background: '#FFF3E0',
    },

    info: {
        main: '#81D4FA',        // Sky Blue
        light: '#B3E5FC',
        dark: '#4FC3F7',
        background: '#E1F5FE',
    },

    // Background Colors
    background: {
        primary: '#FFFFFF',      // Soft Medical White
        secondary: '#F8FAFB',    // Very Light Blue-Gray
        tertiary: '#F0F4F7',     // Light Gray
        card: '#FFFFFF',         // White cards
        overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Text Colors
    text: {
        primary: '#2C3E50',      // Dark Slate
        secondary: '#7F8C8D',    // Medium Gray
        tertiary: '#95A5A6',     // Light Gray
        white: '#FFFFFF',        // Pure White
        link: '#00ACC1',         // Healing Teal
        disabled: '#BDC3C7',     // Disabled Gray
    },

    // Border Colors
    border: {
        light: '#E8EAED',
        main: '#DADCE0',
        medium: '#DADCE0',
        dark: '#BDC1C6',
    },

    // Fitness & Wellness - Energetic but Clean
    fitness: {
        aqua: '#4DD0E1',         // Fresh Aqua
        green: '#66BB6A',        // Herbal Green
        coral: '#FF7043',        // Energy Coral
        gradient: ['#4DD0E1', '#66BB6A', '#FF7043'],
    },

    // Women's Health
    womens: {
        lavender: '#CE93D8',     // Mild Lavender
        light: '#F3E5F5',
        gradient: ['#CE93D8', '#E1BEE7'],
    },

    // AI Guidance - Minimal & Clean
    ai: {
        teal: '#00ACC1',         // Soft Teal
        white: '#FFFFFF',        // White minimal
        coral: '#FF7043',        // Red flags
        gradient: ['#00ACC1', '#FFFFFF'],
    },

    // Dashboard Specific
    dashboard: {
        background: '#FFFFFF',   // Soft Medical White
        primaryButton: '#00ACC1', // Healing Teal
        secondaryButton: '#81D4FA', // Sky Wellness Blue
        alert: '#FF7043',        // Energy Coral
        safe: '#66BB6A',         // Herbal Green
    },

    // Card Colors
    card: {
        background: '#FFFFFF',
        border: '#E8EAED',
        shadow: 'rgba(0, 0, 0, 0.1)',
    },

    // Button Colors
    button: {
        disabled: '#E0E0E0',
        disabledText: '#9E9E9E',
    },

    // Shadow Colors
    shadows: {
        light: 'rgba(0, 0, 0, 0.05)',
        medium: 'rgba(0, 0, 0, 0.1)',
        dark: 'rgba(0, 0, 0, 0.2)',
    },
};

// Utility function to get rgba color with opacity
export const withOpacity = (color, opacity) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default healthColors;
