/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme, healthColors } from "../../theme";
import { captureException } from "../../config/sentry";

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
    console.log("═══════════════════════════════════════════");
    console.log("[ERROR BOUNDARY CAUGHT ERROR]");
    console.log("Error:", error);
    console.log("Error Message:", error?.message);
    console.log("Error Stack:", error?.stack);
    console.log("Component Stack:", errorInfo?.componentStack);
    console.log("═══════════════════════════════════════════");

    // Send to Sentry
    try {
      captureException(error, {
        tags: { context: "ErrorBoundary" },
        extra: { errorInfo },
      });
    } catch (sentryError) {
      console.log(
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
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We&#39;re sorry for the inconvenience. Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
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
    padding: theme.spacing.lg,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: healthColors.text.secondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: healthColors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.lg,
    width: "100%",
  },
  errorText: {
    fontSize: 12,
    color: healthColors.error.main,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: healthColors.primary.main,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    minWidth: 150,
  },
  buttonText: {
    color: healthColors.text.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default ErrorBoundary;

