/**
 * AayuCare - HomeScreen
 * 
 * Main dashboard with health metrics, appointments, and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import {
    Card,
    Avatar,
    FloatingActionButton,
    EmptyState,
    LoadingOverlay,
} from '../../components/common';
import {
    HealthMetricCard,
    AppointmentCard,
} from '../../components/health';

const HomeScreen = ({ navigation }) => {
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const user = useSelector((state) => state.auth.user);

    const quickActions = [
        {
            id: 1,
            icon: 'calendar',
            label: 'Book Appointment',
            color: healthColors.primary.main,
            gradient: healthColors.gradients.primary,
            onPress: () => navigation.navigate('Doctors'),
        },
        {
            id: 2,
            icon: 'call',
            label: 'Emergency',
            color: healthColors.error.main,
            gradient: ['#F44336', '#E57373'],
            onPress: () => Alert.alert('Emergency', 'Calling emergency services...'),
        },
        {
            id: 3,
            icon: 'document-text',
            label: 'Health Records',
            color: healthColors.accent.teal,
            gradient: ['#26A69A', '#4DB6AC'],
            onPress: () => Alert.alert('Health Records', 'Access your complete health history including:\\n\\n• Lab Reports\\n• Prescriptions\\n• Doctor Visits\\n• Medical History'),
        },
        {
            id: 4,
            icon: 'medkit',
            label: 'Medications',
            color: healthColors.accent.purple,
            gradient: ['#9C27B0', '#BA68C8'],
            onPress: () => Alert.alert('Medications', 'Track your medications including:\\n\\n• Current Prescriptions\\n• Dosage Schedule\\n• Medication Reminders\\n• Refill Alerts'),
        },
    ];

    const onRefresh = async () => {
        setRefreshing(true);
        // TODO: Fetch latest data from API
        setTimeout(() => {
            setRefreshing(false);
        }, 1500);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <Avatar source={user?.avatar} name={user?.name} size="medium" />
                    </TouchableOpacity>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.quickActionsGrid}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                onPress={action.onPress}
                                style={styles.quickActionCard}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={action.gradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.quickActionGradient}
                                >
                                    <Ionicons
                                        name={action.icon}
                                        size={28}
                                        color={healthColors.neutral.white}
                                    />
                                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Coming Soon Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Health Overview</Text>
                    <EmptyState
                        icon="fitness-outline"
                        title="Coming Soon"
                        message="Health metrics tracking will be available soon"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                    <EmptyState
                        icon="calendar-outline"
                        title="No Appointments"
                        message="You don't have any upcoming appointments"
                        actionLabel="Find Doctors"
                        onActionPress={() => navigation.navigate('Doctors')}
                    />
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            <FloatingActionButton
                icon="add"
                onPress={() => navigation.navigate('Doctors')}
                gradient
            />

            <LoadingOverlay visible={loading} message="Loading..." />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg,
        backgroundColor: healthColors.background.primary,
    },
    greeting: {
        ...textStyles.bodyMedium,
        color: healthColors.text.secondary,
    },
    userName: {
        ...textStyles.h2,
        color: healthColors.text.primary,
        marginTop: 2,
    },
    section: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    sectionTitle: {
        ...textStyles.h3,
        color: healthColors.text.primary,
        marginBottom: spacing.md,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -spacing.xs,
    },
    quickActionCard: {
        width: '48%',
        aspectRatio: 1,
        margin: spacing.xs,
        borderRadius: healthColors.borderRadius.medium,
        overflow: 'hidden',
    },
    quickActionGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
    },
    quickActionLabel: {
        ...textStyles.bodyMedium,
        color: healthColors.neutral.white,
        fontWeight: '600',
        marginTop: spacing.sm,
        textAlign: 'center',
    },
    bottomSpacing: {
        height: 100,
    },
});

export default HomeScreen;
