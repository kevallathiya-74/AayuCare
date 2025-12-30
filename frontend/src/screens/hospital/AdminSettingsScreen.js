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
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import { logout } from "../../store/slices/authSlice";
import { logError } from "../../utils/errorHandler";

const AdminSettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loggingOut, setLoggingOut] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogout = useCallback(async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try {
            await dispatch(logout()).unwrap();
          } catch (err) {
            logError(err, { context: "AdminSettingsScreen.handleLogout" });
            Alert.alert("Error", "Failed to logout. Please try again.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }, [dispatch]);

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
        title: "Reports & Analytics",
        items: [
          {
            icon: "document-text",
            label: "Medical Reports",
            screen: "Reports",
            isTabScreen: true,
            color: healthColors.warning.main,
          },
          {
            icon: "analytics",
            label: "Error Analytics",
            screen: "Analytics",
            isTabScreen: true,
            color: healthColors.error.main,
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
                "Version 1.0.0\nHealthcare Management System"
              ),
            color: healthColors.info.main,
          },
        ],
      },
    ],
    []
  );

  const handleSettingPress = useCallback(
    (item) => {
      if (item.screen) {
        // Navigate to tab screens via AdminTabs, others directly
        if (item.isTabScreen) {
          navigation.navigate("AdminTabs", { screen: item.screen });
        } else {
          navigation.navigate(item.screen);
        }
      } else if (item.action) {
        item.action();
      }
    },
    [navigation]
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
          style={[styles.settingIcon, { backgroundColor: item.color + "15" }]}
        >
          <Ionicons name={item.icon} size={22} color={item.color} />
        </View>
        <Text style={styles.settingLabel}>{item.label}</Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={healthColors.text.tertiary}
        />
      </TouchableOpacity>
    ),
    [handleSettingPress]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
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
            <Ionicons
              name="person"
              size={32}
              color={healthColors.primary.main}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "Admin"}</Text>
            <Text style={styles.profileRole}>Administrator</Text>
            <Text style={styles.profileEmail}>
              {user?.email || "admin@aayucare.com"}
            </Text>
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
              <Ionicons
                name="log-out"
                size={22}
                color={healthColors.error.main}
              />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: indianDesign.spacing.lg,
    paddingVertical: indianDesign.spacing.md,
    backgroundColor: healthColors.background.card,
    ...createShadow(2),
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
    fontSize: indianDesign.fontSize.large,
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  placeholder: { width: 40 },
  content: {
    padding: indianDesign.spacing.lg,
  },
  profileCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.large,
    padding: indianDesign.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: indianDesign.spacing.lg,
    ...createShadow(2),
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: healthColors.primary.main + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: indianDesign.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: indianDesign.fontSize.large,
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  profileRole: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.primary.main,
    fontWeight: indianDesign.fontWeight.medium,
    marginTop: 2,
  },
  profileEmail: {
    fontSize: indianDesign.fontSize.small,
    color: healthColors.text.secondary,
    marginTop: 4,
  },
  section: {
    marginBottom: indianDesign.spacing.lg,
  },
  sectionTitle: {
    fontSize: indianDesign.fontSize.small,
    fontWeight: indianDesign.fontWeight.semiBold,
    color: healthColors.text.tertiary,
    textTransform: "uppercase",
    marginBottom: indianDesign.spacing.sm,
    marginLeft: indianDesign.spacing.xs,
  },
  sectionCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.medium,
    ...createShadow(2),
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: indianDesign.spacing.md,
    paddingHorizontal: indianDesign.spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: indianDesign.spacing.md,
  },
  settingLabel: {
    flex: 1,
    fontSize: indianDesign.fontSize.medium,
    color: healthColors.text.primary,
    fontWeight: indianDesign.fontWeight.medium,
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
    borderRadius: indianDesign.borderRadius.medium,
    paddingVertical: indianDesign.spacing.md,
    gap: indianDesign.spacing.sm,
    borderWidth: 1,
    borderColor: healthColors.error.light,
  },
  logoutText: {
    fontSize: indianDesign.fontSize.medium,
    fontWeight: indianDesign.fontWeight.semiBold,
    color: healthColors.error.main,
  },
});

export default AdminSettingsScreen;
