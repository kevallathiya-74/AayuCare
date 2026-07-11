const appJson = require("./app.json");

module.exports = ({ config }) => {
  const base = config || appJson.expo;
  const projectId =
    base.extra?.eas?.projectId || "31972ca4-e87a-4c14-862f-330973332013";

  return {
    ...base,
    plugins: [...(base.plugins || []), "expo-image"],
    updates: {
      ...base.updates,
      url: `https://u.expo.dev/${projectId}`,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
      ...base.extra,
      EXPO_PUBLIC_NODE_ENV:
        process.env.EXPO_PUBLIC_NODE_ENV ||
        process.env.NODE_ENV ||
        base.extra?.EXPO_PUBLIC_NODE_ENV ||
        "development",
      EXPO_PUBLIC_API_BASE_URL:
        process.env.EXPO_PUBLIC_API_BASE_URL ||
        base.extra?.EXPO_PUBLIC_API_BASE_URL ||
        null,
      EXPO_PUBLIC_API_BASE_URL_DEV:
        process.env.EXPO_PUBLIC_API_BASE_URL_DEV ||
        base.extra?.EXPO_PUBLIC_API_BASE_URL_DEV ||
        null,
      EXPO_PUBLIC_API_BASE_URL_PROD:
        process.env.EXPO_PUBLIC_API_BASE_URL_PROD ||
        base.extra?.EXPO_PUBLIC_API_BASE_URL_PROD ||
        null,
      PRODUCTION_API_URL:
        process.env.EXPO_PUBLIC_API_BASE_URL_PROD ||
        process.env.PRODUCTION_API_URL ||
        base.extra?.PRODUCTION_API_URL ||
        null,
      DEBUG_MODE:
        process.env.EXPO_PUBLIC_DEBUG_MODE || base.extra?.DEBUG_MODE || null,
      VERBOSE_LOGGING:
        process.env.EXPO_PUBLIC_VERBOSE_LOGGING ||
        base.extra?.VERBOSE_LOGGING ||
        null,
    },
  };
};
