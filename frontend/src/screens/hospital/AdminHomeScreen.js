/**
 * Admin Home Screen (Screen 5)
 * Complete dashboard with overview stats, quick actions, and recent activities
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Dimensions,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { createShadow } from '../../theme/indianDesign';
import { moderateScale, verticalScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { logoutUser } from '../../store/slices/authSlice';
import { showConfirmation, showError, logError } from '../../utils/errorHandler';
import adminService from '../../services/admin.service';

const { width } = Dimensions.get('window');

const AdminHomeScreen = ({ navigation }) => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        appointments: 0,
        doctors: 0,
        patients: 0,
        prescriptions: 0,
    });
    const [recentActivities, setRecentActivities] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            
            // Fetch stats and activities in parallel
            const [statsResponse, activitiesResponse] = await Promise.all([
                adminService.getDashboardStats().catch(() => null),
                adminService.getRecentActivities(5).catch(() => null),
            ]);

            if (statsResponse?.success) {
                setStats(statsResponse.data);
            }

            if (activitiesResponse?.success) {
                setRecentActivities(activitiesResponse.data);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard';
            setError(errorMessage);
            logError(err, { context: 'AdminHomeScreen.fetchDashboardData' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    }, [fetchDashboardData]);

    const handleLogout = useCallback(() => {
        showConfirmation(
            'Are you sure you want to logout?',
            () => dispatch(logoutUser()),
            () => {},
            'Logout'
        );
    }, [dispatch]);

    const quickActions = useMemo(() => [
        { title: 'Patients', icon: 'people', color: healthColors.primary.main, screen: 'PatientManagement' },
        { title: 'Doctors', icon: 'medical', color: healthColors.secondary.main, screen: 'ManageDoctors' },
        { title: 'Appoints.', icon: 'calendar', color: healthColors.accent.coral, screen: 'Appointments' },
        { title: 'Reports', icon: 'stats-chart', color: healthColors.accent.green, screen: 'Reports' },
        { title: 'Pharmacy', icon: 'medkit', color: healthColors.info.main, screen: 'CreatePrescription' },
        { title: 'Events', icon: 'megaphone', color: healthColors.warning.main, screen: 'Events' },
    ], []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.menuButton}
                    accessibilityRole="button"
                    accessibilityLabel="Open menu"
                    accessibilityHint="Opens the navigation menu"
                >
                    <Ionicons name="menu" size={28} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={() => navigation.navigate('Notifications')}
                        accessibilityRole="button"
                        accessibilityLabel="Notifications"
                        accessibilityHint="Opens notification list"
                    >
                        <Ionicons name="notifications-outline" size={24} color={healthColors.text.primary} />
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={() => navigation.navigate('Profile')}
                        accessibilityRole="button"
                        accessibilityLabel="Profile"
                        accessibilityHint="Opens your profile"
                    >
                        <Ionicons name="person-circle-outline" size={24} color={healthColors.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            ) : (
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[healthColors.primary.main]} />}
            >
                {/* Welcome Section */}
                <View style={styles.welcomeSection}>
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeText}>Welcome, {user?.name || 'Admin'}</Text>
                        <Text style={styles.welcomeSubtext}>{user?.role?.toUpperCase() || 'ADMIN'} • AayuCare Hospital</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleLogout} 
                        style={styles.logoutButton}
                        accessibilityRole="button"
                        accessibilityLabel="Logout"
                        accessibilityHint="Logs you out of the admin dashboard"
                    >
                        <Ionicons name="log-out-outline" size={24} color={healthColors.error} />
                    </TouchableOpacity>
                </View>

                {/* Today's Overview */}
                <View style={styles.section}>
                    <View style={styles.overviewCard}>
                        <View style={styles.overviewHeader}>
                            <Ionicons name="stats-chart" size={20} color={healthColors.primary.main} />
                            <Text style={styles.overviewTitle}>TODAY'S OVERVIEW</Text>
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>🏥</Text>
                                <Text style={styles.statValue}>{stats.appointments}</Text>
                                <Text style={styles.statLabel}>Appointments</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>👨‍⚕️</Text>
                                <Text style={styles.statValue}>{stats.doctors}</Text>
                                <Text style={styles.statLabel}>Doctors Active</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>👥</Text>
                                <Text style={styles.statValue}>{stats.patients.toLocaleString()}</Text>
                                <Text style={styles.statLabel}>Patients</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>💊</Text>
                                <Text style={styles.statValue}>{stats.prescriptions}</Text>
                                <Text style={styles.statLabel}>Prescriptions</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUICK ACTIONS:</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickActionCard}
                                onPress={() => action.screen && navigation.navigate(action.screen)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
                                    <Ionicons name={action.icon} size={28} color={action.color} />
                                </View>
                                <Text style={styles.quickActionText}>{action.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Recent Activities */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time-outline" size={20} color={healthColors.primary.main} />
                        <Text style={styles.sectionTitle}>RECENT ACTIVITIES</Text>
                    </View>
                    <View style={styles.activitiesCard}>
                        {recentActivities.length > 0 ? (
                            recentActivities.map((activity) => (
                                <View key={activity.id || activity._id} style={styles.activityItem}>
                                    <Ionicons name={activity.icon || 'ellipse'} size={18} color={healthColors.text.secondary} />
                                    <Text style={styles.activityText}>• {activity.text}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No recent activities</Text>
                        )}
                    </View>
                </View>

                <View style={{ height: 80 }} />
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: getScreenPadding(),
        paddingVertical: moderateScale(12),
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
    },
    menuButton: {
        padding: moderateScale(4),
    },
    headerTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: '700',
        color: healthColors.text.primary,
        flex: 1,
        marginLeft: moderateScale(12),
    },
    headerRight: {
        flexDirection: 'row',
        gap: moderateScale(8),
    },
    iconButton: {
        padding: moderateScale(4),
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: healthColors.error.main,
    },
    welcomeSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: getScreenPadding(),
        paddingBottom: moderateScale(8),
    },
    welcomeContent: {
        flex: 1,
    },
    welcomeText: {
        fontSize: scaledFontSize(24),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    welcomeSubtext: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: moderateScale(4),
    },
    logoutButton: {
        padding: moderateScale(8),
    },
    section: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: verticalScale(16),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
    },
    sectionTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        letterSpacing: 0.5,
    },
    overviewCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        ...createShadow(2),
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
    },
    overviewTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: healthColors.border.light,
        marginVertical: moderateScale(12),
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(12),
    },
    statItem: {
        flex: 1,
        minWidth: (width - getScreenPadding() * 2 - moderateScale(48)) / 2,
        alignItems: 'center',
        paddingVertical: moderateScale(12),
    },
    statIcon: {
        fontSize: moderateScale(32),
        marginBottom: moderateScale(8),
    },
    statValue: {
        fontSize: scaledFontSize(24),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    statLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginTop: moderateScale(4),
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(12),
    },
    quickActionCard: {
        width: (width - getScreenPadding() * 2 - moderateScale(24)) / 3,
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        alignItems: 'center',
        ...createShadow(1),
    },
    quickActionIcon: {
        width: moderateScale(56),
        height: moderateScale(56),
        borderRadius: moderateScale(28),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: moderateScale(8),
    },
    quickActionText: {
        fontSize: scaledFontSize(12),
        fontWeight: '600',
        color: healthColors.text.primary,
        textAlign: 'center',
    },
    activitiesCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        ...createShadow(2),
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        paddingVertical: moderateScale(8),
    },
    activityText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: moderateScale(12),
    },
    loadingText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
    },
    emptyText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        textAlign: 'center',
        paddingVertical: moderateScale(12),
    },
});

export default AdminHomeScreen;
