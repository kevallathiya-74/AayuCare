/**
 * AayuCare — Premium Reusable Button Component (TypeScript)
 *
 * Variants: primary, secondary, outline, ghost, text, danger
 * Sizes: small, medium, large
 * Features: spring press animation, gradient, loading state, icon support, full-width, accessibility, memoization
 */

import React, { useRef, useMemo, memo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  PressableProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
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

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title?: string;
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  gradient?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Button: React.FC<ButtonProps> = ({
  children,
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
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

  const handlePress = (event: GestureResponderEvent) => {
    if (!disabled && !loading && onPress) {
      onPress(event);
    }
  };

  const buttonStyle = useMemo(() => {
    const sizeStyles = { small: styles.small, medium: styles.medium, large: styles.large };
    const baseStyle: StyleProp<ViewStyle>[] = [styles.button, sizeStyles[size] || sizeStyles.medium];
    
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
  }, [variant, size, disabled, loading, fullWidth]);

  const buttonTextStyle = useMemo(() => {
    const sizeTextStyles = { small: styles.smallText, medium: styles.mediumText, large: styles.largeText };
    const baseStyle: StyleProp<TextStyle>[] = [styles.buttonText, sizeTextStyles[size] || sizeTextStyles.medium];

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
  }, [variant, size, disabled, loading]);

  const indicatorColor = useMemo(() => {
    if (variant === 'primary' || variant === 'danger') return healthColors.white;
    return healthColors.primary.main;
  }, [variant]);

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text numberOfLines={1} ellipsizeMode="tail" style={[buttonTextStyle, textStyle]}>
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

  const isGradientEnabled = gradient && variant === 'primary' && !disabled && !loading;

  if (isGradientEnabled) {
    const rawColors = (healthColors.gradients && healthColors.gradients.primary) 
      ? healthColors.gradients.primary 
      : [healthColors.primary.main, healthColors.secondary?.main || healthColors.primary.main];
    const gradientColors: [string, string, ...string[]] = [
      rawColors[0] || healthColors.primary.main,
      rawColors[1] || healthColors.primary.main,
      ...rawColors.slice(2),
    ];

    const sizeStyle = styles[size] as { height?: number; paddingHorizontal?: number };
    const buttonHeight = sizeStyle?.height ?? 50;
    const buttonPadding = sizeStyle?.paddingHorizontal ?? 20;

    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[animStyle, styles.button, { height: buttonHeight }, styles.gradientWrapper, fullWidth && styles.fullWidth, style]}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        accessibilityLabel={typeof labelContent === 'string' ? labelContent : undefined}
        collapsable={false}
        {...props}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, { paddingHorizontal: buttonPadding }]}
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
      style={[animStyle, buttonStyle, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={typeof labelContent === 'string' ? labelContent : undefined}
      collapsable={false}
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
  primary: {
    backgroundColor: healthColors.primary.main,
    ...theme.shadows.button,
  },
  secondary: {
    backgroundColor: healthColors.primary.surface,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: healthColors.transparent,
    borderWidth: 1.5,
    borderColor: healthColors.primary.main,
  },
  ghost: {
    backgroundColor: healthColors.transparent,
    borderWidth: 0,
  },
  textBtn: {
    backgroundColor: healthColors.transparent,
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
    backgroundColor: healthColors.transparent,
    ...theme.shadows.button,
  },
  buttonText: {
    ...(textStyles.button as TextStyle),
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

export default memo(Button);
