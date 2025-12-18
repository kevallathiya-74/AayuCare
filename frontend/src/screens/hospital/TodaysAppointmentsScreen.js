/**
 * Today's Appointments Screen
 * Fast appointment access for doctors
 * Filters: Today, Upcoming, Completed
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
import { indianDesign } from '../../theme/indianDesign';
import { doctorService } from '../../services';
import { logError } from '../../utils/errorHandler';

const TodaysAppointmentsScreen = ({ navigation }) => {
    const [selectedFilter, setSelectedFilter] = useState('today');
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const filters = [
        { key: 'today', label: 'Today' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'completed', label: 'Completed' },
    ];

    const fetchAppointments = useCallback(async (filter = selectedFilter) => {
        try {
            setError(null);
            let response;
            
            if (filter === 'today') {
                response = await doctorService.getTodaysAppointments();
            } else if (filter === 'upcoming') {
                response = await doctorService.getUpcomingAppointments();
            } else {
                response = await doctorService.getTodaysAppointments('completed');
            }

            if (response?.success) {
                setAppointments(response.data || []);
            } else {
                setError('Failed to load appointments');
            }
        } catch (err) {
            logError(err, 'TodaysAppointmentsScreen.fetchAppointments');
            setError('Unable to fetch appointments');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedFilter]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleFilterChange = useCallback((filterKey) => {
        setSelectedFilter(filterKey);
        setLoading(true);
        fetchAppointments(filterKey);
    }, [fetchAppointments]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAppointments();
    }, [fetchAppointments]);

    const handleStartConsultation = useCallback(async (appointment) => {
        try {
            const response = await doctorService.updateAppointmentStatus(
                appointment._id,
                'in-progress'
            );
            if (response?.success) {
                Alert.alert('Consultation Started', 'Consultation interface coming soon!');
                // navigation.navigate('Consultation', { appointment }); // Screen doesn't exist yet
            }
        } catch (err) {
            logError(err, 'TodaysAppointmentsScreen.handleStartConsultation');
            Alert.alert('Error', 'Unable to start consultation');
        }
    }, [navigation]);

    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'confirmed': return healthColors.success.main;
            case 'completed': return healthColors.info.main;
            case 'cancelled': return healthColors.error;
            case 'in-progress': return healthColors.primary.main;
            default: return healthColors.warning;
        }
    }, []);

    const getStatusLabel = useCallback((status) => {
        switch (status) {
            case 'confirmed': return 'Confirmed';
            case 'completed': return 'Completed';
            case 'cancelled': return 'Cancelled';
            case 'in-progress': return 'In Progress';
            case 'scheduled': return 'Scheduled';
            default: return 'Pending';
        }
    }, []);

    const renderAppointmentCard = ({ item }) => (
        <TouchableOpacity
            style={styles.appointmentCard}
            onPress={() => navigation.navigate('AppointmentDetails', { appointmentId: item._id })}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Appointment with ${item.patient?.name || item.patientName} at ${item.timeSlot || item.time}, ${getStatusLabel(item.status)}`}
        >
            <View style={styles.cardLeft}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color={healthColors.primary.main} />
                </View>
                <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{item.patient?.name || item.patientName}</Text>
                    <Text style={styles.reason}>{item.reasonForVisit || item.reason}</Text>
                    <View style={styles.timeContainer}>
                        <Ionicons name="time-outline" size={14} color={healthColors.text.secondary} />
                        <Text style={styles.time}>{item.timeSlot || item.time}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.cardRight}>
                <TouchableOpacity 
                    style={styles.actionButton} 
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('VideoCall', { appointmentId: item._id })}
                    accessibilityRole="button"
                    accessibilityLabel="Start video call"
                >
                    <Ionicons name="videocam-outline" size={20} color={healthColors.primary.main} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionButton} 
                    activeOpacity={0.7}
                    onPress={() => handleStartConsultation(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Start consultation"
                >
                    <Ionicons name="medical-outline" size={20} color={healthColors.success.main} />
                </TouchableOpacity>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={healthColors.text.secondary} />
            <Text style={styles.emptyStateTitle}>No Appointments</Text>
            <Text style={styles.emptyStateText}>
                {selectedFilter === 'today' 
                    ? 'No appointments scheduled for today'
                    : selectedFilter === 'upcoming'
                    ? 'No upcoming appointments'
                    : 'No completed appointments'}
            </Text>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading appointments...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
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
                    style={styles.searchButton} 
                    activeOpacity={0.7}
                    onPress={() => Alert.alert('Search', 'Appointment search feature coming soon!')}
                    accessibilityRole="button"
                    accessibilityLabel="Search appointments"
                >
                    <Ionicons name="search" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {filters.map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[
                            styles.filterButton,
                            selectedFilter === filter.key && styles.filterButtonActive,
                        ]}
                        onPress={() => handleFilterChange(filter.key)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityState={{ selected: selectedFilter === filter.key }}
                        accessibilityLabel={`Filter by ${filter.label}`}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === filter.key && styles.filterTextActive,
                            ]}
                        >
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Error State */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        onPress={handleRefresh}
                        accessibilityRole="button"
                        accessibilityLabel="Retry loading appointments"
                    >
                        <Text style={styles.retryText}>Tap to retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Appointments List */}
            <FlatList
                data={appointments}
                renderItem={renderAppointmentCard}
                keyExtractor={(item) => item._id || item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[healthColors.primary.main]}
                        tintColor={healthColors.primary.main}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: indianDesign.spacing.md,
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.md,
        backgroundColor: healthColors.background.card,
        borderBottomWidth: 2,
        borderBottomColor: healthColors.border.light,
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
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersContainer: {
        flexDirection: 'row',
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    filterButton: {
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: indianDesign.borderRadius.pill,
        backgroundColor: healthColors.background.card,
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    filterButtonActive: {
        backgroundColor: healthColors.primary.main,
        borderColor: healthColors.primary.main,
    },
    filterText: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.secondary,
    },
    filterTextActive: {
        color: healthColors.text.white,
    },
    errorContainer: {
        padding: indianDesign.spacing.lg,
        alignItems: 'center',
        backgroundColor: healthColors.error + '10',
        marginHorizontal: indianDesign.spacing.lg,
        borderRadius: indianDesign.borderRadius.medium,
    },
    errorText: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.error,
        marginBottom: indianDesign.spacing.sm,
    },
    retryText: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.semibold,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: indianDesign.spacing.xxl * 2,
    },
    emptyStateTitle: {
        fontSize: indianDesign.fontSize.xlarge,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.lg,
    },
    emptyStateText: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.sm,
        textAlign: 'center',
    },
    listContent: {
        padding: indianDesign.spacing.lg,
        gap: indianDesign.spacing.md,
    },
    appointmentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.large,
        padding: indianDesign.spacing.md,
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    cardLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: indianDesign.spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    patientInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    patientName: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: 2,
    },
    reason: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        marginBottom: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    time: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.secondary,
        fontWeight: indianDesign.fontWeight.medium,
    },
    cardRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: healthColors.background.tertiary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: 4,
        borderRadius: indianDesign.borderRadius.small,
    },
    statusText: {
        fontSize: indianDesign.fontSize.tiny,
        fontWeight: indianDesign.fontWeight.semibold,
    },
});

export default TodaysAppointmentsScreen;
