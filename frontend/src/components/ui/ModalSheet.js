/**
 * AayuCare - ModalSheet Component
 *
 * Premium bottom-sheet modal with:
 *  - Slide-up animation
 *  - Drag handle
 *  - Configurable max height
 *  - KeyboardAvoidingView support
 *  - Tap-outside dismiss
 *  - Optional header title + close button
 *
 * Props:
 *   visible     — boolean
 *   onClose     — function
 *   title       — optional header title string
 *   maxHeight   — fraction of screen height (default 0.85)
 *   children    — sheet content
 *   style       — content area style override
 *   hideHandle  — hide drag handle (default false)
 */

import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme, healthColors } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const ANIMATION_DURATION = 280;

const ModalSheet = ({
  visible,
  onClose,
  title,
  maxHeight = 0.88,
  children,
  style,
  hideHandle = false,
  scrollable = true,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetMaxHeight = SCREEN_HEIGHT * maxHeight;

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: "handled",
        contentContainerStyle: styles.scrollContent,
      }
    : {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet panel */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            { maxHeight: sheetMaxHeight, transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle */}
          {!hideHandle ? (
            <View style={styles.handleWrap}>
              <View style={styles.handle} />
            </View>
          ) : null}

          {/* Optional header */}
          {title ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X  size={22} color={healthColors.text.secondary} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Scrollable (or static) content */}
          <ContentWrapper style={[styles.content, style]} {...contentProps}>
            {children}
          </ContentWrapper>

          {/* Safe area bottom spacer */}
          <View style={{ height: Math.max(insets.bottom, 8) }} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: healthColors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: healthColors.border.main,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
});

export default ModalSheet;
