/**
 * AdminWelcomeBanner — gradient greeting banner at top of admin dashboard
 * Props: greeting, user
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "@/theme";

const AdminWelcomeBanner = ({ greeting, user }) => (
  <LinearGradient
    colors={theme.gradients.primary}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.banner}
  >
    {/* Decorative circles */}
    <View style={[styles.circle, styles.circle1]} />
    <View style={[styles.circle, styles.circle2]} />

    <View style={styles.content}>
      <Text style={styles.greetingText}>{greeting}</Text>
      <Text style={styles.nameText}>
        Welcome{user?.name ? `, ${user.name}` : ""}
      </Text>
      <View style={styles.rolePill}>
        <Text style={styles.roleText}>
          {user?.role?.toUpperCase() || "ADMIN"}
        </Text>
      </View>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.08),
  },
  circle1: { width: 140, height: 140, top: -40, right: -20 },
  circle2: { width: 90, height: 90, bottom: -30, right: 70 },
  content: { gap: 4 },
  greetingText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.withOpacity(healthColors.text.white, 0.85),
  },
  nameText: {
    fontSize: theme.typography.sizes.h3,
    fontWeight: "700",
    color: healthColors.white,
  },
  rolePill: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.2),
    borderRadius: theme.borderRadius.badge,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: theme.typography.sizes.overline,
    fontWeight: "700",
    color: healthColors.white,
    letterSpacing: 0.5,
  },
});

export default AdminWelcomeBanner;
