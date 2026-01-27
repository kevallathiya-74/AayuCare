/**
 * Custom Icon Components
 * Beautiful, animated icons for AayuCare app features
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../theme";

// Animated Icon with Background
export const IconWithBackground = ({
  name,
  size = 24,
  color = healthColors.primary.main,
  backgroundColor = healthColors.primary.main + "15",
  borderRadius = 12,
  padding = 12,
  gradient = false,
  gradientColors = [healthColors.primary.main, healthColors.primary.dark],
  shadow = true,
}) => {
  const containerStyle = {
    backgroundColor: gradient ? "transparent" : backgroundColor,
    borderRadius,
    padding,
    justifyContent: "center",
    alignItems: "center",
    ...(shadow ? theme.shadows.sm : {}),
  };

  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors}
        style={containerStyle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={name} size={size} color={healthColors.neutral.white} />
      </LinearGradient>
    );
  }

  return (
    <View style={containerStyle}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
};

// Feature Icons
export const AIIcon = (props) => (
  <IconWithBackground
    name="sparkles"
    gradient
    gradientColors={[healthColors.info.main, healthColors.secondary.main]}
    {...props}
  />
);

export const PrescriptionIcon = (props) => (
  <IconWithBackground
    name="document-text"
    gradient
    gradientColors={[healthColors.primary.main, healthColors.primary.dark]}
    {...props}
  />
);

export const AppointmentIcon = (props) => (
  <IconWithBackground
    name="calendar"
    gradient
    gradientColors={[healthColors.success.main, healthColors.success.dark]}
    {...props}
  />
);

export const EmergencyIcon = (props) => (
  <IconWithBackground
    name="alert-circle"
    gradient
    gradientColors={[healthColors.error.dark, healthColors.error.dark]}
    {...props}
  />
);

export const HealthMetricsIcon = (props) => (
  <IconWithBackground
    name="pulse"
    gradient
    gradientColors={[healthColors.warning.main, healthColors.warning.dark]}
    {...props}
  />
);

export const PharmacyIcon = (props) => (
  <IconWithBackground
    name="medical"
    gradient
    gradientColors={[healthColors.fitness.aqua, healthColors.primary.main]}
    {...props}
  />
);

export const WomensHealthIcon = (props) => (
  <IconWithBackground
    name="heart"
    gradient
    gradientColors={[healthColors.error.main, healthColors.error.dark]}
    {...props}
  />
);

export const ActivityIcon = (props) => (
  <IconWithBackground
    name="walk"
    gradient
    gradientColors={[healthColors.secondary.main, healthColors.secondary.dark]}
    {...props}
  />
);

export const DiseaseLibraryIcon = (props) => (
  <IconWithBackground
    name="book"
    gradient
    gradientColors={[healthColors.info.main, healthColors.info.dark]}
    {...props}
  />
);

export const VoiceIcon = (props) => (
  <IconWithBackground
    name="mic"
    gradient
    gradientColors={[healthColors.fitness.aqua, healthColors.primary.dark]}
    {...props}
  />
);

export const LanguageIcon = (props) => (
  <IconWithBackground
    name="language"
    gradient
    gradientColors={[healthColors.warning.main, healthColors.warning.dark]}
    {...props}
  />
);

export const EventsIcon = (props) => (
  <IconWithBackground
    name="megaphone"
    gradient
    gradientColors={[healthColors.womens.lavender, healthColors.secondary.dark]}
    {...props}
  />
);

// Badge with Icon
export const BadgeIcon = ({
  count,
  icon = "notifications",
  size = 20,
  badgeColor = healthColors.semantic.error,
}) => {
  return (
    <View style={styles.badgeContainer}>
      <Ionicons name={icon} size={size} color={healthColors.text.primary} />
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: healthColors.neutral.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: healthColors.neutral.white,
  },
});

export default {
  IconWithBackground,
  AIIcon,
  PrescriptionIcon,
  AppointmentIcon,
  EmergencyIcon,
  HealthMetricsIcon,
  PharmacyIcon,
  WomensHealthIcon,
  ActivityIcon,
  DiseaseLibraryIcon,
  VoiceIcon,
  LanguageIcon,
  EventsIcon,
  BadgeIcon,
};
