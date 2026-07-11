/**
 * AI Tagline Component
 * "Your health, enhanced by intelligence."
 * Shows at bottom of all AI-powered features
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "@/theme";
const AITagline = ({
  animated = true,
  variant = "default", // 'default', 'gradient', 'minimal'
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
    }
  }, [animated, fadeAnim, scaleAnim]);

  if (variant === "gradient") {
    return (
      <Animated.View
        style={[
          styles.container,
          style,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            theme.colors.info.main,
            theme.colors.healthcare.purple,
            theme.colors.healthcare.purple,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          <Sparkles
            size={theme.iconSizes.sm}
            color={healthColors.neutral.white}
          />
          <Text style={styles.gradientText}>
            Your health, enhanced by intelligence.
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (variant === "minimal") {
    return (
      <Animated.View
        style={[
          styles.minimalContainer,
          style,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Sparkles
          size={theme.iconSizes.xs}
          color={theme.colors.healthcare.purple}
        />
        <Text style={styles.minimalText}>
          Your health, enhanced by intelligence.
        </Text>
      </Animated.View>
    );
  }

  // Default variant
  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.iconCircle}>
        <Sparkles
          size={theme.iconSizes.sm}
          color={theme.colors.healthcare.purple}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Your health, enhanced by intelligence.</Text>
        <View style={styles.aiIndicator}>
          <View style={styles.aiDot} />
          <Text style={styles.aiLabel}>AI POWERED</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.neutral.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.healthcare.purple,
    shadowOffset: { width: 0, height: 2 },
    ...theme.shadows.md,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.colors.healthcare.purple,
    fontWeight: theme.typography.weights.medium,
    lineHeight: theme.spacing.md,
    marginBottom: theme.spacing[2],
  },
  aiIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  aiDot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.success.main,
  },
  aiLabel: {
    fontSize: theme.typography.sizes.overline,
    color: theme.colors.healthcare.purple,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
  },
  gradientContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    gap: theme.spacing.sm,
  },
  gradientText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.neutral.white,
    fontWeight: theme.typography.weights.semibold,
  },
  minimalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  minimalText: {
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.healthcare.purple,
    fontWeight: theme.typography.weights.medium,
    fontStyle: "italic",
  },
});

export default AITagline;
