import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { healthColors } from './healthColors';
import { fontFamilies, fontSizes, fontWeights } from './typography';
import { spacing, componentSpacing, layout } from './spacing';
import { elevation, shadows } from './elevation';
import { duration, easing, animations, springs } from './animations';

// Ensure healthColors is loaded
if (!healthColors || !healthColors.card) {
  console.error('healthColors not properly loaded!');
}

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
    primary: healthColors?.primary?.main || '#00ACC1',
    primaryContainer: healthColors?.primary?.light || '#B2EBF2',
    onPrimary: healthColors?.neutral?.white || '#FFFFFF',
    onPrimaryContainer: healthColors?.primary?.dark || '#00838F',
    
    // Secondary colors
    secondary: healthColors?.secondary?.main || '#66BB6A',
    secondaryContainer: healthColors?.secondary?.light || '#C8E6C9',
    onSecondary: healthColors?.neutral?.white || '#FFFFFF',
    onSecondaryContainer: healthColors?.secondary?.dark || '#43A047',
    
    // Tertiary/Accent
    tertiary: healthColors?.accent?.aqua || '#4DD0E1',
    tertiaryContainer: healthColors?.accent?.coral || '#FF7043',
    
    // Error colors
    error: healthColors?.error?.main || '#F44336',
    errorContainer: healthColors?.error?.light || '#FFCDD2',
    onError: healthColors?.neutral?.white || '#FFFFFF',
    onErrorContainer: healthColors?.error?.dark || '#C62828',
    
    // Background colors
    background: healthColors?.background?.primary || '#FAFAFA',
    onBackground: healthColors?.text?.primary || '#2C3E50',
    
    // Surface colors (cards, sheets)
    surface: healthColors?.background?.card || '#FFFFFF',
    surfaceVariant: healthColors?.background?.secondary || '#F5F5F5',
    onSurface: healthColors?.text?.primary || '#2C3E50',
    onSurfaceVariant: healthColors?.text?.secondary || '#7F8C8D',
    
    // Outline/Border
    outline: healthColors?.card?.border || '#E8EAED',
    outlineVariant: healthColors?.neutral?.gray200 || '#EEEEEE',
    
    // Other
    shadow: healthColors?.shadows?.medium || 'rgba(0,0,0,0.1)',
    scrim: healthColors?.background?.overlay || 'rgba(0,0,0,0.5)',
    inverseSurface: healthColors?.neutral?.gray800 || '#424242',
    inverseOnSurface: healthColors?.neutral?.white || '#FFFFFF',
    inversePrimary: healthColors?.primary?.light || '#B2EBF2',
    
    // Elevation
    elevation: {
      level0: healthColors?.background?.primary || '#FAFAFA',
      level1: healthColors?.background?.card || '#FFFFFF',
      level2: healthColors?.background?.card || '#FFFFFF',
      level3: healthColors?.background?.card || '#FFFFFF',
      level4: healthColors?.background?.card || '#FFFFFF',
      level5: healthColors?.background?.card || '#FFFFFF',
    },
    
    // Disabled
    surfaceDisabled: healthColors?.button?.disabled || '#E0E0E0',
    onSurfaceDisabled: healthColors?.button?.disabledText || '#9E9E9E',
    
    // Backdrop
    backdrop: healthColors?.background?.overlay || 'rgba(0,0,0,0.5)',
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
  
  // Elevation & Shadows (Material Design 3)
  elevation,
  shadows,
  
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
  
  // Animations & Motion (Material Design + iOS HIG)
  animations,
  duration,
  easing,
  springs,
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
    backgroundColor: healthColors?.background?.primary || '#FAFAFA',
  },
  
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: healthColors?.background?.primary || '#FAFAFA',
  },
  
  // Content container with padding
  contentContainer: {
    flex: 1,
    padding: componentSpacing?.screenPadding || 16,
  },
  
  // Card style
  card: {
    backgroundColor: healthColors?.card?.background || '#FFFFFF',
    borderRadius: 12,
    padding: componentSpacing?.cardPadding || 16,
    marginBottom: componentSpacing?.cardMargin || 16,
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


