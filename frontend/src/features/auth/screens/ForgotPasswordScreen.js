import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Key, Mail, CheckCircle, ShieldCheck, Shield } from "lucide-react-native";
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { theme, healthColors } from '@/theme';
import Routes from '@/navigation/routes';
import {
  showError,
  showSuccess,
  validateEmail,
  validatePhone,
} from '@/utils/errorHandler';
import { handleSmartBack } from '@/utils/navigation';

const ForgotPasswordScreen = ({ navigation, route }) => {
  const userType = route?.params?.userType || "user";
  const isHospital = userType === "hospital";
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent] = useState(false);

  const gradientColors = isHospital
    ? [theme.colors.success.background, theme.colors.background.primary]
    : [theme.colors.info.background, theme.colors.background.primary];
  const iconColor = isHospital
    ? theme.colors.success.dark
    : theme.colors.info.main;
  const iconGradient = isHospital
    ? [theme.colors.success.light, theme.colors.success.main]
    : [theme.colors.info.light, theme.colors.info.main];

  const handleEmailChange = useCallback((text) => {
    setEmail(text);
    setErrors(prev => prev.email ? { ...prev, email: "" } : prev);
  }, []);

  const handleSendOTP = () => {
    // Validation
    const newErrors = {};
    if (!email) {
      newErrors.email = isHospital
        ? "Hospital ID or Email is required"
        : "Email or Phone is required";
      setErrors(newErrors);
      return;
    }

    // Validate email or phone format
    if (!isHospital && email.includes("@")) {
      if (!validateEmail(email)) {
        showError("Please enter a valid email address");
        return;
      }
    } else if (!isHospital && !email.includes("@")) {
      if (!validatePhone(email)) {
        showError("Please enter a valid phone number");
        return;
      }
    }

    // Show success message
    showSuccess(
      `OTP sent successfully to ${email}. Please check your ${email.includes("@") ? "email" : "phone"}.`,
      "OTP Sent"
    );
    setEmailSent(true);

    // Navigate to reset password or OTP verification
    setTimeout(() => {
      navigation.navigate(Routes.AUTH.RESET_PASSWORD, { email, userType });
    }, 1500);
  };

  const handleBack = () => {
    handleSmartBack(navigation, Routes.AUTH.LOGIN);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={24} color={iconColor} />
            </TouchableOpacity>

            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <LinearGradient
                  colors={iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Key
                    size={36}
                    color={theme.colors.text.white}
                  />
                </LinearGradient>
              </View>
              <Text style={[styles.title, isHospital && styles.hospitalText]}>
                Forgot Password?
              </Text>
              <Text
                style={[styles.subtitle, isHospital && styles.hospitalSubtext]}
              >
                {emailSent
                  ? "Check your email for reset instructions"
                  : `Enter your ${isHospital ? "Hospital ID or email" : "registered email or phone"} to reset password`}
              </Text>
            </View>

            {!emailSent ? (
              <>
                {/* Form Section */}
                <View style={styles.form}>
                  <Input
                    label={
                      isHospital ? "Hospital ID or Email" : "Email or Phone"
                    }
                    placeholder={isHospital ? "HOS123456" : "example@email.com"}
                    value={email}
                    onChangeText={handleEmailChange}
                    error={errors.email}
                    leftIcon={<Mail size={20} color={iconColor} />}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <Button
                    variant="primary"
                    size="large"
                    onPress={handleSendOTP}
                    style={[
                      styles.sendButton,
                      isHospital && styles.hospitalButton,
                    ]}
                  >
                    <Text>Send Reset Link</Text>
                  </Button>
                </View>

                {/* Back to Login */}
                <View style={styles.backToLogin}>
                  <Text style={styles.backToLoginText}>
                    Remember your password?
                  </Text>
                  <TouchableOpacity
                    onPress={handleBack}
                    accessibilityRole="button"
                    accessibilityLabel="Back to login"
                  >
                    <Text
                      style={[
                        styles.backToLoginLink,
                        isHospital && styles.hospitalLink,
                      ]}
                    >
                      Back to Login
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <CheckCircle size={64} color={iconColor} />
                </View>
                <Text style={styles.successText}>Email Sent Successfully!</Text>
                <Text style={styles.successSubtext}>
                  We&#39;ve sent password reset instructions to {email}
                </Text>
              </View>
            )}

            {/* Footer Info */}
            <View style={styles.footer}>
              {isHospital ? (
                <ShieldCheck
                  size={20}
                  color={theme.colors.success.dark}
                />
              ) : (
                <Shield
                  size={16}
                  color={healthColors.text.secondary}
                />
              )}
              <Text
                style={[styles.footerText, isHospital && styles.hospitalFooter]}
              >
                Secure password reset process
              </Text>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl - theme.spacing.md,
    paddingBottom: theme.spacing.xl + theme.spacing.sm,
  },
  backButton: {
    width: theme.touchTargets.md,
    height: theme.touchTargets.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: healthColors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xxl,
  },
  iconWrapper: {
    marginBottom: theme.spacing.lg,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.sm + theme.spacing[2],
    letterSpacing: 0.3,
  },
  hospitalText: {
    color: theme.colors.success.dark,
  },
  subtitle: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.secondary,
    textAlign: "center",
    letterSpacing: 0.2,
    paddingHorizontal: theme.spacing.md + theme.spacing[4],
    lineHeight: 22,
  },
  hospitalSubtext: {
    color: theme.colors.success.dark,
  },
  form: {
    marginBottom: theme.spacing.xl + theme.spacing.xs,
  },
  sendButton: {
    marginTop: theme.spacing.md,
    height: 56,
  },
  hospitalButton: {
    backgroundColor: healthColors.success.dark,
  },
  backToLogin: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.lg + theme.spacing[4],
  },
  backToLoginText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.secondary,
  },
  backToLoginLink: {
    marginLeft: theme.spacing.sm - theme.spacing[2],
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
  },
  hospitalLink: {
    color: theme.colors.success.dark,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: theme.spacing.xxl,
  },
  successIcon: {
    marginBottom: theme.spacing.lg + theme.spacing[4],
  },
  successText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.sm + theme.spacing[1],
  },
  successSubtext: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: theme.spacing.md + theme.spacing[4],
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xl + theme.spacing.sm + theme.spacing[4],
    paddingTop: theme.spacing.lg + theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  footerText: {
    marginLeft: theme.spacing.sm + theme.spacing[2],
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
    textAlign: "center",
    lineHeight: 18,
  },
  hospitalFooter: {
    color: theme.colors.success.dark,
  },
});

export default ForgotPasswordScreen;
