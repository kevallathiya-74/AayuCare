/**
 * AayuCare — Premium Card Component
 *
 * Variants: standard, outline, primary, secondary
 * Features: elevation, spring press animation, responsive padding, border radius tokens
 */

import React, { useRef } from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { theme, healthColors } from '@/theme';
import { borderRadius as responsiveBorderRadius } from '@/utils/responsive';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Card = ({
  children,
  onPress,
  variant = "standard", // standard, outline, primary, secondary
  elevation = "medium", // none, small, medium, large
  padding = true,
  borderRadius = "medium", // small, medium, large, xlarge
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        useNativeDriver: true,
        damping: 15,
        stiffness: 300,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 280,
      }).start();
    }
  };

  const getElevationStyle = () => {
    if (variant === "outline") return {};
    switch (elevation) {
      case "none":  return styles.elevationNone;
      case "small": return styles.elevationSmall;
      case "large": return styles.elevationLarge;
      default:      return styles.elevationMedium;
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case "outline":   return styles.variantOutline;
      case "primary":   return styles.variantPrimary;
      case "secondary": return styles.variantSecondary;
      default:          return styles.variantStandard;
    }
  };

  const getRadiusStyle = () => {
    switch (borderRadius) {
      case "small":  return { borderRadius: responsiveBorderRadius.small };
      case "large":  return { borderRadius: responsiveBorderRadius.large };
      case "xlarge": return { borderRadius: responsiveBorderRadius.xlarge };
      default:       return { borderRadius: responsiveBorderRadius.medium };
    }
  };

  const Component = onPress ? AnimatedPressable : View;
  const animationProps = onPress
    ? {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        onPress,
        style: [
          styles.card,
          getVariantStyle(),
          getElevationStyle(),
          getRadiusStyle(),
          padding && styles.withPadding,
          style,
          { transform: [{ scale: scaleAnim }] }
        ],
        accessibilityRole: "button",
        accessible: true,
      }
    : {};

  if (onPress) {
    return (
      <Component {...animationProps} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <View
      style={[
        styles.card,
        getVariantStyle(),
        getElevationStyle(),
        getRadiusStyle(),
        padding && styles.withPadding,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  withPadding: {
    padding: theme.spacing.md,
  },
  
  // Variants
  variantStandard: {
    backgroundColor: healthColors.background.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  variantOutline: {
    backgroundColor: healthColors.transparent,
    borderWidth: 1.5,
    borderColor: healthColors.border.main,
  },
  variantPrimary: {
    backgroundColor: healthColors.primary.main,
    borderWidth: 0,
  },
  variantSecondary: {
    backgroundColor: healthColors.primary.surface,
    borderWidth: 1,
    borderColor: healthColors.primary[200],
  },

  // Elevations
  elevationNone: {
    shadowOpacity: 0,
    elevation: 0,
  },
  elevationSmall: {
    ...theme.shadows.sm,
  },
  elevationMedium: {
    ...theme.shadows.md,
  },
  elevationLarge: {
    ...theme.shadows.lg,
  },
});

export default Card;

