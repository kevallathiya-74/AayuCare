/**
 * Doctor Home Screen (Screen 8)
 * Main dashboard for doctors with today's schedule and quick patient access
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
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { 
    getScreenPadding, 
    moderateScale, 
    verticalScale,
    scaledFontSize,
} from '../../utils/responsive';
import Avatar from '../../components/common/Avatar';
import { logoutUser } from '../../store/slices/authSlice';
import { showConfirmation, logError } from '../../utils/errorHandler';
import { doctorService } from '../../services';

const DoctorHomeScreen = ({ navigation }) => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [notificationCount] = useState(3);
    
    const [schedule, setSchedule] = useState({
        totalAppointments: 0,
        completed: 0,
        pending: 0,
        nextPatient: 'Loading...',
        nextTime: '--:--',
    });

    const [todaysAppointments, setTodaysAppointments] = useState([]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setError(null);
            const response = await doctorService.getDashboard();
            
            if (response?.success) {
                setSchedule(response.data.schedule);
                setTodaysAppointments(response.data.todaysAppointments || []);
            }
        } catch (err) {
            logError(err, { context: 'DoctorHomeScreen.fetchDashboardData' });
            setError('Failed to load dashboard');
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

    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await doctorService.searchMyPatients(query);
            setSearchResults(response?.data || []);
        } catch (err) {
            logError(err, { context: 'DoctorHomeScreen.handleSearch' });
        } finally {
            setSearching(false);
        }
    }, []);

    const handleLogout = useCallback(() => {
        showConfirmation(
            'Are you sure you want to logout?',
            () => dispatch(logoutUser()),
            () => {},
            'Logout'
        );
    }, [dispatch]);

    const handleStartConsultation = useCallback(async (appointment) => {
        try {
            await doctorService.updateAppointmentStatus(appointment.id, 'in-progress');
            Alert.alert('Consultation Started', `Starting consultation with ${appointment.patientName}`);
            fetchDashboardData();
        } catch (err) {
            logError(err, { context: 'DoctorHomeScreen.handleStartConsultation' });
            Alert.alert('Error', 'Failed to start consultation');
        }
    }, [fetchDashboardData]);

    const getGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'completed':
                return healthColors.success.main || healthColors.success;
            case 'in-progress':
                return healthColors.info.main || healthColors.info;
            case 'cancelled':
            case 'no-show':
                return healthColors.error.main || healthColors.error;
            default:
                return healthColors.warning.main || healthColors.warning;
        }
    }, []);

    const getStatusLabel = useCallback((status) => {
        switch (status) {
            case 'completed': return 'Completed';
            case 'in-progress': return 'In Progress';
            case 'cancelled': return 'Cancelled';
            case 'no-show': return 'No Show';
            case 'confirmed': return 'Confirmed';
            default: return 'Pending';
        }
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.main} />
            
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh}
                        colors={[healthColors.primary.main]}
                        tintColor={healthColors.primary.main}
                    />
                }
            >
                {/* Header with Icons */}
                <View style={styles.header}>
                    <View style={styles.headerIcons}>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            accessibilityRole="button"
                            accessibilityLabel="Menu"
                        >
                            <Ionicons name="menu" size={24} color={healthColors.text.primary} />
                        </TouchableOpacity>
                        <View style={styles.headerRight}>
                            <TouchableOpacity 
                                style={styles.iconButton}
                                onPress={() => Alert.alert('Notifications', `You have ${notificationCount} new notifications`)}
                                accessibilityRole="button"
                                accessibilityLabel={`${notificationCount} notifications`}
                            >
                                <Ionicons name="notifications-outline" size={24} color={healthColors.text.primary} />
                                {notificationCount > 0 && (
                                    <View style={styles.notificationBadge}>
                                        <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.iconButton}
                                onPress={handleLogout}
                            >
                                <Ionicons name="person-circle-outline" size={24} color={healthColors.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                    
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeText}>{getGreeting()}, Dr. {user?.name || 'Shah'} 🌅</Text>
                        <Text style={styles.welcomeSubtext}>Cardiologist • OPD 3</Text>
                    </View>
                </View>

                {/* Today's Schedule */}
                <View style={styles.section}>
                    <View style={styles.scheduleCard}>
                        <View style={styles.scheduleHeader}>
                            <Ionicons name="calendar" size={20} color={healthColors.primary.main} />
                            <Text style={styles.scheduleTitle}>TODAY'S SCHEDULE:</Text>
                        </View>
                        <View style={styles.divider} />

                        <View style={styles.scheduleStats}>
                            <View style={styles.scheduleStat}>
                                <Text style={styles.scheduleStatIcon}>📅</Text>
                                <Text style={styles.scheduleStatValue}>{schedule.totalAppointments}</Text>
                                <Text style={styles.scheduleStatLabel}>Appointments</Text>
                            </View>
                            <View style={styles.scheduleStat}>
                                <Text style={styles.scheduleStatIcon}>⏰</Text>
                                <Text style={styles.scheduleStatValue}>{schedule.nextTime}</Text>
                                <Text style={styles.scheduleStatLabel}>Next Patient</Text>
                            </View>
                        </View>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressRow}>
                                <Text style={styles.progressLabel}>✅ Completed: {schedule.completed}</Text>
                                <Text style={styles.progressLabel}>⏳ Pending: {schedule.pending}</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View 
                                    style={[
                                        styles.progressFill, 
                                        { width: `${(schedule.completed / schedule.totalAppointments) * 100}%` }
                                    ]} 
                                />
                            </View>
                        </View>

                        <View style={styles.nextPatientCard}>
                            <Text style={styles.nextPatientLabel}>Next Patient:</Text>
                            <Text style={styles.nextPatientName}>{schedule.nextPatient}</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Patient Search */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QUICK PATIENT SEARCH:</Text>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={healthColors.text.secondary} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter patient name..."
                            placeholderTextColor={healthColors.text.secondary}
                            value={searchQuery}
                            onChangeText={handleSearch}
                            accessibilityLabel="Search patients by name"
                            accessibilityHint="Type patient name to search"
                        />
                        {searching && (
                            <ActivityIndicator size="small" color={healthColors.primary.main} />
                        )}
                        {searchQuery.length > 0 && !searching && (
                            <TouchableOpacity 
                                onPress={() => {
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel="Clear search"
                            >
                                <Ionicons name="close-circle" size={20} color={healthColors.text.secondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                    {searchResults.length > 0 && (
                        <View style={styles.searchResultsContainer}>
                            {searchResults.map((patient) => (
                                <TouchableOpacity 
                                    key={patient._id}
                                    style={styles.searchResultItem}
                                    onPress={() => navigation.navigate('PatientManagement', { patientId: patient._id })}
                                    accessibilityRole="button"
                                    accessibilityLabel={`View ${patient.name}, ${patient.age} years old`}
                                >
                                    <View style={styles.searchResultInfo}>
                                        <Text style={styles.searchResultName}>{patient.name}</Text>
                                        <Text style={styles.searchResultDetails}>
                                            Age: {patient.age} | ID: {patient._id?.slice(-6)}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={healthColors.text.secondary} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Today's Appointments */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TODAY'S APPOINTMENTS:</Text>
                    {todaysAppointments.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={48} color={healthColors.text.secondary} />
                            <Text style={styles.emptyStateText}>No appointments scheduled for today</Text>
                        </View>
                    ) : (
                        todaysAppointments.map((appointment) => (
                            <View 
                                key={appointment._id || appointment.id} 
                                style={styles.appointmentCard}
                                accessible={true}
                                accessibilityLabel={`Appointment with ${appointment.patientName || appointment.patient?.name} at ${appointment.time || appointment.timeSlot}, Status: ${getStatusLabel(appointment.status)}`}
                            >
                                <View style={styles.appointmentHeader}>
                                    <View style={styles.appointmentTime}>
                                        <Ionicons name="time-outline" size={16} color={healthColors.primary.main} />
                                        <Text style={styles.appointmentTimeText}>{appointment.time || appointment.timeSlot}</Text>
                                    </View>
                                    <View style={styles.appointmentTypeBadge}>
                                        <Ionicons 
                                            name={appointment.type === 'telemedicine' ? 'videocam' : 'medical'} 
                                            size={14} 
                                            color={appointment.type === 'telemedicine' ? healthColors.info.main : healthColors.primary.main} 
                                        />
                                    </View>
                                </View>
                                
                                <View style={styles.appointmentPatientRow}>
                                    <Text style={styles.appointmentPatient}>{appointment.patientName || appointment.patient?.name}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                                            {getStatusLabel(appointment.status)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.appointmentReason}>
                                    ID: {appointment.patientId || appointment.patient?._id?.slice(-6)} | Age: {appointment.age || appointment.patient?.age || 'N/A'} | {appointment.reason || appointment.reasonForVisit}
                                </Text>
                                
                                <View style={styles.appointmentActions}>
                                    <TouchableOpacity 
                                        style={styles.actionButtonSecondary}
                                        onPress={() => navigation.navigate('PatientManagement', { patientId: appointment.patient?._id })}
                                        accessibilityRole="button"
                                        accessibilityLabel={`View history for ${appointment.patientName || appointment.patient?.name}`}
                                    >
                                        <Text style={styles.actionButtonSecondaryText}>View History</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={styles.actionButtonPrimary}
                                        onPress={() => handleStartConsultation(appointment)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Start consultation with ${appointment.patientName || appointment.patient?.name}`}
                                    >
                                        <Text style={styles.actionButtonPrimaryText}>Start Consultation</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Add Walk-in Button */}
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.addWalkinButton}
                        onPress={() => navigation.navigate('AddWalkin')}
                        accessibilityRole="button"
                        accessibilityLabel="Add walk-in patient"
                        accessibilityHint="Add a new walk-in patient to the queue"
                    >
                        <Ionicons name="add-circle" size={24} color={healthColors.primary.main} />
                        <Text style={styles.addWalkinText}>Add Walk-in Patient</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: verticalScale(20) }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.main,
    },
    header: {
        backgroundColor: healthColors.background.card,
        paddingBottom: moderateScale(16),
        ...createShadow(2),
    },
    headerIcons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: getScreenPadding(),
        paddingTop: moderateScale(12),
        paddingBottom: moderateScale(8),
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
    },
    iconButton: {
        padding: moderateScale(8),
        position: 'relative',
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
    welcomeSection: {
        paddingHorizontal: getScreenPadding(),
        paddingTop: moderateScale(8),
    },
    welcomeText: {
        fontSize: scaledFontSize(22),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    welcomeSubtext: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: moderateScale(4),
    },
    section: {
        paddingHorizontal: getScreenPadding(),
        marginTop: verticalScale(16),
    },
    sectionTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        letterSpacing: 0.5,
        marginBottom: moderateScale(12),
    },
    scheduleCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        ...createShadow(2),
    },
    scheduleHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
    },
    scheduleTitle: {
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
    scheduleStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: moderateScale(16),
    },
    scheduleStat: {
        alignItems: 'center',
    },
    scheduleStatIcon: {
        fontSize: scaledFontSize(32),
        marginBottom: moderateScale(8),
    },
    scheduleStatValue: {
        fontSize: scaledFontSize(20),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    scheduleStatLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginTop: moderateScale(4),
    },
    progressContainer: {
        marginBottom: moderateScale(16),
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: moderateScale(8),
    },
    progressLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        fontWeight: '600',
    },
    progressBar: {
        height: moderateScale(8),
        backgroundColor: healthColors.border.light,
        borderRadius: moderateScale(4),
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: healthColors.success,
        borderRadius: moderateScale(4),
    },
    nextPatientCard: {
        backgroundColor: healthColors.primary.main + '10',
        padding: moderateScale(12),
        borderRadius: moderateScale(8),
        borderLeftWidth: 3,
        borderLeftColor: healthColors.primary.main,
    },
    nextPatientLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(4),
    },
    nextPatientName: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.primary.main,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(12),
        borderWidth: 1,
        borderColor: healthColors.border.light,
        ...createShadow(1),
    },
    searchIcon: {
        marginRight: moderateScale(8),
    },
    searchInput: {
        flex: 1,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    searchResultsContainer: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        marginTop: moderateScale(8),
        ...createShadow(2),
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: moderateScale(12),
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultName: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    searchResultDetails: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginTop: moderateScale(2),
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: moderateScale(32),
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        ...createShadow(1),
    },
    emptyStateText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: moderateScale(12),
        textAlign: 'center',
    },
    appointmentCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: moderateScale(12),
        borderLeftWidth: 4,
        borderLeftColor: healthColors.primary.main,
        ...createShadow(2),
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(12),
    },
    appointmentTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    appointmentTimeText: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    appointmentTypeBadge: {
        padding: moderateScale(6),
        borderRadius: moderateScale(8),
        backgroundColor: healthColors.background.main,
    },
    appointmentPatientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(4),
    },
    statusBadge: {
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(4),
        borderRadius: moderateScale(6),
    },
    statusText: {
        fontSize: scaledFontSize(11),
        fontWeight: '600',
    },
    appointmentPatient: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    appointmentReason: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(12),
    },
    appointmentActions: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    actionButtonSecondary: {
        flex: 1,
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(8),
        backgroundColor: healthColors.background.main,
        borderWidth: 1,
        borderColor: healthColors.primary.main,
        alignItems: 'center',
    },
    actionButtonSecondaryText: {
        fontSize: scaledFontSize(13),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
    actionButtonPrimary: {
        flex: 1,
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(8),
        backgroundColor: healthColors.primary.main,
        alignItems: 'center',
    },
    actionButtonPrimaryText: {
        fontSize: scaledFontSize(13),
        fontWeight: '600',
        color: healthColors.background.card,
    },
    addWalkinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.background.card,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        borderWidth: 2,
        borderColor: healthColors.primary.main,
        borderStyle: 'dashed',
        ...createShadow(1),
    },
    addWalkinText: {
        fontSize: scaledFontSize(15),
        fontWeight: '600',
        color: healthColors.primary.main,
        marginLeft: moderateScale(8),
    },
});

export default DoctorHomeScreen;
