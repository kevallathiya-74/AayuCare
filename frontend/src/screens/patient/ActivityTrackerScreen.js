/**
 * Activity Tracker Screen
 * Track steps, sleep, water intake, and stress relief activities
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { getScreenPadding, scaledFontSize, moderateScale, verticalScale } from '../../utils/responsive';

const ActivityTrackerScreen = ({ navigation }) => {
    const [waterGlasses, setWaterGlasses] = useState(6);
    const targetGlasses = 8;
    
    const stepsData = {
        current: 6543,
        target: 10000,
        percentage: 65,
    };

    const sleepData = {
        duration: '7h 30m',
        quality: 'GOOD',
        bedtime: '10:30 PM',
        wakeTime: '6:00 AM',
    };

    const stressActivities = [
        { icon: 'fitness', name: 'Breathing Exercise', duration: '5 min', color: '#4CAF50' },
        { icon: 'body', name: 'Yoga Session', duration: '15 min', color: '#9C27B0' },
        { icon: 'musical-notes', name: 'Meditation', duration: '10 min', color: '#2196F3' },
    ];

    const addWaterGlass = () => {
        if (waterGlasses < targetGlasses) {
            setWaterGlasses(waterGlasses + 1);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <LinearGradient
                colors={[healthColors.primary.main, healthColors.primary.dark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="fitness" size={32} color="#FFF" />
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Activity Tracker</Text>
                        <Text style={styles.headerSubtitle}>Monitor your daily activities</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="bar-chart" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Steps Tracker */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🚶 STEPS TODAY:</Text>
                    <View style={styles.card}>
                        <View style={styles.stepsHeader}>
                            <Text style={styles.stepsCount}>
                                {stepsData.current.toLocaleString()} / {stepsData.target.toLocaleString()} steps
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${stepsData.percentage}%` }]} />
                        </View>
                        <Text style={styles.progressText}>
                            📊 {stepsData.target - stepsData.current} steps to go!
                        </Text>
                    </View>
                </View>

                {/* Sleep Tracker */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💤 SLEEP TRACKER:</Text>
                    <View style={styles.card}>
                        <View style={styles.sleepRow}>
                            <Text style={styles.sleepLabel}>Last Night:</Text>
                            <View style={styles.sleepValue}>
                                <Text style={styles.sleepDuration}>{sleepData.duration}</Text>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            </View>
                        </View>
                        <View style={styles.sleepRow}>
                            <Text style={styles.sleepLabel}>Quality:</Text>
                            <Text style={[styles.sleepQuality, { color: '#4CAF50' }]}>
                                {sleepData.quality}
                            </Text>
                        </View>
                        <View style={styles.sleepDetails}>
                            <View style={styles.sleepTime}>
                                <Text style={styles.sleepTimeLabel}>🌙 Bedtime:</Text>
                                <Text style={styles.sleepTimeValue}>{sleepData.bedtime}</Text>
                            </View>
                            <View style={styles.sleepTime}>
                                <Text style={styles.sleepTimeLabel}>☀️ Wake:</Text>
                                <Text style={styles.sleepTimeValue}>{sleepData.wakeTime}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.reportButton}>
                            <Text style={styles.reportButtonText}>View Weekly Report</Text>
                            <Ionicons name="chevron-forward" size={16} color={healthColors.primary.main} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Water Intake */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💧 WATER INTAKE:</Text>
                    <View style={styles.card}>
                        <Text style={styles.waterCount}>
                            {waterGlasses} / {targetGlasses} glasses today
                        </Text>
                        <View style={styles.waterGlasses}>
                            {Array.from({ length: targetGlasses }).map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.glassIcon,
                                        { opacity: index < waterGlasses ? 1 : 0.3 },
                                    ]}
                                >
                                    <Text style={styles.glassEmoji}>💧</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={styles.addGlassButton}
                            onPress={addWaterGlass}
                            disabled={waterGlasses >= targetGlasses}
                        >
                            <LinearGradient
                                colors={['#2196F3', '#1976D2']}
                                style={styles.addGlassGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="add" size={20} color="#FFF" />
                                <Text style={styles.addGlassText}>Add Glass</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <Text style={styles.reminderText}>⏰ Reminder every 2 hours</Text>
                    </View>
                </View>

                {/* Stress Relief */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🧘 STRESS RELIEF:</Text>
                    <View style={styles.card}>
                        {stressActivities.map((activity, index) => (
                            <TouchableOpacity key={index} style={styles.activityItem}>
                                <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                                    <Ionicons name={activity.icon} size={24} color={activity.color} />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityName}>{activity.name}</Text>
                                    <Text style={styles.activityDuration}>({activity.duration})</Text>
                                </View>
                                <Ionicons name="play-circle" size={28} color={activity.color} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Progress Button */}
                <TouchableOpacity style={styles.progressButton}>
                    <LinearGradient
                        colors={[healthColors.primary.main, healthColors.primary.dark]}
                        style={styles.progressGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="stats-chart" size={24} color="#FFF" />
                        <Text style={styles.progressButtonText}>📊 View 30-Day Progress</Text>
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
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
    },
    card: {
        backgroundColor: healthColors.background.card,
        borderRadius: 16,
        padding: indianDesign.spacing.lg,
        ...createShadow(2),
    },
    stepsHeader: {
        marginBottom: indianDesign.spacing.md,
    },
    stepsCount: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        textAlign: 'center',
    },
    progressBar: {
        height: 12,
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: indianDesign.spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: healthColors.primary.main,
    },
    progressText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        textAlign: 'center',
    },
    sleepRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    sleepLabel: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
    },
    sleepValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
    },
    sleepDuration: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    sleepQuality: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
    },
    sleepDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: healthColors.border.light,
    },
    sleepTime: {
        alignItems: 'center',
    },
    sleepTimeLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        marginBottom: 4,
    },
    sleepTimeValue: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: indianDesign.spacing.xs,
        marginTop: indianDesign.spacing.sm,
    },
    reportButtonText: {
        fontSize: scaledFontSize(14),
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.medium,
    },
    waterCount: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        textAlign: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    waterGlasses: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: indianDesign.spacing.xs,
        marginBottom: indianDesign.spacing.lg,
    },
    glassIcon: {
        alignItems: 'center',
    },
    glassEmoji: {
        fontSize: 24,
    },
    addGlassButton: {
        borderRadius: indianDesign.borderRadius.medium,
        overflow: 'hidden',
        marginBottom: indianDesign.spacing.md,
        ...createShadow(2),
    },
    addGlassGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.sm,
        gap: indianDesign.spacing.xs,
    },
    addGlassText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
    reminderText: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        textAlign: 'center',
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
    progressButton: {
        borderRadius: indianDesign.borderRadius.medium,
        overflow: 'hidden',
        marginTop: indianDesign.spacing.lg,
        ...createShadow(4),
    },
    progressGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    progressButtonText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
});

export default ActivityTrackerScreen;
