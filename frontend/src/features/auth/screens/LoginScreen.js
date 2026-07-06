/**
 * Login Screen
 * Premium SaaS UI - HealthCare UX
 * Supports: Admin, Doctor, Patient roles
 */

import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  Keyboard,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  User,
  Lock,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  HeartPulse,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "@/theme";
import Routes from "@/navigation/routes";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/store/slices/authSlice";
import { Input, Button } from "@/components/common";

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const initialHeightRef = useRef(0);
  if (initialHeightRef.current === 0 && windowHeight > 0) {
    initialHeightRef.current = windowHeight;
  }
  // Use initial height to prevent keyboard-triggered layout resizing and input focus loss
  const height = initialHeightRef.current || windowHeight || 800;

  // Responsive header height: 35% on tall phones, 30% min on small screens
  const headerHeight = Math.max(height * 0.35, 220);
  // Card overlap into header — proportional so it never clips on small screens
  const cardOverlap = Math.min(headerHeight * 0.12, 48);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ userId: "", password: "" });
  const [formError, setFormError] = useState("");

  const passwordInputRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();

    const newErrors = { userId: "", password: "" };
    if (!userId.trim()) newErrors.userId = "User ID is required";
    if (!password) newErrors.password = "Password is required";

    if (newErrors.userId || newErrors.password) {
      setFieldErrors(newErrors);
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    setFieldErrors({ userId: "", password: "" });
    setFormError("");

    try {
      await dispatch(loginUser({ userId, password })).unwrap();
    } catch (error) {
      setFormError(error?.message || "Invalid credentials. Please try again.");
    }
  }, [userId, password, dispatch, scaleAnim]);

  const onUserIdChange = useCallback((text) => {
    setUserId(text);
    setFieldErrors((prev) => (prev.userId ? { ...prev, userId: "" } : prev));
    setFormError((prev) => (prev ? "" : prev));
  }, []);

  const onPasswordChange = useCallback((text) => {
    setPassword(text);
    setFieldErrors((prev) =>
      prev.password ? { ...prev, password: "" } : prev,
    );
    setFormError((prev) => (prev ? "" : prev));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={healthColors.primary.dark}
      />

      {/* Single KeyboardAvoidingView — iOS-only padding avoidance, native Android adjustment */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <LoginForm
          scrollInsets={insets}
          navigation={navigation}
          userId={userId}
          password={password}
          onUserIdChange={onUserIdChange}
          onPasswordChange={onPasswordChange}
          fieldErrors={fieldErrors}
          formError={formError}
          isLoading={isLoading}
          handleLogin={handleLogin}
          passwordInputRef={passwordInputRef}
          fadeAnim={fadeAnim}
          slideAnim={slideAnim}
          scaleAnim={scaleAnim}
          headerHeight={headerHeight}
          cardOverlap={cardOverlap}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const iconColor = healthColors.text.tertiary;
const iconSize = theme.iconSizes.md;
const emailIcon = <User size={iconSize} color={iconColor} />;
const lockIcon = <Lock size={iconSize} color={iconColor} />;

const LoginForm = memo(
  ({
    scrollInsets,
    navigation,
    userId,
    password,
    onUserIdChange,
    onPasswordChange,
    fieldErrors,
    formError,
    isLoading,
    handleLogin,
    passwordInputRef,
    fadeAnim,
    slideAnim,
    scaleAnim,
    headerHeight,
    cardOverlap,
  }) => {
    const onEmailSubmit = useCallback(() => {
      passwordInputRef.current?.focus();
    }, [passwordInputRef]);

    return (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(scrollInsets.bottom + 24, 40) },
        ]}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Premium Header ── */}
        <LinearGradient
          colors={[
            healthColors.primary.dark,
            healthColors.primary.main,
            healthColors.secondary.main,
          ]}
          style={[styles.header, { height: headerHeight }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.5 }}
        >
          <View style={styles.abstractShape1} pointerEvents="none" />
          <View style={styles.abstractShape2} pointerEvents="none" />

          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
            <View style={styles.logoOuter}>
              <LinearGradient
                colors={[
                  theme.withOpacity(healthColors.text.white, 0.3),
                  theme.withOpacity(healthColors.text.white, 0.1),
                ]}
                style={styles.logoInner}
              >
                <HeartPulse
                  size={42}
                  color={healthColors.text.white}
                  strokeWidth={2.5}
                />
              </LinearGradient>
            </View>
            <Text style={styles.appName} accessibilityRole="header">
              AayuCare
            </Text>
            <Text style={styles.tagline}>Elevating Healthcare Together</Text>
          </Animated.View>
        </LinearGradient>

        {/* ── Glassmorphic Form Card ── */}
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginTop: -cardOverlap,
            },
          ]}
        >
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Sign In</Text>
            <Text style={styles.subtitleText}>
              Enter your credentials to continue
            </Text>
          </View>

          <View
            style={styles.rolePills}
            accessible={true}
            accessibilityLabel="Roles available: Admin, Doctor, Patient"
          >
            {["Admin", "Doctor", "Patient"].map((role, idx) => (
              <View key={role} style={styles.roleBadge}>
                <View
                  style={[
                    styles.roleDot,
                    {
                      backgroundColor:
                        idx === 0
                          ? healthColors.accent.coral
                          : idx === 1
                            ? healthColors.secondary.main
                            : healthColors.primary.main,
                    },
                  ]}
                />
                <Text style={styles.roleBadgeText}>{role}</Text>
              </View>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Email or User ID"
              value={userId}
              onChangeText={onUserIdChange}
              placeholder="e.g. pat1, doc1, admin@aayucare.com"
              leftIcon={emailIcon}
              error={fieldErrors.userId}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={onEmailSubmit}
              editable={!isLoading}
              style={styles.inputSpacing}
              accessibilityLabel="Email or User ID Input"
            />
          </View>

          <View style={styles.inputGroup}>
            <Input
              label="Password"
              value={password}
              onChangeText={onPasswordChange}
              placeholder="Enter your password"
              leftIcon={lockIcon}
              secureTextEntry
              error={fieldErrors.password}
              ref={passwordInputRef}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              style={styles.inputSpacing}
              accessibilityLabel="Password Input"
            />
          </View>

          {!!formError && (
            <View style={styles.formErrorContainer} accessibilityRole="alert">
              <AlertCircle
                size={theme.iconSizes.sm}
                color={healthColors.error.main}
              />
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate(Routes.AUTH.FORGOT_PASSWORD)}
            activeOpacity={0.6}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityRole="button"
            accessibilityLabel="Forgot Password"
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.loginBtnWrapper,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Button
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginBtn}
              gradient
              fullWidth
              icon={
                !isLoading ? (
                  <ArrowRight
                    size={theme.iconSizes.md}
                    color={healthColors.text.white}
                  />
                ) : null
              }
              iconPosition="right"
              accessibilityRole="button"
              accessibilityLabel="Continue to Login"
            >
              <Text>Continue</Text>
            </Button>
          </Animated.View>
        </Animated.View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <ShieldCheck
            size={theme.iconSizes.sm}
            color={healthColors.primary.main}
          />
          <Text style={styles.footerText}>
            End-to-end encrypted · HIPAA Compliant
          </Text>
        </View>
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ── Premium Header ──
  header: {
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  abstractShape1: {
    position: "absolute",
    top: -50,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.08),
  },
  abstractShape2: {
    position: "absolute",
    bottom: -60,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.05),
  },
  logoContainer: {
    alignItems: "center",
  },
  logoOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: theme.withOpacity(healthColors.text.white, 0.15),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.withOpacity(healthColors.text.white, 0.3),
  },
  logoInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  appName: {
    fontSize: theme.typography.sizes.h1,
    fontWeight: "800",
    color: healthColors.text.white,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  tagline: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.withOpacity(healthColors.text.white, 0.9),
    letterSpacing: 0.5,
    fontWeight: "500",
  },

  // ── Glassmorphic Form Card ──
  formCard: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.withOpacity(healthColors.neutral.gray200, 0.8),
    shadowColor: healthColors.neutral.gray500,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  welcomeContainer: {
    marginBottom: theme.spacing.lg,
  },
  welcomeText: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: "800",
    color: healthColors.text.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: 22,
  },
  rolePills: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.tertiary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.badge,
    gap: theme.spacing.xs,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleBadgeText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputSpacing: {
    marginBottom: 0,
  },

  // ── Errors & Helpers ──
  formErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.error.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: healthColors.error.surface,
    gap: theme.spacing.sm,
  },
  formErrorText: {
    flex: 1,
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.error.main,
    fontWeight: "500",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.xl,
  },
  forgotPasswordText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.secondary.main,
    fontWeight: "600",
  },

  // ── Login Button ──
  loginBtnWrapper: {
    width: "100%",
    marginBottom: theme.spacing.md,
  },
  loginBtn: {
    height: 56,
    borderRadius: theme.borderRadius.button,
  },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  footerText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
    fontWeight: "500",
  },
});

export default LoginScreen;
