/**
 * Unified Login Screen
 * Single authentication screen with role-based login
 * Supports: Admin, Doctor, Patient roles
 */

import React, { useState, useRef } from "react";
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
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../theme";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../store/slices/authSlice";
import {
  getScreenPadding,
  getSafeAreaEdges,
  getKeyboardConfig,
  isTablet,
} from "../../utils/responsive";
import { Input, Button } from "../../components/common";

// Development auto-fill credentials (only available in __DEV__ mode)
// Simple test credentials for easy development
const DEV_CREDENTIALS = __DEV__
  ? {
      patient: { userId: "patient", password: "password123" },
      doctor: { userId: "doctor", password: "password123" },
      admin: { userId: "admin", password: "password123" },
    }
  : null;

const UnifiedLoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showDevHelper, setShowDevHelper] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ userId: "", password: "" });
  const [formError, setFormError] = useState("");

  const passwordInputRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleAutoFill = (role) => {
    const credentials = DEV_CREDENTIALS[role];
    if (credentials) {
      setUserId(credentials.userId);
      setPassword(credentials.password);
      setFieldErrors({ userId: "", password: "" });
      setFormError("");
      setShowDevHelper(false);
    }
  };

  const validateLoginForm = () => {
    const nextErrors = { userId: "", password: "" };
    const trimmedUserId = userId.trim();

    if (!trimmedUserId) {
      nextErrors.userId = "Email or User ID is required";
    } else if (trimmedUserId.length < 3) {
      nextErrors.userId = "Enter a valid Email or User ID";
    }

    if (!password) {
      nextErrors.password = "Password is required";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setFieldErrors(nextErrors);
    return !nextErrors.userId && !nextErrors.password;
  };

  const handleLogin = async () => {
    setFormError("");

    if (!validateLoginForm()) {
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await dispatch(
        loginUser({
          userId: userId.trim(),
          password,
        })
      ).unwrap();
      // Role-based navigation handled automatically by AppNavigator
    } catch (err) {
      const message = err?.message || err?.toString() || "Login failed";
      setFormError(message);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <SafeAreaView style={styles.container} edges={getSafeAreaEdges("default")}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={healthColors.primary.main}
      />

      <KeyboardAvoidingView
        behavior={getKeyboardConfig().behavior}
        keyboardVerticalOffset={getKeyboardConfig().keyboardVerticalOffset}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 36) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero Header ── */}
          <LinearGradient
            colors={[
              healthColors.primary.main,
              healthColors.primary.dark,
              theme.colors.info.dark,
            ]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative circles */}
            <View style={styles.circleTopRight} pointerEvents="none" />
            <View style={styles.circleBottomLeft} pointerEvents="none" />

            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons
                  name="medical"
                  size={48}
                  color={healthColors.neutral.white}
                />
              </View>
              <Text style={styles.appName}>AayuCare</Text>
              <Text style={styles.tagline}>Smart Healthcare Management</Text>
            </View>
          </LinearGradient>

          {/* ── Login Form Card ── */}
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.subtitleText}>
              Sign in to access your healthcare dashboard
            </Text>

            {/* Role pill */}
            <View style={styles.roleIndicator}>
              <Ionicons
                name="people"
                size={14}
                color={healthColors.primary.main}
              />
              <Text style={styles.roleText}>Admin · Doctor · Patient</Text>
            </View>

            {/* ── User ID ── */}
            <Input
              label="Email or User ID"
              value={userId}
              onChangeText={(text) => {
                setUserId(text);
                if (fieldErrors.userId || formError) {
                  setFieldErrors((prev) => ({ ...prev, userId: "" }));
                  setFormError("");
                }
              }}
              placeholder="Enter your email or user ID"
              leftIcon={
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={healthColors.text.tertiary}
                />
              }
              error={fieldErrors.userId}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              editable={!isLoading}
              keyboardType="email-address"
              style={styles.inputSpacing}
            />

            {/* ── Password ── */}
            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password || formError) {
                  setFieldErrors((prev) => ({ ...prev, password: "" }));
                  setFormError("");
                }
              }}
              placeholder="Enter your password"
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={healthColors.text.tertiary}
                />
              }
              secureTextEntry
              error={fieldErrors.password}
              ref={passwordInputRef}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              style={styles.inputSpacing}
            />

            {/* Form-level error */}
            {!!formError && (
              <View style={styles.formErrorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={healthColors.error.main}
                />
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            )}

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* ── Dev Quick-Login Helper ── */}
            {__DEV__ && (
              <View style={styles.devHelper}>
                <TouchableOpacity
                  style={styles.devToggle}
                  onPress={() => setShowDevHelper(!showDevHelper)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showDevHelper ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={healthColors.info.main}
                  />
                  <Text style={styles.devToggleText}>
                    {showDevHelper ? "Hide Quick Login" : "Quick Login"}
                  </Text>
                </TouchableOpacity>

                {showDevHelper && (
                  <View style={styles.devButtons}>
                    {[
                      { role: "patient", icon: "people", color: healthColors.primary.main },
                      { role: "doctor", icon: "medical", color: healthColors.secondary.main },
                      { role: "admin", icon: "shield-checkmark", color: healthColors.accent.coral },
                    ].map(({ role, icon, color }) => (
                      <TouchableOpacity
                        key={role}
                        style={[styles.devButton, { borderColor: color + "40" }]}
                        onPress={() => handleAutoFill(role)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={icon} size={14} color={color} />
                        <Text style={styles.devButtonText}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Login Button ── */}
            <Animated.View style={[styles.loginBtnWrapper, { transform: [{ scale: scaleAnim }] }]}>
              <Button
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                variant="primary"
                gradient
                fullWidth
                size="large"
                icon={
                  !isLoading ? (
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={healthColors.neutral.white}
                    />
                  ) : null
                }
                iconPosition="right"
              >
                Sign In
              </Button>
            </Animated.View>

            {/* Dev credentials reference */}
            {__DEV__ && (
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Dev Credentials</Text>
                {[
                  { label: "Patient:", value: "patient / password123" },
                  { label: "Doctor:", value: "doctor / password123" },
                  { label: "Admin:", value: "admin / password123" },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.demoRow}>
                    <Text style={styles.demoLabel}>{label}</Text>
                    <Text style={styles.demoValue}>{value}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={healthColors.text.tertiary}
            />
            <Text style={styles.footerText}>
              Secure Login · Your data is protected
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ── Header ──
  header: {
    paddingTop: 44,
    paddingBottom: 60,
    alignItems: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  circleTopRight: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.07),
  },
  circleBottomLeft: {
    position: "absolute",
    bottom: -20,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.05),
  },
  logoContainer: { alignItems: "center" },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.14),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: theme.withOpacity(theme.colors.text.white, 0.25),
    ...theme.shadows.lg,
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    color: healthColors.neutral.white,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  tagline: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: theme.withOpacity(theme.colors.text.white, 0.88),
    letterSpacing: 0.4,
  },

  // ── Form Card ──
  formCard: {
    marginTop: -36,
    marginHorizontal: getScreenPadding(),
    maxWidth: isTablet() ? 480 : 440,
    width: "100%",
    alignSelf: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.withOpacity(healthColors.border.light, 0.6),
    ...theme.shadows.xl,
  },
  welcomeText: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  roleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.main + "0C",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: healthColors.primary.main + "18",
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.3,
  },
  inputSpacing: { marginBottom: 16 },

  // ── Form Error ──
  formErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: healthColors.error.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  formErrorText: {
    flex: 1,
    fontSize: theme.typography.sizes.caption,
    color: healthColors.error.main,
    fontWeight: theme.typography.weights.medium,
  },

  // ── Forgot password ──
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: 2,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.semibold,
  },

  // ── Login button wrapper ──
  loginBtnWrapper: { width: "100%", marginTop: 8 },

  // ── Dev Helper ──
  devHelper: {
    marginBottom: 16,
    backgroundColor: healthColors.info.main + "08",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.info.main + "1A",
    overflow: "hidden",
  },
  devToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
  },
  devToggleText: {
    fontSize: 12,
    color: healthColors.info.main,
    fontWeight: theme.typography.weights.semibold,
  },
  devButtons: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    paddingTop: 4,
  },
  devButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: healthColors.background.card,
  },
  devButtonText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },

  // ── Demo Section ──
  demoSection: {
    marginTop: 20,
    padding: 14,
    backgroundColor: healthColors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderStyle: "dashed",
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.secondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  demoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  demoLabel: {
    fontSize: 11,
    color: healthColors.text.tertiary,
    fontWeight: theme.typography.weights.medium,
  },
  demoValue: {
    fontSize: 11,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.medium,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: healthColors.text.tertiary,
  },
});

export default UnifiedLoginScreen;
