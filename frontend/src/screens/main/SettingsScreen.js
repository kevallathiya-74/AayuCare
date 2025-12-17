/**
 * AayuCare - SettingsScreen
 * 
 * App settings and preferences
 * Features: grouped settings, toggle switches, navigation
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    Card,
    ListItem,
    ErrorRecovery,
    NetworkStatusIndicator,
} from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const SettingsScreen = ({ navigation }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [appointmentReminders, setAppointmentReminders] = useState(true);
    const [medicationReminders, setMedicationReminders] = useState(true);
    const [healthTips, setHealthTips] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();

    const handleSettingChange = async (setter, value, settingName) => {
        try {
            setter(value);
            // TODO: Save setting to API
        } catch (err) {
            logError(err, `SettingsScreen.handleSettingChange.${settingName}`);
            showError('Failed to update setting');
            setter(!value); // Revert on error
        }
    };

    const renderSwitch = (value, onValueChange, settingName) => (
        <Switch
            value={value}
            onValueChange={(val) => handleSettingChange(onValueChange, val, settingName)}
            trackColor={{
                false: healthColors.neutral.gray300,
                true: healthColors.primary.light,
            }}
            thumbColor={value ? healthColors.primary.main : healthColors.neutral.white}
        />
    );

    const accountSettings = [
        {
            title: 'Edit Profile',
            leftIcon: { name: 'person', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => navigation.navigate('Profile'),
        },
        {
            title: 'Change Password',
            leftIcon: { name: 'lock-closed', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Accessibility & Advanced',
            leftIcon: { name: 'accessibility', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => navigation.navigate('SettingsAccessibility'),
        },
        {
            title: 'Linked Accounts',
            leftIcon: { name: 'link', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
    ];

    const privacySettings = [
        {
            title: 'Privacy Policy',
            leftIcon: { name: 'shield-checkmark', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Terms of Service',
            leftIcon: { name: 'document-text', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Data & Privacy',
            leftIcon: { name: 'eye-off', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
    ];

    const aboutSettings = [
        {
            title: 'About AayuCare',
            leftIcon: { name: 'information-circle', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Help & Support',
            leftIcon: { name: 'help-circle', color: healthColors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Rate Us',
            leftIcon: { name: 'star', color: healthColors.warning.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <NetworkStatusIndicator />
            {error ? (
                <ErrorRecovery
                    error={error}
                    onRetry={() => setError(null)}
                />
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading settings...</Text>
                </View>
            ) : (
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Notifications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notifications</Text>
                    <Card padding={false}>
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>Push Notifications</Text>
                                <Text style={styles.settingDescription}>
                                    Enable all notifications
                                </Text>
                            </View>
                            {renderSwitch(notificationsEnabled, setNotificationsEnabled, 'pushNotifications')}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>Appointment Reminders</Text>
                                <Text style={styles.settingDescription}>
                                    Get notified before appointments
                                </Text>
                            </View>
                            {renderSwitch(appointmentReminders, setAppointmentReminders, 'appointmentReminders')}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>Medication Reminders</Text>
                                <Text style={styles.settingDescription}>
                                    Reminders to take medications
                                </Text>
                            </View>
                            {renderSwitch(medicationReminders, setMedicationReminders, 'medicationReminders')}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>Health Tips</Text>
                                <Text style={styles.settingDescription}>
                                    Daily health tips and insights
                                </Text>
                            </View>
                            {renderSwitch(healthTips, setHealthTips, 'healthTips')}
                        </View>
                    </Card>
                </View>

                {/* Account */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <Card padding={false}>
                        {accountSettings.map((item, index) => (
                            <ListItem
                                key={index}
                                {...item}
                                showDivider={index < accountSettings.length - 1}
                            />
                        ))}
                    </Card>
                </View>

                {/* Privacy */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Privacy & Security</Text>
                    <Card padding={false}>
                        {privacySettings.map((item, index) => (
                            <ListItem
                                key={index}
                                {...item}
                                showDivider={index < privacySettings.length - 1}
                            />
                        ))}
                    </Card>
                </View>

                {/* About */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <Card padding={false}>
                        {aboutSettings.map((item, index) => (
                            <ListItem
                                key={index}
                                {...item}
                                showDivider={index < aboutSettings.length - 1}
                            />
                        ))}
                    </Card>
                </View>

                {/* App Version */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
    },
    scrollView: {
        flex: 1,
    },
    section: {
        paddingHorizontal: spacing.md,
        marginTop: spacing.lg,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: healthColors.text.primary,
        marginBottom: spacing.md,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    settingInfo: {
        flex: 1,
        marginRight: spacing.md,
    },
    settingTitle: {
        ...textStyles.bodyLarge,
        fontWeight: '600',
        color: healthColors.text.primary,
        marginBottom: 2,
    },
    settingDescription: {
        ...textStyles.bodySmall,
        color: healthColors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: healthColors.neutral.gray200,
        marginLeft: spacing.md,
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    versionText: {
        ...textStyles.bodySmall,
        color: healthColors.text.tertiary,
    },
    bottomSpacing: {
        height: spacing.xl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    loadingText: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
        marginTop: spacing.md,
    },
});

export default SettingsScreen;
