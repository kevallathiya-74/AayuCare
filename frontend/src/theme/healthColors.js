/**
 * AayuCare Health Colors - Complete Color System
 * Professional, trustworthy, and healing color palette
 * Optimized for healthcare application
 */

const healthColors = {
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
        main: '#00ACC1',
        light: '#4DD0E1',
        dark: '#00838F',
        gradient: ['#00ACC1', '#4DD0E1', '#81D4FA'],
    },

    // Secondary Colors - Wellness & Energy
    secondary: {
        main: '#81D4FA',
        light: '#B3E5FC',
        dark: '#4FC3F7',
        gradient: ['#81D4FA', '#4FC3F7'],
    },

    // Hospital Professional - Teal + Navy
    hospital: {
        teal: '#00ACC1',
        navy: '#1A237E',
        gradient: ['#00ACC1', '#1A237E'],
    },

    // Accent Colors
    accent: {
        coral: '#FF7043',
        green: '#66BB6A',
        lavender: '#CE93D8',
        aqua: '#4DD0E1',
    },

    // Semantic Colors
    success: {
        main: '#66BB6A',
        light: '#C8E6C9',
        dark: '#43A047',
        background: '#E8F5E9',
    },

    error: {
        main: '#FF7043',
        light: '#FFCCBC',
        dark: '#F4511E',
        background: '#FBE9E7',
    },

    warning: {
        main: '#FFA726',
        light: '#FFE0B2',
        dark: '#FB8C00',
        background: '#FFF3E0',
    },

    info: {
        main: '#81D4FA',
        light: '#B3E5FC',
        dark: '#4FC3F7',
        background: '#E1F5FE',
    },

    // Background Colors
    background: {
        primary: '#FFFFFF',
        secondary: '#F8FAFB',
        tertiary: '#F0F4F7',
        card: '#FFFFFF',
        overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Text Colors
    text: {
        primary: '#2C3E50',
        secondary: '#7F8C8D',
        tertiary: '#95A5A6',
        white: '#FFFFFF',
        link: '#00ACC1',
        disabled: '#BDC3C7',
    },

    // Border Colors
    border: {
        light: '#E8EAED',
        main: '#DADCE0',
        medium: '#DADCE0',
        dark: '#BDC1C6',
    },

    // Fitness & Wellness
    fitness: {
        aqua: '#4DD0E1',
        green: '#66BB6A',
        coral: '#FF7043',
        gradient: ['#4DD0E1', '#66BB6A', '#FF7043'],
    },

    // Women's Health
    womens: {
        lavender: '#CE93D8',
        light: '#F3E5F5',
        gradient: ['#CE93D8', '#E1BEE7'],
    },

    // AI Guidance
    ai: {
        teal: '#00ACC1',
        white: '#FFFFFF',
        coral: '#FF7043',
        gradient: ['#00ACC1', '#FFFFFF'],
    },

    // Dashboard Specific
    dashboard: {
        background: '#FFFFFF',
        primaryButton: '#00ACC1',
        secondaryButton: '#81D4FA',
        alert: '#FF7043',
        safe: '#66BB6A',
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

    // Healthcare-Specific Colors
    health: {
        heartRate: '#E91E63',
        bloodPressure: '#9C27B0',
        temperature: '#FF9800',
        glucose: '#66BB6A',
        oxygen: '#00ACC1',
        weight: '#FF7043',
        steps: '#81D4FA',
    },

    // Status Colors
    status: {
        pending: '#FFA726',
        confirmed: '#66BB6A',
        cancelled: '#FF7043',
        completed: '#9E9E9E',
        inProgress: '#00ACC1',
    },

    // Gradient Combinations
    gradients: {
        primary: ['#00ACC1', '#4DD0E1'],
        secondary: ['#81D4FA', '#4FC3F7'],
        warm: ['#FF9800', '#FFB74D'],
        cool: ['#00ACC1', '#81D4FA'],
        health: ['#66BB6A', '#00ACC1'],
    },

    // Border Radius
    borderRadius: {
        small: 8,
        medium: 12,
        large: 16,
        xlarge: 24,
        round: 999,
    },
};

// Utility function to get rgba color with opacity
const withOpacity = (color, opacity) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// CommonJS exports for better Metro bundler compatibility
module.exports = {
    healthColors,
    withOpacity,
    default: healthColors,
};