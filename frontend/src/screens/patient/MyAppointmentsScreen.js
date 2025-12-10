/**
 * My Appointments Screen (Patient)
 * View upcoming and past appointments
 * Reschedule/cancel options
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { ErrorRecovery, NetworkStatusIndicator } from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const MyAppointmentsScreen = ({ navigation }) => {
    const [selectedTab, setSelectedTab] = useState('upcoming');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const isConnected = useNetworkStatus();

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Mock appointments - replace with actual API call
            const mockData = [
                {
                    id: '1',
                    doctorName: 'Dr. Sharma',
                    specialization: 'Cardiologist',
                    date: 'Dec 8, 2025',
                    time: '10:00 AM',
                    status: 'confirmed',
                    type: 'upcoming',
                },
                {
                    id: '2',
                    doctorName: 'Dr. Patel',
                    specialization: 'General Physician',
                    date: 'Dec 10, 2025',
                    time: '02:30 PM',
                    status: 'scheduled',
                    type: 'upcoming',
                },
            ];
            
            setAppointments(mockData);
        } catch (err) {
            logError(err, 'MyAppointmentsScreen - fetchAppointments');
            setError(err);
            showError(err.message || 'Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const renderAppointment = ({ item }) => (
        <View style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                    <View style={styles.doctorAvatar}>
                        <Ionicons name="person" size={24} color={healthColors.primary.main} />
                    </View>
                    <View>
                        <Text style={styles.doctorName}>{item.doctorName}</Text>
                        <Text style={styles.specialization}>{item.specialization}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                    <Text style={styles.statusText}>
                        {item.status === 'confirmed' ? 'Confirmed' : 'Scheduled'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={healthColors.text.secondary} />
                    <Text style={styles.infoText}>{item.date}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={healthColors.text.secondary} />
                    <Text style={styles.infoText}>{item.time}</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
                    <Ionicons name="calendar-outline" size={18} color={healthColors.primary.main} />
                    <Text style={styles.actionText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} activeOpacity={0.7}>
                    <Ionicons name="close-circle-outline" size={18} color={healthColors.error.main} />
                    <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />
            <NetworkStatusIndicator />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Appointments</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
                    onPress={() => setSelectedTab('upcoming')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
                        Upcoming
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
                    onPress={() => setSelectedTab('past')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
                        Past
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Appointments List */}
            {error ? (
                <ErrorRecovery
                    error={error}
                    onRetry={fetchAppointments}
                    onGoBack={() => navigation.goBack()}
                    context="loading appointments"
                />
            ) : loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading appointments...</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderAppointment}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.md,
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: indianDesign.fontSize.xlarge,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    tab: {
        flex: 1,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: indianDesign.borderRadius.medium,
        backgroundColor: healthColors.background.card,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: healthColors.primary.main,
    },
    tabText: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.secondary,
    },
    tabTextActive: {
        color: healthColors.text.white,
    },
    listContent: {
        padding: indianDesign.spacing.lg,
        gap: indianDesign.spacing.md,
    },
    appointmentCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.large,
        padding: indianDesign.spacing.md,
        ...createShadow(2),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: indianDesign.spacing.md,
    },
    doctorInfo: {
        flexDirection: 'row',
        gap: indianDesign.spacing.sm,
        flex: 1,
    },
    doctorAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorName: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    specialization: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
    },
    statusBadge: {
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: 4,
        borderRadius: indianDesign.borderRadius.small,
    },
    status_scheduled: {
        backgroundColor: healthColors.warning.background,
    },
    status_confirmed: {
        backgroundColor: healthColors.success.background,
    },
    statusText: {
        fontSize: indianDesign.fontSize.tiny,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    cardBody: {
        gap: indianDesign.spacing.xs,
        marginBottom: indianDesign.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
    },
    infoText: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: indianDesign.spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: indianDesign.borderRadius.small,
        backgroundColor: healthColors.primary.main + '15',
    },
    cancelButton: {
        backgroundColor: healthColors.error.background,
    },
    actionText: {
        fontSize: indianDesign.fontSize.small,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.primary.main,
    },
    cancelText: {
        color: healthColors.error.main,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
    },
    loadingText: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
    },
});

export default MyAppointmentsScreen;
