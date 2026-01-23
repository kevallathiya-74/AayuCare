/**
 * AayuCare Design System - Spacing & Layout
 * 
 * 8px grid system for consistent spacing across the app.
 * Indian users appreciate clean layouts with breathing room.
 */

// Base spacing unit (8px)
const BASE_UNIT = 8;

export const spacing = {
  // Fundamental spacing scale (8px increments)
  xs: BASE_UNIT * 0.5,      // 4px - Tight spacing
  sm: BASE_UNIT,            // 8px - Small spacing
  md: BASE_UNIT * 2,        // 16px - Medium spacing (most common)
  lg: BASE_UNIT * 3,        // 24px - Large spacing
  xl: BASE_UNIT * 4,        // 32px - Extra large spacing
  xxl: BASE_UNIT * 6,       // 48px - Section dividers
  xxxl: BASE_UNIT * 8,      // 64px - Major sections

  // Numbered scale for precise control
  0: 0,
  1: BASE_UNIT * 0.25,      // 2px
  2: BASE_UNIT * 0.5,       // 4px
  4: BASE_UNIT * 0.5,       // 4px
  8: BASE_UNIT,             // 8px
  12: BASE_UNIT * 1.5,      // 12px
  16: BASE_UNIT * 2,        // 16px
  20: BASE_UNIT * 2.5,      // 20px
  24: BASE_UNIT * 3,        // 24px
  32: BASE_UNIT * 4,        // 32px
  40: BASE_UNIT * 5,        // 40px
  48: BASE_UNIT * 6,        // 48px
  56: BASE_UNIT * 7,        // 56px
  64: BASE_UNIT * 8,        // 64px
};

// Component-specific spacing
export const componentSpacing = {
  // Screen/Container padding
  screenPadding: spacing.md,           // 16px - Standard screen edge padding
  screenPaddingLarge: spacing.lg,      // 24px - Large screen padding
  
  // Card spacing
  cardPadding: spacing.md,             // 16px - Inside card padding
  cardMargin: spacing.md,              // 16px - Between cards
  cardGap: spacing.sm,                 // 8px - Between card elements
  
  // List spacing
  listItemPadding: spacing.md,         // 16px - List item padding
  listItemGap: spacing.sm,             // 8px - Gap between list items
  
  // Form spacing
  inputPadding: spacing.md,            // 16px - Inside input fields
  inputMargin: spacing.md,             // 16px - Between form fields
  labelMargin: spacing.sm,             // 8px - Between label and input
  
  // Button spacing
  buttonPadding: {
    vertical: spacing.md,              // 16px
    horizontal: spacing.lg,            // 24px
  },
  buttonMargin: spacing.sm,            // 8px - Between buttons
  
  // Icon spacing
  iconMargin: spacing.sm,              // 8px - Space around icons
  iconTextGap: spacing.sm,             // 8px - Gap between icon and text
  
  // Section spacing
  sectionGap: spacing.lg,              // 24px - Between major sections
  sectionPadding: spacing.md,          // 16px - Inside sections
  
  // Header/Footer
  headerPadding: spacing.md,           // 16px
  footerPadding: spacing.md,           // 16px
  
  // Tab bar
  tabBarPadding: spacing.sm,           // 8px
  tabBarHeight: 60,                    // Standard bottom tab bar height
  
  // Modal/Bottom Sheet
  modalPadding: spacing.lg,            // 24px
  sheetPadding: spacing.md,            // 16px
};

// Layout dimensions
export const layout = {
  // Container widths
  containerMaxWidth: 600,              // Max width for content on tablets
  
  // Touch targets (accessibility - min 48dp)
  minTouchTarget: 48,                  // Minimum touch target size
  iconTouchTarget: 48,                 // Icon button touch target
  
  // Heights
  inputHeight: 48,                     // Standard input height
  buttonHeight: {
    small: 36,
    medium: 48,
    large: 56,
  },
  headerHeight: 56,                    // App header height
  tabBarHeight: 60,                    // Bottom navigation height
  
  // Avatar sizes
  avatar: {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96,
  },
  
  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  },
  
  // Border radius (from colors.js but duplicated for convenience)
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 24,
    round: 999,
  },
  
  // Elevation (shadow depth)
  elevation: {
    0: 0,
    1: 2,      // Subtle elevation
    2: 4,      // Card elevation
    3: 8,      // Modal/dialog elevation
    4: 16,     // Floating action button
    5: 24,     // Maximum elevation
  },
};

// Safe area insets (for notched devices)
export const safeArea = {
  top: 44,        // iOS notch
  bottom: 34,     // iOS home indicator
  left: 0,
  right: 0,
};

// Responsive breakpoints (for tablets)
export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

// Grid system (for complex layouts)
export const grid = {
  columns: 12,
  gutter: spacing.md,      // 16px between columns
  margin: spacing.md,      // 16px screen edges
};

export default {
  spacing,
  componentSpacing,
  layout,
  safeArea,
  breakpoints,
  grid,
};

