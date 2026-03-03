/**
 * DoctorHeader
 * Gradient hero banner for the Doctor Dashboard.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../../theme";
import LanguageSelector from "../../../components/common/LanguageSelector";

const DoctorHeader = ({
  user,
  greeting = "Hello",
  greetingIcon = "sunny",
  notificationCount = 0,
  onMenuOpen,
  onNotificationPress,
  onProfilePress,
}) => (
  <LinearGradient
    colors={[healthColors.primary.main, healthColors.primary.dark]}
    style={styles.container}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
  >
    <View style={styles.circleLarge} pointerEvents="none" />
    <View style={styles.circleSmall} pointerEvents="none" />

    {/* ── Top row ── */}
    <View style={styles.topRow}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onMenuOpen}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="menu" size={24} color={theme.colors.text.white} />
      </TouchableOpacity>

      <View style={styles.rightIcons}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onNotificationPress}
          accessibilityRole="button"
          accessibilityLabel={notificationCount > 0 ? `${notificationCount} pending` : "Notifications"}
        >
          <Ionicons name="notifications" size={24} color={theme.colors.text.white} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{String(notificationCount)}</Text>
            </View>
          )}
        </TouchableOpacity>
        <LanguageSelector compact iconColor={theme.colors.text.white} />
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Ionicons name="person" size={24} color={theme.colors.text.white} />
        </TouchableOpacity>
      </View>
    </View>

    {/* ── Greeting ── */}
    <View style={styles.greetingSection}>
      <View style={styles.greetingRow}>
        <Ionicons
          name={greetingIcon}
          size={26}
          color={theme.colors.text.white}
          style={styles.greetingIcon}
        />
        <View>
          <Text style={styles.greetingLabel}>{greeting}</Text>
          <Text style={styles.userName}>Dr. {user?.name || "Doctor"}</Text>
        </View>
      </View>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="medical" size={15} color={theme.colors.text.white} />
          <Text style={styles.infoText}>
            {user?.specialization || "General Physician"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="business" size={15} color={theme.colors.text.white} />
          <Text style={styles.infoText}>{user?.department || "OPD"}</Text>
        </View>
      </View>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  circleLarge: {
    position: "absolute", top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.06),
  },
  circleSmall: {
    position: "absolute", bottom: -20, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.04),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  rightIcons: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.12),
    justifyContent: "center", alignItems: "center",
  },
  badge: {
    position: "absolute", top: 4, right: 4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: healthColors.accent.coral,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: theme.colors.text.white },

  greetingSection: { paddingTop: 4 },
  greetingRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  greetingIcon: { marginRight: 10 },
  greetingLabel: {
    fontSize: 13, color: theme.withOpacity(theme.colors.text.white, 0.85), marginBottom: 2,
  },
  userName: { fontSize: 22, fontWeight: "700", color: theme.colors.text.white, letterSpacing: 0.3 },
  infoCard: {
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.12),
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 6,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: theme.colors.text.white, fontWeight: "500" },
});

export default DoctorHeader;
