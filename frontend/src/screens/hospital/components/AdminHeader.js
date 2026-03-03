/**
 * AdminHeader — top bar for admin dashboard
 * Props: notificationCount, showProfile, onMenuOpen, onNotificationPress, onProfileToggle
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../../theme";
import LanguageSelector from "../../../components/common/LanguageSelector";

const AdminHeader = ({
  notificationCount = 0,
  showProfile = false,
  onMenuOpen,
  onNotificationPress,
  onProfileToggle,
}) => (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.iconBtn}
      onPress={onMenuOpen}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
    >
      <Ionicons name="menu" size={28} color={healthColors.text.primary} />
    </TouchableOpacity>

    <Text style={styles.title}>Admin Dashboard</Text>

    <View style={styles.actions}>
      <LanguageSelector compact iconColor={healthColors.primary.main} />

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onNotificationPress}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons
          name="notifications-outline"
          size={24}
          color={healthColors.text.primary}
        />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 9 ? "9+" : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onProfileToggle}
        accessibilityRole="button"
        accessibilityLabel="Profile"
      >
        <Ionicons
          name={showProfile ? "close-circle-outline" : "person-circle-outline"}
          size={24}
          color={showProfile ? healthColors.primary.main : healthColors.text.primary}
        />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: healthColors.error.main,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});

export default AdminHeader;
