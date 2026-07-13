/**
 * Splash Screen
 *
 * Small startup gate that waits for auth state and routes once.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { healthColors, textStyles, spacing, theme } from "@/theme";
import logger from "@/utils/logger";

const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth || {}
  );
  const routed = useRef(false);
  const { height } = useWindowDimensions();

  // Reanimated shared values
  const opacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Start pulsing animation on mount
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // Infinite repeat
      true
    );
  }, [pulseScale]);

  logger.debug("SplashScreen", "Rendering");

  useEffect(() => {
    if (routed.current) {
      return;
    }

    if (isLoading) {
      logger.debug("SplashScreen", "Auth still loading");
      return;
    }

    routed.current = true;

    if (!isAuthenticated) {
      logger.debug(
        "SplashScreen",
        "Not authenticated — navigate to BoxSelection"
      );
      navigation.replace("BoxSelection");
      return;
    }

    const role = user?.role;
    logger.debug("SplashScreen", "Auth check complete", {
      isAuthenticated,
      user: user?.id,
      role,
    });

    const navigateTo = (screen) => {
      // Fade out animation before navigating
      opacity.value = withTiming(
        0,
        { duration: 400, easing: Easing.inOut(Easing.ease) },
        () => {
          runOnJS(navigation.replace)(screen);
        }
      );
    };

    if (role === "admin") {
      navigateTo("AdminTabs");
      return;
    }

    if (role === "doctor") {
      navigateTo("DoctorTabs");
      return;
    }

    if (role === "patient") {
      navigateTo("PatientTabs");
      return;
    }

    navigateTo("BoxSelection");
  }, [isAuthenticated, user?.id, user?.role, isLoading, navigation, opacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    flex: 1,
    backgroundColor: healthColors.background.primary,
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Dynamic logo size based on screen height
  const logoSize = height < 600 ? 80 : 96;

  return (
    <Animated.View style={animatedContainerStyle}>
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              animatedLogoStyle,
              { borderRadius: (logoSize + spacing.md * 2) / 2 },
            ]}
          >
            <Image
              source={require("../../../../assets/icons/aayucare-logo.png")}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
              contentFit="contain"
              transition={300}
            />
          </Animated.View>
          <Text style={styles.title}>AayuCare</Text>
          <Text style={styles.subtitle}>Elevating Healthcare Together</Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    padding: spacing.md,
    backgroundColor: healthColors.primary.surface,
    marginBottom: spacing.lg,
    ...theme.shadows.sm,
  },
  logo: {
    // Dynamic sizing applied in inline styles
  },
  title: {
    ...textStyles.h1,
    color: healthColors.primary.main,
    letterSpacing: 0.5,
  },
  subtitle: {
    ...textStyles.bodyLarge,
    color: healthColors.text.secondary,
    marginTop: spacing.sm,
    letterSpacing: 0.25,
  },
});

export default SplashScreen;
