/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertTriangle, RotateCw } from "lucide-react-native";
import { healthColors } from "@/theme";
import { captureException } from "@/config/sentry";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Always log error to console for debugging with clear markers
    console.warn("═══════════════════════════════════════════");
    console.warn("[ERROR BOUNDARY CAUGHT ERROR]");
    console.warn("Error:", error);
    console.warn("Error Message:", error?.message);
    console.warn("Error Stack:", error?.stack);
    console.warn("Component Stack:", errorInfo?.componentStack);
    console.warn("═══════════════════════════════════════════");

    // Send to Sentry
    try {
      captureException(error, {
        tags: { context: "ErrorBoundary" },
        extra: { errorInfo },
      });
    } catch (sentryError) {
      console.warn(
        "[ErrorBoundary] Sentry capture failed:",
        sentryError.message
      );
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error
        ? this.state.error.message || String(this.state.error)
        : "Unknown Error";

      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <AlertTriangle size={40} color={healthColors.error.main} />
          </View>

          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            The application encountered an unexpected error. You can try
            reloading the screen to restore functionality.
          </Text>

          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <View style={styles.errorHeader}>
                <Text style={styles.errorLabel}>Technical Details</Text>
              </View>
              <Text style={styles.errorText} numberOfLines={6}>
                {errorMsg}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={this.handleReset}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Try reloading the screen"
          >
            <RotateCw
              size={18}
              color={healthColors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: healthColors.error.surface, // soft red tint
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: healthColors.error.main,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  errorDetails: {
    backgroundColor: healthColors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    padding: 16,
    width: "100%",
    maxWidth: 340,
    marginBottom: 28,
  },
  errorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: healthColors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 13,
    color: healthColors.error.main,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 24, // pill button
    shadowColor: healthColors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 150,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: healthColors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ErrorBoundary;
