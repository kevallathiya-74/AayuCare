/**
 * Sentry Configuration
 * Safe for Expo Go + Development + Production
 */

import Constants from "expo-constants";

// Lazy load Sentry
let Sentry = null;

try {
  Sentry = require("@sentry/react-native");
} catch (e) {
  if (__DEV__) {
    console.warn("[Sentry] Module not available.");
  }
}

/**
 * Expo execution environment
 *
 * Possible values:
 * "storeClient" -> Expo Go / Dev Client
 * "standalone" -> Production Build
 * "bare"        -> Bare React Native
 */

const executionEnvironment = Constants?.executionEnvironment;

const isExpoGo = executionEnvironment === "storeClient";

if (__DEV__) {
  console.log("[Sentry] Execution Environment:", executionEnvironment);
  console.log("[Sentry] Is Expo Go:", isExpoGo);
}

let sentryInitialized = false;

const getSentryDSN = () => {
  try {
    const dsn =
      Constants?.expoConfig?.extra?.SENTRY_DSN ??
      Constants?.expoConfig?.extra?.sentryDSN ??
      null;

    if (
      typeof dsn === "string" &&
      dsn.trim() !== "" &&
      dsn !== "null" &&
      !dsn.includes("your-dsn-here")
    ) {
      return dsn;
    }

    return null;
  } catch (e) {
    console.warn("[Sentry] Failed reading DSN.", e);
    return null;
  }
};

export function initializeSentry() {
  if (sentryInitialized) return;

  if (isExpoGo) {
    console.log("[Sentry] Running inside Expo Go. Initialization skipped.");
    return;
  }

  if (!Sentry) {
    console.warn("[Sentry] SDK unavailable.");
    return;
  }

  const dsn = getSentryDSN();

  if (!dsn) {
    console.warn("[Sentry] No DSN configured.");
    return;
  }

  try {
    Sentry.init({
      dsn,
      debug: __DEV__,
      environment: __DEV__ ? "development" : "production",
      tracesSampleRate: __DEV__ ? 1 : 0.2,
      attachStacktrace: true,
    });

    sentryInitialized = true;

    console.log("[Sentry] Initialized successfully.");
  } catch (error) {
    console.error("[Sentry] Initialization failed.", error);
  }
}

function isSentryEnabled() {
  return sentryInitialized && !!Sentry && !isExpoGo;
}

export function captureException(error, context = {}) {
  if (!isSentryEnabled()) {
    console.error(error);
    return;
  }

  Sentry.captureException(error, context);
}

export function captureMessage(message, level = "info") {
  if (!isSentryEnabled()) {
    console.log(`[${level}]`, message);
    return;
  }

  Sentry.captureMessage(message, { level });
}

export function setUser(user) {
  if (!isSentryEnabled()) return;

  Sentry.setUser(user || null);
}

export function addBreadcrumb(breadcrumb) {
  if (!isSentryEnabled()) return;

  Sentry.addBreadcrumb(breadcrumb);
}

export default {
  initialize: initializeSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
};