/**
 * AayuCare - Badge Component
 *
 * Variants: status, count, dot
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { healthColors } from "../../theme/healthColors";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

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

    switch (status) {
      case "pending":
        return {
          color: healthColors.status.pending,
          backgroundColor: healthColors.warning.light,
        };
      case "confirmed":
        return {
          color: healthColors.status.confirmed,
          backgroundColor: healthColors.success.light,
        };
      case "cancelled":
        return {
          color: healthColors.status.cancelled,
          backgroundColor: healthColors.error.light,
        };
      case "completed":
        return {
          color: healthColors.status.completed,
          backgroundColor: healthColors.neutral.gray200,
        };
      case "in-progress":
        return {
          color: healthColors.status.inProgress,
          backgroundColor: healthColors.info.light,
        };
      default:
        return {
          color: color || healthColors.text.primary,
          backgroundColor: backgroundColor || healthColors.background.secondary,
        };
    }
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
    borderRadius: healthColors.borderRadius.medium,
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
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    ...textStyles.labelSmall,
    fontWeight: "600",
  },
  smallText: {
    fontSize: 9,
  },
  largeText: {
    fontSize: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default Badge;

