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
            icon: 'library',
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
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                {/* Top Header with Icons */}
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        style={styles.iconButton}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                        accessibilityHint="Opens the navigation menu"
                    >
                        <Ionicons name="menu" size={24} color={healthColors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.appTitle}>AayuCare</Text>
                    <View style={styles.headerRight}>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Notifications')}
                            accessibilityRole="button"
                            accessibilityLabel="Notifications"
                            accessibilityHint="Opens notification list. You have 3 unread notifications"
                        >
                            <Ionicons name="notifications-outline" size={24} color={healthColors.text.primary} />
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>3</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={handleLogout}
                            accessibilityRole="button"
                            accessibilityLabel="Logout"
                            accessibilityHint="Logs you out of your account"
                        >
                            <Ionicons name="person-circle-outline" size={24} color={healthColors.text.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Patient Info */}
                <View style={styles.patientInfoSection}>
                    {!user || loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={healthColors.primary.main} />
                            <Text style={styles.loadingText}>Loading profile...</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.namasteGreeting}>Namaste, {user.name} 🙏</Text>
                            <Text style={styles.patientDetails}>
                                ID: {user.userId}  Age: {user.age}  Blood: {user.bloodGroup || 'N/A'}
                            </Text>
                        </>
                    )}
                </View>

                {/* Health Status Card */}
                <View style={styles.healthStatusSection}>
                    <Text style={styles.healthStatusTitle}>🩺 HEALTH STATUS:</Text>
                    <View style={styles.healthCard}>
                        <View style={styles.healthCardLeft}>
                            <Text style={styles.healthEmoji}>💚</Text>
                            <View style={styles.healthCardText}>
                                <Text style={styles.healthCardTitle}>HEALTHY  Risk Score: 25/100</Text>
                                <Text style={styles.healthCardDetail}>
                                    BP: 130/85  Sugar: 110  Temp: 98.6°F
                                </Text>
                                <Text style={styles.healthCardUpdated}>Last Updated: Today 9:00 AM</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Emergency Buttons */}
                <View style={styles.emergencySection}>
                    <Text style={styles.emergencyTitle}>🚨 QUICK EMERGENCY:</Text>
                    <View style={styles.emergencyButtons}>
                        <TouchableOpacity
                            style={[styles.emergencyButton, styles.ambulanceButton]}
                            onPress={() => navigation.navigate('Emergency')}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Call ambulance"
                            accessibilityHint="Initiates emergency ambulance service with one click"
                        >
                            <Text style={styles.emergencyIcon}>🚑</Text>
                            <Text style={styles.emergencyButtonTitle}>CALL AMBULANCE</Text>
                            <Text style={styles.emergencyButtonSubtitle}>ONE CLICK</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.emergencyButton, styles.doctorButton]}
                            onPress={() => Alert.alert('Emergency Helpline', 'Calling doctor helpline...')}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Call doctor helpline"
                            accessibilityHint="Calls emergency doctor helpline number"
                        >
                            <Text style={styles.emergencyIcon}>📞</Text>
                            <Text style={styles.emergencyButtonTitle}>CALL DOCTOR</Text>
                            <Text style={styles.emergencyButtonSubtitle}>HELPLINE</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Features Title */}
                <Text style={styles.sectionTitle}>MAIN FEATURES:</Text>
            </View>

            {/* Action Cards */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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

                {/* Notifications */}
                <View style={styles.notificationsSection}>
                    <View style={styles.notificationsHeader}>
                        <Ionicons name="notifications" size={20} color={healthColors.primary.main} />
                        <Text style={styles.notificationsTitle}>NOTIFICATIONS (3):</Text>
                    </View>
                    <View style={styles.notificationsList}>
                        <Text style={styles.notificationItem}>• Prescription ready at pharmacy</Text>
                        <Text style={styles.notificationItem}>• Appointment tomorrow 10:30 AM</Text>
                        <Text style={styles.notificationItem}>• Health camp on 15 Dec</Text>
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
    header: {
        backgroundColor: healthColors.background.card,
        paddingTop: moderateScale(12),
        paddingBottom: moderateScale(16),
        ...createShadow(2),
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    iconButton: {
        padding: moderateScale(8),
        position: 'relative',
    },
    appTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: '700',
        color: healthColors.primary.main,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    notificationBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: healthColors.error,
        borderRadius: moderateScale(10),
        minWidth: moderateScale(18),
        height: moderateScale(18),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(4),
    },
    notificationBadgeText: {
        fontSize: scaledFontSize(10),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    patientInfoSection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    namasteGreeting: {
        fontSize: scaledFontSize(20),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(4),
    },
    patientDetails: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        fontWeight: '500',
    },
    healthStatusSection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(16),
    },
    healthStatusTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(12),
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
    healthEmoji: {
        fontSize: moderateScale(32),
    },
    healthCardText: {
        flex: 1,
    },
    healthCardTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.success.main,
        marginBottom: moderateScale(4),
    },
    healthCardDetail: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.primary,
        fontWeight: '500',
        marginBottom: moderateScale(2),
    },
    healthCardUpdated: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginTop: moderateScale(4),
    },
    emergencySection: {
        marginBottom: moderateScale(16),
    },
    emergencyTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(12),
    },
    emergencyButtons: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    emergencyButton: {
        flex: 1,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        ...createShadow(3),
    },
    ambulanceButton: {
        backgroundColor: healthColors.error.main,
    },
    doctorButton: {
        backgroundColor: healthColors.primary.main,
    },
    emergencyIcon: {
        fontSize: moderateScale(32),
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
        marginBottom: moderateScale(4),
    },
    notificationsSection: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginTop: moderateScale(16),
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
    notificationItem: {
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
        padding: getScreenPadding(),
        paddingBottom: verticalScale(32),
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
    },
    gridItem: {
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
});

export default PatientDashboard;
