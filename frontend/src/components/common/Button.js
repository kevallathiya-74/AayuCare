/**
 * AayuCare - Custom Button Component
 * 
 * Variants: primary, secondary, outline, text
 * Features: loading state, gradient, icons, haptic feedback
 */

import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, healthColors } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { 
    touchTargets,
    borderRadius as responsiveBorderRadius,
    getButtonHeight,
} from '../../utils/responsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Button = ({
  children,
  onPress,
  variant = 'primary', // primary, secondary, outline, text
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left', // left, right
  gradient = false,
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size]];

    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled) baseStyle.push(styles.disabled);

    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'text':
        baseStyle.push(styles.text);
        break;
      default:
        baseStyle.push(styles.primary);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${size}Text`]];

    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
      case 'text':
        baseStyle.push(styles.textButtonText);
        break;
      default:
        baseStyle.push(styles.primaryText);
    }

    if (disabled) baseStyle.push(styles.disabledText);

    return baseStyle;
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? healthColors.neutral.white : healthColors.primary.main} 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{children}</Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </>
      )}
    </View>
  );

  if (gradient && variant === 'primary' && !disabled) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[{ transform: [{ scale: scaleAnim }] }, getButtonStyle(), style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        accessibilityLabel={typeof children === 'string' ? children : undefined}
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
      style={[{ transform: [{ scale: scaleAnim }] }, getButtonStyle(), style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={typeof children === 'string' ? children : undefined}
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
  
  // Sizes (responsive with minimum 48dp accessibility targets)
  small: {
    height: Math.max(getButtonHeight('small'), touchTargets.minimum), // Enforce minimum 48dp
    paddingHorizontal: theme.spacing.md,
  },
  medium: {
    height: Math.max(getButtonHeight('medium'), touchTargets.minimum), // Enforce minimum 48dp
    paddingHorizontal: theme.spacing.lg,
  },
  large: {
    height: Math.max(getButtonHeight('large'), touchTargets.comfortable), // Larger minimum for large buttons
    paddingHorizontal: theme.spacing.xl,
  },
  
  // Variants
  primary: {
    backgroundColor: healthColors.primary.main,
  },
  secondary: {
    backgroundColor: healthColors.background.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: healthColors.primary.main,
  },
  text: {
    backgroundColor: 'transparent',
  },
  
  disabled: {
    backgroundColor: healthColors.button.disabled,
    borderColor: healthColors.button.disabled,
  },
  
  // Text styles (responsive)
  buttonText: {
    ...textStyles.button,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  
  primaryText: {
    color: healthColors.neutral.white,
  },
  secondaryText: {
    color: healthColors.text.primary,
  },
  outlineText: {
    color: healthColors.primary.main,
  },
  textButtonText: {
    color: healthColors.primary.main,
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




