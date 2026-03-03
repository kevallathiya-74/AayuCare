/**
 * SplashScreen — animated brand intro with auth-based navigation
 * Preserved: all auth logic, navigation, animations
 * Enhanced: pulsating ring, staggered wave dots, cleaner layout
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Image } from "react-native";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, healthColors } from "../../theme";
import logger from "../../utils/logger";

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasNavigated = useRef(false);
  const insets = useSafeAreaInsets();

  // 4 dot bounce animations with staggered phase
  const dotAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth || {});

  logger.debug("SplashScreen", "Rendering");

  useEffect(() => {
    try {
      logger.debug("SplashScreen", "Starting animations");

      // Logo entrance
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 45, useNativeDriver: true }),
      ]).start();

      // Pulsating ring around logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // Staggered wave dots
      dotAnims.forEach((anim, i) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(i * 160),
            Animated.timing(anim, { toValue: -12, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 350, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.delay((3 - i) * 160 + 200),
          ])
        ).start();
      });

      logger.debug("SplashScreen", "Animations started");
    } catch (error) {
      logger.error("SplashScreen", "Animation error", error);
    }
  }, []);

  // Navigation after auth check
  useEffect(() => {
    if (hasNavigated.current) {
      logger.debug("SplashScreen", "Already navigated, skipping");
      return;
    }

    if (isLoading) {
      logger.debug("SplashScreen", "Auth still loading");
      return;
    }

    logger.debug("SplashScreen", "Auth check complete", { isAuthenticated, user: user?.id });

    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      if (!navigation) { logger.error("SplashScreen", "Navigation prop missing"); return; }

      if (isAuthenticated && user) {
        logger.debug("SplashScreen", "Authenticated user role", user.role);
        switch (user.role) {
          case "admin":    navigation.replace("AdminTabs"); break;
          case "doctor":   navigation.replace("DoctorTabs"); break;
          case "patient":  navigation.replace("PatientTabs"); break;
          default:
            logger.warn("SplashScreen", "Unknown role", user.role);
            navigation.replace("BoxSelection");
        }
      } else {
        logger.debug("SplashScreen", "Not authenticated — navigate to BoxSelection");
        navigation.replace("BoxSelection");
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user, navigation]);

  return (
    <LinearGradient
      colors={[healthColors.primary.main, healthColors.primary.dark, "#1A237E"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Background decoration circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Pulsating ring + logo */}
        <View style={styles.logoOuter}>
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/images/aayucare-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <Text style={styles.appName}>AayuCare</Text>
        <Text style={styles.tagline}>Smart Healthcare Management</Text>

        {/* Wave loading dots */}
        <View style={styles.dotsRow}>
          {dotAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { transform: [{ translateY: anim }] }]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.footerText}>Your health, enhanced by intelligence</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  bgCircle1: {
    position: "absolute", width: 320, height: 320, borderRadius: 160,
    backgroundColor: "rgba(255,255,255,0.05)", top: -60, right: -80,
  },
  bgCircle2: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: 80, left: -60,
  },
  content: { alignItems: "center", gap: 8 },

  logoOuter: { alignItems: "center", justifyContent: "center", marginBottom: 16 },
  pulseRing: {
    position: "absolute",
    width: 168, height: 168, borderRadius: 84,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.35)",
  },
  logoContainer: {
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center", alignItems: "center",
    padding: 16,
  },
  logo: { width: "100%", height: "100%" },

  appName: {
    fontSize: 38, fontWeight: "800", color: "#fff",
    letterSpacing: 1.5, marginTop: 8,
  },
  tagline: { fontSize: 15, color: "rgba(255,255,255,0.8)", fontWeight: "500" },

  dotsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 32 },
  dot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: "rgba(255,255,255,0.9)" },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, alignItems: "center", paddingHorizontal: 32 },
  footerText: { fontSize: 13, color: "rgba(255,255,255,0.65)", textAlign: "center" },
});

export default SplashScreen;
