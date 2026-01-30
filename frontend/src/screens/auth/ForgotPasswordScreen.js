import React, { useState } from "react";
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
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { theme, healthColors } from "../../theme";
import {
  showError,
  showSuccess,
  validateEmail,
  validatePhone,
} from "../../utils/errorHandler";

const ForgotPasswordScreen = ({ navigation, route }) => {
  const userType = route?.params?.userType || "user";
  const isHospital = userType === "hospital";
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent] = useState(false);

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
      navigation.navigate("ResetPassword", { email, userType });
    }, 1500);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      const loginScreen = "Login"; // Unified login screen for all user types
      navigation.navigate(loginScreen);
    }
  };

  const gradientColors = isHospital
    ? [theme.colors.success.background, theme.colors.background.primary]
    : [theme.colors.info.background, theme.colors.background.primary];
  const iconColor = isHospital
    ? theme.colors.success.dark
    : theme.colors.info.main;
  const iconGradient = isHospital
    ? [theme.colors.success.light, theme.colors.success.main]
    : [theme.colors.info.light, theme.colors.info.main];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
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
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Feather name="arrow-left" size={24} color={iconColor} />
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
                  <Feather
                    name="key"
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
                    onChangeText={(text) => {
                      setEmail(text);
                      setErrors({ ...errors, email: "" });
                    }}
                    error={errors.email}
                    leftIcon={
                      <Feather name="mail" size={20} color={iconColor} />
                    }
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
                    Send Reset Link
                  </Button>
                </View>

                {/* Back to Login */}
                <View style={styles.backToLogin}>
                  <Text style={styles.backToLoginText}>
                    Remember your password?
                  </Text>
                  <TouchableOpacity onPress={handleBack}>
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
                  <Feather name="check-circle" size={64} color={iconColor} />
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
                <MaterialCommunityIcons
                  name="shield-check"
                  size={20}
                  color={theme.colors.success.dark}
                />
              ) : (
                <Feather
                  name="shield"
                  size={16}
                  color={healthColors.textSecondary}
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
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: healthColors.background.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...theme.shadows.md,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 10,
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
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  hospitalSubtext: {
    color: theme.colors.success.dark,
  },
  form: {
    marginBottom: 36,
  },
  sendButton: {
    marginTop: 16,
    height: 56,
  },
  hospitalButton: {
    backgroundColor: healthColors.success.dark,
  },
  backToLogin: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  backToLoginText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.secondary,
  },
  backToLoginLink: {
    marginLeft: 6,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
  },
  hospitalLink: {
    color: theme.colors.success.dark,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  successIcon: {
    marginBottom: 28,
  },
  successText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 14,
  },
  successSubtext: {
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.regular,
    color: healthColors.text.secondary,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 44,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: healthColors.card.border,
  },
  footerText: {
    marginLeft: 10,
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
