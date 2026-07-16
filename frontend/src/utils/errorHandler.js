import { Alert } from "react-native";
import * as Sentry from "@sentry/react-native";

export const ERROR_TYPES = {};
export const ERROR_MESSAGES = {
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

export const parseError = (error) => {
  if (typeof error === "string") return error;
  if (error?.response?.data?.message && typeof error.response.data.message === "string") return error.response.data.message;
  if (error?.message && typeof error.message === "string") return error.message;
  return ERROR_MESSAGES.UNKNOWN;
};

export const getHumanReadableError = parseError;

export const logError = (error, context = "") => {
  const sanitized = {
    category: error?.name || "UnknownError",
    status: error?.response?.status || 500,
    context,
  };
  
  if (__DEV__) {
    console.error(`[${context}] Error:`, JSON.stringify(sanitized));
  } else {
    Sentry.captureException(new Error(`Sanitized Error: ${sanitized.category}`), {
      tags: sanitized,
    });
  }
};

let activeDialogTrigger = null;
export const registerDialogTrigger = (triggerFn) => {
  activeDialogTrigger = triggerFn;
};

export const showError = (error, title = "Error", onDismiss) => {
  const message = parseError(error);
  if (activeDialogTrigger) {
    activeDialogTrigger({ type: "error", title, message, buttons: [{ text: "OK", onPress: onDismiss }] });
  } else {
    Alert.alert(title, message, [{ text: "OK", onPress: onDismiss }]);
  }
};

export const showSuccess = (message, title = "Success", onDismiss) => {
  if (activeDialogTrigger) {
    activeDialogTrigger({ type: "success", title, message, buttons: [{ text: "OK", onPress: onDismiss }] });
  } else {
    Alert.alert(title, message, [{ text: "OK", onPress: onDismiss }]);
  }
};

export const showConfirmation = (message, onConfirm, onCancel, title = "Confirm", icon = "help-circle") => {
  if (activeDialogTrigger) {
    activeDialogTrigger({
      type: "confirm", title, message, icon,
      buttons: [
        { text: "Cancel", onPress: onCancel, style: "cancel" },
        { text: "Confirm", onPress: onConfirm, style: "default" }
      ]
    });
  } else {
    Alert.alert(title, message, [
      { text: "Cancel", onPress: onCancel, style: "cancel" },
      { text: "Confirm", onPress: onConfirm }
    ]);
  }
};

export const handleAsync = async (asyncFn, setLoading, setError = null, errorContext = "") => {
  try {
    if (setLoading) setLoading(true);
    const result = await asyncFn();
    if (setLoading) setLoading(false);
    return result;
  } catch (error) {
    if (setLoading) setLoading(false);
    logError(error, errorContext);
    if (setError) setError(parseError(error));
    throw error;
  }
};

export const toSafeError = (error) => new Error(parseError(error));

export default {
  ERROR_TYPES,
  ERROR_MESSAGES,
  parseError,
  getHumanReadableError,
  showError,
  showSuccess,
  showConfirmation,
  registerDialogTrigger,
  logError,
  handleAsync,
  toSafeError,
};
