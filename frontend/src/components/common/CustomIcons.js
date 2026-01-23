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
    gradientColors={["#6366F1", "#8B5CF6"]}
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
    gradientColors={["#10B981", "#059669"]}
    {...props}
  />
);

export const EmergencyIcon = (props) => (
  <IconWithBackground
    name="alert-circle"
    gradient
    gradientColors={["#EF4444", "#DC2626"]}
    {...props}
  />
);

export const HealthMetricsIcon = (props) => (
  <IconWithBackground
    name="pulse"
    gradient
    gradientColors={["#F59E0B", "#D97706"]}
    {...props}
  />
);

export const PharmacyIcon = (props) => (
  <IconWithBackground
    name="medical"
    gradient
    gradientColors={["#06B6D4", "#0891B2"]}
    {...props}
  />
);

export const WomensHealthIcon = (props) => (
  <IconWithBackground
    name="heart"
    gradient
    gradientColors={["#EC4899", "#DB2777"]}
    {...props}
  />
);

export const ActivityIcon = (props) => (
  <IconWithBackground
    name="walk"
    gradient
    gradientColors={["#8B5CF6", "#7C3AED"]}
    {...props}
  />
);

export const DiseaseLibraryIcon = (props) => (
  <IconWithBackground
    name="book"
    gradient
    gradientColors={["#3B82F6", "#2563EB"]}
    {...props}
  />
);

export const VoiceIcon = (props) => (
  <IconWithBackground
    name="mic"
    gradient
    gradientColors={["#14B8A6", "#0D9488"]}
    {...props}
  />
);

export const LanguageIcon = (props) => (
  <IconWithBackground
    name="language"
    gradient
    gradientColors={["#F97316", "#EA580C"]}
    {...props}
  />
);

export const EventsIcon = (props) => (
  <IconWithBackground
    name="megaphone"
    gradient
    gradientColors={["#A855F7", "#9333EA"]}
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
