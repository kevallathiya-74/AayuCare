import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { theme, healthColors } from '@/theme';
import authService from '@/features/auth/api/auth.service';
import { logoutUser } from '@/store/slices/authSlice';
import { logError, parseError } from '@/utils/errorHandler';
import { Input, Button } from '@/components/common';
import { handleSmartBack } from '@/utils/navigation';

const ChangePasswordScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      authService.changePassword(currentPassword, newPassword),
    retry: 1,
  });

  const rules = useMemo(
    () => ({
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
    }),
    [newPassword]
  );

  const isStrongPassword =
    rules.minLength && rules.hasUpper && rules.hasLower && rules.hasNumber;

  const validateForm = () => {
    const nextErrors = {};

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      nextErrors.newPassword = "New password is required";
    } else if (!isStrongPassword) {
      nextErrors.newPassword =
        "Password must be 8+ chars with uppercase, lowercase, and number";
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword =
        "New password must be different from current password";
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your new password";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError("");
    if (!validateForm()) {
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      await dispatch(logoutUser()).unwrap();
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    } catch (error) {
      const message = parseError(error);
      setSubmitError(message);
      logError(error, { context: "ChangePasswordScreen.handleSubmit" });
    }
  };

  const renderPasswordInput = ({
    label,
    value,
    onChangeText,
    secure,
    placeholder,
    error,
  }) => (
    <Input
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secure}
      error={error}
      disabled={changePasswordMutation.isPending}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => handleSmartBack(navigation, "Settings")}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        > 
          <ArrowLeft  size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Your Password</Text>
          <Text style={styles.cardSubtitle}>
            For account security, use a strong password and do not reuse old passwords.
          </Text>

          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}

          {renderPasswordInput({
            label: "Current Password",
            value: currentPassword,
            onChangeText: (text) => {
              setCurrentPassword(text);
              if (fieldErrors.currentPassword) {
                setFieldErrors((prev) => ({ ...prev, currentPassword: "" }));
              }
            },
            secure: true,
            placeholder: "Enter current password",
            error: fieldErrors.currentPassword,
          })}

          {renderPasswordInput({
            label: "New Password",
            value: newPassword,
            onChangeText: (text) => {
              setNewPassword(text);
              if (fieldErrors.newPassword) {
                setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
              }
            },
            secure: true,
            placeholder: "Enter new password",
            error: fieldErrors.newPassword,
          })}

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Password must include:</Text>
            <Text style={[styles.ruleText, rules.minLength && styles.ruleTextValid]}>
              • At least 8 characters
            </Text>
            <Text style={[styles.ruleText, rules.hasUpper && styles.ruleTextValid]}>
              • One uppercase letter
            </Text>
            <Text style={[styles.ruleText, rules.hasLower && styles.ruleTextValid]}>
              • One lowercase letter
            </Text>
            <Text style={[styles.ruleText, rules.hasNumber && styles.ruleTextValid]}>
              • One number
            </Text>
          </View>

          {renderPasswordInput({
            label: "Confirm New Password",
            value: confirmPassword,
            onChangeText: (text) => {
              setConfirmPassword(text);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }
            },
            secure: true,
            placeholder: "Confirm new password",
            error: fieldErrors.confirmPassword,
          })}

          <Button
            variant="primary"
            size="large"
            fullWidth
            gradient
            loading={changePasswordMutation.isPending}
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Change Password
          </Button>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    width: 40,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    ...theme.shadows.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  cardSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  submitError: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.error.main,
    marginBottom: theme.spacing.sm,
    backgroundColor: healthColors.error.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  inputBlock: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.primary,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.primary,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  },
  inputWrapperError: {
    borderColor: healthColors.error.main,
  },
  input: {
    flex: 1,
    color: healthColors.text.primary,
    fontSize: theme.typography.sizes.bodyMedium,
    paddingVertical: theme.spacing.sm,
  },
  fieldError: {
    marginTop: theme.spacing.xs,
    color: healthColors.error.main,
    fontSize: theme.typography.sizes.overline,
  },
  rulesBox: {
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  rulesTitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  ruleText: {
    fontSize: theme.typography.sizes.overline,
    color: healthColors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  ruleTextValid: {
    color: healthColors.success.main,
  },
  submitButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: healthColors.primary.main,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: healthColors.button.disabled,
  },
  submitButtonText: {
    color: healthColors.text.white,
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
  },
});

export default ChangePasswordScreen;
