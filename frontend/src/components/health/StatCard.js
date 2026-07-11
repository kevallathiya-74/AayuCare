/**
 * AayuCare - StatCard Component
 *
 * Dashboard metric card with icon, label, value, and optional trend indicator.
 * Used in Patient, Doctor, and Admin dashboards.
 *
 * Props:
 *   icon        — Ionicons name
 *   iconColor   — hex or theme token
 *   label       — metric name
 *   value       — primary display value
 *   trend       — number (+/- percent) or null
 *   trendLabel  — override the default "+X%" trend text
 *   bgColor     — card background (defaults to white)
 *   onPress     — optional tap handler
 *   style       — override style
 */

import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { theme, healthColors } from "@/theme";
import DynamicIcon from "../common/DynamicIcon";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const StatCard = ({
  icon,
  iconColor,
  label,
  value,
  trend,
  trendLabel,
  bgColor,
  onPress,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const trendIsPositive = typeof trend === "number" ? trend >= 0 : null;
  const trendColor =
    trendIsPositive === null
      ? healthColors.text.tertiary
      : trendIsPositive
        ? healthColors.success.main
        : healthColors.error.main;
  const trendIcon =
    trendIsPositive === null
      ? null
      : trendIsPositive
        ? "trending-up"
        : "trending-down";

  const displayTrend =
    trendLabel ||
    (typeof trend === "number" ? `${trend >= 0 ? "+" : ""}${trend}%` : null);

  const color = iconColor || healthColors.primary.main;
  const CardWrapper = onPress ? AnimatedTouchable : Animated.View;

  return (
    <CardWrapper
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.85}
      style={[
        styles.card,
        { backgroundColor: bgColor || healthColors.background.card },
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      {/* Icon blob */}
      <View style={[styles.iconWrap, { backgroundColor: color + "18" }]}>
        <DynamicIcon name={icon} size={theme.iconSizes.md} color={color} />
      </View>

      {/* Value */}
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value ?? "–"}
      </Text>

      {/* Label */}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>

      {/* Trend */}
      {displayTrend ? (
        <View style={styles.trendRow}>
          {trendIcon ? (
            <DynamicIcon
              name={trendIcon}
              size={theme.iconSizes.xs}
              color={trendColor}
            />
          ) : null}
          <Text style={[styles.trendText, { color: trendColor }]}>
            {" "}
            {displayTrend}
          </Text>
        </View>
      ) : null}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    minWidth: 100,
    ...theme.shadows.card,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  value: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
    lineHeight: 16,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.xs,
  },
  trendText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default StatCard;
