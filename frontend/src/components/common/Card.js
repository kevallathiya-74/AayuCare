/**
 * AayuCare - Custom Card Component
 *
 * Features: elevation, press animation, swipeable actions
 */

import React, { useRef } from "react";
import { View, StyleSheet, Pressable, Animated } from "react-native";
import { healthColors } from "../../theme/healthColors";
import { spacing, componentSpacing } from "../../theme/spacing";
import {
  borderRadius as responsiveBorderRadius,
  verticalScale,
} from "../../utils/responsive";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Card = ({
  children,
  onPress,
  elevation = "medium", // none, small, medium, large
  padding = true,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getElevationStyle = () => {
    switch (elevation) {
      case "none":
        return {};
      case "small":
        return styles.elevationSmall;
      case "large":
        return styles.elevationLarge;
      default:
        return styles.elevationMedium;
    }
  };

  const Component = onPress ? AnimatedPressable : View;
  const animationProps = onPress
    ? {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        onPress,
        style: { transform: [{ scale: scaleAnim }] },
        accessibilityRole: "button",
        accessible: true,
      }
    : {};

  return (
    <Component
      {...animationProps}
      style={[
        styles.card,
        getElevationStyle(),
        padding && styles.withPadding,
        style,
      ]}
      {...props}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: healthColors.card.background,
    borderRadius: responsiveBorderRadius.medium,
    borderWidth: 1,
    borderColor: healthColors.card.border,
  },
  withPadding: {
    padding: theme.spacing.lg,
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
