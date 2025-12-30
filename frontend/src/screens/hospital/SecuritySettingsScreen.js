/**
 * Security Settings Screen
 * Password management, session control, and security statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { moderateScale, scaledFontSize } from '../../utils/responsive';
import { showError, logError } from '../../utils/errorHandler';
import adminService from '../../services/admin.service';

const SecuritySettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [securityData, setSecurityData] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getSecuritySettings();
      setSecurityData(response.data);
    } catch (error) {
      logError(error, { context: 'SecuritySettingsScreen.fetchSecurityData' });
      showError('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSecurityData();
    setRefreshing(false);
  }, [fetchSecurityData]);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    Alert.alert(
      'Change Password',
      'Are you sure you want to change your password? You will be logged out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          style: 'destructive',
          onPress: async () => {
            try {
              setPasswordLoading(true);
              await adminService.changePassword(currentPassword, newPassword);
              Alert.alert('Success', 'Password changed successfully. Please login again.', [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate to login screen
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'LoginScreen' }],
                    });
                  },
                },
              ]);
              setShowPasswordModal(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            } catch (error) {
              const errorMessage = error.response?.data?.error || 'Failed to change password';
              Alert.alert('Error', errorMessage);
              logError(error, { context: 'SecuritySettingsScreen.handleChangePassword' });
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
      'Logout All Devices',
      'This will logout all devices including this one. You will need to login again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.logoutAllDevices();
              Alert.alert('Success', 'Logged out from all devices successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'LoginScreen' }],
                    });
                  },
                },
              ]);
            } catch (error) {
              showError('Failed to logout from all devices');
              logError(error, { context: 'SecuritySettingsScreen.handleLogoutAll' });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  if (loading && !securityData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security Settings</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={healthColors.primary.main} />
          <Text style={styles.loadingText}>Loading security settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security Settings</Text>
        <TouchableOpacity style={styles.backButton} onPress={onRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator size="small" color={healthColors.primary.main} />
          ) : (
            <Ionicons name="refresh" size={24} color={healthColors.primary.main} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
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
              <View style={[styles.statusIcon, { backgroundColor: healthColors.success.main + '15' }]}>
                <Ionicons name="shield-checkmark" size={32} color={healthColors.success.main} />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>Account Status</Text>
                <Text style={styles.statusSubtitle}>
                  {securityData?.user?.isVerified ? 'Verified Account' : 'Not Verified'}
                </Text>
              </View>
            </View>
            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Ionicons name="time-outline" size={18} color={healthColors.text.secondary} />
                <Text style={styles.statusLabel}>Last Login:</Text>
                <Text style={styles.statusValue}>{securityData?.lastActivity}</Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons name="calendar-outline" size={18} color={healthColors.text.secondary} />
                <Text style={styles.statusLabel}>Account Created:</Text>
                <Text style={styles.statusValue}>
                  {formatDate(securityData?.user?.accountCreated)}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Ionicons name="key-outline" size={18} color={healthColors.text.secondary} />
                <Text style={styles.statusLabel}>Token Version:</Text>
                <Text style={styles.statusValue}>{securityData?.user?.tokenVersion}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Statistics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Active Sessions',
              securityData?.statistics?.activeSessions || 0,
              'people',
              healthColors.success.main
            )}
            {renderStatCard(
              'Recent Logins',
              securityData?.statistics?.recentLogins || 0,
              'log-in',
              healthColors.info.main
            )}
            {renderStatCard(
              'Verified Users',
              securityData?.statistics?.verifiedUsers || 0,
              'checkmark-circle',
              healthColors.primary.main
            )}
            {renderStatCard(
              'Unverified Users',
              securityData?.statistics?.unverifiedUsers || 0,
              'alert-circle',
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
          >
            <View style={[styles.actionIcon, { backgroundColor: healthColors.primary.main + '15' }]}>
              <Ionicons name="lock-closed" size={24} color={healthColors.primary.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtitle}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={healthColors.text.tertiary} />
          </TouchableOpacity>

          {/* Logout All Devices */}
          <TouchableOpacity style={styles.actionCard} onPress={handleLogoutAll}>
            <View style={[styles.actionIcon, { backgroundColor: healthColors.error.main + '15' }]}>
              <Ionicons name="log-out" size={24} color={healthColors.error.main} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Logout All Devices</Text>
              <Text style={styles.actionSubtitle}>End all active sessions</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={healthColors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Password Change Modal */}
        {showPasswordModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                  <Ionicons name="close" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={healthColors.text.disabled}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Ionicons
                      name={showCurrentPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={healthColors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={healthColors.text.disabled}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={healthColors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={[styles.passwordInput, styles.input]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Confirm new password"
                  placeholderTextColor={healthColors.text.disabled}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Change Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: indianDesign.spacing.lg,
    paddingVertical: indianDesign.spacing.md,
    backgroundColor: healthColors.background.card,
    ...createShadow(2),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: healthColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: scaledFontSize(14),
    color: healthColors.text.secondary,
    marginTop: indianDesign.spacing.md,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: indianDesign.spacing.lg,
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
    marginBottom: indianDesign.spacing.md,
  },
  statusCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.medium,
    padding: indianDesign.spacing.lg,
    ...createShadow(2),
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: indianDesign.spacing.md,
  },
  statusIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: indianDesign.spacing.md,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
  },
  statusDetails: {
    paddingTop: indianDesign.spacing.md,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
    gap: indianDesign.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: indianDesign.spacing.sm,
  },
  statusLabel: {
    fontSize: scaledFontSize(13),
    color: healthColors.text.secondary,
    flex: 1,
  },
  statusValue: {
    fontSize: scaledFontSize(13),
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: indianDesign.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.medium,
    padding: indianDesign.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...createShadow(1),
    borderWidth: 1,
    borderColor: healthColors.border.light,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: indianDesign.spacing.sm,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: scaledFontSize(20),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  statTitle: {
    fontSize: scaledFontSize(11),
    color: healthColors.text.secondary,
    marginTop: 2,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.medium,
    padding: indianDesign.spacing.lg,
    marginBottom: indianDesign.spacing.md,
    ...createShadow(1),
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  actionIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: indianDesign.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: scaledFontSize(15),
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: scaledFontSize(12),
    color: healthColors.text.secondary,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: indianDesign.spacing.lg,
  },
  modalContent: {
    backgroundColor: healthColors.background.card,
    borderRadius: indianDesign.borderRadius.large,
    padding: indianDesign.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...createShadow(5),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: indianDesign.spacing.lg,
  },
  modalTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: indianDesign.fontWeight.bold,
    color: healthColors.text.primary,
  },
  inputContainer: {
    marginBottom: indianDesign.spacing.md,
  },
  inputLabel: {
    fontSize: scaledFontSize(13),
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
    marginBottom: indianDesign.spacing.xs,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: healthColors.background.primary,
    borderRadius: indianDesign.borderRadius.small,
    paddingHorizontal: indianDesign.spacing.md,
    paddingVertical: indianDesign.spacing.sm,
    borderWidth: 1,
    borderColor: healthColors.border.light,
  },
  input: {
    flex: 1,
    fontSize: scaledFontSize(14),
    color: healthColors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: indianDesign.spacing.md,
    marginTop: indianDesign.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: indianDesign.spacing.md,
    borderRadius: indianDesign.borderRadius.small,
    backgroundColor: healthColors.background.tertiary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: indianDesign.fontWeight.semibold,
    color: healthColors.text.primary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: indianDesign.spacing.md,
    borderRadius: indianDesign.borderRadius.small,
    backgroundColor: healthColors.primary.main,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: scaledFontSize(14),
    fontWeight: indianDesign.fontWeight.bold,
    color: '#FFF',
  },
});

export default SecuritySettingsScreen;
