import React, { useEffect } from "react";
import { useFonts } from "./src/hooks/useFonts";
import { StatusBar } from "expo-status-bar";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { View, Platform, StyleSheet, LogBox } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initializeSentry } from "./src/config/sentry";
import queryClient from "./src/config/reactQueryConfig";

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
      console.log("[DEBUG] Property error context:", new Error().stack);
    }
    originalConsoleError.apply(console, args);
  };

  // Set up global error handler
  const errorHandler = (error, isFatal) => {
    console.log("[GLOBAL ERROR CAUGHT]");
    console.log("Error:", error?.message || error);
    console.log("Stack:", error?.stack);
    if (isFatal) {
      console.log("[FATAL ERROR] App will restart");
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

import store from "./src/store/store";
import { ToastProvider } from "./src/context/ToastContext";

import AppNavigator from "./src/navigation/AppNavigator";

import ErrorBoundary from "./src/components/common/ErrorBoundary";

// Initialize i18n
import "./src/i18n";

// Import theme safely with fallback
let paperTheme;
try {
  // Import unified theme
  const { theme } = require("./src/theme");
  
  // Create paperTheme adapter from unified theme
  paperTheme = {
    colors: {
      primary: theme.colors.primary,
      accent: theme.colors.secondary,
      background: theme.colors.background.primary,
      surface: theme.colors.background.secondary,
      text: theme.colors.text.primary,
      disabled: theme.colors.grays.gray400,
      placeholder: theme.colors.text.secondary,
      backdrop: 'rgba(0, 0, 0, 0.5)',
      notification: theme.colors.error.main,
    },
    fonts: {
      regular: {
        fontFamily: theme.typography.fontFamily.body,
      },
      medium: {
        fontFamily: theme.typography.fontFamily.body,
        fontWeight: '500',
      },
      light: {
        fontFamily: theme.typography.fontFamily.body,
        fontWeight: '300',
      },
      thin: {
        fontFamily: theme.typography.fontFamily.body,
        fontWeight: '100',
      },
    },
  };
} catch (e) {
  if (__DEV__) {
    console.error("[App] Theme loading failed:", e.message);
  }
  // Use a minimal fallback theme
  paperTheme = {
    colors: {},
    fonts: {},
  };
}

// Initialize Sentry (safe guards built into initializeSentry)
initializeSentry();

export default function App() {
  const { fontsLoaded, onLayoutRootView } = useFonts();

  useEffect(() => {
    if (__DEV__) {
      if (!paperTheme || !paperTheme.colors || !paperTheme.fonts) {
        console.warn("[App] Theme not fully loaded");
      }
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={styles.container} onLayout={onLayoutRootView}>
          <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>
              <PaperProvider theme={paperTheme}>
                <ToastProvider>
                  <StatusBar style="dark" />
                  <AppNavigator />
                </ToastProvider>
              </PaperProvider>
            </QueryClientProvider>
          </ReduxProvider>
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFB", // theme.colors.backgroundSecondary
  },
});
