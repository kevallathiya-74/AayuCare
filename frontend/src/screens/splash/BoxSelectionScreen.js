/**
 * BoxSelectionScreen — Role selection screen
 * Preserved: all navigation handlers
 * Enhanced: improved heading hierarchy, premium branded gradient cards
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
import { Building2, ArrowRight, UserCircle2, ChevronRight, ShieldCheck } from "lucide-react-native";
import { theme, healthColors, textStyles, spacing } from "../../theme";
import { ModalSheet, Button } from "../../components/common";
import logger from "../../utils/logger";

const { height } = Dimensions.get("window");
const SMALL = height < 700;

const BoxSelectionScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [showUserModal, setShowUserModal] = React.useState(false);

  const handleHospitalPress = () => {
    try {
      navigation.navigate("Login");
    } catch (error) {
      logger.error("BoxSelectionScreen", "Navigation error", error);
    }
  };

  const handleUserPress = () => {
    setShowUserModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Image
            source={require("../../../assets/images/aayucare-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.brandTitle}>AayuCare</Text>
        <View style={styles.subtitleWrap}>
          <Text style={styles.subtitle}>Choose your role to get started</Text>
        </View>
      </View>

      {/* Cards Container */}
      <View style={styles.cardsContainer}>
        {/* Hospital Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={handleHospitalPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[healthColors.primary.main, healthColors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Background Decoration */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Building2 size={36} color={theme.colors.text.white} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardLabel}>CONTINUE AS</Text>
                <Text style={styles.cardTitle}>Hospital</Text>
                <Text style={styles.cardDescription}>
                  Admin, Doctor & Employee Access
                </Text>
              </View>
              <View style={styles.actionIcon}>
                <ChevronRight size={24} color={theme.withOpacity(theme.colors.text.white, 0.7)} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* User Card */}
        <TouchableOpacity
          style={styles.cardWrapper}
          onPress={handleUserPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[healthColors.secondary.main, healthColors.secondary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Decoration */}
            <View style={[styles.decorCircle1, { backgroundColor: theme.withOpacity(theme.colors.text.white, 0.05) }]} />
            
            <View style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2) }]}>
                <UserCircle2 size={36} color={theme.colors.text.white} />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardLabel}>CONTINUE AS</Text>
                <Text style={styles.cardTitle}>User</Text>
                <Text style={styles.cardDescription}>
                  Personal Health & Wellness
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>LIMITED ACCESS</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <View style={styles.trustBadge}>
          <ShieldCheck size={16} color={healthColors.success.main} />
          <Text style={styles.footerText}>Secure • Private • Trusted</Text>
        </View>
      </View>

      {/* User Section Modal */}
      <ModalSheet
        visible={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Coming Soon"
        maxHeight={0.4}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalBody}>
            The User section is currently under development. Please utilize the Hospital portal for doctor and admin functions.
          </Text>
          <Button 
            variant="primary" 
            title="Got it"
            onPress={() => setShowUserModal(false)}
            style={{ marginTop: 24 }}
          />
        </View>
      </ModalSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: healthColors.background.primary 
  },
  header: {
    paddingTop: height * (SMALL ? 0.05 : 0.08),
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: theme.colors.text.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...theme.shadows.sm,
  },
  logo: { 
    width: 64, 
    height: 64 
  },
  welcomeText: {
    ...textStyles.h4,
    color: healthColors.text.secondary,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  brandTitle: {
    ...textStyles.h1,
    color: healthColors.primary.main,
    marginTop: -4,
  },
  subtitleWrap: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: healthColors.primary.lightest,
    borderRadius: 20,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: healthColors.primary.main,
    fontWeight: "600",
  },
  cardsContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 20,
  },
  cardWrapper: {
    height: height * (SMALL ? 0.18 : 0.2),
    borderRadius: 24,
    ...theme.shadows.md,
    overflow: "hidden",
  },
  cardGradient: {
    flex: 1,
    padding: 24,
    position: "relative",
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.25),
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    ...textStyles.overline,
    color: theme.withOpacity(theme.colors.text.white, 0.7),
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.2,
  },
  cardTitle: {
    ...textStyles.h2,
    color: theme.colors.text.white,
    marginTop: 2,
  },
  cardDescription: {
    ...textStyles.bodySmall,
    color: theme.withOpacity(theme.colors.text.white, 0.85),
    marginTop: 4,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.2),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    ...textStyles.overline,
    color: theme.colors.text.white,
    fontWeight: theme.typography.weights.bold,
  },
  decorCircle1: {
    position: "absolute",
    top: -40,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.1),
  },
  decorCircle2: {
    position: "absolute",
    bottom: -30,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.05),
  },
  footer: {
    alignItems: "center",
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.text.white,
    borderRadius: 20,
    ...theme.shadows.xs,
  },
  footerText: { 
    ...textStyles.caption,
    color: healthColors.text.tertiary, 
    fontWeight: "600" 
  },
  modalContent: {
    paddingBottom: 8,
  },
  modalBody: {
    ...textStyles.bodyLarge,
    color: healthColors.text.secondary,
    lineHeight: 24,
    textAlign: "center",
  },
});

export default BoxSelectionScreen;
