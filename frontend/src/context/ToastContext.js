/**
 * AayuCare - ToastContext
 *
 * Lightweight toast notification system via React Context.
 * Exposes: useToast() → { showToast(message, type, duration) }
 *
 * Wrap the root app in <ToastProvider>.
 *
 * Types: 'success' | 'error' | 'warning' | 'info'
 */

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
  View,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, healthColors } from "../theme";
import { DynamicIcon } from "../components/common";
import Button from "../components/common/Button";
import { registerDialogTrigger } from "../utils/errorHandler";

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: {
    bg: healthColors.success.main,
    icon: "checkmark-circle",
    text: healthColors.white,
  },
  error: {
    bg: healthColors.error.main,
    icon: "close-circle",
    text: healthColors.white,
  },
  warning: {
    bg: healthColors.warning.main,
    icon: "warning",
    text: healthColors.white,
  },
  info: {
    bg: healthColors.primary.main,
    icon: "information-circle",
    text: healthColors.white,
  },
};

const DEFAULT_DURATION = 3000;
const ANIMATION_DURATION = 280;

export const ToastProvider = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(60)).current;
  const timerRef = useRef(null);
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    registerDialogTrigger((config) => {
      setDialog(config);
    });
    return () => registerDialogTrigger(null);
  }, []);

  const closeDialog = () => {
    setDialog(null);
  };

  const handleButtonPress = (btnOnPress) => {
    closeDialog();
    if (btnOnPress) {
      btnOnPress();
    }
  };

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 60,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [fadeAnim, translateY]);

  const showToast = useCallback(
    (message, type = "info", duration = DEFAULT_DURATION) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setToast({ message, type });

      fadeAnim.setValue(0);
      translateY.setValue(60);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(hideToast, duration);
    },
    [fadeAnim, translateY, hideToast]
  );

  const config = toast ? TOAST_CONFIG[toast.type] || TOAST_CONFIG.info : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && config ? (
        <Animated.View
          style={[
            styles.container,
            {
              bottom: Math.max(insets.bottom + 72, 88),
              backgroundColor: config.bg,
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <DynamicIcon
            name={config.icon}
            size={20}
            color={config.text}
            style={styles.icon}
          />
          <Text style={[styles.message, { color: config.text }]} numberOfLines={3}>
            {toast.message}
          </Text>
          <TouchableOpacity
            onPress={hideToast}
            style={styles.closeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <DynamicIcon name="X" size={16} color={config.text + "CC"} />
          </TouchableOpacity>
        </Animated.View>
      ) : null}
      {dialog ? (
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!dialog}
          onRequestClose={closeDialog}
        >
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogContent}>
              {/* Top Circular Icon */}
              <View
                style={[
                  styles.dialogIconContainer,
                  dialog.type === "success" && styles.iconSuccessBg,
                  dialog.type === "error" && styles.iconErrorBg,
                  dialog.type === "warning" && styles.iconWarningBg,
                  dialog.type === "confirm" && styles.iconConfirmBg,
                ]}
              >
                <DynamicIcon
                  name={
                    dialog.icon
                      ? dialog.icon
                      : dialog.type === "success"
                      ? "checkmark-circle"
                      : dialog.type === "error"
                      ? "close-circle"
                      : dialog.type === "warning"
                      ? "warning"
                      : "help-circle"
                  }
                  size={30}
                  color={
                    dialog.type === "success"
                      ? healthColors.success.main
                      : dialog.type === "error"
                      ? healthColors.error.main
                      : dialog.type === "warning"
                      ? healthColors.warning.main
                      : healthColors.primary.main
                  }
                />
              </View>

              {/* Title & Message */}
              <Text style={styles.dialogTitle}>{dialog.title}</Text>
              <Text style={styles.dialogMessage}>{dialog.message}</Text>

              {/* Action Buttons */}
              <View
                style={[
                  styles.dialogButtonsContainer,
                  dialog.buttons.length > 1 && styles.dialogButtonsRow,
                ]}
              >
                {dialog.buttons.map((btn, index) => (
                  <Button
                    key={index}
                    title={btn.text}
                    variant={
                      btn.style === "cancel"
                        ? "secondary"
                        : btn.style === "destructive"
                        ? "danger"
                        : "primary"
                    }
                    onPress={() => handleButtonPress(btn.onPress)}
                    style={dialog.buttons.length > 1 ? styles.dialogButtonFlex : styles.dialogButtonFull}
                  />
                ))}
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </ToastContext.Provider>
  );
};

/**
 * Hook to access the toast system.
 * @returns {{ showToast: (message: string, type?: string, duration?: number) => void }}
 */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    if (__DEV__) {
      console.warn("[useToast] Must be used inside <ToastProvider>.");
    }
    return { showToast: () => {} };
  }
  return ctx;
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: healthColors.shadows.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
    zIndex: 9999,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: theme.spacing.sm,
    padding: 2,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogContent: {
    backgroundColor: healthColors.background.card,
    borderRadius: 16,
    padding: 24,
    width: "88%",
    maxWidth: 380,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: healthColors.shadows.color,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.16,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  dialogIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconSuccessBg: {
    backgroundColor: healthColors.primary[50],
  },
  iconErrorBg: {
    backgroundColor: healthColors.error[50],
  },
  iconWarningBg: {
    backgroundColor: healthColors.warning[50],
  },
  iconConfirmBg: {
    backgroundColor: healthColors.success[50],
  },
  dialogTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  dialogMessage: {
    fontSize: theme.typography.sizes.body,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  dialogButtonsRow: {
    flexDirection: "row",
  },
  dialogButtonFlex: {
    flex: 1,
  },
  dialogButtonFull: {
    width: "100%",
  },
});

export default { ToastProvider, useToast };
