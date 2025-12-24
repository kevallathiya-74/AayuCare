/**
 * AayuCare - ProfileScreen
 * 
 * Full user profile page with personal information and account settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { moderateScale, scaledFontSize } from '../../utils/responsive';
import { Card } from '../../components/common';
import { logoutUser } from '../../store/slices/authSlice';
import { appointmentService, medicalRecordService, prescriptionService } from '../../services';
import { logError } from '../../utils/errorHandler';

const ProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    
    // Statistics states
    const [stats, setStats] = useState({
        appointments: 0,
        records: 0,
        prescriptions: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch user statistics
    const fetchStats = useCallback(async () => {
        if (!user?._id) return;

        try {
            const [appointmentsRes, recordsRes, prescriptionsRes] = await Promise.allSettled([
                appointmentService.getPatientAppointments(user._id),
                medicalRecordService.getPatientRecords(user._id),
                prescriptionService.getPatientPrescriptions(user._id),
            ]);

            setStats({
                appointments: appointmentsRes.status === 'fulfilled' 
                    ? (appointmentsRes.value?.data?.appointments?.length || appointmentsRes.value?.data?.length || 0)
                    : 0,
                records: recordsRes.status === 'fulfilled'
                    ? (recordsRes.value?.data?.medicalRecords?.length || recordsRes.value?.data?.length || 0)
                    : 0,
                prescriptions: prescriptionsRes.status === 'fulfilled'
                    ? (prescriptionsRes.value?.data?.prescriptions?.length || prescriptionsRes.value?.data?.length || 0)
                    : 0,
            });
        } catch (err) {
            logError(err, { context: 'ProfileScreen.fetchStats' });
        } finally {
            setLoadingStats(false);
        }
    }, [user]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchStats();
        setRefreshing(false);
    }, [fetchStats]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
        });
    };

    const profileSections = [
        {
            title: 'Personal Information',
            icon: 'person-outline',
            data: [
                { label: 'Full Name', value: user?.name || 'N/A' },
                { label: 'Patient ID', value: user?.userId || 'N/A' },
                { label: 'Email', value: user?.email || 'N/A' },
                { label: 'Phone', value: user?.phone || 'N/A' },
                { label: 'Age', value: user?.age ? `${user.age} years` : 'N/A' },
                { label: 'Gender', value: user?.gender || 'N/A' },
                { label: 'Blood Group', value: user?.bloodGroup || 'N/A' },
            ],
        },
        {
            title: 'Medical Information',
            icon: 'medical-outline',
            data: [
                { label: 'Medical History', value: user?.medicalHistory?.join(', ') || 'None' },
                { label: 'Allergies', value: user?.allergies?.join(', ') || 'None' },
                { label: 'Current Medications', value: user?.currentMedications?.join(', ') || 'None' },
            ],
        },
        {
            title: 'Emergency Contact',
            icon: 'call-outline',
            data: [
                { label: 'Contact Name', value: user?.emergencyContact?.name || 'N/A' },
                { label: 'Contact Phone', value: user?.emergencyContact?.phone || 'N/A' },
                { label: 'Relationship', value: user?.emergencyContact?.relationship || 'N/A' },
            ],
        },
    ];

    const actionItems = [
        {
            title: 'Edit Profile',
            icon: 'create-outline',
            color: healthColors.primary.main,
            onPress: () => console.log('Edit Profile'),
        },
        {
            title: 'Change Password',
            icon: 'lock-closed-outline',
            color: healthColors.info.main,
            onPress: () => console.log('Change Password'),
        },
        {
            title: 'Privacy Settings',
            icon: 'shield-checkmark-outline',
            color: healthColors.success.main,
            onPress: () => console.log('Privacy Settings'),
        },
        {
            title: 'Help & Support',
            icon: 'help-circle-outline',
            color: healthColors.warning.main,
            onPress: () => console.log('Help & Support'),
        },
        {
            title: 'Logout',
            icon: 'log-out-outline',
            color: healthColors.error.main,
            onPress: handleLogout,
        },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[healthColors.primary.main]}
                        tintColor={healthColors.primary.main}
                    />
                }
            >
                {/* Header */}
                <LinearGradient
                    colors={[healthColors.primary.main, healthColors.primary.dark]}
                    style={styles.header}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={60} color={healthColors.primary.main} />
                        </View>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                        <Text style={styles.userRole}>{user?.role || 'Patient'}</Text>
                        <View style={styles.userIdBadge}>
                            <Ionicons name="card-outline" size={14} color="rgba(255, 255, 255, 0.9)" />
                            <Text style={styles.userIdText}>ID: {user?.userId || 'PAT001'}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar-outline" size={24} color={healthColors.primary.main} />
                        {loadingStats ? (
                            <ActivityIndicator size="small" color={healthColors.primary.main} />
                        ) : (
                            <Text style={styles.statValue}>{stats.appointments}</Text>
                        )}
                        <Text style={styles.statLabel}>Appointments</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="document-text-outline" size={24} color={healthColors.success.main} />
                        {loadingStats ? (
                            <ActivityIndicator size="small" color={healthColors.success.main} />
                        ) : (
                            <Text style={styles.statValue}>{stats.records}</Text>
                        )}
                        <Text style={styles.statLabel}>Records</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="medkit-outline" size={24} color={healthColors.info.main} />
                        {loadingStats ? (
                            <ActivityIndicator size="small" color={healthColors.info.main} />
                        ) : (
                            <Text style={styles.statValue}>{stats.prescriptions}</Text>
                        )}
                        <Text style={styles.statLabel}>Prescriptions</Text>
                    </View>
                </View>

                {/* Profile Sections */}
                {profileSections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIconContainer}>
                                <Ionicons name={section.icon} size={20} color={healthColors.primary.main} />
                            </View>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                        </View>
                        <Card style={styles.card}>
                            {section.data.map((item, idx) => (
                                <View key={idx} style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>{item.label}</Text>
                                    <Text style={styles.infoValue} numberOfLines={2}>
                                        {item.value}
                                    </Text>
                                </View>
                            ))}
                        </Card>
                    </View>
                ))}

                {/* Action Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIconContainer}>
                            <Ionicons name="settings-outline" size={20} color={healthColors.primary.main} />
                        </View>
                        <Text style={styles.sectionTitle}>Account Actions</Text>
                    </View>
                    <Card style={styles.card}>
                        {actionItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.actionItem,
                                    index !== actionItems.length - 1 && styles.actionItemBorder,
                                ]}
                                onPress={item.onPress}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon} size={22} color={item.color} />
                                </View>
                                <Text style={[styles.actionText, { color: item.color }]}>
                                    {item.title}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color={healthColors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    header: {
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxxl,
        paddingHorizontal: spacing.lg,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    avatarContainer: {
        alignItems: 'center',
    },
    avatar: {
        width: moderateScale(120),
        height: moderateScale(120),
        borderRadius: moderateScale(60),
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    userName: {
        ...textStyles.h1,
        color: '#FFF',
        marginBottom: spacing.xs,
    },
    userRole: {
        ...textStyles.body,
        color: 'rgba(255, 255, 255, 0.8)',
        textTransform: 'capitalize',
    },
    userIdBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
        marginTop: spacing.xs,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(16),
    },
    userIdText: {
        fontSize: scaledFontSize(13),
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        marginTop: -moderateScale(30),
        gap: moderateScale(12),
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(16),
        padding: moderateScale(16),
        alignItems: 'center',
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    statValue: {
        fontSize: scaledFontSize(24),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginTop: moderateScale(8),
    },
    statLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginTop: moderateScale(4),
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionIconContainer: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        ...textStyles.h3,
        color: healthColors.text.primary,
        marginLeft: spacing.sm,
        fontSize: scaledFontSize(16),
        fontWeight: '700',
    },
    card: {
        padding: spacing.md,
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(16),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    infoLabel: {
        ...textStyles.body,
        color: healthColors.text.secondary,
        flex: 1,
        fontSize: scaledFontSize(14),
    },
    infoValue: {
        ...textStyles.body,
        color: healthColors.text.primary,
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
        fontSize: scaledFontSize(14),
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(14),
        paddingHorizontal: moderateScale(4),
    },
    actionItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    actionIcon: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    actionText: {
        ...textStyles.body,
        flex: 1,
        fontWeight: '600',
        fontSize: scaledFontSize(15),
    },
});

export default ProfileScreen;
