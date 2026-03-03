/**
 * PatientHeader
 * Gradient hero banner for the Patient Dashboard.
 * Handles menu open, notifications, profile navigation, and greeting.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../../theme";
import LanguageSelector from "../../../components/common/LanguageSelector";
import { calculateAge } from "../../../utils/dateHelpers";

const PatientHeader = ({
  user,
  isLoading,
  unreadNotifications = 0,
  greeting = "Hello",
  greetingIcon = "sunny",
  onMenuOpen,
  onNotificationPress,
  onProfilePress,
}) => {
  return (
    <LinearGradient
      colors={[healthColors.primary.main, healthColors.primary.dark]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={styles.circleLarge} pointerEvents="none" />
      <View style={styles.circleSmall} pointerEvents="none" />

      {/* ── Top action row ── */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenuOpen}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={24} color={theme.colors.text.white} />
        </TouchableOpacity>

        <Text style={styles.appTitle}>AayuCare</Text>

        <View style={styles.rightIcons}>
          <LanguageSelector compact iconColor={theme.colors.text.white} />

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications" size={24} color={theme.colors.text.white} />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={onProfilePress}
            accessibilityRole="button"
            accessibilityLabel="Profile"
          >
            <Ionicons name="person" size={24} color={theme.colors.text.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Greeting section ── */}
      <View style={styles.greetingSection}>
        {!user || isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.text.white} />
            <Text style={styles.loadingText}>Loading profile…</Text>
          </View>
        ) : (
          <>
            <View style={styles.greetingRow}>
              <Ionicons
                name={greetingIcon}
                size={26}
                color={theme.colors.text.white}
                style={styles.greetingIcon}
              />
              <View>
                <Text style={styles.greetingLabel}>{greeting}</Text>
                <Text style={styles.userName}>{user?.name || "Patient"}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={16} color={theme.colors.text.white} />
                <Text style={styles.infoText}>ID: {user?.userId || "N/A"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color={theme.colors.text.white} />
                <Text style={styles.infoText}>
                  Age: {user?.age || (user?.dateOfBirth ? calculateAge(user.dateOfBirth) : "N/A")}
                  {" "}· Blood: {user?.bloodGroup || "N/A"}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  circleLarge: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.06),
  },
  circleSmall: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.04),
  },

  // top row
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.white,
    letterSpacing: 0.5,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.12),
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: healthColors.accent.coral,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.text.white,
  },

  // greeting
  greetingSection: { paddingTop: 4 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  loadingText: {
    color: theme.colors.text.white,
    fontSize: 14,
    opacity: 0.8,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  greetingIcon: { marginRight: 10 },
  greetingLabel: {
    fontSize: 14,
    color: theme.withOpacity(theme.colors.text.white, 0.85),
    marginBottom: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text.white,
    letterSpacing: 0.3,
  },
  infoCard: {
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.12),
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.text.white,
    fontWeight: "500",
  },
});

export default PatientHeader;
