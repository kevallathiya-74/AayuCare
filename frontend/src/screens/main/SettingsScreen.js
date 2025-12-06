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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    Card,
    ListItem,
} from '../../components/common';

const SettingsScreen = ({ navigation }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [appointmentReminders, setAppointmentReminders] = useState(true);
    const [medicationReminders, setMedicationReminders] = useState(true);
    const [healthTips, setHealthTips] = useState(false);

    const renderSwitch = (value, onValueChange) => (
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
                false: colors.neutral.gray300,
                true: colors.primary.light,
            }}
            thumbColor={value ? colors.primary.main : colors.neutral.white}
        />
    );

    const accountSettings = [
        {
            title: 'Edit Profile',
            leftIcon: { name: 'person', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Change Password',
            leftIcon: { name: 'lock-closed', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Linked Accounts',
            leftIcon: { name: 'link', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
    ];

    const privacySettings = [
        {
            title: 'Privacy Policy',
            leftIcon: { name: 'shield-checkmark', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Terms of Service',
            leftIcon: { name: 'document-text', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Data & Privacy',
            leftIcon: { name: 'eye-off', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
    ];

    const aboutSettings = [
        {
            title: 'About AayuCare',
            leftIcon: { name: 'information-circle', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Help & Support',
            leftIcon: { name: 'help-circle', color: colors.primary.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
        {
            title: 'Rate Us',
            leftIcon: { name: 'star', color: colors.warning.main },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => { },
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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
                            {renderSwitch(notificationsEnabled, setNotificationsEnabled)}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>Appointment Reminders</Text>
                                <Text style={styles.settingDescription}>
                                    Get notified before appointments
                                </Text>
                            </View>
                            {renderSwitch(appointmentReminders, setAppointmentReminders)}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>Medication Reminders</Text>
                                <Text style={styles.settingDescription}>
                                    Reminders to take medications
                                </Text>
                            </View>
                            {renderSwitch(medicationReminders, setMedicationReminders)}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingTitle}>Health Tips</Text>
                                <Text style={styles.settingDescription}>
                                    Daily health tips and insights
                                </Text>
                            </View>
                            {renderSwitch(healthTips, setHealthTips)}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.secondary,
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
        color: colors.text.primary,
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
        color: colors.text.primary,
        marginBottom: 2,
    },
    settingDescription: {
        ...textStyles.bodySmall,
        color: colors.text.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.neutral.gray200,
        marginLeft: spacing.md,
    },
    versionContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    versionText: {
        ...textStyles.bodySmall,
        color: colors.text.tertiary,
    },
    bottomSpacing: {
        height: spacing.xl,
    },
});

export default SettingsScreen;
