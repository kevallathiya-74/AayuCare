/**
 * BoxSelectionScreen — Role selection screen
 * Preserved: all navigation handlers
 * Enhanced: simplified responsive code, cleaner card design
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
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import logger from "../../utils/logger";

const { height } = Dimensions.get("window");
const SMALL = height < 700;

const BoxSelectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleHospitalPress = () => {
    try {
      navigation.navigate("Login");
    } catch (error) {
      logger.error("BoxSelectionScreen", "Navigation error", error);
    }
  };

  const handleUserPress = () => {
    Alert.alert(
      "Coming Soon",
      "The User (General Health) section is currently under development. Please use Hospital login for now.",
      [{ text: "OK", style: "default" }]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Image
            source={require("../../../assets/images/aayucare-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Continue as</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {/* Hospital Card */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleHospitalPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue as Hospital user"
        >
          <LinearGradient
            colors={healthColors.hospital?.gradient || [healthColors.primary.main, healthColors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Decoration */}
            <View style={styles.decor1} />
            <View style={styles.decor2} />

            <View style={styles.iconCircle}>
              <Ionicons name="business" size={SMALL ? 30 : 38} color="#fff" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Hospital</Text>
              <Text style={styles.cardSub}>Admin, Doctor & Patient Access</Text>
            </View>
            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={SMALL ? 18 : 22} color="#fff" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.spacer} />

        {/* User Card */}
        <TouchableOpacity
          style={[styles.card, styles.disabledCard]}
          onPress={handleUserPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="User section — Coming Soon"
        >
          <LinearGradient
            colors={healthColors.secondary?.gradient || [healthColors.secondary.main, healthColors.secondary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Coming soon badge */}
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>COMING SOON</Text>
            </View>

            {/* Decoration */}
            <View style={styles.decor1} />
            <View style={styles.decor2} />

            <View style={styles.iconCircle}>
              <Ionicons name="person" size={SMALL ? 30 : 38} color="#fff" />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>User</Text>
              <Text style={styles.cardSub}>General Health Services</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 8, 20) }]}>
        <View style={styles.footerDot} />
        <Text style={styles.footerText}>  Secure • Private • Trusted</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: healthColors.background.primary },

  header: {
    paddingTop: SMALL ? 16 : 28,
    paddingHorizontal: 28,
    marginBottom: SMALL ? 16 : 24,
    alignItems: "center",
  },
  logoWrap: {
    width: SMALL ? 88 : 104,
    height: SMALL ? 88 : 104,
    borderRadius: SMALL ? 44 : 52,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SMALL ? 14 : 18,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.sm,
  },
  logo: { width: SMALL ? 72 : 88, height: SMALL ? 72 : 88 },
  title: {
    fontSize: SMALL ? 24 : 28,
    fontWeight: "800",
    color: healthColors.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: SMALL ? 13 : 15,
    color: healthColors.text.secondary,
    textAlign: "center",
    fontWeight: "500",
  },

  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    paddingBottom: SMALL ? 12 : 20,
  },
  spacer: { height: SMALL ? 12 : 16 },

  card: {
    flexBasis: SMALL ? "42%" : "47%",
    minHeight: 140,
    maxHeight: SMALL ? 160 : 195,
    borderRadius: 20,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  disabledCard: { opacity: 0.92 },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    position: "relative",
  },

  iconCircle: {
    width: SMALL ? 62 : 76,
    height: SMALL ? 62 : 76,
    borderRadius: SMALL ? 31 : 38,
    backgroundColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.38)",
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: SMALL ? 22 : 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: SMALL ? 12 : 13,
    color: "rgba(255,255,255,0.88)",
    fontWeight: "500",
  },
  arrowCircle: {
    position: "absolute",
    bottom: 18, right: 18,
    width: SMALL ? 42 : 52,
    height: SMALL ? 42 : 52,
    borderRadius: SMALL ? 21 : 26,
    backgroundColor: "rgba(255,255,255,0.28)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.38)",
  },

  comingSoonBadge: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: healthColors.warning.main,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 14, zIndex: 1,
  },
  comingSoonText: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },

  decor1: {
    position: "absolute", top: -32, right: -32,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  decor2: {
    position: "absolute", bottom: -22, left: -22,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  footer: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingTop: 12,
  },
  footerDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: healthColors.success.main,
  },
  footerText: { fontSize: 13, color: healthColors.text.tertiary, fontWeight: "500" },
});

export default BoxSelectionScreen;
