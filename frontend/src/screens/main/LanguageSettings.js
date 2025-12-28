/**
 * Language Settings Screen
 * Allow users to switch between English, Hindi, and Gujarati
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import {
  getScreenPadding,
  scaledFontSize,
  moderateScale,
  verticalScale,
} from "../../utils/responsive";
import {
  changeLanguage,
  getAvailableLanguages,
  getCurrentLanguage,
} from "../../i18n";

const LanguageSettings = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [changing, setChanging] = useState(false);
  const insets = useSafeAreaInsets();

  const languages = getAvailableLanguages();

  useEffect(() => {
    setSelectedLanguage(getCurrentLanguage());
  }, []);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === selectedLanguage) return;

    setChanging(true);
    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        setSelectedLanguage(languageCode);
        Alert.alert(
          "Language Changed",
          `Language has been changed to ${languages.find((l) => l.code === languageCode)?.nativeName}`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Failed to change language. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while changing language.");
    } finally {
      setChanging(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "left", "right"]}
    >
      {/* Header */}
      <LinearGradient
        colors={[healthColors.primary.main, healthColors.primary.dark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="language" size={32} color="#FFF" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Language Settings</Text>
            <Text style={styles.headerSubtitle}>
              Choose your preferred language
            </Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        <Text style={styles.sectionTitle}>Available Languages</Text>

        {languages.map((language) => (
          <TouchableOpacity
            key={language.code}
            style={[
              styles.languageCard,
              selectedLanguage === language.code && styles.languageCardSelected,
            ]}
            onPress={() => handleLanguageChange(language.code)}
            disabled={changing}
          >
            <View style={styles.languageInfo}>
              <Text style={styles.languageName}>{language.name}</Text>
              <Text style={styles.languageNative}>{language.nativeName}</Text>
            </View>
            {selectedLanguage === language.code && (
              <View style={styles.checkmark}>
                <Ionicons
                  name="checkmark-circle"
                  size={28}
                  color={healthColors.primary.main}
                />
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle"
            size={24}
            color={healthColors.primary.main}
          />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>About Language Support</Text>
            <Text style={styles.infoDescription}>
              AayuCare supports multiple languages to make healthcare accessible
              to everyone. Your language preference will be saved and applied
              across the entire app.
            </Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          <Text style={styles.featuresTitle}>What gets translated:</Text>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>
              All screen titles and buttons
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>Navigation labels</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>Form labels and placeholders</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>
              Error messages and notifications
            </Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>
              AI insights and recommendations
            </Text>
          </View>
        </View>
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
    padding: getScreenPadding(),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(30),
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: indianDesign.spacing.md,
    flex: 1,
    marginLeft: indianDesign.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: indianDesign.fontWeight.bold,
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: scaledFontSize(13),
    color: "rgba(255, 255, 255, 0.9)",
  },
  content: {
    padding: getScreenPadding(),
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
    marginBottom: indianDesign.spacing.md,
  },
  languageCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: healthColors.background.card,
    padding: indianDesign.spacing.lg,
    borderRadius: 12,
    marginBottom: indianDesign.spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
    ...createShadow(2),
  },
  languageCardSelected: {
    borderColor: healthColors.primary.main,
    backgroundColor: healthColors.primary.main + "08",
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  languageNative: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
  },
  checkmark: {
    marginLeft: indianDesign.spacing.md,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: healthColors.primary.main + "10",
    padding: indianDesign.spacing.lg,
    borderRadius: 12,
    marginTop: indianDesign.spacing.xl,
    marginBottom: indianDesign.spacing.lg,
    gap: indianDesign.spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
    lineHeight: 18,
  },
  featuresList: {
    backgroundColor: healthColors.background.card,
    padding: indianDesign.spacing.lg,
    borderRadius: 12,
    ...createShadow(1),
  },
  featuresTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
    marginBottom: indianDesign.spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: indianDesign.spacing.sm,
    marginBottom: indianDesign.spacing.sm,
  },
  featureText: {
    flex: 1,
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
  },
});

export default LanguageSettings;
