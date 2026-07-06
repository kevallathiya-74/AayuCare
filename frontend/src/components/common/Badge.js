/**
 * AayuCare - Badge Component
 *
 * Variants: status, count, dot
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { theme } from '@/theme';
import { healthColors } from '@/theme/healthColors';
import { textStyles } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { getStatusStyle } from '@/utils/helpers';

const Badge = ({
  children,
  variant = "default", // default, status, count, dot
  status, // pending, confirmed, cancelled, completed, in-progress
  color,
  backgroundColor,
  size = "medium", // small, medium, large
  style,
}) => {
  const getStatusColor = () => {
    if (color && backgroundColor) {
      return { color, backgroundColor };
    }

    if (status) {
      return getStatusStyle(status);
    }

    return {
      color: color || healthColors.text.primary,
      backgroundColor: backgroundColor || healthColors.background.secondary,
    };
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.small;
      case "large":
        return styles.large;
      default:
        return styles.medium;
    }
  };

  if (variant === "dot") {
    const { color: dotColor, backgroundColor: dotBg } = getStatusColor();
    return (
      <View
        style={[
          styles.dot,
          { backgroundColor: dotColor || dotBg },
          getSizeStyle(),
          style,
        ]}
        accessibilityLabel="Status indicator"
      />
    );
  }

  const { color: textColor, backgroundColor: bgColor } = getStatusColor();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        getSizeStyle(),
        variant === "count" && styles.countBadge,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: textColor },
          size === "small" && styles.smallText,
          size === "large" && styles.largeText,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: theme.borderRadius.badge,
    alignSelf: "flex-start",
  },
  small: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  large: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: theme.borderRadius.badge,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    ...textStyles.labelSmall,
    fontWeight: "600",
  },
  smallText: {
    fontSize: theme.typography.sizes.overline,
  },
  largeText: {
    fontSize: theme.typography.sizes.bodySmall,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.xs,
  },
});

export default Badge;

