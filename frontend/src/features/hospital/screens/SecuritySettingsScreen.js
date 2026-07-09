/**
 * Security Settings Screen
 * Password management, session control, and security statistics
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, RefreshCw, ShieldCheck, Clock, Calendar, Lock, Smartphone, ChevronRight, LogOut, X } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { theme, healthColors } from '@/theme';
import { queryKeys } from '@/config/reactQueryConfig';
import { showError, logError, parseError } from '@/utils/errorHandler';
import { formatDate } from '@/utils/helpers';
import adminService from '@/services/admin.service';
import { logoutUser } from '@/store/slices/authSlice';
import { SkeletonCardRow, Input } from '@/components/common';
import { DynamicIcon } from '@/components/common';
import { handleSmartBack } from '@/utils/navigation';

const SecuritySettingsScreen = ({ navigation }) => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSubmitError, setPasswordSubmitError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasLower: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
  };

  const isPasswordValid =
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasLower &&
    passwordRules.hasNumber;

  const doPasswordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  const canSubmitPassword =
    currentPassword.trim().length > 0 &&
    isPasswordValid &&
    doPasswordsMatch &&
    !passwordLoading;

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
    setPasswordSubmitError("");
  };

  const forceLogoutToLogin = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (logoutError) {
      logError(logoutError, {
        context: "SecuritySettingsScreen.forceLogoutToLogin",
      });
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  };

  const {
    data: securityData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: queryKeys.doctors.list({ scope: "security-settings" }),
    staleTime: 60 * 1000,
    enabled: !!user?.id && user?.role === "admin",
    queryFn: async () => {
      const response = await adminService.getSecuritySettings();
      return response?.data || null;
    },
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleChangePassword = async () => {
    const nextErrors = {};
    setPasswordSubmitError("");

    if (!currentPassword) {
      nextErrors.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      nextErrors.newPassword = "New password is required";
    } else if (!isPasswordValid) {
      nextErrors.newPassword =
        "Password must be 8+ chars with uppercase, lowercase, and number";
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword =
        "New password must be different from current password";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm new password";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "New passwords do not match";
    }

    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    Alert.alert(
      "Change Password",
      "Are you sure you want to change your password? You will be logged out.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          style: "destructive",
          onPress: async () => {
            try {
              setPasswordLoading(true);
              await adminService.changePassword(currentPassword, newPassword);
              Alert.alert(
                "Success",
                "Password changed successfully. Please login again.",
                [
                  {
                    text: "OK",
                    onPress: forceLogoutToLogin,
                  },
                ]
              );
              closePasswordModal();
            } catch (error) {
              const errorMessage = parseError(error);
              setPasswordSubmitError(errorMessage);
              logError(error, {
                context: "SecuritySettingsScreen.handleChangePassword",
              });
            } finally {
              setPasswordLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogoutAll = () => {
    Alert.alert(
      "Logout All Devices",
      "This will logout all devices including this one. You will need to login again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout All",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await adminService.logoutAllDevices();
              Alert.alert(
                "Success",
                "Logged out from all devices successfully",
                [
                  {
                    text: "OK",
                    onPress: forceLogoutToLogin,
                  },
                ]
              );
            } catch (error) {
              showError("Failed to logout from all devices");
              logError(error, {
                context: "SecuritySettingsScreen.handleLogoutAll",
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View
        style={[styles.statIconContainer, { backgroundColor: color + "15" }]}
      >
        <DynamicIcon name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  if (isLoading && !securityData) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => handleSmartBack(navigation, "AdminTabs")}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <DynamicIcon
              name="arrow-back"
              size={24}
              color={healthColors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Settings</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((i) => (<SkeletonCardRow key={i} />))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => handleSmartBack(navigation, "AdminTabs")}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onRefresh}
          disabled={isRefetching}
          accessibilityRole="button"
          accessibilityLabel="Refresh security settings"
          accessibilityState={{ disabled: isRefetching }}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color={healthColors.primary.main} />
          ) : (
            <RefreshCw
              
              size={24}
              color={healthColors.primary.main}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[healthColors.primary.main]}
            tintColor={healthColors.primary.main}
          />
        }
      >
        {/* Account Security Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Security</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusIcon,
                  { backgroundColor: theme.withOpacity(healthColors.success.main, 0.08) },
                ]}
              >
                <ShieldCheck
                  
                  size={32}
                  color={healthColors.success.main}
                />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Account Status</Text>
                <Text style={styles.statusSubtitle}>
                  {securityData?.user?.isVerified
                    ? "Verified Account"
                    : "Not Verified"}
                </Text>
              </View>
            </View>
            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Clock
                  
                  size={18}
                  color={healthColors.text.secondary}
                />
                <Text style={styles.statusLabel}>Last Login:</Text>
                <Text style={styles.statusValue}>
                  {securityData?.lastActivity}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Calendar
                  
                  size={18}
                  color={healthColors.text.secondary}
                />
                <Text style={styles.statusLabel}>Account Created:</Text>
                <Text style={styles.statusValue}>
                  {formatDate(securityData?.user?.accountCreated)}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Lock
                  
                  size={18}
                  color={healthColors.text.secondary}
                />
                <Text style={styles.statusLabel}>Password Updated:</Text>
                <Text style={styles.statusValue}>
                  {securityData?.user?.lastPasswordChange
                    ? formatDate(securityData.user.lastPasswordChange)
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Smartphone
                  
                  size={18}
                  color={healthColors.text.secondary}
                />
                <Text style={styles.statusLabel}>My Active Sessions:</Text>
                <Text style={styles.statusValue}>
                  {securityData?.user?.myActiveSessions ?? 0}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Statistics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              "Active Sessions",
              securityData?.statistics?.activeSessions || 0,
              "people",
              healthColors.success.main
            )}
            {renderStatCard(
              "Recent Logins",
              securityData?.statistics?.recentLogins || 0,
              "log-in",
              healthColors.info.main
            )}
            {renderStatCard(
              "Verified Users",
              securityData?.statistics?.verifiedUsers || 0,
              "checkmark-circle",
              healthColors.primary.main
            )}
            {renderStatCard(
              "Active Users (7d)",
              securityData?.statistics?.activeUsers7d || 0,
              "pulse",
              healthColors.warning.main
            )}
          </View>
        </View>

        {/* Security Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Actions</Text>

          {/* Change Password */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowPasswordModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Change password"
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08) },
              ]}
            >
              <Lock
                
                size={24}
                color={healthColors.primary.main}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtitle}>
                Update your account password
              </Text>
            </View>
            <ChevronRight
              
              size={24}
              color={healthColors.text.tertiary}
            />
          </TouchableOpacity>

          {/* Logout All Devices */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleLogoutAll}
            disabled={actionLoading}
            accessibilityRole="button"
            accessibilityLabel="Logout all devices"
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: theme.withOpacity(healthColors.error.main, 0.08) },
              ]}
            >
              <LogOut
                
                size={24}
                color={healthColors.error.main}
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Logout All Devices</Text>
              <Text style={styles.actionSubtitle}>End all active sessions</Text>
            </View>
            {actionLoading ? (
              <ActivityIndicator size="small" color={healthColors.error.main} />
            ) : (
              <ChevronRight
                
                size={24}
                color={healthColors.text.tertiary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Password Change Modal */}
        <Modal statusBarTranslucent
          visible={showPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={closePasswordModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity
                  onPress={closePasswordModal}
                  accessibilityRole="button"
                  accessibilityLabel="Close password modal"
                >
                  <X
                    
                    size={24}
                    color={healthColors.text.primary}
                  />
                </TouchableOpacity>
              </View>

              {!!passwordSubmitError && (
                <Text style={styles.passwordSubmitError}>{passwordSubmitError}</Text>
              )}

              <Input
                label="Current Password"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (passwordErrors.currentPassword || passwordSubmitError) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      currentPassword: "",
                    }));
                    setPasswordSubmitError("");
                  }
                }}
                secureTextEntry
                placeholder="Enter current password"
                error={passwordErrors.currentPassword}
              />

              <Input
                label="New Password"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (passwordErrors.newPassword || passwordSubmitError) {
                    setPasswordErrors((prev) => ({ ...prev, newPassword: "" }));
                    setPasswordSubmitError("");
                  }
                }}
                secureTextEntry
                placeholder="Enter new password"
                error={passwordErrors.newPassword}
              />

              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (passwordErrors.confirmPassword || passwordSubmitError) {
                    setPasswordErrors((prev) => ({
                      ...prev,
                      confirmPassword: "",
                    }));
                    setPasswordSubmitError("");
                  }
                }}
                secureTextEntry
                placeholder="Confirm new password"
                error={passwordErrors.confirmPassword}
              />
              {!!confirmPassword && (
                <Text
                  style={[
                    styles.passwordHint,
                    {
                      color: doPasswordsMatch
                        ? healthColors.success.main
                        : healthColors.error.main,
                    },
                  ]}
                >
                  {doPasswordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </Text>
              )}

              <View style={styles.passwordRulesContainer}>
                <Text style={styles.passwordRulesTitle}>Password must include:</Text>
                <Text
                  style={[
                    styles.passwordRule,
                    {
                      color: passwordRules.minLength
                        ? healthColors.success.main
                        : healthColors.text.secondary,
                    },
                  ]}
                >
                  • At least 8 characters
                </Text>
                <Text
                  style={[
                    styles.passwordRule,
                    {
                      color: passwordRules.hasUpper
                        ? healthColors.success.main
                        : healthColors.text.secondary,
                    },
                  ]}
                >
                  • One uppercase letter
                </Text>
                <Text
                  style={[
                    styles.passwordRule,
                    {
                      color: passwordRules.hasLower
                        ? healthColors.success.main
                        : healthColors.text.secondary,
                    },
                  ]}
                >
                  • One lowercase letter
                </Text>
                <Text
                  style={[
                    styles.passwordRule,
                    {
                      color: passwordRules.hasNumber
                        ? healthColors.success.main
                        : healthColors.text.secondary,
                    },
                  ]}
                >
                  • One number
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closePasswordModal}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel password change"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !canSubmitPassword && styles.submitButtonDisabled,
                  ]}
                  onPress={handleChangePassword}
                  disabled={!canSubmitPassword}
                  accessibilityRole="button"
                  accessibilityLabel="Submit password change"
                  accessibilityState={{ disabled: !canSubmitPassword }}
                >
                  {passwordLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>Change Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    ...theme.shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statusCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    borderCurve: "continuous",
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  statusDetails: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  statusLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    flex: 1,
  },
  statusValue: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    borderCurve: "continuous",
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderLeftWidth: 4,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  statTitle: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.md,
    borderCurve: "continuous",
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: healthColors.border.light,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)",
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: theme.typography.sizes.caption,
    color: healthColors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: healthColors.background.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: healthColors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 400,
    ...theme.shadows.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  passwordRulesContainer: {
    backgroundColor: healthColors.background.secondary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  passwordRulesTitle: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  passwordRule: {
    fontSize: theme.typography.sizes.caption,
    marginBottom: theme.spacing.xs,
  },
  passwordHint: {
    fontSize: theme.typography.sizes.caption,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.weights.medium,
  },
  passwordSubmitError: {
    color: healthColors.error.main,
    backgroundColor: healthColors.error.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.sizes.caption,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    backgroundColor: healthColors.background.tertiary,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.small,
    backgroundColor: healthColors.primary.main,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: healthColors.button.disabled,
  },
  submitButtonText: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
});

export default SecuritySettingsScreen;



