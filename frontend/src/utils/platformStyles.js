/**
 * Platform-specific style utilities
 * Handles deprecated shadow and text shadow props for web compatibility
 */

import { Platform } from 'react-native';

/**
 * Creates cross-platform shadow styles
 * @param {Object} options - Shadow options
 * @param {string} options.color - Shadow color (hex or rgba)
 * @param {Object} options.offset - Shadow offset {width, height}
 * @param {number} options.opacity - Shadow opacity (0-1)
 * @param {number} options.radius - Shadow blur radius
 * @param {number} options.elevation - Android elevation
 * @returns {Object} Platform-specific shadow styles
 */
export const createShadow = ({ color = '#000', offset = { width: 0, height: 0 }, opacity = 0, radius = 0, elevation = 0 }) => {
  // Validate and sanitize all inputs to prevent NaN
  if (!color || typeof color !== 'string') {
    color = '#000';
  }
  
  // Validate offset
  const safeOffset = {
    width: typeof offset?.width === 'number' && !isNaN(offset.width) && isFinite(offset.width) ? offset.width : 0,
    height: typeof offset?.height === 'number' && !isNaN(offset.height) && isFinite(offset.height) ? offset.height : 0,
  };
  
  // Validate opacity (0-1 range)
  const safeOpacity = typeof opacity === 'number' && !isNaN(opacity) && isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 0;
  
  // Validate radius
  const safeRadius = typeof radius === 'number' && !isNaN(radius) && isFinite(radius) ? Math.max(0, radius) : 0;
  
  // Validate elevation (0-24 range for Android)
  const safeElevation = typeof elevation === 'number' && !isNaN(elevation) && isFinite(elevation) ? Math.max(0, Math.min(24, elevation)) : 0;
  
  // Use sanitized values
  offset = safeOffset;
  opacity = safeOpacity;
  radius = safeRadius;
  elevation = safeElevation;
  
  if (Platform.OS === 'web') {
    // Convert color to rgba format for web
    let shadowColor = color;
    
    // If color is already rgba/rgb, adjust opacity
    if (color.includes('rgba') || color.includes('rgb')) {
      shadowColor = color.replace(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
        (match, r, g, b, a) => `rgba(${r}, ${g}, ${b}, ${opacity || a || 1})`
      );
    } 
    // If color is hex, convert to rgba
    else if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      shadowColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${shadowColor}`,
    };
  }
  
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation: elevation,
  };
};

/**
 * Creates cross-platform text shadow styles
 * @param {Object} options - Text shadow options
 * @param {string} options.color - Shadow color
 * @param {Object} options.offset - Shadow offset {width, height}
 * @param {number} options.radius - Shadow blur radius
 * @returns {Object} Platform-specific text shadow styles
 */
export const createTextShadow = ({ color = '#000', offset = { width: 0, height: 0 }, radius = 0 }) => {
  // Validate inputs
  if (!color || typeof color !== 'string') {
    color = '#000';
  }
  
  if (Platform.OS === 'web') {
    return {
      textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
    };
  }
  
  return {
    textShadowColor: color,
    textShadowOffset: offset,
    textShadowRadius: radius,
  };
};

/**
 * Preset shadow styles for common elevations
 */
export const shadows = {
  none: createShadow({
    color: '#000',
    offset: { width: 0, height: 0 },
    opacity: 0,
    radius: 0,
    elevation: 0,
  }),
  
  small: createShadow({
    color: '#000',
    offset: { width: 0, height: 1 },
    opacity: 0.1,
    radius: 2,
    elevation: 1,
  }),
  
  medium: createShadow({
    color: '#000',
    offset: { width: 0, height: 2 },
    opacity: 0.1,
    radius: 4,
    elevation: 2,
  }),
  
  large: createShadow({
    color: '#000',
    offset: { width: 0, height: 4 },
    opacity: 0.15,
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
};
