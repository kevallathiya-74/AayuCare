import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "./src/hooks/useFonts";
import { AuthProvider } from "./src/context/AuthContext";
import { Provider as PaperProvider } from "react-native-paper";
import { View, StyleSheet, LogBox, AppState, Platform } from "react-native";
import { focusManager } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initializeSentry } from "./src/config/sentry";
import queryClient from "./src/config/reactQueryConfig";
import { healthColors } from "./src/theme";
import "./src/config/i18n";

// Global error handler to catch unhandled errors
if (__DEV__) {
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Log additional context for property access errors
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("Property")
    ) {
      console.warn("[DEBUG] Property error context:", new Error().stack);
    }
    originalConsoleError.apply(console, args);
  };

  // Set up global error handler
  const errorHandler = (error, isFatal) => {
    console.warn("[GLOBAL ERROR CAUGHT]");
    console.warn("Error:", error?.message || error);
    console.warn("Stack:", error?.stack);
    if (isFatal) {
      console.warn("[FATAL ERROR] App will restart");
    }
  };

  if (global.ErrorUtils) {
    global.ErrorUtils.setGlobalHandler(errorHandler);
  }
}

// Ignore specific logs that might spam the console
LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
]);

import { ToastProvider } from "./src/context/ToastContext";

import AppNavigator from "./src/navigation/AppNavigator";

import ErrorBoundary from "./src/components/common/ErrorBoundary";

// Initialize i18n
import "./src/i18n";

// Import theme safely with fallback
let paperTheme;
try {
  // Import theme
  const { theme } = require("./src/theme");

  // Create paperTheme adapter from theme
  paperTheme = {
    colors: {
      primary: theme.colors.primary,
      accent: theme.colors.secondary,
      background: theme.colors.background.primary,
      surface: theme.colors.background.secondary,
      text: theme.colors.text.primary,
      disabled: theme.colors.grays.gray400,
      placeholder: theme.colors.text.secondary,
      backdrop: "rgba(0, 0, 0, 0.5)",
      notification: theme.colors.error.main,
    },
    fonts: {
      regular: {
        fontFamily: theme.typography.fontFamilies.body,
      },
      medium: {
        fontFamily: theme.typography.fontFamilies.body,
        fontWeight: "500",
      },
      light: {
        fontFamily: theme.typography.fontFamilies.body,
        fontWeight: "300",
      },
      thin: {
        fontFamily: theme.typography.fontFamilies.body,
        fontWeight: "100",
      },
    },
  };

  // Fix 2.4 — Runtime validation
  if (!paperTheme.colors.primary) {
    if (__DEV__)
      console.warn(
        "[App] theme.colors.primary is undefined, applying fallback"
      );
    paperTheme.colors.primary = "#00ACC1"; // Primary teal fallback
  }
} catch (e) {
  if (__DEV__) {
    console.error("[App] Theme loading failed:", e.message);
  }
  // Use a minimal fallback theme
  paperTheme = {
    colors: { primary: "#00ACC1" },
    fonts: {},
  };
}

// Initialize Sentry (safe guards built into initializeSentry)
initializeSentry();

export default function App() {
  const { fontsLoaded, onLayoutRootView } = useFonts();

  useEffect(() => {
    const onAppStateChange = (status) => {
      if (Platform.OS !== "web") {
        focusManager.setFocused(status === "active");
      }
    };
    const subscription = AppState.addEventListener("change", onAppStateChange);

    if (__DEV__) {
      if (!paperTheme || !paperTheme.colors || !paperTheme.fonts) {
        console.warn("[App] Theme not fully loaded");
      }
    }

    return () => {
      subscription.remove();
    };
  }, []);

  // Fix 2.3 — Prevent white flash
  if (!fontsLoaded) {
    return <View style={styles.splash} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <PaperProvider theme={paperTheme}>
                <ToastProvider>
                  <StatusBar style="auto" />
                  <AppNavigator />
                </ToastProvider>
              </PaperProvider>
            </QueryClientProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  splash: {
    flex: 1,
    backgroundColor: healthColors.primary.main,
  },
});
