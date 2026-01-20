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
import { healthColors } from "../../theme/healthColors";
import { indianDesign, createShadow } from "../../theme/indianDesign";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../store/slices/authSlice";
import {
  getScreenPadding,
  moderateScale,
  verticalScale,
  scaledFontSize,
  getSafeAreaEdges,
  getKeyboardConfig,
  getInputHeight,
  getContainerWidth,
  isTablet,
} from "../../utils/responsive";
import { showError, validateRequiredFields } from "../../utils/errorHandler";

// Development auto-fill credentials (only available in __DEV__ mode)
const DEV_CREDENTIALS = __DEV__
  ? {
      patient: { userId: "PAT001", password: "password123" },
      doctor: { userId: "DOC001", password: "password123" },
      admin: { userId: "ADM001", password: "password123" },
    }
  : null;

const UnifiedLoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
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
            { paddingBottom: Math.max(insets.bottom, moderateScale(20)) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Gradient */}
          <LinearGradient
            colors={[
              healthColors.primary.main,
              healthColors.primary.dark,
              "#1565C0",
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
                  editable={!loading}
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
                  editable={!loading}
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
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                activeOpacity={0.8}
                disabled={loading}
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
                  {loading ? (
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
                  <Text style={styles.demoLabel}>Admin:</Text>
                  <Text style={styles.demoValue}>ADM001 / password123</Text>
                </View>
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Doctor:</Text>
                  <Text style={styles.demoValue}>DOC001 / password123</Text>
                </View>
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Patient:</Text>
                  <Text style={styles.demoValue}>PAT001 / password123</Text>
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
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(50),
    alignItems: "center",
    borderBottomLeftRadius: moderateScale(32),
    borderBottomRightRadius: moderateScale(32),
    ...createShadow(8),
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(16),
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...createShadow(4),
  },
  appName: {
    fontSize: scaledFontSize(32),
    fontWeight: "700",
    color: healthColors.neutral.white,
    marginBottom: moderateScale(6),
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: scaledFontSize(14),
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  formCard: {
    marginTop: moderateScale(-32),
    marginHorizontal: getScreenPadding(),
    maxWidth: isTablet() ? moderateScale(500) : moderateScale(420),
    width: "100%",
    alignSelf: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: moderateScale(24),
    padding: moderateScale(28),
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    ...createShadow(8),
  },
  welcomeSection: {
    marginBottom: moderateScale(24),
  },
  welcomeText: {
    fontSize: scaledFontSize(26),
    fontWeight: "700",
    color: healthColors.text.primary,
    marginBottom: moderateScale(8),
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    fontWeight: "400",
    lineHeight: scaledFontSize(20),
    letterSpacing: 0.2,
  },
  roleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.primary.main + "08",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(24),
    borderWidth: 1,
    borderColor: healthColors.primary.main + "15",
  },
  roleText: {
    fontSize: scaledFontSize(11),
    color: healthColors.primary.main,
    marginLeft: moderateScale(6),
    fontWeight: indianDesign.fontWeight.medium,
  },
  inputContainer: {
    marginBottom: moderateScale(16),
  },
  label: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.tertiary,
    marginBottom: moderateScale(6),
    fontWeight: indianDesign.fontWeight.medium,
  },
  labelFocused: {
    color: healthColors.primary.main,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.tertiary,
    borderRadius: moderateScale(14),
    borderWidth: 1.5,
    borderColor: healthColors.card.border,
    paddingHorizontal: moderateScale(16),
    paddingVertical:
      Platform.OS === "ios" ? moderateScale(14) : moderateScale(10),
    minHeight: moderateScale(52),
    ...createShadow(1),
  },
  inputWrapperFocused: {
    borderColor: healthColors.primary.main,
    backgroundColor: healthColors.background.card,
    borderWidth: 2,
    ...createShadow(2),
  },
  inputIcon: {
    marginRight: moderateScale(10),
  },
  input: {
    flex: 1,
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
    fontWeight: indianDesign.fontWeight.regular,
    paddingVertical: 0,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: moderateScale(24),
    marginTop: moderateScale(8),
    paddingVertical: moderateScale(4),
  },
  forgotPasswordText: {
    fontSize: scaledFontSize(12),
    color: healthColors.primary.main,
    fontWeight: indianDesign.fontWeight.medium,
  },
  loginButton: {
    borderRadius: moderateScale(14),
    overflow: "hidden",
    ...createShadow(4),
    minHeight: moderateScale(54),
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(28),
    gap: moderateScale(10),
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: scaledFontSize(17),
    fontWeight: "700",
    color: healthColors.neutral.white,
    letterSpacing: 0.5,
  },
  demoSection: {
    marginTop: moderateScale(20),
    padding: moderateScale(16),
    backgroundColor: healthColors.background.tertiary,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: healthColors.card.border,
    borderStyle: "dashed",
  },
  demoTitle: {
    fontSize: scaledFontSize(12),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.secondary,
    marginBottom: moderateScale(8),
  },
  demoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
  },
  demoLabel: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.tertiary,
    fontWeight: indianDesign.fontWeight.medium,
  },
  demoValue: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.primary,
    fontWeight: indianDesign.fontWeight.medium,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(24),
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(6),
  },
  footerText: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.tertiary,
  },
  // Development Helper Styles
  devHelper: {
    marginTop: moderateScale(16),
    backgroundColor: healthColors.info.main + "08",
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: healthColors.info.main + "20",
    overflow: "hidden",
  },
  devToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8),
    gap: moderateScale(6),
  },
  devToggleText: {
    fontSize: scaledFontSize(12),
    color: healthColors.info.main,
    fontWeight: "600",
  },
  devButtons: {
    flexDirection: "row",
    gap: moderateScale(8),
    padding: moderateScale(12),
    paddingTop: 0,
  },
  devButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: moderateScale(6),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
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
    fontSize: scaledFontSize(11),
    fontWeight: "600",
    color: healthColors.text.primary,
  },
});

export default UnifiedLoginScreen;
