/**
 * AayuCare - ScreenHeader Component
 *
 * Shared gradient header used across Patient, Doctor, and Admin dashboards.
 * Displays app title, greeting, user name, notification bell, and optional actions.
 *
 * Props:
 *   user                  — auth user object
 *   title                 — row title (left of header, e.g. "AayuCare")
 *   greeting              — e.g. "Good Morning"
 *   subtitle              — e.g. user name or context text
 *   notificationCount     — number, badge on bell icon
 *   onMenuOpen            — function, hamburger press
 *   onNotificationPress   — function
 *   onProfilePress        — function
 *   showLanguageSelector  — boolean (default true)
 *   gradientColors        — array of 2 colors (default primary)
 *   children              — optional extra content below greeting row
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../theme";
import LanguageSelector from "../common/LanguageSelector";

const ScreenHeader = ({
  user,
  title = "AayuCare",
  greeting,
  subtitle,
  notificationCount = 0,
  onMenuOpen,
  onNotificationPress,
  onProfilePress,
  showLanguageSelector = true,
  gradientColors,
  children,
  style,
}) => {
  const colors = gradientColors || [
    healthColors.primary.main,
    healthColors.primary.dark,
  ];

  return (
    <LinearGradient
      colors={colors}
      style={[styles.container, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top action row */}
      <View style={styles.topRow}>
        {/* Hamburger / back */}
        {onMenuOpen ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onMenuOpen}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="menu" size={24} color={healthColors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButton} />
        )}

        {/* App / screen title */}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {/* Right actions */}
        <View style={styles.rightActions}>
          {showLanguageSelector ? (
            <LanguageSelector compact iconColor={healthColors.white} />
          ) : null}

          {onNotificationPress ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onNotificationPress}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="notifications" size={24} color={healthColors.white} />
              {notificationCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : null}

          {onProfilePress ? (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onProfilePress}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="person-circle" size={26} color={healthColors.white} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Greeting row */}
      {(greeting || subtitle) ? (
        <View style={styles.greetingRow}>
          {greeting ? (
            <Text style={styles.greeting}>{greeting}</Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Optional extra content (stats strip, search bar, etc.) */}
      {children ? <View style={styles.childrenSlot}>{children}</View> : null}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: healthColors.white,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.3,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.error.main,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: healthColors.white,
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
  },
  greetingRow: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  greeting: {
    color: "rgba(255,255,255,0.85)",
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  subtitle: {
    color: healthColors.white,
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    marginTop: 2,
  },
  childrenSlot: {
    marginTop: theme.spacing.md,
  },
});

export default ScreenHeader;
