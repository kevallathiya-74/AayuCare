/**
 * Specialist Care Finder Screen (Screen 21)
 * Find doctors by specialty with filters and booking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Image,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { createShadow } from '../../theme/indianDesign';
import { moderateScale, verticalScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { ErrorRecovery, NetworkStatusIndicator } from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';
import { doctorService } from '../../services';

const SpecialistCareFinderScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [selectedAvailability, setSelectedAvailability] = useState('Today');
    const [feeRange, setFeeRange] = useState([0, 1000]);
    const [doctors, setDoctors] = useState([]);

    const specialties = [
        { id: 1, name: 'All', icon: 'apps-outline' },
        { id: 2, name: 'Cardiology', icon: 'heart-outline' },
        { id: 3, name: 'Pulmonology', icon: 'fitness-outline' },
        { id: 4, name: 'Neurology', icon: 'bulb-outline' },
        { id: 5, name: 'Pediatrics', icon: 'happy-outline' },
        { id: 6, name: "Women's Health", icon: 'rose-outline' },
        { id: 7, name: 'Orthopedics', icon: 'body-outline' },
    ];

    useEffect(() => {
        fetchDoctors();
    }, [selectedSpecialty, selectedAvailability]);

    const fetchDoctors = async () => {
        try {
            if (!isConnected) {
                showError('No internet connection');
                return;
            }
            
            setLoading(true);
            setError(null);
            
            // Fetch doctors with optional specialty filter
            const filters = {};
            if (selectedSpecialty !== 'All') {
                filters.specialization = selectedSpecialty;
            }
            
            const response = await doctorService.getDoctors(filters);
            
            // Filter by fee range
            let filteredDoctors = response.data || [];
            if (feeRange && feeRange.length === 2) {
                filteredDoctors = filteredDoctors.filter(
                    doc => doc.consultationFee >= feeRange[0] && doc.consultationFee <= feeRange[1]
                );
            }
            
            setDoctors(filteredDoctors);
        } catch (err) {
            const errorMessage = 'Failed to load specialists';
            setError(errorMessage);
            logError(err, { context: 'SpecialistCareFinderScreen.fetchDoctors' });
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchDoctors();
        setRefreshing(false);
    }, [selectedSpecialty, feeRange]);

    const handleRetry = () => {
        setError(null);
        fetchDoctors();
    };

    const renderDoctorCard = (doctor) => (
        <View key={doctor._id || doctor.id} style={styles.doctorCard}>
            <View style={styles.doctorHeader}>
                <View style={styles.doctorAvatar}>
                    <Ionicons name="person" size={32} color={healthColors.primary.main} />
                </View>
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpecialty}>
                        {doctor.specialization || doctor.specialty} • {doctor.experience || 'N/A'}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFB800" />
                        <Text style={styles.ratingText}>
                            {doctor.rating || 'N/A'} ({doctor.reviews || 0} reviews)
                        </Text>
                    </View>
                    <View style={styles.doctorDetails}>
                        <View style={styles.detailItem}>
                            <Ionicons name="cash-outline" size={14} color={healthColors.success.main} />
                            <Text style={styles.feeText}>₹{doctor.consultationFee || doctor.fee}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={14} color={healthColors.primary.main} />
                            <Text style={styles.availabilityText}>{doctor.availability || 'Check availability'}</Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.consultationTypes}>
                <View style={[styles.consultationType, (doctor.availability || doctor.schedule || doctor.hasClinic) && styles.consultationTypeActive]}>
                    <Ionicons name="business" size={18} color={(doctor.availability || doctor.schedule || doctor.hasClinic) ? healthColors.primary.main : healthColors.text.disabled} />
                    <Text style={[styles.consultationTypeText, (doctor.availability || doctor.schedule || doctor.hasClinic) && styles.consultationTypeTextActive]}>
                        CLINIC
                    </Text>
                </View>
                <View style={[styles.consultationType, (doctor.telemedicine || doctor.hasTelemedicine) && styles.consultationTypeActive]}>
                    <Ionicons name="videocam" size={18} color={(doctor.telemedicine || doctor.hasTelemedicine) ? healthColors.primary.main : healthColors.text.disabled} />
                    <Text style={[styles.consultationTypeText, (doctor.telemedicine || doctor.hasTelemedicine) && styles.consultationTypeTextActive]}>
                        TELEMEDICINE
                    </Text>
                    {(doctor.telemedicine || doctor.hasTelemedicine) && <Ionicons name="checkmark-circle" size={16} color={healthColors.success.main} />}
                </View>
            </View>

            <View style={styles.doctorActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('AppointmentBooking', { doctorId: doctor._id || doctor.id })}
                >
                    <Text style={styles.actionButtonText}>Book Appointment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => Alert.alert('Doctor Profile', `Viewing profile for ${doctor.name} - Full profile coming soon!`)}
                >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
            </View>
            {/* Fixed: BookAppointment -> AppointmentBooking (correct screen name) */}
            {/* Fixed: DoctorProfile replaced with Alert (screen doesn't exist) */}
        </View>
    );

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />
                <NetworkStatusIndicator />
                <ErrorRecovery
                    error={error}
                    onRetry={handleRetry}
                    onBack={() => navigation.goBack()}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />
            <NetworkStatusIndicator />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Find Specialist</Text>
                <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

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
                {/* Title */}
                <View style={styles.titleSection}>
                    <Ionicons name="medkit-outline" size={20} color={healthColors.primary.main} />
                    <Text style={styles.title}>FIND YOUR SPECIALIST</Text>
                </View>

                {/* Filters */}
                <View style={styles.filtersSection}>
                    <View style={styles.filterCard}>
                        <View style={styles.filterRow}>
                            <View style={styles.filterLabelContainer}>
                                <Ionicons name="medical-outline" size={18} color={healthColors.primary.main} />
                                <Text style={styles.filterLabel}>Specialty:</Text>
                            </View>
                            <TouchableOpacity style={styles.filterDropdown}>
                                <Text style={styles.filterValue}>{selectedSpecialty}</Text>
                                <Ionicons name="chevron-down" size={20} color={healthColors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.filterRow}>
                            <View style={styles.filterLabelContainer}>
                                <Ionicons name="calendar-outline" size={18} color={healthColors.primary.main} />
                                <Text style={styles.filterLabel}>Availability:</Text>
                            </View>
                            <TouchableOpacity style={styles.filterDropdown}>
                                <Text style={styles.filterValue}>{selectedAvailability}</Text>
                                <Ionicons name="chevron-down" size={20} color={healthColors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.filterRow}>
                            <View style={styles.filterLabelContainer}>
                                <Ionicons name="cash-outline" size={18} color={healthColors.primary.main} />
                                <Text style={styles.filterLabel}>Fee Range:</Text>
                            </View>
                            <Text style={styles.feeRangeText}>
                                ₹{feeRange[0]} - ₹{feeRange[1]}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Specialties Chips */}
                <View style={styles.specialtiesSection}>
                    <Text style={styles.sectionTitle}>SPECIALTIES:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtiesScroll}>
                        {specialties.map((specialty) => (
                            <TouchableOpacity
                                key={specialty.id}
                                style={styles.specialtyChip}
                                activeOpacity={0.7}
                            >
                                <Ionicons name={specialty.icon} size={20} color={healthColors.primary.main} />
                                <Text style={styles.specialtyText}>{specialty.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Doctor List */}
                <View style={styles.doctorsSection}>
                    <Text style={styles.sectionTitle}>DOCTOR LIST:</Text>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={healthColors.primary.main} />
                            <Text style={styles.loadingText}>Loading specialists...</Text>
                        </View>
                    ) : doctors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="medical-outline" size={64} color={healthColors.text.disabled} />
                            <Text style={styles.emptyStateTitle}>No Specialists Found</Text>
                            <Text style={styles.emptyStateText}>
                                Try adjusting your filters or check back later.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {doctors.map(renderDoctorCard)}
                            <View style={styles.doctorCountContainer}>
                                <Text style={styles.doctorCountText}>
                                    Showing {doctors.length} specialist{doctors.length !== 1 ? 's' : ''}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={{ height: 80 }} />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: getScreenPadding(),
        paddingVertical: moderateScale(12),
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    backButton: {
        padding: moderateScale(4),
    },
    headerTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: '700',
        color: healthColors.text.primary,
        flex: 1,
        marginLeft: moderateScale(12),
    },
    searchButton: {
        padding: moderateScale(4),
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        padding: getScreenPadding(),
        paddingBottom: moderateScale(8),
    },
    title: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    filtersSection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: verticalScale(16),
    },
    filterCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(16),
    },
    filterLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
    },
    filterLabel: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        fontWeight: '500',
    },
    filterDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
        backgroundColor: healthColors.background.secondary,
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(8),
    },
    filterValue: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    feeRangeText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        fontWeight: '600',
    },
    specialtiesSection: {
        marginBottom: verticalScale(16),
    },
    sectionTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        paddingHorizontal: getScreenPadding(),
        marginBottom: moderateScale(12),
    },
    specialtiesScroll: {
        paddingHorizontal: getScreenPadding(),
        gap: moderateScale(8),
    },
    specialtyChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(6),
        backgroundColor: '#FFFFFF',
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(20),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    specialtyText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.primary,
        fontWeight: '500',
    },
    doctorsSection: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: verticalScale(16),
    },
    doctorCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: moderateScale(12),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    doctorHeader: {
        flexDirection: 'row',
        marginBottom: moderateScale(12),
    },
    doctorAvatar: {
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(4),
    },
    doctorSpecialty: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(6),
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
        marginBottom: moderateScale(6),
    },
    ratingText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.primary,
    },
    doctorDetails: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    feeText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.primary,
        fontWeight: '600',
    },
    availabilityText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
    },
    consultationTypes: {
        flexDirection: 'row',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
    },
    consultationType: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(6),
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(8),
        backgroundColor: healthColors.background.secondary,
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    consultationTypeActive: {
        backgroundColor: healthColors.primary.main + '10',
        borderColor: healthColors.primary.main,
    },
    consultationTypeText: {
        fontSize: scaledFontSize(12),
        fontWeight: '600',
        color: healthColors.text.disabled,
    },
    consultationTypeTextActive: {
        color: healthColors.primary.main,
    },
    doctorActions: {
        flexDirection: 'row',
        gap: moderateScale(8),
    },
    actionButton: {
        flex: 1,
        backgroundColor: healthColors.primary.main,
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(8),
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    viewProfileButton: {
        flex: 1,
        backgroundColor: healthColors.background.secondary,
        paddingVertical: moderateScale(12),
        borderRadius: moderateScale(8),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    viewProfileText: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    loadingContainer: {
        paddingVertical: moderateScale(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: moderateScale(12),
    },
    emptyState: {
        paddingVertical: moderateScale(48),
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: '600',
        color: healthColors.text.primary,
        marginTop: moderateScale(16),
        marginBottom: moderateScale(8),
    },
    emptyStateText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        textAlign: 'center',
        paddingHorizontal: getScreenPadding(),
    },
    doctorCountContainer: {
        paddingVertical: moderateScale(16),
        alignItems: 'center',
    },
    doctorCountText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        fontWeight: '500',
    },
});

export default SpecialistCareFinderScreen;
