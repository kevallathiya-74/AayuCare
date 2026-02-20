import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import Button from "./Button";

const EmptyState = ({
  icon = "file-tray-outline",
  title = "No data available",
  message = "There is nothing to display at the moment.",
  actionLabel,
  onActionPress,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        delay: 80,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }, style]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={theme.iconSizes.lg} color={healthColors.text.tertiary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {actionLabel && onActionPress ? (
        <Button onPress={onActionPress} variant="primary" style={styles.button}>
          {actionLabel}
        </Button>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    width: theme.spacing.xxxl,
    height: theme.spacing.xxxl,
    borderRadius: theme.spacing.xxxl,
    backgroundColor: healthColors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm + theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sizes.h6,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    textAlign: "center",
    marginBottom: theme.spacing.xs,
  },
  message: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: theme.typography.sizes.bodyMedium * 1.4,
    maxWidth: 320,
  },
  button: {
    marginTop: theme.spacing.md,
    minWidth: 164,
  },
});

export default EmptyState;




