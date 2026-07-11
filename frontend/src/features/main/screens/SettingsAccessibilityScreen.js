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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft, Eye, ShieldCheck } from "lucide-react-native";
import { theme, healthColors } from "@/theme";
import { verticalScale, getScreenPadding } from "@/utils/responsive";
import { getItem, setItem } from "@/utils/appStorage";
import { logError } from "@/utils/errorHandler";
import { DynamicIcon } from "@/components/common";

import { handleSmartBack } from "@/utils/navigation";
import Routes from "@/navigation/routes";

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

  const handleFontSize = () => {
    Alert.alert("Font Size", `Current size: ${fontSize}`, [
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
    ]);
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
          true: theme.withOpacity(healthColors.primary.main, 0.25),
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
      accessibilityRole="button"
      accessibilityLabel={label}
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
        {/* Display Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color={healthColors.primary.main} />
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
            <ShieldCheck size={20} color={healthColors.primary.main} />
            <Text style={styles.sectionTitle}>PRIVACY:</Text>
          </View>
          <View style={styles.card}>
            <ActionRow
              icon="key-outline"
              label="Change Password"
              onPress={() => navigation.navigate(Routes.SHARED.CHANGE_PASSWORD)}
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
                  "AayuCare protects your health data with encryption in transit and at rest. We use your data only for care, appointments, and platform operations, and we never sell personal medical data. You can request account-data review through support@aayucare.com.",
                )
              }
            />
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

  bottomSpacer: {
    height: 80,
  },
});

export default SettingsAccessibilityScreen;
