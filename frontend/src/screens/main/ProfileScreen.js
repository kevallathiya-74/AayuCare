/**
 * AayuCare - ProfileScreen
 * 
 * User profile with personal information and health data
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    Card,
    Avatar,
    ListItem,
    Button,
    ErrorRecovery,
    NetworkStatusIndicator,
} from '../../components/common';
import { logoutUser } from '../../store/slices/authSlice';
import { showConfirmation, showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const ProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();

    const personalInfoItems = [
        {
            title: 'Email',
            subtitle: user?.email || 'Not provided',
            leftIcon: { name: 'mail', color: healthColors.primary.main },
        },
        {
            title: 'Phone',
            subtitle: user?.phone || 'Not provided',
            leftIcon: { name: 'call', color: healthColors.primary.main },
        },
        {
            title: 'Date of Birth',
            subtitle: user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided',
            leftIcon: { name: 'calendar', color: healthColors.primary.main },
        },
        {
            title: 'Gender',
            subtitle: user?.gender || 'Not provided',
            leftIcon: { name: 'person', color: healthColors.primary.main },
        },
    ];

    const healthInfoItems = [
        {
            title: 'Blood Group',
            subtitle: user?.bloodGroup || 'Not provided',
            leftIcon: { name: 'water', color: healthColors.health.bloodPressure },
        },
        {
            title: 'Height',
            subtitle: user?.height ? `${user.height} cm` : 'Not provided',
            leftIcon: { name: 'resize', color: healthColors.primary.main },
        },
        {
            title: 'Weight',
            subtitle: user?.weight ? `${user.weight} kg` : 'Not provided',
            leftIcon: { name: 'fitness', color: healthColors.health.weight },
        },
    ];

    const settingsItems = [
        {
            title: 'Settings',
            leftIcon: { name: 'settings', color: healthColors.text.secondary },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => navigation.navigate('Settings'),
        },
        {
            title: 'Help & Support',
            leftIcon: { name: 'help-circle', color: healthColors.text.secondary },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => Alert.alert('Help & Support', 'For assistance, please contact:\n\nEmail: support@aayucare.com\nPhone: 1800-XXX-XXXX'),
        },
        {
            title: 'Privacy Policy',
            leftIcon: { name: 'shield-checkmark', color: healthColors.text.secondary },
            rightIcon: { name: 'chevron-forward' },
            onPress: () => Alert.alert('Privacy Policy', 'Your privacy is important to us. Visit our website for full privacy policy details.'),
        },
    ];

    const handleLogout = () => {
        showConfirmation(
            'Are you sure you want to logout?',
            async () => {
                try {
                    setLoading(true);
                    await dispatch(logoutUser());
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'BoxSelection' }],
                    });
                } catch (err) {
                    logError(err, 'ProfileScreen.handleLogout');
                    showError('Failed to logout. Please try again.');
                } finally {
                    setLoading(false);
                }
            },
            () => {},
            'Logout'
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <NetworkStatusIndicator />
            {error ? (
                <ErrorRecovery
                    error={error}
                    onRetry={() => setError(null)}
                />
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading profile...</Text>
                </View>
            ) : (
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Avatar source={user?.avatar} name={user?.name} size="xlarge" />
                    <Text style={styles.name}>{user?.name || 'User'}</Text>
                    <Button
                        onPress={() => Alert.alert('Coming Soon', 'Edit profile coming soon!')}
                        variant="outline"
                        size="small"
                        icon={<Ionicons name="create" size={16} color={healthColors.primary.main} />}
                        style={styles.editButton}
                    >
                        Edit Profile
                    </Button>
                </View>

                {/* Personal Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <Card padding={false}>
                        {personalInfoItems.map((item, index) => (
                            <ListItem
                                key={index}
                                {...item}
                                showDivider={index < personalInfoItems.length - 1}
                            />
                        ))}
                    </Card>
                </View>

                {/* Health Profile */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Health Profile</Text>
                    <Card padding={false}>
                        {healthInfoItems.map((item, index) => (
                            <ListItem
                                key={index}
                                {...item}
                                showDivider={index < healthInfoItems.length - 1}
                            />
                        ))}
                    </Card>

                    {user?.allergies && user.allergies.length > 0 && (
                        <Card style={styles.healthCard}>
                            <View style={styles.healthCardHeader}>
                                <Ionicons name="warning" size={20} color={healthColors.warning.main} />
                                <Text style={styles.healthCardTitle}>Allergies</Text>
                            </View>
                            <View style={styles.tagsContainer}>
                                {user.allergies.map((allergy, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{allergy}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {user?.medicalConditions && user.medicalConditions.length > 0 && (
                        <Card style={styles.healthCard}>
                            <View style={styles.healthCardHeader}>
                                <Ionicons name="medkit" size={20} color={healthColors.primary.main} />
                                <Text style={styles.healthCardTitle}>Medical Conditions</Text>
                            </View>
                            <View style={styles.tagsContainer}>
                                {user.medicalConditions.map((condition, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{condition}</Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}
                </View>

                {/* Settings & More */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Settings & More</Text>
                    <Card padding={false}>
                        {settingsItems.map((item, index) => (
                            <ListItem
                                key={index}
                                {...item}
                                showDivider={index < settingsItems.length - 1}
                            />
                        ))}
                    </Card>
                </View>

                {/* Logout Button */}
                <View style={styles.section}>
                    <Button
                        onPress={handleLogout}
                        variant="outline"
                        fullWidth
                        icon={<Ionicons name="log-out-outline" size={20} color={healthColors.error.main} />}
                        textStyle={{ color: healthColors.error.main }}
                    >
                        Logout
                    </Button>
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
    header: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        backgroundColor: healthColors.background.primary,
    },
    name: {
        ...textStyles.h2,
        color: healthColors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    editButton: {
        paddingHorizontal: spacing.lg,
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
    healthCard: {
        marginTop: spacing.md,
    },
    healthCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    healthCardTitle: {
        ...textStyles.bodyLarge,
        fontWeight: '600',
        color: healthColors.text.primary,
        marginLeft: spacing.sm,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.xs,
    },
    tag: {
        backgroundColor: healthColors.background.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: healthColors.borderRadius.medium,
        marginRight: spacing.sm,
        marginBottom: spacing.sm,
    },
    tagText: {
        ...textStyles.bodyMedium,
        color: healthColors.text.primary,
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

export default ProfileScreen;
