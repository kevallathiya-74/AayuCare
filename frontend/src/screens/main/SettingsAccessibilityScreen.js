/**
 * Settings & Accessibility Screen (Screen 23)
 * App settings with language, voice, notifications, and privacy
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  Linking,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft, Languages, Mic, Bell, Eye, ShieldCheck, HelpCircle, Phone, Mail } from "lucide-react-native";
import { theme, healthColors } from "../../theme";
import {
  verticalScale,
  getScreenPadding,
} from "../../utils/responsive";
import { getItem, setItem } from "../../utils/appStorage";
import { logError } from "../../utils/errorHandler";
import { DynamicIcon } from "../../components/common";
import { handleSmartBack } from "../../utils/navigation";

const ACCESSIBILITY_SETTINGS_KEY = "aayucare_accessibility_settings";
const FONT_SIZE_KEY = "aayucare_font_size";

const SettingsAccessibilityScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [fontSize, setFontSize] = useState("Medium");

  const [settings, setSettings] = useState({
    voiceCommands: true,
    voiceNavigation: true,
    audioDescriptions: false,
    appointmentReminders: true,
    medicineReminders: true,
    healthAlerts: true,
    hospitalEvents: true,
    waterIntakeReminder: true,
    biometricLogin: false,
    highContrastMode: false,
    darkMode: false,
  });

  // Load persisted settings on mount
  useEffect(() => {
    (async () => {
      try {
        const [storedSettings, storedFontSize] = await Promise.all([
          getItem(ACCESSIBILITY_SETTINGS_KEY),
          getItem(FONT_SIZE_KEY),
        ]);
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
        if (storedFontSize) setFontSize(storedFontSize);
      } catch (err) {
        logError(err, "SettingsAccessibilityScreen.loadSettings");
      }
    })();
  }, []);

  const openURL = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else Alert.alert("Cannot Open", "Unable to open this link on your device.");
    } catch (err) {
      logError(err, "SettingsAccessibilityScreen.openURL");
    }
  };

  const handleFontSize = () => {
    Alert.alert(
      "Font Size",
      `Current size: ${fontSize}`,
      [
        {
          text: "Small",
          onPress: async () => {
            setFontSize("Small");
            await setItem(FONT_SIZE_KEY, "Small");
          },
        },
        {
          text: "Medium",
          onPress: async () => {
            setFontSize("Medium");
            await setItem(FONT_SIZE_KEY, "Medium");
          },
        },
        {
          text: "Large",
          onPress: async () => {
            setFontSize("Large");
            await setItem(FONT_SIZE_KEY, "Large");
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const toggleSetting = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await setItem(ACCESSIBILITY_SETTINGS_KEY, JSON.stringify(updated));
    } catch (err) {
      logError(err, `SettingsAccessibilityScreen.toggleSetting.${key}`);
      // Revert on error
      setSettings(settings);
    }
  };

  const SettingRow = ({ icon, label, value, onToggle, iconColor }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <DynamicIcon
          name={icon}
          size={20}
          color={iconColor || healthColors.text.secondary}
        />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{
          false: healthColors.border.light,
          true: healthColors.primary.main + "40",
        }}
        thumbColor={
          value ? healthColors.primary.main : healthColors.background.tertiary
        }
        ios_backgroundColor={healthColors.border.light}
      />
    </View>
  );

  const ActionRow = ({ icon, label, onPress, iconColor, showArrow = true }) => (
    <TouchableOpacity
      style={styles.actionRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <DynamicIcon
          name={icon}
          size={20}
          color={iconColor || healthColors.text.secondary}
        />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {showArrow && (
        <DynamicIcon
          name="chevron-forward"
          size={20}
          color={healthColors.text.disabled}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "Settings")}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>APP SETTINGS</Text>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Languages
              
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>LANGUAGE:</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.languageRow}>
              <Text style={styles.languageLabel}>Current: English</Text>
              <TouchableOpacity style={styles.changeButton}>
                <Text style={styles.changeButtonText}>Change</Text>
                <DynamicIcon
                  name="chevron-forward"
                  size={16}
                  color={healthColors.primary.main}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.languageOptions}>
              <TouchableOpacity style={styles.languageChip}>
                <Text style={styles.languageChipText}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.languageChip}>
                <Text style={styles.languageChipText}>हिंदी</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.languageChip}>
                <Text style={styles.languageChipText}>ગુજરાતી</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Voice Accessibility Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mic  size={20} color={healthColors.primary.main} />
            <Text style={styles.sectionTitle}>VOICE ACCESSIBILITY:</Text>
          </View>
          <View style={styles.card}>
            <SettingRow
              icon="mic-outline"
              label="Voice Commands"
              value={settings.voiceCommands}
              onToggle={() => toggleSetting("voiceCommands")}
            />
            <SettingRow
              icon="navigate-outline"
              label="Voice Navigation"
              value={settings.voiceNavigation}
              onToggle={() => toggleSetting("voiceNavigation")}
            />
            <SettingRow
              icon="volume-high-outline"
              label="Audio Descriptions"
              value={settings.audioDescriptions}
              onToggle={() => toggleSetting("audioDescriptions")}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell
              
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>NOTIFICATIONS:</Text>
          </View>
          <View style={styles.card}>
            <SettingRow
              icon="calendar-outline"
              label="Appointment Reminders"
              value={settings.appointmentReminders}
              onToggle={() => toggleSetting("appointmentReminders")}
              iconColor={healthColors.info.main}
            />
            <SettingRow
              icon="medkit-outline"
              label="Medicine Reminders"
              value={settings.medicineReminders}
              onToggle={() => toggleSetting("medicineReminders")}
              iconColor={healthColors.success.main}
            />
            <SettingRow
              icon="heart-outline"
              label="Health Alerts"
              value={settings.healthAlerts}
              onToggle={() => toggleSetting("healthAlerts")}
              iconColor={healthColors.error.main}
            />
            <SettingRow
              icon="megaphone-outline"
              label="Hospital Events"
              value={settings.hospitalEvents}
              onToggle={() => toggleSetting("hospitalEvents")}
              iconColor={healthColors.warning.main}
            />
            <SettingRow
              icon="water-outline"
              label="Water Intake Reminder"
              value={settings.waterIntakeReminder}
              onToggle={() => toggleSetting("waterIntakeReminder")}
              iconColor={healthColors.secondary.main}
            />
          </View>
        </View>

        {/* Display Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye  size={20} color={healthColors.primary.main} />
            <Text style={styles.sectionTitle}>DISPLAY:</Text>
          </View>
          <View style={styles.card}>
            <ActionRow
              icon="text-outline"
              label={`Font Size: ${fontSize}`}
              onPress={handleFontSize}
            />
            <SettingRow
              icon="contrast-outline"
              label="High Contrast Mode"
              value={settings.highContrastMode}
              onToggle={() => toggleSetting("highContrastMode")}
            />
            <SettingRow
              icon="moon-outline"
              label="Dark Mode"
              value={settings.darkMode}
              onToggle={() => toggleSetting("darkMode")}
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldCheck
              
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>PRIVACY:</Text>
          </View>
          <View style={styles.card}>
            <ActionRow
              icon="key-outline"
              label="Change Password"
              onPress={() => navigation.navigate("ChangePassword")}
            />
            <SettingRow
              icon="finger-print-outline"
              label="Biometric Login (Fingerprint)"
              value={settings.biometricLogin}
              onToggle={() => toggleSetting("biometricLogin")}
              iconColor={healthColors.success.main}
            />
            <ActionRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "AayuCare protects your health data with encryption in transit and at rest. We use your data only for care, appointments, and platform operations, and we never sell personal medical data. You can request account-data review through support@aayucare.com."
                )
              }
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle
              
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>HELP & SUPPORT:</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity style={styles.supportItem} activeOpacity={0.7} onPress={() => openURL("tel:18001234567")}>
              <Phone
                
                size={18}
                color={healthColors.primary.main}
              />
              <Text style={styles.supportText}>• Call: 1800-123-4567</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportItem} activeOpacity={0.7} onPress={() => openURL("mailto:support@aayucare.com")}>
              <Mail
                
                size={18}
                color={healthColors.primary.main}
              />
              <Text style={styles.supportText}>
                • Email: support@aayucare.com
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    ...theme.shadows.md,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  placeholder: {
    width: 32,
  },
  titleSection: {
    padding: getScreenPadding(),
    paddingBottom: 8,
  },
  title: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: verticalScale(20),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.md,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  languageLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: healthColors.primary.main + "10",
    borderRadius: 8,
  },
  changeButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
  languageOptions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  languageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: healthColors.background.secondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  languageChipText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  supportText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  bottomSpacer: {
    height: 80,
  },
});

export default SettingsAccessibilityScreen;



