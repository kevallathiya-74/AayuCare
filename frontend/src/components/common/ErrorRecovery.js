/**
 * AayuCare - Error Recovery Component
 *
 * Provides user-friendly error recovery UI with actionable suggestions
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme, healthColors } from "../../theme";
import { verticalScale } from "../../utils/responsive";

const ErrorRecovery = ({
  error,
  onRetry,
  onGoBack,
  onContactSupport,
  showRetry = true,
  showGoBack = true,
  showSupport = true,
  customMessage,
  customSuggestions,
}) => {
  // Determine error type and suggestions
  const getErrorInfo = () => {
    const errorMsg = error?.message || error || "";
    const lowerError = errorMsg.toLowerCase();

    // Network errors
    if (
      lowerError.includes("network") ||
      lowerError.includes("connection") ||
      lowerError.includes("offline")
    ) {
      return {
        icon: "cloud-offline-outline",
        iconColor: healthColors.warning.main,
        title: "Connection Issue",
        message: customMessage || "Unable to connect to the server",
        suggestions: customSuggestions || [
          "Check your internet connection",
          "Make sure WiFi or mobile data is enabled",
          "Try again in a few moments",
        ],
      };
    }

    // Authentication errors
    if (
      lowerError.includes("unauthorized") ||
      lowerError.includes("authentication") ||
      lowerError.includes("session")
    ) {
      return {
        icon: "lock-closed-outline",
        iconColor: healthColors.error.main,
        title: "Authentication Error",
        message: customMessage || "Your session has expired",
        suggestions: customSuggestions || [
          "Please login again",
          "Check your credentials",
          "Contact support if issue persists",
        ],
      };
    }

    // Server errors
    if (
      lowerError.includes("500") ||
      lowerError.includes("server") ||
      lowerError.includes("maintenance")
    ) {
      return {
        icon: "server-outline",
        iconColor: healthColors.error.main,
        title: "Server Error",
        message: customMessage || "Something went wrong on our end",
        suggestions: customSuggestions || [
          "This is not your fault",
          "Our team has been notified",
          "Please try again later",
        ],
      };
    }

    // Data not found
    if (lowerError.includes("not found") || lowerError.includes("404")) {
      return {
        icon: "search-outline",
        iconColor: healthColors.info.main,
        title: "Not Found",
        message: customMessage || "The requested information was not found",
        suggestions: customSuggestions || [
          "Check if the information exists",
          "Try searching again",
          "Contact support for assistance",
        ],
      };
    }

    // Generic error
    return {
      icon: "alert-circle-outline",
      iconColor: healthColors.error.main,
      title: "Something Went Wrong",
      message: customMessage || "An unexpected error occurred",
      suggestions: customSuggestions || [
        "Try again",
        "Check your internet connection",
        "Contact support if issue continues",
      ],
    };
  };

  const errorInfo = getErrorInfo();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: errorInfo.iconColor + "15" },
        ]}
      >
        <Ionicons name={errorInfo.icon} size={36} color={errorInfo.iconColor} />
      </View>

      <Text style={styles.title}>{errorInfo.title}</Text>
      <Text style={styles.message}>{errorInfo.message}</Text>

      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>What you can do:</Text>
        {errorInfo.suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionItem}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={healthColors.success.main}
              style={styles.suggestionIcon}
            />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        {showRetry && onRetry && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color={healthColors.white} />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {showGoBack && onGoBack && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onGoBack}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={healthColors.primary.main}
            />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}

        {showSupport && onContactSupport && (
          <TouchableOpacity
            style={styles.supportButton}
            onPress={onContactSupport}
            activeOpacity={0.8}
          >
            <Ionicons
              name="headset"
              size={20}
              color={healthColors.text.secondary}
            />
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: healthColors.background.primary,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  message: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.sizes.bodyMedium * 1.4,
  },
  suggestionsContainer: {
    width: "100%",
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  suggestionsTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  suggestionIcon: {
    marginRight: theme.spacing.xs,
  },
  suggestionText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    lineHeight: theme.typography.sizes.bodySmall * 1.4,
  },
  actionsContainer: {
    width: "100%",
    gap: theme.spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.primary.main,
    minHeight: theme.touchTargets.min,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.white,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.white,
    minHeight: theme.touchTargets.min,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.primary.main,
    gap: theme.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.secondary,
    minHeight: theme.touchTargets.min,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  supportButtonText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
});

export default ErrorRecovery;
