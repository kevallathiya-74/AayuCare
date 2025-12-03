/**
 * AayuCare Design System - Main Theme Configuration
 * 
 * Integrates colors, typography, spacing, and React Native Paper theme.
 * This creates a cohesive design system for the entire app.
 */

import { MD3LightTheme, configureFonts } from 'react-native-paper';
import colors from './colors';
import { fontFamilies, fontSizes, fontWeights } from './typography';
import { spacing, componentSpacing, layout } from './spacing';
import { createShadow } from '../utils/platformStyles';

// Configure fonts for React Native Paper
const fontConfig = {
  default: {
    regular: {
      fontFamily: fontFamilies.body,
      fontWeight: fontWeights.regular,
    },
    medium: {
      fontFamily: fontFamilies.body,
      fontWeight: fontWeights.medium,
    },
    light: {
      fontFamily: fontFamilies.body,
      fontWeight: fontWeights.light,
    },
    thin: {
      fontFamily: fontFamilies.body,
      fontWeight: fontWeights.light,
    },
  },
};

// React Native Paper theme customization
export const paperTheme = {
  ...MD3LightTheme,
  
  // Override colors
  colors: {
    ...MD3LightTheme.colors,
    
    // Primary colors
    primary: colors.primary.main,
    primaryContainer: colors.primary.light,
    onPrimary: colors.neutral.white,
    onPrimaryContainer: colors.primary.dark,
    
    // Secondary colors
    secondary: colors.secondary.main,
    secondaryContainer: colors.secondary.light,
    onSecondary: colors.neutral.white,
    onSecondaryContainer: colors.secondary.dark,
    
    // Tertiary/Accent
    tertiary: colors.accent.teal,
    tertiaryContainer: colors.accent.orange,
    
    // Error colors
    error: colors.error.main,
    errorContainer: colors.error.light,
    onError: colors.neutral.white,
    onErrorContainer: colors.error.dark,
    
    // Background colors
    background: colors.background.primary,
    onBackground: colors.text.primary,
    
    // Surface colors (cards, sheets)
    surface: colors.background.elevated,
    surfaceVariant: colors.background.secondary,
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    
    // Outline/Border
    outline: colors.card.border,
    outlineVariant: colors.neutral.gray200,
    
    // Other
    shadow: colors.shadows.medium,
    scrim: colors.background.overlay,
    inverseSurface: colors.neutral.gray800,
    inverseOnSurface: colors.neutral.white,
    inversePrimary: colors.primary.light,
    
    // Elevation
    elevation: {
      level0: colors.background.primary,
      level1: colors.background.elevated,
      level2: colors.background.elevated,
      level3: colors.background.elevated,
      level4: colors.background.elevated,
      level5: colors.background.elevated,
    },
    
    // Disabled
    surfaceDisabled: colors.button.disabled,
    onSurfaceDisabled: colors.button.disabledText,
    
    // Backdrop
    backdrop: colors.background.overlay,
  },
  
  // Fonts configuration
  fonts: configureFonts({ config: fontConfig }),
  
  // Roundness (border radius)
  roundness: colors.borderRadius.medium,
  
  // Animation
  animation: {
    scale: 1.0,
  },
};

// Complete theme object (all design tokens)
export const theme = {
  // Colors
  colors,
  
  // Typography
  fonts: fontFamilies,
  fontSizes,
  fontWeights,
  
  // Spacing & Layout
  spacing,
  componentSpacing,
  layout,
  
  // Shadows (elevation styles for iOS/Android)
  shadows: {
    small: createShadow({
      color: '#000',
      offset: { width: 0, height: 1 },
      opacity: 0.06,
      radius: 2,
      elevation: 1,
    }),
    medium: createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.08,
      radius: 4,
      elevation: 2,
    }),
    large: createShadow({
      color: '#000',
      offset: { width: 0, height: 4 },
      opacity: 0.12,
      radius: 8,
      elevation: 4,
    }),
    elevated: createShadow({
      color: '#000',
      offset: { width: 0, height: 8 },
      opacity: 0.15,
      radius: 16,
      elevation: 8,
    }),
  },
  
  // Border styles
  borders: {
    width: {
      thin: 1,
      medium: 2,
      thick: 3,
    },
    style: 'solid',
    radius: colors.borderRadius,
  },
  
  // Opacity values (for overlays, disabled states)
  opacity: {
    disabled: 0.38,
    hover: 0.04,
    focus: 0.12,
    selected: 0.08,
    activated: 0.12,
    pressed: 0.16,
    dragged: 0.16,
  },
  
  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
  
  // Transitions/Animations
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
};

// Helper function to create consistent component styles
export const createComponentStyle = (baseStyle, variants = {}) => {
  return {
    base: baseStyle,
    variants,
  };
};

// Common component patterns
export const commonStyles = {
  // Centered container
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  // Content container with padding
  contentContainer: {
    flex: 1,
    padding: componentSpacing.screenPadding,
  },
  
  // Card style
  card: {
    backgroundColor: colors.card.background,
    borderRadius: colors.borderRadius.medium,
    padding: componentSpacing.cardPadding,
    marginBottom: componentSpacing.cardMargin,
  },
  
  // Row layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Space between row
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  // Column layout
  column: {
    flexDirection: 'column',
  },
};

export default theme;
