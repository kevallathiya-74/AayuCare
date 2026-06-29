/**
 * AdminHeader — top bar for admin dashboard
 * Optimized with new design system tokens
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Menu, Bell, User, X } from "lucide-react-native";
import { theme, healthColors } from '@/theme';
import LanguageSelector from '@/components/common/LanguageSelector';

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
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Menu size={22} color={healthColors.text.primary} />
    </TouchableOpacity>

    <Text style={styles.title}>Admin Panel</Text>

    <View style={styles.actions}>
      <LanguageSelector compact iconColor={healthColors.primary.main} />

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onNotificationPress}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Bell size={20} color={healthColors.text.primary} />
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {notificationCount > 9 ? "9+" : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.iconBtn, styles.profileBtn, showProfile && styles.profileBtnActive]}
        onPress={onProfileToggle}
        accessibilityRole="button"
        accessibilityLabel="Profile"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {showProfile ? (
          <X size={18} color={healthColors.primary.main} />
        ) : (
          <User size={18} color={healthColors.text.primary} />
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
    backgroundColor: healthColors.background.primary,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.sizes.h5,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginLeft: theme.spacing.sm,
    letterSpacing: 0.2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  profileBtn: {
    backgroundColor: healthColors.background.secondary,
  },
  profileBtnActive: {
    backgroundColor: healthColors.primary.surface,
    borderWidth: 1,
    borderColor: healthColors.primary[200],
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: healthColors.error.main,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: healthColors.white,
  },
  badgeText: {
    color: healthColors.white,
    fontSize: theme.typography.sizes.overline - 1,
    fontWeight: "700",
  },
});

export default AdminHeader;

