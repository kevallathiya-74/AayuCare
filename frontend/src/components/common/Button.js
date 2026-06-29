/**
 * AayuCare â€” Premium Button Component
 *
 * Variants: primary, secondary, outline, ghost, text, danger
 * Sizes: small, medium, large
 * Features: spring press animation, gradient, loading state, icon support, full-width
 */

import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, healthColors } from '@/theme';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import {
  touchTargets,
  borderRadius as responsiveBorderRadius,
  getButtonHeight,
} from '@/utils/responsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button = ({
  children,
  title,
  onPress,
  variant = 'primary', // primary, secondary, outline, ghost, text, danger
  size = 'medium',     // small, medium, large
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  gradient = false,
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const labelContent = children ?? title;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        damping: 15,
        stiffness: 300,
        mass: 0.8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 280,
        mass: 0.8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];
    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled || loading) baseStyle.push(styles.disabled);

    switch (variant) {
      case 'secondary': baseStyle.push(styles.secondary); break;
      case 'outline':   baseStyle.push(styles.outline);   break;
      case 'ghost':     baseStyle.push(styles.ghost);     break;
      case 'text':      baseStyle.push(styles.textBtn);   break;
      case 'danger':    baseStyle.push(styles.danger);    break;
      default:          baseStyle.push(styles.primary);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${size}Text`]];

    switch (variant) {
      case 'secondary': baseStyle.push(styles.secondaryText); break;
      case 'outline':   baseStyle.push(styles.outlineText);   break;
      case 'ghost':     baseStyle.push(styles.ghostText);     break;
      case 'text':      baseStyle.push(styles.textBtnText);   break;
      case 'danger':    baseStyle.push(styles.dangerText);    break;
      default:          baseStyle.push(styles.primaryText);
    }

    if (disabled || loading) baseStyle.push(styles.disabledText);
    return baseStyle;
  };

  const getIndicatorColor = () => {
    if (variant === 'primary' || variant === 'danger') return healthColors.white;
    return healthColors.primary.main;
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={getIndicatorColor()} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text numberOfLines={1} ellipsizeMode="tail" style={[getTextStyle(), textStyle]}>
            {labelContent}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </View>
  );

  const animStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  if (gradient && variant === 'primary' && !disabled && !loading) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animStyle, styles.button, styles[size], styles.gradientWrapper, fullWidth && styles.fullWidth, style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        accessibilityLabel={typeof labelContent === 'string' ? labelContent : undefined}
        {...props}
      >
        <LinearGradient
          colors={healthColors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animStyle, getButtonStyle(), style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={typeof labelContent === 'string' ? labelContent : undefined}
      {...props}
    >
      {renderContent()}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: responsiveBorderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },

  // Sizes
  small: {
    height: Math.max(getButtonHeight('small'), touchTargets.medium),
    paddingHorizontal: spacing.md,
  },
  medium: {
    height: Math.max(getButtonHeight('medium'), touchTargets.medium),
    paddingHorizontal: spacing.lg,
  },
  large: {
    height: Math.max(getButtonHeight('large'), touchTargets.large),
    paddingHorizontal: spacing.xl,
  },

  // Variants
  primary: {
    backgroundColor: healthColors.primary.main,
    shadowColor: healthColors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: healthColors.primary.surface,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: healthColors.primary.main,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  textBtn: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: spacing.sm,
  },
  danger: {
    backgroundColor: healthColors.error.main,
    shadowColor: healthColors.error.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  disabled: {
    backgroundColor: healthColors.button.disabled,
    borderColor: healthColors.button.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientWrapper: {
    padding: 0,
    backgroundColor: 'transparent',
    shadowColor: healthColors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },

  // Text styles (responsive)
  buttonText: {
    ...textStyles.button,
  },
  smallText: {
    fontSize: theme.typography.sizes.bodyMedium,
  },
  mediumText: {
    fontSize: theme.typography.sizes.bodyLarge,
  },
  largeText: {
    fontSize: theme.typography.sizes.h5,
  },

  // Text Colors
  primaryText: {
    color: healthColors.white,
  },
  secondaryText: {
    color: healthColors.primary.main,
  },
  outlineText: {
    color: healthColors.primary.main,
  },
  ghostText: {
    color: healthColors.primary.main,
  },
  textBtnText: {
    color: healthColors.primary.main,
  },
  dangerText: {
    color: healthColors.white,
  },
  disabledText: {
    color: healthColors.button.disabledText,
  },

  // Content
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;

