/**
 * AayuCare - SkeletonLoader Component
 *
 * Animated shimmer loader for content placeholders.
 * Uses an Animated value to create a sweeping highlight effect.
 *
 * Variants:
 *   line    — text line (full-width or specified width)
 *   card    — card-height block
 *   avatar  — circular avatar
 *   stat    — compact stat-card placeholder
 *   row     — horizontal icon+text placeholder row
 *
 * Usage:
 *   <SkeletonLoader variant="card" />
 *   <SkeletonLoader variant="line" width="60%" />
 *   <SkeletonLoader variant="avatar" size={48} />
 */

import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Dimensions } from "react-native";
import { theme, healthColors } from "../../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const BASE_COLOR = healthColors.neutral.gray200;
const HIGHLIGHT_COLOR = healthColors.neutral.gray100;

const SkeletonLoader = ({
  variant = "line",
  width,
  height,
  size,
  style,
  count = 1,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const backgroundColor = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [BASE_COLOR, HIGHLIGHT_COLOR],
  });

  const getShape = () => {
    switch (variant) {
      case "avatar":
        return {
          width: size || 48,
          height: size || 48,
          borderRadius: (size || 48) / 2,
        };
      case "card":
        return {
          width: width || "100%",
          height: height || 100,
          borderRadius: theme.borderRadius.card,
        };
      case "stat":
        return {
          width: width || "47%",
          height: height || 84,
          borderRadius: theme.borderRadius.md,
        };
      case "row":
        return {
          width: width || "80%",
          height: height || 20,
          borderRadius: theme.borderRadius.sm,
        };
      case "line":
      default:
        return {
          width: width || "100%",
          height: height || 14,
          borderRadius: theme.borderRadius.xs,
        };
    }
  };

  const shape = getShape();

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.base,
            shape,
            { backgroundColor },
            idx > 0 && variant === "line" && styles.lineSpacing,
            style,
          ]}
        />
      ))}
    </>
  );
};

// Composite row: avatar + lines
export const SkeletonCardRow = ({ style }) => (
  <View style={[styles.cardRow, style]}>
    <SkeletonLoader variant="avatar" size={44} />
    <View style={styles.cardRowLines}>
      <SkeletonLoader variant="line" width="55%" height={14} />
      <SkeletonLoader variant="line" width="80%" height={12} style={{ marginTop: 6 }} />
    </View>
  </View>
);

// Two-column stat grid
export const SkeletonStatGrid = ({ rows = 1 }) => (
  <View style={styles.statGrid}>
    {Array.from({ length: rows * 2 }).map((_, i) => (
      <SkeletonLoader key={i} variant="stat" style={styles.statItem} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  lineSpacing: {
    marginTop: theme.spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  cardRowLines: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    marginBottom: theme.spacing.sm,
  },
});

export default SkeletonLoader;
