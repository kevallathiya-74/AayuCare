import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { View, Platform, StyleSheet, LogBox } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

console.log("═══════════════════════════════════════════");
console.log("[App.js] File loading...");
console.log("═══════════════════════════════════════════");

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
    console.log("═══════════════════════════════════════════");
    console.log("[GLOBAL ERROR CAUGHT]");
    console.log("Error:", error?.message || error);
    console.log("Stack:", error?.stack);
    console.log("Fatal:", isFatal);
    console.log("═══════════════════════════════════════════");
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

console.log("[App.js] Importing dependencies...");

import store from "./src/store/store";
console.log("[App.js] Store imported");

import AppNavigator from "./src/navigation/AppNavigator";
console.log("[App.js] AppNavigator imported");

import ErrorBoundary from "./src/components/common/ErrorBoundary";
console.log("[App.js] ErrorBoundary imported");

// Initialize i18n
console.log("[App.js] Initializing i18n...");
import "./src/i18n";
console.log("[App.js] i18n initialized");

// Import theme safely with fallback
console.log("[App.js] Loading unified theme system...");
let paperTheme;
try {
  // Import unified theme
  const { theme } = require("./src/theme");
  const themeModule = require("./src/theme/theme");
  paperTheme = themeModule.paperTheme;

  // Validate theme has required properties
  if (paperTheme && paperTheme.colors && paperTheme.fonts) {
    console.log("[App] ✅ Unified Theme System Loaded");
    console.log("[App] Theme Colors:", Object.keys(paperTheme.colors).length);
  } else {
    console.warn("[App] Theme incomplete, using defaults");
    paperTheme = paperTheme || {};
  }
} catch (e) {
  console.error("[App] Theme loading failed:", e.message);
  // Use a minimal fallback theme
  paperTheme = {};
}

console.log("[App.js] Initializing Sentry...");
// Initialize Sentry safely
try {
  const { initializeSentry } = require("./src/config/sentry");
  initializeSentry();
  console.log("[App.js] Sentry initialized");
} catch (e) {
  console.log("[App] Sentry init skipped:", e.message);
}

console.log("[App.js] Creating QueryClient...");
// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

console.log("[App.js] QueryClient created");
console.log("[App.js] Defining App component...");

export default function App() {
  console.log("[App] Component rendering...");

  useEffect(() => {
    // Simple logging for debugging - don't block rendering
    const logInit = () => {
      console.log("[App] Starting...");
      if (!paperTheme || !paperTheme.colors || !paperTheme.fonts) {
        console.warn("[App] Theme not fully loaded");
      } else {
        console.log(
          "[App] Theme OK - Colors:",
          Object.keys(paperTheme.colors).length,
          "properties"
        );
      }
      console.log("[App] Ready");
    };

    // Run async to avoid blocking
    setTimeout(logInit, 0);
  }, []);

  console.log("[App] Returning JSX...");

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <View style={styles.container}>
          <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>
              <PaperProvider theme={paperTheme}>
                <StatusBar style="dark" />
                <AppNavigator />
              </PaperProvider>
            </QueryClientProvider>
          </ReduxProvider>
        </View>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFB", // theme.colors.backgroundSecondary
    ...(Platform.OS === "web" && {
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
    }),
  },
});
