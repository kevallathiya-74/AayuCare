/**
 * Women's Health Hub Screen
 * Menstrual tracker, pregnancy care, mental wellness
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { getScreenPadding, scaledFontSize, moderateScale, verticalScale } from '../../utils/responsive';
import NetworkStatusIndicator from '../../components/common/NetworkStatusIndicator';
import ErrorRecovery from '../../components/common/ErrorRecovery';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const WomensHealthScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();

    const menstrualData = {
        currentDay: 12,
        cycleDays: 28,
        nextPeriod: 5,
        insight: 'Your energy is high today! Good day for exercise.',
    };

    const pregnancyData = {
        week: 24,
        totalWeeks: 40,
        babySize: '🥭 Mango',
        tips: [
            'Prenatal vitamin intake',
            'Gentle yoga exercises',
            'Hydration is key',
        ],
        nextCheckup: '20 Dec',
    };

    const mentalWellnessActivities = [
        { icon: 'fitness', name: 'Breathing Exercises', duration: '5 min', color: '#4CAF50' },
        { icon: 'musical-notes', name: 'Guided Meditation', duration: '10 min', color: '#9C27B0' },
        { icon: 'call', name: 'Counseling Support', action: 'Call Now', color: '#F44336' },
    ];

    const handleRetry = () => {
        setError(null);
    };

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
                <NetworkStatusIndicator />
                <ErrorRecovery
                    error={error}
                    onRetry={handleRetry}
                    onDismiss={() => setError(null)}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <NetworkStatusIndicator />
            {/* Header */}
            <LinearGradient
                colors={['#EC4899', '#DB2777']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="rose-outline" size={32} color="#FFF" />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Women's Health</Text>
                        <Text style={styles.headerSubtitle}>Personalized care for women</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="calendar" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Menstrual Tracker */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Ionicons name="calendar-outline" size={20} color={healthColors.primary.main} />
                        <Text style={styles.sectionTitle}>MENSTRUAL TRACKER</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.cycleInfo}>
                            <Text style={styles.cycleText}>
                                Current Cycle: Day {menstrualData.currentDay} of {menstrualData.cycleDays}
                            </Text>
                            <Text style={styles.nextPeriodText}>
                                Next Period: {menstrualData.nextPeriod} days
                            </Text>
                        </View>

                        {/* Cycle Progress */}
                        <View style={styles.cycleProgress}>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${(menstrualData.currentDay / menstrualData.cycleDays) * 100}%`,
                                            backgroundColor: healthColors.primary.main,
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.calendarButton}>
                            <Ionicons name="stats-chart-outline" size={18} color="#EC4899" />
                            <Text style={styles.calendarButtonText}>View Full Calendar</Text>
                            <Ionicons name="chevron-forward" size={16} color="#EC4899" />
                        </TouchableOpacity>

                        <View style={styles.insightBox}>
                            <Ionicons name="bulb-outline" size={20} color="#FFA726" />
                            <View style={styles.insightContent}>
                                <Text style={styles.insightTitle}>Today's Insight:</Text>
                                <Text style={styles.insightText}>{menstrualData.insight}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Pregnancy Care */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Ionicons name="heart-outline" size={20} color={healthColors.primary.main} />
                        <Text style={styles.sectionTitle}>PREGNANCY CARE</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.pregnancyHeader}>
                            <Text style={styles.pregnancyWeek}>
                                Week {pregnancyData.week} of {pregnancyData.totalWeeks}
                            </Text>
                            <View style={styles.babySizeContainer}>
                                <Ionicons name="fitness-outline" size={18} color={healthColors.text.secondary} />
                                <Text style={styles.babySize}>Baby Size: Mango</Text>
                            </View>
                        </View>

                        <View style={styles.tipsSection}>
                            <View style={styles.tipsHeader}>
                                <Ionicons name="list-outline" size={18} color={healthColors.text.primary} />
                                <Text style={styles.tipsTitle}>This Week's Tips:</Text>
                            </View>
                            {pregnancyData.tips.map((tip, index) => (
                                <View key={index} style={styles.tipItem}>
                                    <Ionicons name="checkmark-circle" size={16} color={healthColors.success.main} />
                                    <Text style={styles.tipText}>{tip}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.checkupInfo}>
                            <View style={styles.checkupRow}>
                                <Ionicons name="medkit-outline" size={20} color="#EC4899" />
                                <Text style={styles.checkupText}>Next Checkup: {pregnancyData.nextCheckup}</Text>
                            </View>
                            <TouchableOpacity style={styles.scheduleButton}>
                                <Ionicons name="medical-outline" size={18} color="#EC4899" />
                                <Text style={styles.scheduleButtonText}>Immunization Schedule</Text>
                                <Ionicons name="chevron-forward" size={16} color="#EC4899" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Mental Wellness */}
                <View style={styles.section}>
                    <View style={styles.sectionTitleContainer}>
                        <Ionicons name="heart-circle-outline" size={20} color={healthColors.primary.main} />
                        <Text style={styles.sectionTitle}>MENTAL WELLNESS</Text>
                    </View>
                    <View style={styles.card}>
                        {mentalWellnessActivities.map((activity, index) => (
                            <TouchableOpacity key={index} style={styles.activityItem}>
                                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                                    <Ionicons name={activity.icon} size={24} color={activity.color} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityName}>{activity.name}</Text>
                                    <Text style={styles.activityDuration}>
                                        {activity.duration || activity.action}
                                    </Text>
                                </View>
                                {activity.action ? (
                                    <LinearGradient
                                        colors={[activity.color, activity.color + 'DD']}
                                        style={styles.actionButton}
                                    >
                                        <Text style={styles.actionButtonText}>{activity.action}</Text>
                                    </LinearGradient>
                                ) : (
                                    <Ionicons name="play-circle" size={28} color={activity.color} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Emergency Contact */}
                <TouchableOpacity style={styles.emergencyButton}>
                    <LinearGradient
                        colors={['#F44336', '#D32F2F']}
                        style={styles.emergencyGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="call" size={24} color="#FFF" />
                        <Text style={styles.emergencyText}>Women's Helpline: 1091</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
        padding: getScreenPadding(),
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(30),
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        flex: 1,
        marginLeft: indianDesign.spacing.md,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: scaledFontSize(13),
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        padding: getScreenPadding(),
    },
    section: {
        marginBottom: indianDesign.spacing.xl,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: indianDesign.spacing.md,
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: indianDesign.spacing.lg,
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    cycleInfo: {
        marginBottom: indianDesign.spacing.md,
    },
    cycleText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: 4,
    },
    nextPeriodText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
    },
    cycleProgress: {
        marginBottom: indianDesign.spacing.md,
    },
    progressBar: {
        height: 12,
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: indianDesign.spacing.xs,
        marginBottom: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.sm,
    },
    calendarButtonText: {
        fontSize: scaledFontSize(14),
        color: '#EC4899',
        fontWeight: indianDesign.fontWeight.medium,
    },
    insightBox: {
        flexDirection: 'row',
        backgroundColor: healthColors.background.secondary,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.medium,
        gap: indianDesign.spacing.sm,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        fontSize: scaledFontSize(13),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: 4,
    },
    insightText: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        lineHeight: 18,
    },
    pregnancyHeader: {
        alignItems: 'center',
        marginBottom: indianDesign.spacing.lg,
    },
    pregnancyWeek: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: 4,
    },
    babySizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
        marginTop: 4,
    },
    babySize: {
        fontSize: scaledFontSize(16),
        color: healthColors.text.secondary,
    },
    tipsSection: {
        marginBottom: indianDesign.spacing.lg,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
        marginBottom: indianDesign.spacing.sm,
    },
    tipsTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: indianDesign.spacing.sm,
        paddingLeft: indianDesign.spacing.sm,
    },
    tipText: {
        flex: 1,
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        lineHeight: 20,
    },
    checkupInfo: {
        borderTopWidth: 1,
        borderColor: healthColors.border.light,
        paddingTop: indianDesign.spacing.md,
    },
    checkupRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.sm,
        marginBottom: indianDesign.spacing.md,
    },
    checkupText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.primary,
    },
    scheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: indianDesign.spacing.xs,
        paddingVertical: indianDesign.spacing.sm,
    },
    scheduleButtonText: {
        fontSize: scaledFontSize(14),
        color: '#EC4899',
        fontWeight: indianDesign.fontWeight.medium,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: indianDesign.spacing.md,
        backgroundColor: healthColors.background.primary,
        borderRadius: indianDesign.borderRadius.medium,
        marginBottom: indianDesign.spacing.sm,
    },
    activityIcon: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
    },
    activityInfo: {
        flex: 1,
    },
    activityName: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    activityDuration: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
    },
    actionButton: {
        paddingHorizontal: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.xs,
        borderRadius: indianDesign.borderRadius.small,
    },
    actionButtonText: {
        fontSize: scaledFontSize(12),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
    emergencyButton: {
        borderRadius: indianDesign.borderRadius.medium,
        overflow: 'hidden',
        marginTop: indianDesign.spacing.lg,
    },
    emergencyGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    emergencyText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
});

export default WomensHealthScreen;
