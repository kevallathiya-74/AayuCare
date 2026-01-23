/**
 * AayuCare Design System - Typography
 * 
 * Font choices optimized for Indian users:
 * - Poppins SemiBold for headings (friendly, modern)
 * - Lato/Inter for body text (highly legible)
 * - Inter for numbers (clear on budget Android screens)
 * 
 * All sizes are optimized for mobile readability.
 */

import { Platform } from 'react-native';

// Font families
export const fontFamilies = {
  // Headings - System font fallback (replace with Poppins when added)
  heading: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Body - System font fallback (replace with Inter when added)
  body: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Numbers - System font fallback (replace with Inter when added)
  numbers: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Alternative - System font fallback
  bodyAlt: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  
  // Monospace (for codes, IDs)
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
};

// Font weights
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Font sizes (mobile-optimized, accessible)
export const fontSizes = {
  // Display sizes (large headings)
  displayLarge: 32,      // Hero text
  displayMedium: 28,     // Screen titles
  displaySmall: 24,      // Section headers
  
  // Heading sizes
  h1: 24,                // Main headings
  h2: 20,                // Sub headings
  h3: 18,                // Section titles
  h4: 16,                // Card titles
  h5: 14,                // Small headings
  h6: 12,                // Tiny headings
  
  // Body sizes
  bodyLarge: 16,         // Large body text (comfortable reading)
  bodyMedium: 14,        // Standard body text (most common)
  bodySmall: 12,         // Small body text
  
  // Label sizes
  labelLarge: 14,        // Button labels, input labels
  labelMedium: 12,       // Form labels
  labelSmall: 10,        // Tiny labels, badges
  
  // Special
  caption: 10,           // Captions, hints
  overline: 10,          // Overline text (all caps)
};

// Line heights (for readability)
export const lineHeights = {
  tight: 1.2,            // Headings
  normal: 1.5,           // Body text (optimal for reading)
  relaxed: 1.75,         // Comfortable reading
  loose: 2,              // Very spacious
};

// Letter spacing (for clarity)
export const letterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 1.5,
};

// Typography styles (pre-configured text styles)
export const textStyles = {
  // Display styles
  displayLarge: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.displayLarge,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.displayLarge * lineHeights.tight,
    letterSpacing: letterSpacing.normal,
  },
  
  displayMedium: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.displayMedium,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.displayMedium * lineHeights.tight,
  },
  
  displaySmall: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.displaySmall,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.displaySmall * lineHeights.tight,
  },
  
  // Heading styles
  h1: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h1,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.h1 * lineHeights.tight,
  },
  
  h2: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.h2 * lineHeights.tight,
  },
  
  h3: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.h3 * lineHeights.normal,
  },
  
  h4: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.h4,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.h4 * lineHeights.normal,
  },
  
  // Body styles
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.bodyLarge,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.bodyLarge * lineHeights.normal,
  },
  
  bodyMedium: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.bodyMedium,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.bodyMedium * lineHeights.normal,
  },
  
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.bodySmall,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.bodySmall * lineHeights.normal,
  },
  
  // Body bold variants
  bodyLargeBold: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.bodyLarge,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.bodyLarge * lineHeights.normal,
  },
  
  bodyMediumBold: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.bodyMedium,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.bodyMedium * lineHeights.normal,
  },
  
  // Label styles
  labelLarge: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.labelLarge,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.labelLarge * lineHeights.normal,
  },
  
  labelMedium: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.labelMedium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.labelMedium * lineHeights.normal,
  },
  
  labelSmall: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.labelSmall,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.labelSmall * lineHeights.normal,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
  },
  
  // Special styles
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
    lineHeight: fontSizes.caption * lineHeights.normal,
    color: '#80868B', // text.tertiary
  },
  
  overline: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.overline,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.overline * lineHeights.normal,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wider,
  },
  
  // Button styles
  button: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.labelLarge,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.labelLarge * lineHeights.tight,
    textTransform: 'none', // Don't uppercase buttons (friendlier)
  },
  
  // Number styles (for health metrics)
  numberLarge: {
    fontFamily: fontFamilies.numbers,
    fontSize: 32,
    fontWeight: fontWeights.semibold,
    lineHeight: 32 * lineHeights.tight,
  },
  
  numberMedium: {
    fontFamily: fontFamilies.numbers,
    fontSize: 24,
    fontWeight: fontWeights.medium,
    lineHeight: 24 * lineHeights.tight,
  },
  
  numberSmall: {
    fontFamily: fontFamilies.numbers,
    fontSize: 16,
    fontWeight: fontWeights.medium,
    lineHeight: 16 * lineHeights.normal,
  },
};

// Font loading configuration (for expo-font)
// Note: Add font files to assets/fonts/ directory
export const fontsToLoad = {
  // Uncomment when font files are added to assets/fonts/
  // 'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  // 'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
  // 'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
  // 'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  // 'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
  // 'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
  // 'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
  // 'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
  // 'Lato-Regular': require('../../assets/fonts/Lato-Regular.ttf'),
  // 'Lato-Bold': require('../../assets/fonts/Lato-Bold.ttf'),
};

export default {
  fontFamilies,
  fontWeights,
  fontSizes,
  lineHeights,
  letterSpacing,
  textStyles,
  fontsToLoad,
};

