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
import { healthColors } from "../../theme/healthColors";
import { createShadow } from "../../theme/indianDesign";
import {
  moderateScale,
  verticalScale,
  scaledFontSize,
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
    paddingVertical: moderateScale(12),
    backgroundColor: healthColors.background.card,
    ...createShadow(2),
  },
  backButton: {
    padding: moderateScale(4),
  },
  headerTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "700",
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: moderateScale(12),
  },
  placeholder: {
    width: moderateScale(32),
  },
  titleSection: {
    padding: getScreenPadding(),
    paddingBottom: moderateScale(8),
  },
  title: {
    fontSize: scaledFontSize(16),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  section: {
    paddingHorizontal: getScreenPadding(),
    marginBottom: verticalScale(20),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  sectionTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: "700",
    color: healthColors.text.primary,
  },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    ...createShadow(2),
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  languageLabel: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    backgroundColor: healthColors.primary.main + "10",
    borderRadius: moderateScale(8),
  },
  changeButtonText: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.primary.main,
  },
  languageOptions: {
    flexDirection: "row",
    gap: moderateScale(8),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  languageChip: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    backgroundColor: healthColors.background.secondary,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  languageChipText: {
    fontSize: scaledFontSize(13),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    flex: 1,
  },
  settingLabel: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingVertical: moderateScale(10),
  },
  supportText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
  },
});

export default SettingsAccessibilityScreen;
