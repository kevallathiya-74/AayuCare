/**
 * Language Selector Component
 * Allows users to switch between English, Hindi, and Gujarati
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Globe, CheckCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { theme, healthColors } from "@/theme";
import { changeLanguage } from "@/i18n";

const LANGUAGES = [
  { code: "en", label: "EN", fullName: "English" },
  { code: "hi", label: "हि", fullName: "हिन्दी" },
  { code: "gu", label: "ગુ", fullName: "ગુજરાતી" },
];

const LanguageSelector = ({
  style,
  iconColor = theme.colors.white,
  compact = false,
}) => {
  const { i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const currentLanguage = i18n.language || "en";

  const handleLanguageChange = async (languageCode) => {
    try {
      await changeLanguage(languageCode);
      setModalVisible(false);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  const currentLang =
    LANGUAGES.find((lang) => lang.code === currentLanguage) || LANGUAGES[0];

  if (compact) {
    // Compact mode: Just show current language, opens modal on press
    return (
      <>
        <TouchableOpacity
          style={[styles.compactButton, style]}
          onPress={() => setModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={`Current language: ${currentLang.fullName}. Tap to change language`}
        >
          <Globe size={theme.iconSizes.lg} color={iconColor} />
          <Text style={[styles.compactLabel, { color: iconColor }]}>
            {currentLang.label}
          </Text>
        </TouchableOpacity>

        <Modal
          statusBarTranslucent
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay} edges={["top", "bottom"]}>
            <Pressable
              style={styles.modalOverlayPressable}
              onPress={() => setModalVisible(false)}
            >
              <Pressable
                style={styles.modalContent}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Globe
                    size={theme.iconSizes.lg}
                    color={healthColors.primary.main}
                  />
                  <Text style={styles.modalTitle}>Select Language</Text>
                </View>

                {LANGUAGES.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      currentLanguage === language.code &&
                        styles.languageOptionActive,
                    ]}
                    onPress={() => handleLanguageChange(language.code)}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${language.fullName}`}
                  >
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageLabel}>{language.label}</Text>
                      <Text style={styles.languageName}>
                        {language.fullName}
                      </Text>
                    </View>
                    {currentLanguage === language.code && (
                      <CheckCircle
                        size={theme.iconSizes.lg}
                        color={healthColors.primary.main}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </Pressable>
            </Pressable>
          </SafeAreaView>
        </Modal>
      </>
    );
  }

  // Default mode: Inline language buttons
  return (
    <View style={[styles.container, style]}>
      <Globe size={theme.iconSizes.sm} color={iconColor} style={styles.icon} />
      {LANGUAGES.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageButton,
            currentLanguage === language.code && styles.languageButtonActive,
            { borderColor: theme.withOpacity(iconColor, 0.25) },
          ]}
          onPress={() => handleLanguageChange(language.code)}
          accessibilityRole="button"
          accessibilityLabel={`Select ${language.fullName}`}
        >
          <Text
            style={[
              styles.languageText,
              { color: iconColor },
              currentLanguage === language.code && styles.languageTextActive,
            ]}
          >
            {language.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginRight: 4,
  },
  languageButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xs,
    borderWidth: 1,
    minWidth: 40,
    alignItems: "center",
  },
  languageButtonActive: {
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.25),
    borderWidth: 1.5,
  },
  languageText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: "600",
  },
  languageTextActive: {
    fontWeight: "700",
  },
  compactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.modal,
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.2),
  },
  compactLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
  },
  modalOverlayPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    width: "85%",
    maxWidth: 340,
    ...theme.shadows.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: "700",
    color: healthColors.text.primary,
    flex: 1,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.input,
    marginBottom: theme.spacing.sm,
  },
  languageOptionActive: {
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.1),
    borderWidth: 1,
    borderColor: theme.withOpacity(healthColors.primary.main, 0.3),
  },
  languageInfo: {
    flex: 1,
  },
  languageLabel: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  languageName: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
});

export default LanguageSelector;
