/**
 * Settings & Accessibility Screen (Screen 23)
 * App settings with language, voice, notifications, and privacy
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  verticalScale,
  getScreenPadding,
} from "../../utils/responsive";

const SettingsAccessibilityScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    voiceCommands: true,
    voiceNavigation: true,
    audioDescriptions: false,
    appointmentReminders: true,
    medicineReminders: true,
    healthAlerts: true,
    hospitalEvents: true,
    waterIntakeReminder: true,
    highContrastMode: false,
    darkMode: false,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const SettingRow = ({ icon, label, value, onToggle, iconColor }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons
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
        <Ionicons
          name={icon}
          size={20}
          color={iconColor || healthColors.text.secondary}
        />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {showArrow && (
        <Ionicons
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
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
            <Ionicons
              name="language"
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
                <Ionicons
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
            <Ionicons name="mic" size={20} color={healthColors.primary.main} />
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
            <Ionicons
              name="notifications"
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
            <Ionicons name="eye" size={20} color={healthColors.primary.main} />
            <Text style={styles.sectionTitle}>DISPLAY:</Text>
          </View>
          <View style={styles.card}>
            <ActionRow
              icon="text-outline"
              label="Font Size: Large"
              onPress={() => {}}
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
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>PRIVACY:</Text>
          </View>
          <View style={styles.card}>
            <ActionRow
              icon="key-outline"
              label="Change Password"
              onPress={() =>
                Alert.alert(
                  "Change Password",
                  "Password change feature coming soon!"
                )
              }
            />
            <ActionRow
              icon="finger-print-outline"
              label="Biometric Login (Fingerprint)"
              onPress={() =>
                Alert.alert(
                  "Biometric Login",
                  "Biometric authentication coming soon!"
                )
              }
            />
            <ActionRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() =>
                Alert.alert(
                  "Privacy Policy",
                  "Privacy policy viewer coming soon!"
                )
              }
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="help-circle"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.sectionTitle}>HELP & SUPPORT:</Text>
          </View>
          <View style={styles.card}>
            <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
              <Ionicons
                name="call"
                size={18}
                color={healthColors.primary.main}
              />
              <Text style={styles.supportText}>• Call: 1800-123-4567</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportItem} activeOpacity={0.7}>
              <Ionicons
                name="mail"
                size={18}
                color={healthColors.primary.main}
              />
              <Text style={styles.supportText}>
                • Email: support@aayucare.com
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 80 }} />
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
    fontSize: 18,
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
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 13,
    fontWeight: theme.typography.weights.semiBold,
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
    fontSize: 13,
    fontWeight: theme.typography.weights.semiBold,
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
    fontSize: 14,
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
    fontSize: 14,
    color: healthColors.text.primary,
  },
});

export default SettingsAccessibilityScreen;



