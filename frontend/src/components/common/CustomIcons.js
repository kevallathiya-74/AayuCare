/**
 * Custom Icon Components
 * Beautiful, animated icons for AayuCare app features
 */

import React from "react";
import { View } from "react-native";
import { Sparkles } from "lucide-react-native";
import DynamicIcon from "./DynamicIcon";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "@/theme";

// Animated Icon with Background
const IconWithBackground = ({
  name,
  size = 24,
  color = healthColors.primary.main,
  backgroundColor = theme.withOpacity(healthColors.primary.main, 0.08),
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
        <Sparkles size={size} color={healthColors.neutral.white} />
      </LinearGradient>
    );
  }

  return (
    <View style={containerStyle}>
      <DynamicIcon name={name} size={size} color={color} />
    </View>
  );
};

// Feature Icons
export const AIIcon = (props) => (
  <IconWithBackground
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

export default {
    AIIcon,
  EmergencyIcon,
};
