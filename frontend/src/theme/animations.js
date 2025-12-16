/**
 * AayuCare Design System - Animation & Motion
 * 
 * Consistent animation timing and easing functions
 * Following Material Design and iOS Human Interface Guidelines
 */

import { Easing, Platform } from 'react-native';

/**
 * Animation Duration (in milliseconds)
 * Based on Material Motion and iOS animation guidelines
 */
export const duration = {
  // Micro-interactions (hover, press, ripple)
  instant: 0,
  fastest: 100,
  fast: 150,
  
  // Standard transitions (most common)
  normal: 250,
  medium: 300,
  
  // Page transitions, modals
  slow: 400,
  slower: 500,
  
  // Complex animations, hero transitions
  slowest: 600,
  verySlow: 800,
  
  // Special cases
  toast: 3000,      // Toast notification display time
  snackbar: 4000,   // Snackbar display time
  splash: 2000,     // Splash screen minimum
};

/**
 * Easing Functions
 * Platform-specific easing curves for natural motion
 */
export const easing = {
  // Material Design Standard (Android preference)
  standard: Easing.bezier(0.4, 0.0, 0.2, 1.0),      // Accelerate then decelerate
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),    // Start fast, end slow (entrance)
  accelerate: Easing.bezier(0.4, 0.0, 1.0, 1.0),    // Start slow, end fast (exit)
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1.0),         // Quick snap
  
  // iOS Standard
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),       // iOS standard
  easeOut: Easing.bezier(0.0, 0, 0.58, 1),          // iOS entrance
  easeIn: Easing.bezier(0.42, 0, 1, 1),             // iOS exit
  
  // React Native Built-ins
  linear: Easing.linear,
  ease: Easing.ease,
  quad: Easing.quad,
  cubic: Easing.cubic,
  
  // Special effects
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
  back: Easing.back(1.5),
  
  // Smooth curves
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),        // Very smooth
  swift: Easing.bezier(0.55, 0, 0.1, 1),            // iOS-like swift motion
};

/**
 * Platform-specific defaults
 * Use the platform's preferred animation style
 */
export const platformEasing = Platform.select({
  ios: easing.easeInOut,
  android: easing.standard,
  default: easing.standard,
});

export const platformDuration = Platform.select({
  ios: duration.normal,
  android: duration.medium,
  default: duration.normal,
});

/**
 * Animation Presets
 * Common animation configurations ready to use
 */
export const animations = {
  // Fade animations
  fadeIn: {
    duration: duration.normal,
    easing: easing.decelerate,
    useNativeDriver: true,
  },
  fadeOut: {
    duration: duration.fast,
    easing: easing.accelerate,
    useNativeDriver: true,
  },
  
  // Scale animations (buttons, cards)
  scaleIn: {
    duration: duration.normal,
    easing: easing.decelerate,
    useNativeDriver: true,
  },
  scaleOut: {
    duration: duration.fast,
    easing: easing.accelerate,
    useNativeDriver: true,
  },
  
  // Press animations (buttons)
  pressIn: {
    duration: duration.fast,
    easing: easing.standard,
    useNativeDriver: true,
  },
  pressOut: {
    duration: duration.normal,
    easing: easing.decelerate,
    useNativeDriver: true,
  },
  
  // Slide animations (modals, drawers)
  slideIn: {
    duration: duration.medium,
    easing: easing.decelerate,
    useNativeDriver: true,
  },
  slideOut: {
    duration: duration.normal,
    easing: easing.accelerate,
    useNativeDriver: true,
  },
  
  // Bounce (playful interactions)
  bounce: {
    duration: duration.slow,
    easing: easing.bounce,
    useNativeDriver: true,
  },
  
  // Spring (natural feel)
  spring: {
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  },
  
  // Quick spring (snappy)
  springQuick: {
    tension: 100,
    friction: 8,
    useNativeDriver: true,
  },
  
  // Soft spring (gentle)
  springSoft: {
    tension: 40,
    friction: 10,
    useNativeDriver: true,
  },
};

/**
 * Micro-interaction Timings
 * For buttons, switches, checkboxes, etc.
 */
export const microInteractions = {
  ripple: duration.fast,           // 150ms - Material ripple effect
  hover: duration.fastest,         // 100ms - Hover state change
  press: duration.fast,            // 150ms - Button press
  switch: duration.normal,         // 250ms - Toggle switch
  checkbox: duration.fast,         // 150ms - Checkbox check
  radioButton: duration.fast,      // 150ms - Radio select
  tooltip: duration.normal,        // 250ms - Tooltip appear
};

