/**
 * AayuCare - DrawerMenu Component
 *
 * Shared animated slide-in drawer used across Patient, Doctor, and Admin dashboards.
 * Accepts configurable menu sections so each role can supply its own nav links.
 *
 * Props:
 *   visible      — boolean
 *   onClose      — function
 *   slideAnim    — Animated.Value (from useDrawer)
 *   drawerWidth  — number
 *   user         — auth user object
 *   role         — "patient" | "doctor" | "admin"
 *   menuSections — Array<{ title: string, items: Array<{ icon, iconColor, label, onPress }> }>
 *   onLogout     — function
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { User, X, ChevronRight, LogOut } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from '@/theme';

const ROLE_LABELS = {
  patient: "Patient Account",
  doctor: "Doctor Account",
  admin: "Administrator",
};

const DrawerMenu = ({
  visible,
  onClose,
  slideAnim,
  drawerWidth,
  user,
  role = "patient",
  menuSections = [],
  onLogout,
}) => {
  const handleItemPress = useCallback(
    (onPress) => {
      onClose();
      if (onPress) {
        setTimeout(onPress, 120);
      }
    },
    [onClose]
  );

  const handleLogout = useCallback(() => {
    onClose();
    if (onLogout) {
      setTimeout(onLogout, 120);
    }
  }, [onClose, onLogout]);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Tap-outside to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Drawer panel */}
        <Animated.View
          style={[
            styles.drawer,
            { width: drawerWidth, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[healthColors.primary.main, healthColors.primary.dark]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.profileRow}>
                <View style={styles.avatarCircle}>
                  <User  size={28} color={healthColors.white} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || "User"}
                  </Text>
                  <Text style={styles.userRole}>{ROLE_LABELS[role] ?? role}</Text>
                  {user?.userId ? (
                    <Text style={styles.userId}>ID: {user.userId}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close menu"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X  size={26} color={healthColors.white} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Menu sections */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {menuSections.map((section, sIdx) => (
              <View key={sIdx} style={styles.section}>
                {section.title ? (
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                ) : null}
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={iIdx}
                    style={styles.menuItem}
                    onPress={() => handleItemPress(item.onPress)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <View
                      style={[
                        styles.menuIconWrap,
                        {
                          backgroundColor:
                            (item.iconColor || healthColors.primary.main) + "18",
                        },
                      ]}
                    >
                      {item.icon ? (
                        <item.icon
                          size={20}
                          color={item.iconColor || healthColors.primary.main}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <ChevronRight
                      size={16}
                      color={healthColors.text.tertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Logout */}
            {onLogout ? (
              <View style={styles.section}>
                <TouchableOpacity
                  style={[styles.menuItem, styles.logoutItem]}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuIconWrap,
                      { backgroundColor: healthColors.error.background },
                    ]}
                  >
                    <LogOut
                      
                      size={20}
                      color={healthColors.error.main}
                    />
                  </View>
                  <Text style={[styles.menuLabel, styles.logoutLabel]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Bottom spacer */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
  },
  drawer: {
    height: "100%",
    backgroundColor: healthColors.background.primary,
    ...theme.shadows.xl,
  },
  header: {
    paddingTop: 52,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: healthColors.white,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
  },
  userRole: {
    color: "rgba(255,255,255,0.75)",
    fontSize: theme.typography.sizes.sm,
    marginTop: 2,
  },
  userId: {
    color: "rgba(255,255,255,0.6)",
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  body: {
    flex: 1,
  },
  section: {
    paddingTop: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.tertiary,
    letterSpacing: 0.8,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    textTransform: "uppercase",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.primary,
  },
  logoutItem: {
    marginTop: theme.spacing.sm,
  },
  logoutLabel: {
    color: healthColors.error.main,
  },
  bottomSpacer: {
    height: 48,
  },
});

export default DrawerMenu;
