/**
 * AayuCare - Style Validation Utilities
 * 
 * Comprehensive utilities to prevent "Cannot read property of undefined" errors
 * Validates style objects before they reach the render cycle
 */

import { healthColors } from '../theme/healthColors';

/**
 * Safe getter for nested object properties
 * @param {Object} obj - The object to access
 * @param {string} path - Dot-notation path (e.g., 'card.border')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} The value at path or defaultValue
 */
export const safeGet = (obj, path, defaultValue = undefined) => {
    if (!obj || typeof obj !== 'object') {
        return defaultValue;
    }

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result === null || result === undefined || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }

    return result !== undefined ? result : defaultValue;
};

/**
 * Validates and returns a color value from healthColors
 * @param {string} path - Dot-notation path to color (e.g., 'card.border')
 * @param {string} fallback - Fallback color value
 * @returns {string} Valid color value
 */
export const getColor = (path, fallback = '#000000') => {
    return safeGet(healthColors, path, fallback);
};

/**
 * Validates style object and provides warnings for missing properties
 * @param {Object} styleObj - Style object to validate
 * @param {string} componentName - Name of component for debugging
 * @returns {Object} Validated style object
 */
export const validateStyle = (styleObj, componentName = 'Component') => {
    if (!styleObj || typeof styleObj !== 'object') {
        console.warn(`[StyleValidator] Invalid style object in ${componentName}`);
        return {};
    }

    const validatedStyle = { ...styleObj };
    const warnings = [];

    // Check for undefined values
    Object.keys(validatedStyle).forEach(key => {
        if (validatedStyle[key] === undefined) {
            warnings.push(`Undefined style property: ${key}`);
            delete validatedStyle[key];
        }
    });

    if (warnings.length > 0 && __DEV__) {
        console.warn(`[StyleValidator] ${componentName} has issues:`, warnings);
    }

    return validatedStyle;
};

/**
 * Safe border style getter
 * @param {Object} options - Border options
 * @param {number} options.width - Border width
 * @param {string} options.color - Border color (can be a path like 'card.border')
 * @param {string} options.style - Border style ('solid', 'dashed', 'dotted')
 * @returns {Object} Safe border style object
 */
export const createBorderStyle = ({ 
    width = 1, 
    color = 'border.main', 
    style = 'solid' 
} = {}) => {
    return {
        borderWidth: width,
        borderColor: typeof color === 'string' && color.includes('.') 
            ? getColor(color, '#DADCE0') 
            : color,
        borderStyle: style,
    };
};

/**
 * Validates theme object structure on app start
 * @param {Object} themeObj - Theme object to validate
 * @returns {Object} Validation result
 */
export const validateThemeStructure = (themeObj) => {
    const requiredPaths = [
        'card.border',
        'card.background',
        'border.light',
        'border.main',
        'input.border',
        'input.borderFocused',
        'input.borderError',
        'primary.main',
        'secondary.main',
        'background.primary',
        'background.card',
        'text.primary',
        'text.secondary',
    ];

    const missingPaths = [];
    const validPaths = [];

    requiredPaths.forEach(path => {
        const value = safeGet(themeObj, path);
        if (value === undefined) {
            missingPaths.push(path);
        } else {
            validPaths.push(path);
        }
    });

    if (missingPaths.length > 0) {
        console.error(
            '[StyleValidator] Missing required theme paths:',
            missingPaths
        );
    }

    return {
        isValid: missingPaths.length === 0,
        missingPaths,
        validPaths,
        coverage: (validPaths.length / requiredPaths.length) * 100,
    };
};

/**
 * Creates a safe style object accessor
 * @param {Object} baseColors - Base color object (e.g., healthColors)
 * @returns {Proxy} Proxied object with safe access
 */
export const createSafeStyleProxy = (baseColors) => {
    const createProxy = (obj, path = []) => {
        return new Proxy(obj || {}, {
            get(target, prop) {
                const value = target[prop];
                const currentPath = [...path, prop].join('.');

                if (value === undefined) {
                    if (__DEV__) {
                        console.warn(
                            `[StyleValidator] Accessing undefined style path: ${currentPath}`
                        );
                    }
                    // Return a safe fallback
                    if (prop === 'border' || prop.includes('border') || prop.includes('Border')) {
                        return '#DADCE0';
                    }
                    if (prop === 'background' || prop.includes('background')) {
                        return '#FFFFFF';
                    }
                    if (prop === 'text' || prop.includes('Text')) {
                        return '#000000';
                    }
                    return undefined;
                }

                if (typeof value === 'object' && value !== null) {
                    return createProxy(value, [...path, prop]);
                }

                return value;
            },
        });
    };

    return createProxy(baseColors);
};

/**
 * Runtime style validator for component props
 * Use in components that receive style props
 * @param {Object} props - Component props
 * @param {Array<string>} requiredStyleProps - Required style properties
 * @param {string} componentName - Component name for debugging
 */
export const validateComponentStyles = (props, requiredStyleProps = [], componentName = 'Component') => {
    if (!__DEV__) return; // Only validate in development

    const { style, ...otherProps } = props;

    // Validate required style props
    requiredStyleProps.forEach(prop => {
        if (otherProps[prop] === undefined && (!style || !style[prop])) {
            console.warn(
                `[${componentName}] Missing required style prop: ${prop}`
            );
        }
    });

    // Validate style object if provided
    if (style && typeof style === 'object') {
        validateStyle(style, componentName);
    }
};

/**
 * Creates a validated stylesheet
 * Wraps StyleSheet.create with validation
 * @param {Object} styles - Styles object
 * @param {string} componentName - Component name
 * @returns {Object} Validated styles
 */
export const createValidatedStyles = (styles, componentName = 'Component') => {
    if (!__DEV__) return styles; // Skip validation in production

    const validatedStyles = {};

    Object.keys(styles).forEach(key => {
        validatedStyles[key] = validateStyle(styles[key], `${componentName}.${key}`);
    });

    return validatedStyles;
};

// Validation report generator
export const generateStyleValidationReport = () => {
    const report = validateThemeStructure(healthColors);
    
    console.group('[REPORT] Style Validation Report');
    console.log(`Coverage: ${report.coverage.toFixed(1)}%`);
    console.log(`Valid Paths: ${report.validPaths.length}`);
    console.log(`Missing Paths: ${report.missingPaths.length}`);
    
    if (report.missingPaths.length > 0) {
        console.group('[ERROR] Missing Paths:');
        report.missingPaths.forEach(path => console.error(`  - ${path}`));
        console.groupEnd();
    }
    
    if (report.validPaths.length > 0) {
        console.group('[SUCCESS] Valid Paths:');
        report.validPaths.forEach(path => console.log(`  - ${path}`));
        console.groupEnd();
    }
    
    console.groupEnd();
    
    return report;
};

// Export default validator instance
export default {
    safeGet,
    getColor,
    validateStyle,
    createBorderStyle,
    validateThemeStructure,
    createSafeStyleProxy,
    validateComponentStyles,
    createValidatedStyles,
    generateStyleValidationReport,
};