/**
 * Page Transition Timings
 * For navigation and screen changes
 */
export const pageTransitions = {
  screenChange: duration.medium,      // 300ms - Standard screen transition
  modalOpen: duration.normal,         // 250ms - Modal slide up
  modalClose: duration.fast,          // 150ms - Modal slide down
  drawerOpen: duration.medium,        // 300ms - Navigation drawer
  drawerClose: duration.normal,       // 250ms - Drawer close
  tabSwitch: duration.fast,           // 150ms - Tab navigation
  stackPush: duration.medium,         // 300ms - Stack navigation push
  stackPop: duration.normal,          // 250ms - Stack navigation pop
};

/**
 * Loading & Progress Timings
 */
export const loadingTimings = {
  spinner: 1000,                   // 1000ms - Full spinner rotation
  skeleton: 1500,                  // 1500ms - Skeleton shimmer cycle
  progressBar: duration.normal,    // 250ms - Progress update
  pullToRefresh: duration.slow,    // 400ms - Pull refresh animation
};

/**
 * Spring Configurations
 * For more natural, physics-based animations
 */
export const springs = {
  // Gentle spring (smooth, subtle)
  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  
  // Bouncy spring (playful)
  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  
  // Snappy spring (quick, responsive)
  snappy: {
    damping: 15,
    mass: 0.8,
    stiffness: 150,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  
  // Stiff spring (minimal bounce)
  stiff: {
    damping: 25,
    mass: 1,
    stiffness: 200,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  
  // Wobbly spring (exaggerated)
  wobbly: {
    damping: 8,
    mass: 1,
    stiffness: 80,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

/**
 * Gesture Response Timings
 * How quickly animations respond to gestures
 */
export const gestureResponse = {
  immediate: 0,           // No delay (swipe to dismiss)
  fast: 50,              // Quick response (scroll bounce)
  normal: 100,           // Standard (pan gesture)
  slow: 200,             // Delayed (long press)
};

/**
 * Motion Principles (Guidelines)
 */
export const motionPrinciples = {
  // All animations should:
  // 1. Be purposeful - serve a functional purpose
  // 2. Be smooth - maintain 60fps
  // 3. Be natural - follow physics and real-world motion
  // 4. Be subtle - not distract from content
  // 5. Provide feedback - respond to user actions immediately
  // 6. Be consistent - use the same timing for similar actions
  // 7. Be accessible - respect reduced motion preferences
};

/**
 * Usage Examples:
 * 
 * // Button press animation
 * const scaleAnim = useRef(new Animated.Value(1)).current;
 * 
 * const handlePressIn = () => {
 *   Animated.timing(scaleAnim, {
 *     toValue: 0.95,
 *     ...animations.pressIn,
 *   }).start();
 * };
 * 
 * // Fade in animation
 * const fadeAnim = useRef(new Animated.Value(0)).current;
 * 
 * useEffect(() => {
 *   Animated.timing(fadeAnim, {
 *     toValue: 1,
 *     ...animations.fadeIn,
 *   }).start();
 * }, []);
 * 
 * // Spring animation
 * Animated.spring(position, {
 *   toValue: { x: 0, y: 0 },
 *   ...springs.gentle,
 * }).start();
 * 
 * // Modal slide up
 * Animated.timing(modalPosition, {
 *   toValue: 0,
 *   duration: pageTransitions.modalOpen,
 *   easing: easing.decelerate,
 *   useNativeDriver: true,
 * }).start();
 */

/**
 * Check if reduced motion is enabled (accessibility)
 * Use this to disable or reduce animations for users who prefer it
 */
export const shouldReduceMotion = async () => {
  try {
    const { AccessibilityInfo } = require('react-native');
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
};

/**
 * Get animation duration respecting reduced motion
 */
export const getAnimationDuration = (normalDuration) => {
  // If reduced motion is enabled, use instant or very fast animations
  // You'll need to check this in your components
  return normalDuration; // Placeholder - check in component
};

export default {
  duration,
  easing,
  animations,
  springs,
  microInteractions,
  pageTransitions,
  loadingTimings,
  gestureResponse,
  platformEasing,
  platformDuration,
  shouldReduceMotion,
  getAnimationDuration,
};
