/**
 * Admin Settings Screen
 * Hospital and system settings with logout functionality
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft, LogOut } from "lucide-react-native";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
import { useDispatch, useSelector } from "react-redux";
import { theme, healthColors } from "@/theme";
import Routes from "@/navigation/routes";
import { logoutUser } from "@/store/slices/authSlice";
import { logError } from "@/utils/errorHandler";
import { ModalSheet, Button } from "@/components/common";
import { DynamicIcon } from "@/components/common";
import { handleSmartBack } from "@/utils/navigation";

const AdminSettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loggingOut, setLoggingOut] = useState(false);
  const insets = useSafeAreaInsets();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = useCallback(() => {
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (err) {
      logError(err, { context: "AdminSettingsScreen.handleLogout" });
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const settingsSections = useMemo(
    () => [
      {
        title: "Hospital Management",
        items: [
          {
            icon: "people",
            label: "Manage Doctors",
            screen: "ManageDoctors",
            isTabScreen: false,
            color: healthColors.primary.main,
          },
          {
            icon: "person-add",
            label: "Patient Management",
            screen: "PatientManagement",
            isTabScreen: false,
            color: healthColors.success.main,
          },
          {
            icon: "calendar",
            label: "Appointments",
            screen: "Appointments",
            isTabScreen: true,
            color: healthColors.info.main,
          },
        ],
      },
      {
        title: "Reports",
        items: [
          {
            icon: "document-text",
            label: "Medical Reports",
            screen: "Reports",
            isTabScreen: true,
            color: healthColors.warning.main,
          },
        ],
      },
      {
        title: "System",
        items: [
          {
            icon: "shield-checkmark",
            label: "Security",
            screen: "SecuritySettings",
            isTabScreen: false,
            color: healthColors.success.main,
          },
          {
            icon: "information-circle",
            label: "About",
            action: () =>
              Alert.alert(
                "AayuCare",
                "Version 1.0.0\nHealthcare Management System",
              ),
            color: healthColors.info.main,
          },
        ],
      },
    ],
    [],
  );

  const handleSettingPress = useCallback(
    (item) => {
      if (item.screen) {
        // Navigate to tab screens via AdminTabs, others directly
        if (item.isTabScreen) {
          navigation.navigate(Routes.TABS.ADMIN, { screen: item.screen });
        } else {
          navigation.navigate(item.screen);
        }
      } else if (item.action) {
        item.action();
      }
    },
    [navigation],
  );

  const renderSettingItem = useCallback(
    (item, index) => (
      <TouchableOpacity
        key={index}
        style={styles.settingItem}
        onPress={() => handleSettingPress(item)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: theme.withOpacity(item.color, 0.15) },
          ]}
        >
          <DynamicIcon name={item.icon} size={22} color={item.color} />
        </View>
        <Text style={styles.settingLabel}>{item.label}</Text>
        <DynamicIcon
          name="chevron-forward"
          size={20}
          color={healthColors.text.tertiary}
        />
      </TouchableOpacity>
    ),
    [handleSettingPress],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleSmartBack(navigation, "AdminTabs")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={healthColors.text.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {getInitials(user?.name || "Admin")}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "Admin"}</Text>
            <Text style={styles.profileRole}>Administrator</Text>
            <Text style={styles.profileEmail}>
              {user?.email || "admin@aayucare.com"}
            </Text>
            <Text style={styles.profileEmail}>ID: {user?.userId || "—"}</Text>
          </View>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={itemIndex}>
                  {renderSettingItem(item, itemIndex)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Logout"
          accessibilityState={{ disabled: loggingOut }}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={healthColors.error.main} />
          ) : (
            <>
              <LogOut size={22} color={healthColors.error.main} />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ModalSheet
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout"
        maxHeight={0.35}
      >
        <Text style={styles.modalText}>
          Are you sure you want to log out of your account?
        </Text>
        <View style={styles.modalActions}>
          <Button
            variant="outline"
            onPress={() => setShowLogoutModal(false)}
            style={styles.modalButton}
            disabled={loggingOut}
            title="Cancel"
          />
          <Button
            variant="primary"
            onPress={confirmLogout}
            style={[
              styles.modalButton,
              {
                backgroundColor: healthColors.error.main,
                borderColor: healthColors.error.main,
              },
            ]}
            textStyle={{ color: healthColors.neutral.white }}
            loading={loggingOut}
            title="Logout"
          />
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    ...theme.shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  placeholder: { width: 40 },
  content: {
    padding: theme.spacing.lg,
  },
  profileCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: healthColors.primary.main,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  profileRole: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  sectionCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.medium,
  },
  separator: {
    height: 1,
    backgroundColor: healthColors.border.light,
    marginLeft: 60,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.error.background,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: healthColors.error.light,
  },
  logoutText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.error.main,
  },
  bottomSpacer: {
    height: 40,
  },
  modalText: {
    fontSize: theme.typography.sizes.bodyLarge,
    color: healthColors.text.primary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default AdminSettingsScreen;
