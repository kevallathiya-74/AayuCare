/**
 * Unified Login Screen
 * Single authentication screen with role-based login
 * Supports: Admin, Doctor, Patient roles
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
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
  verticalScale,
  getSafeAreaEdges,
  getKeyboardConfig,
  getInputHeight,
  getContainerWidth,
  isTablet,
} from "../../utils/responsive";
import { showError, validateRequiredFields } from "../../utils/errorHandler";

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
  const [showPassword, setShowPassword] = useState(false);
  const [userIdFocused, setUserIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showDevHelper, setShowDevHelper] = useState(false);

  const passwordInputRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleAutoFill = (role) => {
    const credentials = DEV_CREDENTIALS[role];
    if (credentials) {
      setUserId(credentials.userId);
      setPassword(credentials.password);
      setShowDevHelper(false);
    }
  };

  const handleLogin = async () => {
    // Validate inputs
    const validation = validateRequiredFields({ userId, password });
    if (!validation.isValid) {
      showError("Please enter both User ID and Password");
      return;
    }

    // Animate button press
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

    try {
      const result = await dispatch(
        loginUser({
          userId: userId.trim(),
          password,
        })
      ).unwrap();

      // Role-based navigation handled automatically by AppNavigator
    } catch (err) {
      // Show user-friendly error with errorHandler
      showError(err, "Login Failed");
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
            { paddingBottom: Math.max(insets.bottom(20)) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Gradient */}
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
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons
                  name="medical"
                  size={50}
                  color={healthColors.neutral.white}
                />
              </View>
              <Text style={styles.appName}>AayuCare</Text>
              <Text style={styles.tagline}>Smart Healthcare Management</Text>
            </View>
          </LinearGradient>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subtitleText}>
                Sign in to access your healthcare dashboard
              </Text>
            </View>

            {/* Role Indicator */}
            <View style={styles.roleIndicator}>
              <Ionicons
                name="people"
                size={16}
                color={healthColors.primary.main}
              />
              <Text style={styles.roleText}>
                All Roles: Admin • Doctor • Patient
              </Text>
            </View>

            {/* User ID Input */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.label,
                  (userIdFocused || userId) && styles.labelFocused,
                ]}
              >
                User ID / Employee ID / Patient ID
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  userIdFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={
                    userIdFocused
                      ? healthColors.primary.main
                      : healthColors.text.tertiary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={userId}
                  onChangeText={setUserId}
                  onFocus={() => setUserIdFocused(true)}
                  onBlur={() => setUserIdFocused(false)}
                  placeholder="Enter your ID"
                  placeholderTextColor={healthColors.text.tertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.label,
                  (passwordFocused || password) && styles.labelFocused,
                ]}
              >
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  passwordFocused && styles.inputWrapperFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    passwordFocused
                      ? healthColors.primary.main
                      : healthColors.text.tertiary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={passwordInputRef}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter your password"
                  placeholderTextColor={healthColors.text.tertiary}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={healthColors.text.tertiary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Development Helper - Quick Login Buttons */}
            {__DEV__ && (
              <View style={styles.devHelper}>
                <TouchableOpacity
                  style={styles.devToggle}
                  onPress={() => setShowDevHelper(!showDevHelper)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showDevHelper ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={healthColors.info.main}
                  />
                  <Text style={styles.devToggleText}>
                    {showDevHelper ? "Hide" : "Quick Login"}
                  </Text>
                </TouchableOpacity>

                {showDevHelper && (
                  <View style={styles.devButtons}>
                    <TouchableOpacity
                      style={[styles.devButton, styles.devButtonPatient]}
                      onPress={() => handleAutoFill("patient")}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="people"
                        size={16}
                        color={healthColors.primary.main}
                      />
                      <Text style={styles.devButtonText}>Patient</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.devButton, styles.devButtonDoctor]}
                      onPress={() => handleAutoFill("doctor")}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="medical"
                        size={16}
                        color={healthColors.secondary.main}
                      />
                      <Text style={styles.devButtonText}>Doctor</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.devButton, styles.devButtonAdmin]}
                      onPress={() => handleAutoFill("admin")}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={16}
                        color={healthColors.accent.coral}
                      />
                      <Text style={styles.devButtonText}>Admin</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Login Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[
                    healthColors.primary.main,
                    healthColors.primary.dark,
                  ]}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={healthColors.neutral.white} />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Login</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color={healthColors.neutral.white}
                      />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Demo Credentials - Only shown in development */}
            {__DEV__ && (
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Development Credentials:</Text>
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Patient:</Text>
                  <Text style={styles.demoValue}>patient / password123</Text>
                </View>
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Doctor:</Text>
                  <Text style={styles.demoValue}>doctor / password123</Text>
                </View>
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Admin:</Text>
                  <Text style={styles.demoValue}>admin / password123</Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={healthColors.text.tertiary}
            />
            <Text style={styles.footerText}>
              Secure Login • Your data is protected
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
    backgroundColor: healthColors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 50,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...theme.shadows.xl,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.withOpacity(theme.colors.text.white, 0.15),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.withOpacity(theme.colors.text.white, 0.3),
    ...theme.shadows.lg,
  },
  appName: {
    fontSize: 32,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.neutral.white,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: theme.withOpacity(theme.colors.text.white, 0.95),
    fontWeight: theme.typography.weights.regular,
    letterSpacing: 0.3,
  },
  formCard: {
    marginTop: -32,
    marginHorizontal: getScreenPadding(),
    maxWidth: isTablet() ? 500 : 420,
    width: "100%",
    alignSelf: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: theme.withOpacity(theme.colors.grays.black, 0.05),
    ...theme.shadows.xl,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 14,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.regular,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  roleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.main + "08",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: healthColors.primary.main + "15",
  },
  roleText: {
    fontSize: 11,
    color: healthColors.primary.main,
    marginLeft: 6,
    fontWeight: theme.typography.weights.medium,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: healthColors.text.tertiary,
    marginBottom: 6,
    fontWeight: theme.typography.weights.medium,
  },
  labelFocused: {
    color: healthColors.primary.main,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.tertiary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: healthColors.card.border,
    paddingHorizontal: 16,
    paddingVertical:
      Platform.OS === "ios" ? 14 : 10,
    minHeight: 52,
    ...theme.shadows.sm,
  },
  inputWrapperFocused: {
    borderColor: healthColors.primary.main,
    backgroundColor: healthColors.background.card,
    borderWidth: 2,
    ...theme.shadows.md,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.regular,
    paddingVertical: 0,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: 8,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
  loginButton: {
    borderRadius: 14,
    overflow: "hidden",
    ...theme.shadows.lg,
    minHeight: 54,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 28,
    gap: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.neutral.white,
    letterSpacing: 0.5,
  },
  demoSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: healthColors.background.tertiary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.card.border,
    borderStyle: "dashed",
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.secondary,
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: healthColors.text.tertiary,
  },
  // Development Helper Styles
  devHelper: {
    marginTop: 16,
    backgroundColor: healthColors.info.main + "08",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.info.main + "20",
    overflow: "hidden",
  },
  devToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 6,
  },
  devToggleText: {
    fontSize: 12,
    color: healthColors.info.main,
    fontWeight: theme.typography.weights.semiBold,
  },
  devButtons: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    paddingTop: 0,
  },
  devButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: healthColors.background.card,
  },
  devButtonPatient: {
    borderColor: healthColors.primary.main + "40",
  },
  devButtonDoctor: {
    borderColor: healthColors.secondary.main + "40",
  },
  devButtonAdmin: {
    borderColor: healthColors.accent.coral + "40",
  },
  devButtonText: {
    fontSize: 11,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.text.primary,
  },
});

export default UnifiedLoginScreen;



