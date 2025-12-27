/**
 * AayuCare - FloatingActionButton Component
 *
 * Circular FAB with elevation and animations
 * Features: gradient support, press animation, icon support
 */

import React, { useRef } from "react";
import { TouchableOpacity, StyleSheet, Platform, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { healthColors } from "../../theme/healthColors";
import { spacing } from "../../theme/spacing";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const FloatingActionButton = ({
  onPress,
  icon = "add",
  iconSize = 28,
  iconColor = healthColors.neutral.white,
  size = "large", // small, medium, large
  gradient = true,
  backgroundColor = healthColors.primary.main,
  position = "bottom-right", // bottom-right, bottom-left, bottom-center
  style,
  disabled = false,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 16) + spacing.lg;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return { width: 48, height: 48 };
      case "medium":
        return { width: 56, height: 56 };
      default:
        return { width: 64, height: 64 };
    }
  };

  const getPositionStyle = () => {
    const baseStyle = {
      position: "absolute",
      bottom: bottomOffset,
    };

    switch (position) {
      case "bottom-left":
        return { ...baseStyle, left: spacing.lg };
      case "bottom-center":
        return { ...baseStyle, alignSelf: "center" };
      default:
        return { ...baseStyle, right: spacing.lg };
    }
  };

  const renderContent = () => (
    <Ionicons name={icon} size={iconSize} color={iconColor} />
  );

  if (gradient) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
        style={[
          styles.fab,
          getSizeStyle(),
          getPositionStyle(),
          animatedStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={healthColors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, getSizeStyle()]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
      style={[
        styles.fab,
        getSizeStyle(),
        getPositionStyle(),
        { backgroundColor },
        animatedStyle,
        disabled && styles.disabled,
        style,
      ]}
    >
      {renderContent()}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  fab: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  gradient: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});

export default FloatingActionButton;
