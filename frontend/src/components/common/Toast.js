/**
 * AayuCare - Toast Component (Simplified for Expo Go)
 *
 * Animated toast notifications with auto-dismiss
 * Features: success, error, warning, info variants
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { healthColors } from "../../theme/healthColors";
import { textStyles } from "../../theme/typography";
import { spacing } from "../../theme/spacing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOAST_HEIGHT = 60;

const Toast = ({
  visible = false,
  message,
  type = "info", // success, error, warning, info
  duration = 3000,
  onDismiss,
  position = "top", // top, bottom
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(
    new Animated.Value(position === "top" ? -TOAST_HEIGHT : TOAST_HEIGHT)
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const positionValue =
    position === "top"
      ? Math.max(insets.top, 20) + 8
      : Math.max(insets.bottom, 20) + 8;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: position === "top" ? -TOAST_HEIGHT : TOAST_HEIGHT,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const getToastConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: healthColors.success.main,
          icon: "checkmark-circle",
          iconColor: healthColors.neutral.white,
        };
      case "error":
        return {
          backgroundColor: healthColors.error.main,
          icon: "close-circle",
          iconColor: healthColors.neutral.white,
        };
      case "warning":
        return {
          backgroundColor: healthColors.warning.main,
          icon: "warning",
          iconColor: healthColors.neutral.white,
        };
      default:
        return {
          backgroundColor: healthColors.info.main,
          icon: "information-circle",
          iconColor: healthColors.neutral.white,
        };
    }
  };

  const config = getToastConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          [position]: positionValue,
          transform: [{ translateY }],
          opacity,
          backgroundColor: config.backgroundColor,
        },
      ]}
    >
      <Ionicons
        name={config.icon}
        size={24}
        color={config.iconColor}
        style={styles.icon}
      />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    minHeight: TOAST_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: healthColors.borderRadius.medium,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  icon: {
    marginRight: spacing.sm,
  },
  message: {
    ...textStyles.body,
    color: healthColors.neutral.white,
    flex: 1,
  },
});

export default Toast;
