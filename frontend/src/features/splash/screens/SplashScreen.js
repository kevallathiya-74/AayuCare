/**
 * Splash Screen
 *
 * Small startup gate that waits for auth state and routes once.
 */

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { healthColors, textStyles, spacing, theme } from "@/theme";
import { useTranslation } from "react-i18next";

const SplashScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user, isLoading } = useAuth();
  const routed = useRef(false);
  const { height } = useWindowDimensions();

  const opacity = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseScale]);

  useEffect(() => {
    if (routed.current) return;
    if (isLoading) return;

    routed.current = true;

    if (!isAuthenticated) {
      navigation.replace("BoxSelection");
      return;
    }

    const role = user?.role;

    const navigateTo = (screen) => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        navigation.replace(screen);
      });
    };

    if (role === "admin") return navigateTo("AdminTabs");
    if (role === "doctor") return navigateTo("DoctorTabs");
    if (role === "patient") return navigateTo("PatientTabs");

    navigateTo("BoxSelection");
  }, [isAuthenticated, user?.id, user?.role, isLoading, navigation, opacity]);

  const logoSize = height < 600 ? 80 : 96;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <SafeAreaView
        style={styles.container}
        edges={["top", "left", "right", "bottom"]}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                borderRadius: (logoSize + spacing.md * 2) / 2,
                transform: [{ scale: pulseScale }],
              },
            ]}
          >
            <Image
              source={require("../../../../assets/icons/aayucare-logo.png")}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
              contentFit="contain"
              transition={300}
            />
          </Animated.View>
          <Text style={styles.title}>{t("aayucare")}</Text>
          <Text style={styles.subtitle}>
            {t("elevating_healthcare_together", "Elevating Healthcare Together")}
          </Text>
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
