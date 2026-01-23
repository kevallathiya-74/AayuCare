/**
 * Premium Box Selection Screen
 * Vibrant, beautiful design with enhanced colors
 * Optimized for Indian users with proper typography system
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import { fontFamilies, fontWeights, lineHeights } from "../../theme/typography";
import { createTextShadow } from "../../utils/platformStyles";

if (!healthColors || !theme) {
  console.error("[BoxSelectionScreen] ═══════════════════════════════════");
  console.error("[BoxSelectionScreen] Missing theme imports!");
  console.error("[BoxSelectionScreen] healthColors:", !!healthColors);
  console.error("[BoxSelectionScreen] theme:", !!theme);
  console.error("[BoxSelectionScreen] ═══════════════════════════════════");
}

const { width, height } = Dimensions.get("window");

// Check if it's a small screen (height < 700)
const isSmallScreen = height < 700;
const isMediumScreen = height >= 700 && height < 850;

// Responsive font sizes for cross-device consistency
const responsiveFonts = {
  // Primary heading - "Continue as"
  title: isSmallScreen ? 24 : 28,
  titleLineHeight: (isSmallScreen ? 24 : 28) * lineHeights.tight,

  // Secondary text - description
  subtitle: isSmallScreen ? 13 : 15,
  subtitleLineHeight: (isSmallScreen ? 13 : 15) * lineHeights.normal,

  // Card title - "Hospital", "User"
  cardTitle: isSmallScreen ? 22 : 26,
  cardTitleLineHeight: (isSmallScreen ? 22 : 26) * lineHeights.tight,

  // Card subtitle - description
  cardSubtitle: isSmallScreen ? 12 : 14,
  cardSubtitleLineHeight: (isSmallScreen ? 12 : 14) * lineHeights.normal,

  // Badge text - "Coming Soon"
  badge: 10,
  badgeLineHeight: 10 * lineHeights.normal,

  // Footer text
  footer: isSmallScreen ? 11 : 13,
  footerLineHeight: (isSmallScreen ? 11 : 13) * lineHeights.normal,
};

// Responsive dimensions - scale based on screen size
const responsiveSizes = {
  logoContainer: isSmallScreen ? 90 : 110,
  logo: isSmallScreen ? 80 : 100,
  iconCircle: isSmallScreen ? 65 : 80,
  iconSize: isSmallScreen ? 32 : 40,
  arrowCircle: isSmallScreen ? 44 : 54,
  arrowSize: isSmallScreen ? 20 : 24,
  footerDot: 6,
};

const BoxSelectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleHospitalPress = () => {
    try {
      navigation.navigate("Login");
    } catch (error) {
      console.error("[BoxSelectionScreen] Navigation error:", error);
    }
  };

  const handleUserPress = () => {
    // Coming soon - User section not available yet
    alert(
      "[UNDER CONSTRUCTION] User Section Coming Soon!\n\nThis feature is currently under development. Please use the Hospital login for now."
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />

      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/images/aayucare-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
          Continue as
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          Choose your role to get started
        </Text>
      </View>

      {/* Selection Cards */}
      <View style={styles.cardsContainer}>
        {/* Hospital Card - Professional Teal + Navy */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleHospitalPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue as Hospital user"
        >
          <LinearGradient
            colors={healthColors.hospital.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Icon Circle */}
            <View style={styles.iconCircle}>
              <Ionicons
                name="business"
                size={responsiveSizes.iconSize}
                color="#FFFFFF"
              />
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Hospital</Text>
              <Text style={styles.cardSubtitle}>
                Admin, Doctor & Patient Access
              </Text>
            </View>

            {/* Arrow */}
            <View style={styles.arrowCircle}>
              <Ionicons
                name="arrow-forward"
                size={responsiveSizes.arrowSize}
                color="#FFFFFF"
              />
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Spacer between cards */}
        <View style={styles.cardSpacer} />

        {/* User Card - Sky Wellness Blue */}
        <TouchableOpacity
          style={[styles.card, styles.disabledCard]}
          onPress={handleUserPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="User section - Coming Soon"
        >
          <LinearGradient
            colors={healthColors.secondary.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Coming Soon Badge */}
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>

            {/* Icon Circle */}
            <View style={styles.iconCircle}>
              <Ionicons
                name="person"
                size={responsiveSizes.iconSize}
                color="#FFFFFF"
              />
            </View>

            {/* Card Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>User</Text>
              <Text style={styles.cardSubtitle}>General Health Services</Text>
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, theme.spacing.lg) },
        ]}
      >
        <View style={styles.footerDot} />
        <View style={styles.footerSpacer} />
        <Text style={styles.footerText}>Secure • Private • Trusted</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    paddingTop: isSmallScreen ? theme.spacing.lg : theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xxl,
    marginBottom: isSmallScreen ? theme.spacing.lg : theme.spacing.xl,
    alignItems: "center",
  },
  logoContainer: {
    width: responsiveSizes.logoContainer,
    height: responsiveSizes.logoContainer,
    borderRadius: responsiveSizes.logoContainer / 2,
    backgroundColor: healthColors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: isSmallScreen ? 16 : 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...theme.shadows.sm,
  },
  logo: {
    width: responsiveSizes.logo,
    height: responsiveSizes.logo,
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamilies.heading,
    fontSize: responsiveFonts.title,
    lineHeight: responsiveFonts.titleLineHeight,
    fontWeight: fontWeights.bold,
    color: "#2C3E50",
    marginBottom: 4,
    textAlign: "center",
    includeFontPadding: false, // Android fix for font alignment
  },
  subtitle: {
    fontFamily: fontFamilies.body,
    fontSize: responsiveFonts.subtitle,
    lineHeight: responsiveFonts.subtitleLineHeight,
    fontWeight: fontWeights.medium,
    color: "#7F8C8D",
    textAlign: "center",
    includeFontPadding: false,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    paddingBottom: isSmallScreen ? 16 : 24,
  },
  cardSpacer: {
    height: isSmallScreen ? 12 : 16,
  },
  card: {
    // Use flex proportions instead of fixed height for better responsiveness
    flexBasis: isSmallScreen ? "42%" : "48%",
    minHeight: 140, // Absolute minimum for small devices
    maxHeight: isSmallScreen ? 160 : 200, // Prevent excessive height
    borderRadius: 20,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  disabledCard: {
    opacity: 0.92,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    position: "relative",
  },
  iconCircle: {
    width: responsiveSizes.iconCircle,
    height: responsiveSizes.iconCircle,
    borderRadius: responsiveSizes.iconCircle / 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: responsiveFonts.cardTitle,
    lineHeight: responsiveFonts.cardTitleLineHeight,
    fontWeight: fontWeights.bold,
    color: healthColors.white,
    marginBottom: 2,
    includeFontPadding: false,
    ...createTextShadow({
      color: "rgba(0, 0, 0, 0.15)",
      offset: { width: 0, height: 2 },
      radius: 8,
    }),
  },
  cardSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: responsiveFonts.cardSubtitle,
    lineHeight: responsiveFonts.cardSubtitleLineHeight,
    fontWeight: fontWeights.medium,
    color: healthColors.white,
    opacity: 0.98,
    includeFontPadding: false,
    ...createTextShadow({
      color: "rgba(0, 0, 0, 0.1)",
      offset: { width: 0, height: 1 },
      radius: 4,
    }),
  },
  arrowCircle: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: responsiveSizes.arrowCircle,
    height: responsiveSizes.arrowCircle,
    borderRadius: responsiveSizes.arrowCircle / 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  comingSoonBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: healthColors.warning.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    ...theme.shadows.lg,
  },
  comingSoonText: {
    fontFamily: fontFamilies.body,
    fontSize: responsiveFonts.badge,
    lineHeight: responsiveFonts.badgeLineHeight,
    fontWeight: fontWeights.bold,
    color: healthColors.white,
    includeFontPadding: false,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  decorCircle1: {
    position: "absolute",
    top: -35,
    right: -35,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: -25,
    left: -25,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isSmallScreen ? 12 : 16,
  },
  footerSpacer: {
    width: 8,
  },
  footerDot: {
    width: responsiveSizes.footerDot,
    height: responsiveSizes.footerDot,
    borderRadius: responsiveSizes.footerDot / 2,
    backgroundColor: healthColors.success.main,
  },
  footerText: {
    fontFamily: fontFamilies.body,
    fontSize: responsiveFonts.footer,
    lineHeight: responsiveFonts.footerLineHeight,
    fontWeight: fontWeights.medium,
    color: "#95A5A6",
    includeFontPadding: false,
    letterSpacing: 0.3,
  },
});

export default BoxSelectionScreen;
