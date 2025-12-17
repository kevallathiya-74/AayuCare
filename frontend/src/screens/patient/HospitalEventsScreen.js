/**
 * Hospital Events & Camps Screen
 * Blood donation, diabetes screening, vaccination, health workshops
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

const HospitalEventsScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();

    const upcomingEvents = [
        {
            id: 1,
            icon: 'water',
            title: 'Blood Donation Camp',
            date: '22 Dec 2024',
            time: '9:00 AM - 4:00 PM',
            venue: 'Community Hall, Block A',
            description: 'Help save lives! Donate blood and receive free health checkup.',
            color: '#E91E63',
            emoji: '🩸',
            spots: 45,
        },
        {
            id: 2,
            icon: 'fitness',
            title: 'Diabetes Screening Camp',
            date: '25 Dec 2024',
            time: '8:00 AM - 12:00 PM',
            venue: 'Outpatient Department',
            description: 'Free blood sugar testing and consultation with diabetologist.',
            color: '#FF9800',
            emoji: '🩺',
            spots: 30,
        },
        {
            id: 3,
            icon: 'medical',
            title: 'Vaccination Drive',
            date: '28 Dec 2024',
            time: '10:00 AM - 3:00 PM',
            venue: 'Pediatric Ward',
            description: 'Children vaccination program - Measles, Polio, and COVID-19 booster.',
            color: '#4CAF50',
            emoji: '💉',
            spots: 60,
        },
        {
            id: 4,
            icon: 'school',
            title: 'Health Workshop',
            date: '30 Dec 2024',
            time: '3:00 PM - 5:00 PM',
            venue: 'Auditorium',
            description: 'Learn about healthy lifestyle, nutrition, and disease prevention.',
            color: '#2196F3',
            emoji: '📚',
            spots: 100,
        },
    ];

    const handleRegister = async (event) => {
        try {
            if (!isConnected) {
                showError('No internet connection. Please check your network.');
                return;
            }

            setLoading(true);
            setError(null);

            // Simulate registration process
            await new Promise(resolve => setTimeout(resolve, 500));

            alert(`Registration for "${event.title}" will open soon!`);
        } catch (err) {
            logError(err, { context: 'HospitalEventsScreen.handleRegister', eventId: event.id });
            setError(err.message || 'Failed to register for event');
            showError('Failed to register for event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                </View>
            )}
            {/* Header */}
            <LinearGradient
                colors={['#FF6F00', '#E65100']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerIcon}>🏥</Text>
                    <View style={styles.headerText}>
                        <Text style={styles.headerTitle}>Hospital Events</Text>
                        <Text style={styles.headerSubtitle}>Health camps & workshops</Text>
                    </View>
                </View>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="notifications" size={24} color="#FFF" />
                </TouchableOpacity>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Notification Banner */}
                <View style={styles.notificationBanner}>
                    <View style={styles.notificationContent}>
                        <Ionicons name="notifications-circle" size={24} color="#FF9800" />
                        <View style={styles.notificationText}>
                            <Text style={styles.notificationTitle}>Enable Notifications</Text>
                            <Text style={styles.notificationSubtitle}>Get alerts for new events and reminders</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.enableButton}>
                        <Text style={styles.enableButtonText}>Enable</Text>
                    </TouchableOpacity>
                </View>

                {/* Upcoming Events */}
                <Text style={styles.sectionTitle}>📅 UPCOMING EVENTS ({upcomingEvents.length})</Text>

                {upcomingEvents.map((event, index) => (
                    <View key={event.id} style={styles.eventCard}>
                        {/* Event Header */}
                        <View style={styles.eventHeader}>
                            <View style={[styles.eventIconContainer, { backgroundColor: event.color + '20' }]}>
                                <Text style={styles.eventEmoji}>{event.emoji}</Text>
                            </View>
                            <View style={styles.eventHeaderText}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                <View style={styles.eventDateRow}>
                                    <Ionicons name="calendar" size={14} color={healthColors.text.tertiary} />
                                    <Text style={styles.eventDate}>{event.date}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Event Details */}
                        <View style={styles.eventDetails}>
                            <View style={styles.eventDetailRow}>
                                <Ionicons name="time" size={16} color={event.color} />
                                <Text style={styles.eventDetailText}>{event.time}</Text>
                            </View>
                            <View style={styles.eventDetailRow}>
                                <Ionicons name="location" size={16} color={event.color} />
                                <Text style={styles.eventDetailText}>{event.venue}</Text>
                            </View>
                        </View>

                        {/* Event Description */}
                        <Text style={styles.eventDescription}>{event.description}</Text>

                        {/* Spots Available */}
                        <View style={styles.spotsContainer}>
                            <View style={styles.spotsInfo}>
                                <Ionicons name="people" size={18} color={event.color} />
                                <Text style={styles.spotsText}>
                                    {event.spots} spots available
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={() => handleRegister(event)}
                            >
                                <LinearGradient
                                    colors={[event.color, event.color + 'DD']}
                                    style={styles.registerGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.registerButtonText}>Register Now</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Past Events */}
                <View style={styles.pastEventsSection}>
                    <Text style={styles.sectionTitle}>📖 PAST EVENTS</Text>
                    <TouchableOpacity style={styles.viewPastButton}>
                        <Text style={styles.viewPastText}>View All Past Events</Text>
                        <Ionicons name="chevron-forward" size={20} color={healthColors.text.tertiary} />
                    </TouchableOpacity>
                </View>

                {/* Feedback Section */}
                <View style={styles.feedbackCard}>
                    <Text style={styles.feedbackTitle}>💭 Share Your Feedback</Text>
                    <Text style={styles.feedbackText}>
                        Help us improve by sharing your experience at our events
                    </Text>
                    <TouchableOpacity style={styles.feedbackButton}>
                        <LinearGradient
                            colors={['#7E57C2', '#5E35B1']}
                            style={styles.feedbackGradient}
                        >
                            <Ionicons name="chatbubbles" size={20} color="#FFF" />
                            <Text style={styles.feedbackButtonText}>Submit Feedback</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
    headerIcon: {
        fontSize: 32,
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
    notificationBanner: {
        backgroundColor: healthColors.background.card,
        borderRadius: 16,
        padding: indianDesign.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: indianDesign.spacing.xl,
        ...createShadow(2),
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        flex: 1,
    },
    notificationText: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: 2,
    },
    notificationSubtitle: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    enableButton: {
        backgroundColor: healthColors.warning.main,
        paddingHorizontal: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.xs,
        borderRadius: indianDesign.borderRadius.small,
    },
    enableButtonText: {
        fontSize: scaledFontSize(12),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
    },
    eventCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: 16,
        padding: indianDesign.spacing.lg,
        marginBottom: indianDesign.spacing.lg,
        ...createShadow(2),
    },
    eventHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    eventIconContainer: {
        width: moderateScale(56),
        height: moderateScale(56),
        borderRadius: moderateScale(28),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
    },
    eventEmoji: {
        fontSize: 32,
    },
    eventHeaderText: {
        flex: 1,
    },
    eventTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: 4,
    },
    eventDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
    },
    eventDate: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.tertiary,
    },
    eventDetails: {
        marginBottom: indianDesign.spacing.md,
    },
    eventDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.sm,
        marginBottom: indianDesign.spacing.xs,
    },
    eventDetailText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
    },
    eventDescription: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        lineHeight: 20,
        marginBottom: indianDesign.spacing.md,
    },
    spotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: indianDesign.spacing.md,
        borderTopWidth: 1,
        borderTopColor: healthColors.border.light,
    },
    spotsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
    },
    spotsText: {
        fontSize: scaledFontSize(13),
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.secondary,
    },
    registerButton: {
        borderRadius: indianDesign.borderRadius.small,
        overflow: 'hidden',
        ...createShadow(2),
    },
    registerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.sm,
        gap: indianDesign.spacing.xs,
    },
    registerButtonText: {
        fontSize: scaledFontSize(13),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
    pastEventsSection: {
        marginTop: indianDesign.spacing.xl,
        marginBottom: indianDesign.spacing.lg,
    },
    viewPastButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        padding: indianDesign.spacing.md,
        ...createShadow(1),
    },
    viewPastText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.primary,
        marginRight: indianDesign.spacing.xs,
    },
    feedbackCard: {
        backgroundColor: healthColors.primary.light,
        borderRadius: 16,
        padding: indianDesign.spacing.lg,
        marginTop: indianDesign.spacing.lg,
        alignItems: 'center',
    },
    feedbackTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.xs,
    },
    feedbackText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        textAlign: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    feedbackButton: {
        borderRadius: indianDesign.borderRadius.medium,
        overflow: 'hidden',
        ...createShadow(2),
    },
    feedbackGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.sm,
        gap: indianDesign.spacing.sm,
    },
    feedbackButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
});

export default HospitalEventsScreen;
