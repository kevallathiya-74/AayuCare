/**
 * AdminProfileView — full-screen profile panel (shown when showProfile=true)
 * Props: user, onNavigate (fn(screen)), onLogout
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { User, ShieldCheck, LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, healthColors } from "../../../theme";
import { DynamicIcon } from "../../../components/common";

const InfoRow = ({ icon, label, value, last }) => (
  <>
    <View style={styles.infoRow}>
      <DynamicIcon name={icon} size={20} color={healthColors.primary.main} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
    {!last && <View style={styles.divider} />}
  </>
);

const ActionRow = ({ icon, label, onPress, last }) => (
  <>
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <DynamicIcon name={icon} size={22} color={healthColors.text.primary} />
      <Text style={styles.actionLabel}>{label}</Text>
      <DynamicIcon name="chevron-forward" size={20} color={healthColors.text.tertiary} />
    </TouchableOpacity>
    {!last && <View style={styles.divider} />}
  </>
);

const AdminProfileView = ({ user, onNavigate, onLogout }) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
    >
      {/* Hero */}
      <LinearGradient
        colors={[healthColors.primary.main, healthColors.primary.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <User  size={56} color={theme.colors.text.white} />
          </View>
        </View>
        <Text style={styles.heroName}>{user?.name || "Admin User"}</Text>
        <Text style={styles.heroEmail}>{user?.email || "admin@aayucare.com"}</Text>
        <View style={styles.rolePill}>
          <ShieldCheck  size={14} color={theme.colors.text.white} />
          <Text style={styles.roleText}>{user?.role?.toUpperCase() || "ADMIN"}</Text>
        </View>
      </LinearGradient>

      {/* Personal info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.card}>
          <InfoRow icon="id-card-outline" label="Admin ID" value={user?.userId || "ADMIN"} />
          <InfoRow icon="person-outline" label="Full Name" value={user?.name || "Admin User"} />
          <InfoRow icon="mail-outline" label="Email Address" value={user?.email || "admin@aayucare.com"} />
          <InfoRow icon="call-outline" label="Phone Number" value={user?.phone || "+91 XXXXXXXXXX"} />
          <InfoRow icon="briefcase-outline" label="Role" value={user?.role || "admin"} />
          <InfoRow
            icon="calendar-outline"
            label="Member Since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "January 2025"}
            last
          />
        </View>
      </View>

      {/* Account settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.card}>
          <ActionRow icon="settings-outline" label="Settings" onPress={() => onNavigate("AdminSettings")} />
          <ActionRow icon="create-outline" label="Edit Profile" onPress={() => onNavigate("EditProfile")} />
          <ActionRow icon="key-outline" label="Change Password" onPress={() => onNavigate("SecuritySettings")} />
          <ActionRow icon="shield-outline" label="Privacy & Security" onPress={() => onNavigate("SecuritySettings")} last />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={onLogout}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <LogOut  size={22} color={healthColors.error.main} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: healthColors.background.secondary },
  hero: {
    alignItems: "center",
    paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24,
    gap: 4,
  },
  avatarWrap: { marginBottom: 12 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.22),
    justifyContent: "center", alignItems: "center",
  },
  heroName: { fontSize: theme.typography.sizes.h3, fontWeight: theme.typography.weights.bold, color: theme.colors.text.white },
  heroEmail: { fontSize: theme.typography.sizes.bodyMedium, color: theme.withOpacity(theme.colors.text.white, 0.75) },
  rolePill: {
    marginTop: 8, flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5,
  },
  roleText: { fontSize: theme.typography.sizes.bodySmall, fontWeight: theme.typography.weights.bold, color: theme.colors.text.white },

  section: { marginHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: theme.typography.sizes.bodyMedium, fontWeight: "700", color: healthColors.text.secondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1, borderColor: healthColors.border.light,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  divider: { height: 1, backgroundColor: healthColors.border.light, marginLeft: 48 },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: theme.typography.sizes.caption, color: healthColors.text.tertiary, fontWeight: "500" },
  infoValue: { fontSize: theme.typography.sizes.bodyMedium, color: healthColors.text.primary, fontWeight: "600", marginTop: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  actionLabel: { flex: 1, fontSize: theme.typography.sizes.bodyMedium, color: healthColors.text.primary, fontWeight: "500" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: healthColors.error.background,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    borderWidth: 1, borderColor: healthColors.error.main + "30",
  },
  logoutText: { fontSize: theme.typography.sizes.bodyLarge, fontWeight: "700", color: healthColors.error.main },
});

export default AdminProfileView;
