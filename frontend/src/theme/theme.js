import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { healthColors } from './healthColors';
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
    primary: healthColors.primary.main,
    primaryContainer: healthColors.primary.light,
    onPrimary: healthColors.neutral.white,
    onPrimaryContainer: healthColors.primary.dark,
    
    // Secondary colors
    secondary: healthColors.secondary.main,
    secondaryContainer: healthColors.secondary.light,
    onSecondary: healthColors.neutral.white,
    onSecondaryContainer: healthColors.secondary.dark,
    
    // Tertiary/Accent
    tertiary: healthColors.accent.aqua,
    tertiaryContainer: healthColors.accent.coral,
    
    // Error colors
    error: healthColors.error.main,
    errorContainer: healthColors.error.light,
    onError: healthColors.neutral.white,
    onErrorContainer: healthColors.error.dark,
    
    // Background colors
    background: healthColors.background.primary,
    onBackground: healthColors.text.primary,
    
    // Surface colors (cards, sheets)
    surface: healthColors.background.card,
    surfaceVariant: healthColors.background.secondary,
    onSurface: healthColors.text.primary,
    onSurfaceVariant: healthColors.text.secondary,
    
    // Outline/Border
    outline: healthColors.card.border,
    outlineVariant: healthColors.neutral.gray200,
    
    // Other
    shadow: healthColors.shadows.medium,
    scrim: healthColors.background.overlay,
    inverseSurface: healthColors.neutral.gray800,
    inverseOnSurface: healthColors.neutral.white,
    inversePrimary: healthColors.primary.light,
    
    // Elevation
    elevation: {
      level0: healthColors.background.primary,
      level1: healthColors.background.card,
      level2: healthColors.background.card,
      level3: healthColors.background.card,
      level4: healthColors.background.card,
      level5: healthColors.background.card,
    },
    
    // Disabled
    surfaceDisabled: healthColors.button.disabled,
    onSurfaceDisabled: healthColors.button.disabledText,
    
    // Backdrop
    backdrop: healthColors.background.overlay,
  },
  
  // Fonts configuration
  fonts: configureFonts({ config: fontConfig }),
  
  // Roundness (border radius)
  roundness: 12,
  
  // Animation
  animation: {
    scale: 1.0,
  },
};

// Complete theme object (all design tokens)
export const theme = {
  // Colors
  colors: healthColors,
  
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
    radius: {
      small: 8,
      medium: 12,
      large: 16,
      xlarge: 24,
      round: 999,
    },
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
    backgroundColor: healthColors.background.primary,
  },
  
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  
  // Content container with padding
  contentContainer: {
    flex: 1,
    padding: componentSpacing.screenPadding,
  },
  
  // Card style
  card: {
    backgroundColor: healthColors.card.background,
    borderRadius: 12,
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
