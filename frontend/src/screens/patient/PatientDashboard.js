/**
 * Patient Dashboard
 * Hospital-linked patient interface
 * Clear, reassuring design with zero medical jargon
 */

import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Platform,
    Alert,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import LargeActionCard from '../../components/common/LargeActionCard';
import { logoutUser } from '../../store/slices/authSlice';
import { 
    getScreenPadding, 
    moderateScale, 
    verticalScale,
    scaledFontSize,
    getGridColumns,
} from '../../utils/responsive';

const PatientDashboard = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user, loading } = useSelector((state) => state.auth);

    const handleLogout = useCallback(async () => {
        await dispatch(logoutUser());
    }, [dispatch]);

    const getTimeBasedGreeting = useCallback(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        if (hour >= 17 && hour < 21) return 'Good Evening';
        return 'Good Night';
    }, []);

    const getGreetingIcon = useCallback(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'sunny';
        if (hour >= 12 && hour < 17) return 'partly-sunny';
        if (hour >= 17 && hour < 21) return 'moon';
        return 'moon-outline';
    }, []);

    const actionCards = useMemo(() => [
        {
            title: 'Book Appointment',
            icon: 'calendar',
            iconColor: healthColors.primary.main,
            onPress: () => navigation.navigate('AppointmentBooking'),
            badge: '',
        },
        {
            title: 'Medical Records',
            icon: 'folder-open',
            iconColor: healthColors.accent.aqua,
            onPress: () => navigation.navigate('MedicalRecords'),
        },
        {
            title: 'Prescriptions',
            icon: 'medical',
            iconColor: healthColors.success.main,
            onPress: () => navigation.navigate('MyPrescriptions'),
        },
        {
            title: 'AI Health Assistant',
            icon: 'chatbubbles',
            iconColor: healthColors.secondary.main,
            onPress: () => navigation.navigate('AIHealthAssistant'),
        },
        {
            title: 'Disease Info',
            icon: 'information-circle',
            iconColor: '#7E57C2',
            onPress: () => navigation.navigate('DiseaseInfo'),
        },
        {
            title: 'Health Metrics',
            icon: 'stats-chart',
            iconColor: '#00897B',
            onPress: () => navigation.navigate('HealthMetrics'),
        },
    ], [navigation]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Enhanced Welcome Banner */}
            <LinearGradient
                colors={[healthColors.primary.main, healthColors.primary.dark]}
                style={styles.welcomeBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                {/* Top Icons Row */}
                <View style={styles.bannerTopRow}>
                    <TouchableOpacity 
                        style={styles.bannerIconButton}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                    >
                        <Ionicons name="menu" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.appTitle}>AayuCare</Text>
                    <View style={styles.bannerRightIcons}>
                        <TouchableOpacity 
                            style={styles.bannerIconButton}
                            onPress={() => navigation.navigate('More')}
                            accessibilityRole="button"
                            accessibilityLabel="Notifications"
                        >
                            <Ionicons name="notifications" size={24} color="#FFFFFF" />
                            <View style={styles.bannerNotificationBadge}>
                                <Text style={styles.bannerNotificationBadgeText}>3</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.bannerIconButton}
                            onPress={() => navigation.navigate('Profile')}
                            accessibilityRole="button"
                            accessibilityLabel="Open profile"
                        >
                            <Ionicons name="person" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Patient Greeting */}
                <View style={styles.bannerGreeting}>
                    {!user || loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={[styles.loadingText, { color: '#FFFFFF' }]}>Loading profile...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.greetingRow}>
                                <Ionicons 
                                    name={getGreetingIcon()} 
                                    size={28} 
                                    color="#FFFFFF" 
                                    style={styles.greetingIcon}
                                />
                                <View>
                                    <Text style={styles.bannerTimeGreeting}>{getTimeBasedGreeting()}</Text>
                                    <Text style={styles.bannerWelcomeText}>{user.name}</Text>
                                </View>
                            </View>
                            <View style={styles.bannerInfoCard}>
                                <View style={styles.bannerInfoRow}>
                                    <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                                    <Text style={styles.bannerInfoText}>ID: {user.userId}</Text>
                                </View>
                                <View style={styles.bannerInfoRow}>
                                    <Ionicons name="person-outline" size={18} color="#FFFFFF" />
                                    <Text style={styles.bannerInfoText}>Age: {user.age}  •  Blood: {user.bloodGroup || 'N/A'}</Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </LinearGradient>

            {/* Scrollable Content */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Health Status Card */}
                <View style={styles.healthStatusSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="heart-circle" size={20} color={healthColors.primary.main} />
                        <Text style={styles.healthStatusTitle}>HEALTH STATUS</Text>
                    </View>
                    <View style={styles.healthCard}>
                        <View style={styles.healthCardLeft}>
                            <View style={styles.healthIconCircle}>
                                <Ionicons name="fitness" size={32} color={healthColors.success.main} />
                            </View>
                            <View style={styles.healthCardText}>
                                <Text style={styles.healthCardTitle}>HEALTHY  Risk Score: 25/100</Text>
                                <View style={styles.healthMetrics}>
                                    <View style={styles.metricItem}>
                                        <Ionicons name="pulse" size={14} color={healthColors.info.main} />
                                        <Text style={styles.healthCardDetail}>BP: 130/85</Text>
                                    </View>
                                    <View style={styles.metricItem}>
                                        <Ionicons name="water" size={14} color={healthColors.warning.main} />
                                        <Text style={styles.healthCardDetail}>Sugar: 110</Text>
                                    </View>
                                    <View style={styles.metricItem}>
                                        <Ionicons name="thermometer" size={14} color={healthColors.error.main} />
                                        <Text style={styles.healthCardDetail}>Temp: 98.6°F</Text>
                                    </View>
                                </View>
                                <View style={styles.healthCardUpdateRow}>
                                    <Ionicons name="time-outline" size={12} color={healthColors.text.secondary} />
                                    <Text style={styles.healthCardUpdated}>Last Updated: Today 9:00 AM</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Emergency Buttons */}
                <View style={styles.emergencySection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="warning" size={20} color={healthColors.error.main} />
                        <Text style={styles.emergencyTitle}>QUICK EMERGENCY</Text>
                    </View>
                    <View style={styles.emergencyButtons}>
                        <TouchableOpacity
                            style={[styles.emergencyButton, styles.ambulanceButton]}
                            onPress={() => navigation.navigate('Emergency')}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Call ambulance"
                        >
                            <LinearGradient
                                colors={[healthColors.error.main, healthColors.error.dark]}
                                style={styles.emergencyButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.emergencyIconCircle}>
                                    <Ionicons name="medkit" size={28} color="#FFFFFF" />
                                </View>
                                <Text style={styles.emergencyButtonTitle}>CALL AMBULANCE</Text>
                                <Text style={styles.emergencyButtonSubtitle}>ONE CLICK</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.emergencyButton, styles.doctorButton]}
                            onPress={() => Alert.alert('Emergency Helpline', 'Calling doctor helpline...')}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Call doctor helpline"
                        >
                            <LinearGradient
                                colors={[healthColors.primary.main, healthColors.primary.dark]}
                                style={styles.emergencyButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.emergencyIconCircle}>
                                    <Ionicons name="call" size={28} color="#FFFFFF" />
                                </View>
                                <Text style={styles.emergencyButtonTitle}>CALL DOCTOR</Text>
                                <Text style={styles.emergencyButtonSubtitle}>HELPLINE</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Features Section */}
                <View style={styles.mainFeaturesSection}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="grid" size={20} color={healthColors.primary.main} />
                        <Text style={styles.emergencyTitle}>MAIN FEATURES</Text>
                    </View>

                    {/* Action Cards */}
                    <View style={styles.grid}>
                        {actionCards.map((card, index) => (
                            <View key={index} style={styles.gridItem}>
                                <LargeActionCard
                                    title={card.title}
                                    icon={card.icon}
                                    iconColor={card.iconColor}
                                    onPress={card.onPress}
                                    badge={card.badge}
                                />
                            </View>
                        ))}
                    </View>
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
    welcomeBanner: {
        paddingTop: moderateScale(12),
        paddingBottom: moderateScale(20),
        borderBottomLeftRadius: moderateScale(24),
        borderBottomRightRadius: moderateScale(24),
        ...createShadow(4),
    },
    bannerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    bannerIconButton: {
        padding: moderateScale(8),
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: moderateScale(20),
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    appTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bannerRightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
    },
    bannerNotificationBadge: {
        position: 'absolute',
        top: moderateScale(2),
        right: moderateScale(2),
        backgroundColor: healthColors.error.main,
        borderRadius: moderateScale(10),
        minWidth: moderateScale(18),
        height: moderateScale(18),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(4),
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    bannerNotificationBadgeText: {
        fontSize: scaledFontSize(10),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bannerGreeting: {
        paddingHorizontal: getScreenPadding(),
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(12),
    },
    greetingIcon: {
        marginRight: moderateScale(12),
    },
    bannerTimeGreeting: {
        fontSize: scaledFontSize(14),
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: moderateScale(2),
        letterSpacing: 0.5,
    },
    bannerWelcomeText: {
        fontSize: scaledFontSize(24),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    bannerInfoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: moderateScale(12),
        padding: moderateScale(12),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    bannerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: moderateScale(6),
    },
    bannerInfoText: {
        fontSize: scaledFontSize(14),
        color: '#FFFFFF',
        marginLeft: moderateScale(8),
        fontWeight: '500',
    },
    healthStatusSection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
    },
    healthStatusTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    healthCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: healthColors.success.background,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: healthColors.success.light,
    },
    healthCardLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: moderateScale(12),
        flex: 1,
    },
    healthIconCircle: {
        width: moderateScale(56),
        height: moderateScale(56),
        borderRadius: moderateScale(28),
        backgroundColor: healthColors.success.main + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    healthCardText: {
        flex: 1,
    },
    healthCardTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.success.main,
        marginBottom: moderateScale(8),
    },
    healthMetrics: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(12),
        marginBottom: moderateScale(8),
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    healthCardDetail: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.primary,
        fontWeight: '500',
    },
    healthCardUpdateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    healthCardUpdated: {
        fontSize: scaledFontSize(11),
        color: healthColors.text.secondary,
    },
    emergencySection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    emergencyTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    mainFeaturesSection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    emergencyButtons: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    emergencyButton: {
        flex: 1,
        borderRadius: moderateScale(12),
        overflow: 'hidden',
        ...createShadow(3),
    },
    emergencyButtonGradient: {
        padding: moderateScale(16),
        alignItems: 'center',
    },
    emergencyIconCircle: {
        width: moderateScale(56),
        height: moderateScale(56),
        borderRadius: moderateScale(28),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: moderateScale(8),
    },
    emergencyButtonTitle: {
        fontSize: scaledFontSize(13),
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: moderateScale(2),
    },
    emergencyButtonSubtitle: {
        fontSize: scaledFontSize(11),
        color: '#FFFFFF',
        opacity: 0.9,
    },
    sectionTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    notificationsSection: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginTop: moderateScale(16),
        marginHorizontal: getScreenPadding(),
        ...createShadow(2),
    },
    notificationsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
    },
    notificationsTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    notificationsList: {
        gap: moderateScale(8),
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
    },
    notificationItem: {
        flex: 1,
        fontSize: scaledFontSize(13),
        color: healthColors.text.primary,
        lineHeight: scaledFontSize(18),
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    viewButtonText: {
        fontSize: scaledFontSize(13),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
    scrollContent: {
        paddingTop: moderateScale(16),
        paddingBottom: verticalScale(32),
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    gridItem: {
        paddingHorizontal: getScreenPadding(),
        width: '48%',
        aspectRatio: 1.2,
        marginBottom: moderateScale(12),
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
    },
    loadingText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        fontWeight: '500',
    },
    // Profile Styles
    profileHeader: {
        marginBottom: moderateScale(16),
    },
    profileHeaderGradient: {
        padding: moderateScale(24),
        alignItems: 'center',
        borderRadius: moderateScale(12),
        marginHorizontal: getScreenPadding(),
    },
    profileAvatarContainer: {
        alignItems: 'center',
    },
    profileAvatar: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(40),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: moderateScale(12),
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    profileName: {
        fontSize: scaledFontSize(22),
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: moderateScale(4),
    },
    profileId: {
        fontSize: scaledFontSize(14),
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    profileSection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    profileSectionTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(12),
        letterSpacing: 0.5,
    },
    profileCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        ...createShadow(2),
    },
    profileInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(8),
    },
    profileInfoContent: {
        marginLeft: moderateScale(12),
        flex: 1,
    },
    profileInfoLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(2),
    },
    profileInfoValue: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    profileDivider: {
        height: 1,
        backgroundColor: healthColors.border.light,
        marginVertical: moderateScale(4),
    },
    profileActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: moderateScale(12),
    },
    profileActionText: {
        flex: 1,
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.text.primary,
        marginLeft: moderateScale(12),
    },
    logoutButtonProfile: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.background.card,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        borderColor: healthColors.error.main,
        ...createShadow(1),
    },
    logoutButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.error.main,
        marginLeft: moderateScale(8),
    },
});

export default PatientDashboard;
