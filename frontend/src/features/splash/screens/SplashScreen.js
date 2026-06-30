/**
 * Splash Screen
 *
 * Small startup gate that waits for auth state and routes once.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { healthColors, textStyles, spacing } from '@/theme';
import logger from '@/utils/logger';

const { width } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth || {});
  const routed = useRef(false);

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
  }, []);

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
      logger.debug("SplashScreen", "Not authenticated — navigate to BoxSelection");
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
      opacity.value = withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }, () => {
        runOnJS(navigation.replace)(screen);
      });
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
  }, [isAuthenticated, user?.id, user?.role, isLoading, navigation]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    flex: 1,
    backgroundColor: healthColors.background.primary,
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={animatedContainerStyle}>
      <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.content}>
          <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
            <Image
              source={require('../../../../assets/icons/aayucare-logo.png')}
              style={styles.logo}
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
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
    borderRadius: 60,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 96,
    height: 96,
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
