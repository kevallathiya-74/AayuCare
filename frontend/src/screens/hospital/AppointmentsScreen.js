/**
 * Admin Appointments Screen
 * View and manage all appointments for admin users
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { appointmentService } from '../../services';
import { logError } from '../../utils/errorHandler';

const AppointmentsScreen = ({ navigation }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchAppointments = useCallback(async () => {
        try {
            setError(null);
            const response = await appointmentService.getAllAppointments();
            setAppointments(response?.data || []);
        } catch (err) {
            logError(err, { context: 'AppointmentsScreen.fetchAppointments' });
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAppointments();
    }, [fetchAppointments]);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'completed':
                return healthColors.success.main;
            case 'cancelled':
                return healthColors.error.main;
            case 'pending':
            case 'scheduled':
                return healthColors.warning.main;
            default:
                return healthColors.text.secondary;
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleAppointmentPress = (appointment) => {
        Alert.alert(
            'Appointment Details',
            `Patient: ${appointment.patientId?.name || 'N/A'}\nDoctor: ${appointment.doctorId?.name || 'N/A'}\nStatus: ${appointment.status || 'N/A'}`,
            [{ text: 'OK' }]
        );
    };

    const renderAppointment = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() => handleAppointmentPress(item)}
            accessibilityRole="button"
            accessibilityLabel={`Appointment with ${item.doctorId?.name || 'Doctor'}`}
        >
            <View style={styles.appointmentHeader}>
                <View style={styles.avatarContainer}>
                    <Ionicons name="calendar" size={24} color={healthColors.primary.main} />
                </View>
                <View style={styles.appointmentInfo}>
                    <Text style={styles.doctorName}>{item.doctorId?.name || 'Unknown Doctor'}</Text>
                    <Text style={styles.patientName}>Patient: {item.patientId?.name || 'Unknown'}</Text>
                    <Text style={styles.appointmentTime}>{formatDate(item.appointmentDate)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status || 'Unknown'}
                    </Text>
                </View>
            </View>
            {item.reason && (
                <Text style={styles.reason} numberOfLines={2}>
                    Reason: {item.reason}
                </Text>
            )}
        </TouchableOpacity>
    ), []);

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={80} color={healthColors.text.tertiary} />
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptySubtitle}>
                {error || 'Appointments will appear here'}
            </Text>
            {error && (
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchAppointments}
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading appointments"
                >
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Appointments</Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => Alert.alert('Filter', 'Filter options coming soon')}
                    accessibilityRole="button"
                    accessibilityLabel="Filter appointments"
                >
                    <Ionicons name="filter" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading appointments...</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderAppointment}
                    keyExtractor={(item) => item._id || String(Math.random())}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[healthColors.primary.main]}
                            tintColor={healthColors.primary.main}
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
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
    filterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    listContent: {
        padding: indianDesign.spacing.lg,
        flexGrow: 1,
    },
    appointmentCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.medium,
        padding: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.md,
        ...createShadow(2),
    },
    appointmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
    },
    appointmentInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semiBold,
        color: healthColors.text.primary,
    },
    patientName: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        marginTop: 2,
    },
    appointmentTime: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.tertiary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: indianDesign.spacing.xs,
        borderRadius: indianDesign.borderRadius.small,
    },
    statusText: {
        fontSize: indianDesign.fontSize.small,
        fontWeight: indianDesign.fontWeight.medium,
        textTransform: 'capitalize',
    },
    reason: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.sm,
        paddingTop: indianDesign.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: healthColors.border.light,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.md,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: indianDesign.spacing.xxxl,
    },
    emptyTitle: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.lg,
    },
    emptySubtitle: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.xs,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: indianDesign.spacing.lg,
        paddingHorizontal: indianDesign.spacing.xl,
        paddingVertical: indianDesign.spacing.md,
        backgroundColor: healthColors.primary.main,
        borderRadius: indianDesign.borderRadius.medium,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semiBold,
    },
});

export default AppointmentsScreen;
