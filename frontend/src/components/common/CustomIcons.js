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

export const EmergencyIcon = (props) => (
  <IconWithBackground
    name="alert-circle"
    gradient
    gradientColors={[healthColors.error.dark, healthColors.error.dark]}
    {...props}
  />
);

export const PrescriptionIcon = (props) => (
  <IconWithBackground
    name="document-text"
    gradient
    gradientColors={[healthColors.secondary.main, healthColors.secondary.dark]}
    {...props}
  />
);

export const AppointmentIcon = (props) => (
  <IconWithBackground
    name="calendar"
    gradient
    gradientColors={[healthColors.primary.main, healthColors.primary.dark]}
    {...props}
  />
);

export const HealthMetricsIcon = (props) => (
  <IconWithBackground
    name="fitness"
    gradient
    gradientColors={[healthColors.health.heartRate, healthColors.error.main]}
    {...props}
  />
);

export const PharmacyIcon = (props) => (
  <IconWithBackground
    name="medkit"
    gradient
    gradientColors={[healthColors.success.main, healthColors.success.dark]}
    {...props}
  />
);

export const WomensHealthIcon = (props) => (
  <IconWithBackground
    name="heart"
    gradient
    gradientColors={[healthColors.hospital.pink, healthColors.error.main]}
    {...props}
  />
);

export const ActivityIcon = (props) => (
  <IconWithBackground
    name="walk"
    gradient
    gradientColors={[healthColors.health.steps, healthColors.secondary.main]}
    {...props}
  />
);

export const DiseaseLibraryIcon = (props) => (
  <IconWithBackground
    name="book"
    gradient
    gradientColors={[healthColors.info.main, healthColors.primary.main]}
    {...props}
  />
);

export const VoiceIcon = (props) => (
  <IconWithBackground
    name="mic"
    gradient
    gradientColors={[healthColors.secondary.main, healthColors.secondary.dark]}
    {...props}
  />
);

export const LanguageIcon = (props) => (
  <IconWithBackground
    name="language"
    gradient
    gradientColors={[healthColors.primary.main, healthColors.info.main]}
    {...props}
  />
);

export const EventsIcon = (props) => (
  <IconWithBackground
    name="calendar-outline"
    gradient
    gradientColors={[healthColors.hospital.teal, healthColors.info.main]}
    {...props}
  />
);

export const BadgeIcon = (props) => (
  <IconWithBackground
    name="ribbon"
    gradient
    gradientColors={[healthColors.warning.main, healthColors.warning.dark]}
    {...props}
  />
);

export default {
  IconWithBackground,
  AIIcon,
  EmergencyIcon,
  PrescriptionIcon,
  AppointmentIcon,
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
