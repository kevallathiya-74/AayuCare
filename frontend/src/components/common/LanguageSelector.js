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
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { theme, healthColors } from "../../theme";
import { changeLanguage } from "../../i18n";

const LANGUAGES = [
  { code: "en", label: "EN", fullName: "English" },
  { code: "hi", label: "हि", fullName: "हिन्दी" },
  { code: "gu", label: "ગુ", fullName: "ગુજરાતી" },
];

const LanguageSelector = ({
  style,
  iconColor = "#FFFFFF",
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
          <Ionicons name="globe-outline" size={20} color={iconColor} />
          <Text style={[styles.compactLabel, { color: iconColor }]}>
            {currentLang.label}
          </Text>
        </TouchableOpacity>

        <Modal
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
                  <Ionicons
                    name="globe"
                    size={24}
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
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
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
      <Ionicons
        name="globe-outline"
        size={16}
        color={iconColor}
        style={styles.icon}
      />
      {LANGUAGES.map((language) => (
        <TouchableOpacity
          key={language.code}
          style={[
            styles.languageButton,
            currentLanguage === language.code && styles.languageButtonActive,
            { borderColor: iconColor + "40" },
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 38,
    alignItems: "center",
  },
  languageButtonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1.5,
  },
  languageText: {
    fontSize: 12,
    fontWeight: "600",
  },
  languageTextActive: {
    fontWeight: "700",
  },
  compactButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  compactLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlayPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: 20,
    width: "85%",
    maxWidth: 340,
    ...theme.shadows.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: healthColors.text.primary,
    flex: 1,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  languageOptionActive: {
    backgroundColor: healthColors.primary.main + "10",
    borderWidth: 1,
    borderColor: healthColors.primary.main + "30",
  },
  languageInfo: {
    flex: 1,
  },
  languageLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: 2,
  },
  languageName: {
    fontSize: 14,
    color: healthColors.text.secondary,
  },
});

export default LanguageSelector;



