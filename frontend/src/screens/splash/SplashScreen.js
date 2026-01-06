/**
 * Animated Splash Screen
 * Hospital icon, app name, tagline, and loading animation
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Image } from "react-native";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { healthColors } from "../../theme/healthColors";
import { indianDesign } from "../../theme/indianDesign";
import { scaledFontSize, moderateScale } from "../../utils/responsive";

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);
  const insets = useSafeAreaInsets();

  const { isAuthenticated, isLoading, user } = useSelector(
    (state) => state.auth || {}
  );

  console.log("[SplashScreen] Rendering...");

  useEffect(() => {
    try {
      console.log("[SplashScreen] Starting animations...");

      // Animate logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate loading dots
      Animated.loop(
        Animated.timing(loadingAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      console.log("[SplashScreen] Animations started");
    } catch (error) {
      console.error("[SplashScreen] Animation error:", error);
    }
  }, []);

  // Handle navigation after auth check completes
  useEffect(() => {
    if (hasNavigated.current) return;

    // Wait for auth loading to complete
    if (isLoading) {
      console.log("[SplashScreen] Waiting for auth check...");
      return;
    }

    console.log("[SplashScreen] Auth check complete:", {
      isAuthenticated,
      user: user?.userId,
    });

    // Navigate based on auth status
    const timer = setTimeout(() => {
      if (hasNavigated.current) return;
      hasNavigated.current = true;

      try {
        if (isAuthenticated && user) {
          console.log(
            "[SplashScreen] User authenticated, navigating to role tabs"
          );
          // Navigate based on user role
          const userRole = user.role;
          if (userRole === "admin") {
            navigation.replace("AdminTabs");
          } else if (userRole === "doctor") {
            navigation.replace("DoctorTabs");
          } else if (userRole === "patient") {
            navigation.replace("PatientTabs");
          } else {
            console.warn("[SplashScreen] Unknown role:", userRole);
            navigation.replace("BoxSelection");
          }
        } else {
          console.log(
            "[SplashScreen] Not authenticated, navigating to BoxSelection"
          );
          navigation.replace("BoxSelection");
        }
      } catch (navError) {
        console.error("[SplashScreen] Navigation error:", navError);
      }
    }, 1500); // Reduced time since we already waited for auth

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  const dotTranslateY = loadingAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -10, 0, -10, 0],
  });

  return (
    <LinearGradient
      colors={[healthColors.primary.main, healthColors.primary.dark, "#1B5E20"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Image */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../../../assets/images/aayucare-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>AayuCare</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>Smart Healthcare</Text>
        <Text style={styles.tagline}>Management</Text>

        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          {[0, 1, 2, 3].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      translateY: loadingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, index % 2 === 0 ? -10 : 10],
                      }),
                    },
                  ],
                  opacity: loadingAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>

      {/* Footer */}
      <View
        style={[
          styles.footerContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Text style={styles.footer}>Your health, enhanced by intelligence</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: indianDesign.spacing.xl,
    padding: moderateScale(20),
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: indianDesign.spacing.xl,
  },
  appName: {
    fontSize: scaledFontSize(36),
    fontWeight: indianDesign.fontWeight.bold,
    color: "#FFF",
    marginBottom: indianDesign.spacing.md,
  },
  tagline: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.medium,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    marginTop: indianDesign.spacing.xl,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: healthColors.white,
    marginRight: indianDesign.spacing.sm,
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: moderateScale(24),
  },
  footer: {
    fontSize: scaledFontSize(12),
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
});

export default SplashScreen;
