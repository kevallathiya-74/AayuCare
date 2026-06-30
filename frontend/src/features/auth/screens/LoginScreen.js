/**
 * Login Screen
 * Premium SaaS UI - HealthCare UX
 * Supports: Admin, Doctor, Patient roles
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Dimensions
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, User, Lock, AlertCircle, ShieldCheck, ArrowRight, HeartPulse } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from '@/theme';
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from '@/store/slices/authSlice';
import { Input, Button, DynamicIcon } from '@/components/common';

const { width, height } = Dimensions.get('window');

// Development auto-fill credentials
const DEV_CREDENTIALS = __DEV__
  ? {
      patient: { userId: "pat1", password: "password123" },
      doctor: { userId: "doc1", password: "password123" },
      admin: { userId: "adm1", password: "password123" },
    }
  : null;

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showDevHelper, setShowDevHelper] = useState(false);
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
  }, []);

  const handleAutoFill = useCallback((role) => {
    const creds = DEV_CREDENTIALS[role];
    setUserId(creds.userId);
    setPassword(creds.password);
    setFormError("");
    setFieldErrors({ userId: "", password: "" });
    setShowDevHelper(false);
  }, []);

  const handleLogin = useCallback(async () => {
    Keyboard.dismiss();

    const newErrors = { userId: "", password: "" };
    if (!userId.trim()) newErrors.userId = "User ID is required";
    if (!password) newErrors.password = "Password is required";

    if (newErrors.userId || newErrors.password) {
      setFieldErrors(newErrors);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
      ]).start();
      return;
    }

    setFieldErrors({ userId: "", password: "" });
    setFormError("");
    setIsLoading(true);

    try {
      await dispatch(loginUser({ userId, password })).unwrap();
    } catch (error) {
      setFormError(error?.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, password, dispatch, scaleAnim]);

  const onUserIdChange = useCallback((text) => {
    setUserId(text);
    if (fieldErrors.userId || formError) {
        setFieldErrors(prev => ({ ...prev, userId: "" }));
        setFormError("");
    }
  }, [fieldErrors.userId, formError]);

  const onPasswordChange = useCallback((text) => {
    setPassword(text);
    if (fieldErrors.password || formError) {
        setFieldErrors(prev => ({ ...prev, password: "" }));
        setFormError("");
    }
  }, [fieldErrors.password, formError]);

  const FormContent = (
    <>
      <LinearGradient
        colors={['#0F766E', '#14B8A6', '#0EA5E9']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1.5 }}
      >
        {/* Glassmorphism Abstract Shapes */}
        <View style={styles.abstractShape1} pointerEvents="none" />
        <View style={styles.abstractShape2} pointerEvents="none" />
        
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <View style={styles.logoOuter}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.logoInner}
            >
              <HeartPulse size={42} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </View>
          <Text style={styles.appName} accessibilityRole="header">AayuCare</Text>
          <Text style={styles.tagline}>Elevating Healthcare Together</Text>
        </Animated.View>
      </LinearGradient>

      {/* ── Login Form Card ── */}
      <Animated.View 
        style={[
          styles.formCard, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Sign In</Text>
          <Text style={styles.subtitleText}>
            Enter your credentials to continue
          </Text>
        </View>

        {/* Role Indicators */}
        <View style={styles.rolePills} accessible={true} accessibilityLabel="Roles available: Admin, Doctor, Patient">
          {['Admin', 'Doctor', 'Patient'].map((role, idx) => (
            <View key={role} style={styles.roleBadge}>
              <View style={[styles.roleDot, { backgroundColor: idx === 0 ? healthColors.accent.coral : idx === 1 ? healthColors.secondary.main : healthColors.primary.main }]} />
              <Text style={styles.roleBadgeText}>{role}</Text>
            </View>
          ))}
        </View>

        {/* ── User ID Input ── */}
        <View style={styles.inputGroup}>
          <Input
            label="Email or User ID"
            value={userId}
            onChangeText={onUserIdChange}
            placeholder="e.g. pat1, doc1, admin@aayucare.com"
            leftIcon={<User size={20} color={healthColors.text.tertiary} />}
            error={fieldErrors.userId}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            editable={!isLoading}
            style={styles.inputSpacing}
            accessibilityLabel="Email or User ID Input"
          />
        </View>

        {/* ── Password Input ── */}
        <View style={styles.inputGroup}>
          <Input
            label="Password"
            value={password}
            onChangeText={onPasswordChange}
            placeholder="Enter your password"
            leftIcon={<Lock size={20} color={healthColors.text.tertiary} />}
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

        {/* Form-level error */}
        {!!formError && (
          <View style={styles.formErrorContainer} accessibilityRole="alert">
            <AlertCircle size={18} color="#EF4444" />
            <Text style={styles.formErrorText}>{formError}</Text>
          </View>
        )}

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => navigation.navigate("ForgotPassword")}
          activeOpacity={0.6}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          accessibilityRole="button"
          accessibilityLabel="Forgot Password"
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* ── Login Button ── */}
        <Animated.View style={[styles.loginBtnWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <Button
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginBtn}
            gradient
            fullWidth
            icon={!isLoading ? <ArrowRight size={20} color="#FFFFFF" /> : null}
            iconPosition="right"
            accessibilityRole="button"
            accessibilityLabel="Continue to Login"
          >
            Continue
          </Button>
        </Animated.View>

        {/* ── Dev Quick-Login Helper ── */}
        {__DEV__ && (
          <View style={styles.devHelperWrapper}>
            <TouchableOpacity
              style={styles.devToggle}
              onPress={() => setShowDevHelper(!showDevHelper)}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityRole="button"
              accessibilityLabel="Toggle Developer Accounts"
            >
              <Text style={styles.devToggleText}>
                {showDevHelper ? "Hide Dev Accounts" : "Show Dev Accounts"}
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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Login quickly as ${role}`}
                  >
                    <DynamicIcon name={icon} size={16} color={color} />
                    <Text style={styles.devButtonText}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </Animated.View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <ShieldCheck size={16} color={healthColors.primary.main} />
        <Text style={styles.footerText}>
          End-to-end encrypted · HIPAA Compliant
        </Text>
      </View>
    </>
  );

  const ScrollContainer = (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Math.max(insets.bottom + 24, 40) },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {FormContent}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0B5E56" />

      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
          {ScrollContainer}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.keyboardView}>
          {ScrollContainer}
        </View>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ── Premium Header ──
  header: {
    height: height * 0.38,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  abstractShape1: {
    position: 'absolute',
    top: -50,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  abstractShape2: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -20,
  },
  logoOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
    fontWeight: '500',
  },

  // ── Glassmorphic Form Card ──
  formCard: {
    marginTop: -45,
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    paddingTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 8,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitleText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  rolePills: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputSpacing: {
    marginBottom: 0,
  },

  // ── Errors & Helpers ──
  formErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  formErrorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 28,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '600',
  },

  // ── Login Button ──
  loginBtnWrapper: { 
    width: "100%", 
    marginBottom: 16,
  },
  loginBtn: {
    height: 56,
    borderRadius: 16,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Dev Helper ──
  devHelperWrapper: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  devToggle: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  devToggleText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  devButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  devButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  devButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: '#334155',
  },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    paddingBottom: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default LoginScreen;
