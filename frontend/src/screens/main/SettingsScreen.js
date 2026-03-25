/**
 * AayuCare - SettingsScreen
 *
 * App settings and preferences
 * Features: grouped settings, toggle switches, navigation
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Linking,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { theme, healthColors, textStyles, spacing } from "../../theme";
import {
  Card,
  ListItem,
  ErrorRecovery,
  NetworkStatusIndicator,
  SkeletonCardRow,
} from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { useDispatch, useSelector } from "react-redux";
import { getItem, setItem } from "../../utils/appStorage";
import { handleSmartBack } from "../../utils/navigation";
import { setNotificationsEnabled } from "../../store/slices/permissionSlice";

const SETTINGS_STORAGE_KEY = "aayucare_notification_settings";

const SettingsScreen = ({ navigation }) => {
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [healthTips, setHealthTips] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const userRole = useSelector((state) => state.auth?.user?.role);
  const notificationPermission = useSelector(
    (state) => state.permissions?.notification || {}
  );
  const notificationsEnabled =
    !!notificationPermission.granted && !!notificationPermission.notificationsEnabled;

  // Load persisted notification preferences on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const prefs = JSON.parse(stored);
          if (typeof prefs.appointmentReminders === "boolean") setAppointmentReminders(prefs.appointmentReminders);
          if (typeof prefs.medicationReminders === "boolean") setMedicationReminders(prefs.medicationReminders);
          if (typeof prefs.healthTips === "boolean") setHealthTips(prefs.healthTips);
        }
      } catch (err) {
        logError(err, "SettingsScreen.loadSettings");
      }
    })();
  }, []);

  const getEditProfileRoute = () => {
    if (userRole === "doctor") return "EditProfile";
    if (userRole === "admin") return "AdminSettings";
    return "PatientEditProfile";
  };

  const getSettingsBackFallback = () => {
    if (userRole === "admin") return "AdminTabs";
    if (userRole === "doctor") return "DoctorTabs";
    return "PatientTabs";
  };

  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Cannot Open", "Unable to open this link on your device.");
    } catch (err) {
      logError(err, "SettingsScreen.openURL");
    }
  };

  const handleSettingChange = async (setter, value, settingName) => {
    try {
      setter(value);
      // Persist all notification prefs as a single JSON object in appStorage
      const currentPrefs = {
        notificationsEnabled,
        appointmentReminders: settingName === "appointmentReminders" ? value : appointmentReminders,
        medicationReminders: settingName === "medicationReminders" ? value : medicationReminders,
        healthTips: settingName === "healthTips" ? value : healthTips,
      };
      await setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentPrefs));
    } catch (err) {
      logError(err, `SettingsScreen.handleSettingChange.${settingName}`);
      showError("Failed to update setting");
      setter(!value); // Revert on error
    }
  };

  const handleNotificationToggle = async (value) => {
    try {
      const result = await dispatch(setNotificationsEnabled(value)).unwrap();

      if (
        value &&
        !result.notificationsEnabled &&
        result.canAskAgain === false
      ) {
        Alert.alert(
          "Permission Required",
          "Notifications are blocked at the device level. Enable them from app settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                Linking.openSettings().catch(() => {
                  showError("Unable to open device settings");
                });
              },
            },
          ]
        );
      }
    } catch (err) {
      logError(err, "SettingsScreen.handleNotificationToggle");
      showError("Failed to update notification permission");
    }
  };

  const renderSwitch = (value, onValueChange, settingName) => (
    <Switch
      value={value}
      onValueChange={(val) =>
        handleSettingChange(onValueChange, val, settingName)
      }
      trackColor={{
        false: healthColors.neutral.gray300,
        true: healthColors.primary.light,
      }}
      thumbColor={
        value ? healthColors.primary.main : healthColors.neutral.white
      }
    />
  );

  const accountSettings = [
    {
      title: "Edit Profile",
      leftIcon: { name: "person", color: healthColors.primary.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () => navigation.navigate(getEditProfileRoute()),
    },
    {
      title: "Change Password",
      leftIcon: { name: "lock-closed", color: healthColors.primary.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () => navigation.navigate("ChangePassword"),
    },
    {
      title: "Accessibility & Advanced",
      leftIcon: { name: "accessibility", color: healthColors.primary.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () => navigation.navigate("SettingsAccessibility"),
    },
  ];

  const privacySettings = [
    {
      title: "Privacy Policy",
      leftIcon: { name: "shield-checkmark", color: healthColors.primary.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () => openURL("https://aayucare.in/privacy-policy"),
    },
    {
      title: "Terms of Service",
      leftIcon: { name: "document-text", color: healthColors.primary.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () => openURL("https://aayucare.in/terms"),
    },
    {
      title: "Data & Privacy",
      leftIcon: { name: "eye-off", color: healthColors.primary.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () => {
        if (userRole === "admin") {
          navigation.navigate("SecuritySettings");
        } else {
          Alert.alert(
            "Data & Privacy",
            "AayuCare uses end-to-end encryption for all health records. Your data is stored securely and never shared without your consent.\n\nFor full details, see our Privacy Policy.",
            [
              { text: "View Policy", onPress: () => openURL("https://aayucare.in/privacy-policy") },
              { text: "OK", style: "default" },
            ]
          );
        }
      },
    },
  ];

  const aboutSettings = [
    {
      title: "About AayuCare",
      leftIcon: {
        name: "information-circle",
        color: healthColors.primary.main,
      },
      rightIcon: { name: "chevron-forward" },
      onPress: () =>
        Alert.alert(
          "About AayuCare",
          "AayuCare – Your Complete Health Management Platform\n\nVersion: 1.0.0\nPlatform: Android & iOS\n\nAayuCare connects patients, doctors, and hospitals in one seamless ecosystem for better, safer healthcare.",
          [{ text: "OK" }]
        ),
    },
    {
      title: "Help & Support",
      leftIcon: { name: "help-circle", color: healthColors.primary.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () =>
        Alert.alert(
          "Help & Support",
          "For assistance, contact us:",
          [
            { text: "Email Support", onPress: () => openURL("mailto:support@aayucare.in") },
            { text: "WhatsApp", onPress: () => openURL("https://wa.me/919876543210") },
            { text: "Cancel", style: "cancel" },
          ]
        ),
    },
    {
      title: "Rate Us",
      leftIcon: { name: "star", color: healthColors.warning.main },
      rightIcon: { name: "chevron-forward" },
      onPress: () => openURL("https://play.google.com/store/apps/details?id=in.aayucare.app"),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      {error ? (
        <ErrorRecovery error={error} onRetry={() => setError(null)} />
      ) : loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => handleSmartBack(navigation, getSettingsBackFallback())}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={22} color={healthColors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Card padding={false}>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>
                    {notificationPermission.granted
                      ? "Enable all notifications"
                      : "OS permission is required to receive notifications"}
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{
                    false: healthColors.neutral.gray300,
                    true: healthColors.primary.light,
                  }}
                  thumbColor={
                    notificationsEnabled
                      ? healthColors.primary.main
                      : healthColors.neutral.white
                  }
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Appointment Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Get notified before appointments
                  </Text>
                </View>
                {renderSwitch(
                  appointmentReminders,
                  setAppointmentReminders,
                  "appointmentReminders"
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Medication Reminders</Text>
                  <Text style={styles.settingDescription}>
                    Reminders to take medications
                  </Text>
                </View>
                {renderSwitch(
                  medicationReminders,
                  setMedicationReminders,
                  "medicationReminders"
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Health Tips</Text>
                  <Text style={styles.settingDescription}>
                    Daily health tips and insights
                  </Text>
                </View>
                {renderSwitch(healthTips, setHealthTips, "healthTips")}
              </View>
            </Card>
          </View>

          {/* Account */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Card padding={false}>
              {accountSettings.map((item, index) => (
                <ListItem
                  key={index}
                  {...item}
                  showDivider={index < accountSettings.length - 1}
                />
              ))}
            </Card>
          </View>

          {/* Privacy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>
            <Card padding={false}>
              {privacySettings.map((item, index) => (
                <ListItem
                  key={index}
                  {...item}
                  showDivider={index < privacySettings.length - 1}
                />
              ))}
            </Card>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Card padding={false}>
              {aboutSettings.map((item, index) => (
                <ListItem
                  key={index}
                  {...item}
                  showDivider={index < aboutSettings.length - 1}
                />
              ))}
            </Card>
          </View>

          {/* App Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: healthColors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...textStyles.h3,
    color: healthColors.text.primary,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: healthColors.text.primary,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...textStyles.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    ...textStyles.bodySmall,
    color: healthColors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: healthColors.neutral.gray200,
    marginLeft: spacing.md,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...textStyles.bodySmall,
    color: healthColors.text.tertiary,
  },
  bottomSpacing: {
    height: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  loadingText: {
    ...textStyles.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: spacing.md,
  },
});

export default SettingsScreen;

