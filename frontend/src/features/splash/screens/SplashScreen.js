/**
 * Splash Screen
 *
 * Small startup gate that waits for auth state and routes once.
 */

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { healthColors, textStyles, spacing } from '@/theme';
import logger from '@/utils/logger';

const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth || {});
  const routed = useRef(false);

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

    if (role === "admin") {
      navigation.replace("AdminTabs");
      return;
    }

    if (role === "doctor") {
      navigation.replace("DoctorTabs");
      return;
    }

    if (role === "patient") {
      navigation.replace("PatientTabs");
      return;
    }

    navigation.replace("BoxSelection");
  }, [isAuthenticated, user?.id, user?.role, isLoading, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.content}>
        <Image
          source={require('../../../../assets/icons/aayucare-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>AayuCare</Text>
        <Text style={styles.subtitle}>Preparing your experience...</Text>
        <ActivityIndicator size="large" color={healthColors.primary.main} style={styles.loader} />
      </View>
    </SafeAreaView>
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
  logo: {
    width: 84,
    height: 84,
    marginBottom: spacing.md,
  },
  title: {
    ...textStyles.h2,
    color: healthColors.primary.main,
  },
  subtitle: {
    ...textStyles.bodyMedium,
    color: healthColors.text.secondary,
    marginTop: spacing.xs,
  },
  loader: {
    marginTop: spacing.lg,
  },
});

export default SplashScreen;
