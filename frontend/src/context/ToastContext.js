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
} from "react";
import {
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, healthColors } from "../theme";
import { DynamicIcon } from "../components/common";

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
});

export default { ToastProvider, useToast };
