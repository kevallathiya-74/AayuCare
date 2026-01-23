/**
 * AayuCare - Error Recovery Component
 *
 * Provides user-friendly error recovery UI with actionable suggestions
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
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
      {/* Error Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: errorInfo.iconColor + "15" },
        ]}
      >
        <Ionicons name={errorInfo.icon} size={60} color={errorInfo.iconColor} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{errorInfo.title}</Text>

      {/* Message */}
      <Text style={styles.message}>{errorInfo.message}</Text>

      {/* Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>What you can do:</Text>
        {errorInfo.suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={healthColors.success.main}
              style={styles.suggestionIcon}
            />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
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
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: healthColors.background.primary,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.sizes.xxxxl,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: theme.typography.sizes.lg,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: theme.typography.sizes.lg * 1.5,
  },
  suggestionsContainer: {
    width: "100%",
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  suggestionsTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  suggestionIcon: {
    marginRight: theme.spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: healthColors.text.secondary,
    lineHeight: theme.typography.sizes.sm * 1.5,
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
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    ...theme.shadows.lg,
  },
  primaryButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
    color: healthColors.white,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.white,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: healthColors.primary.main,
    gap: theme.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: "600",
    color: healthColors.primary.main,
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.background.secondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  supportButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: "500",
    color: healthColors.text.secondary,
  },
});

export default ErrorRecovery;
