/**
 * Specialist Care Finder Screen (Screen 21)
 * Find doctors by specialty with filters and booking
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { createShadow } from '../../theme/indianDesign';
import { moderateScale, verticalScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { ErrorRecovery, NetworkStatusIndicator } from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const SpecialistCareFinderScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [selectedAvailability, setSelectedAvailability] = useState('Today');
    const [feeRange, setFeeRange] = useState([0, 1000]);

    const specialties = [
        { id: 1, name: 'Cardiology', icon: '❤️' },
        { id: 2, name: 'Pulmonology', icon: '🫁' },
        { id: 3, name: 'Neurology', icon: '🧠' },
        { id: 4, name: 'Pediatrics', icon: '👶' },
        { id: 5, name: "Women's Health", icon: '🌸' },
        { id: 6, name: 'Orthopedics', icon: '🦴' },
    ];

    const doctors = [
        {
            id: 1,
            name: 'Dr. Rajesh Shah',
            specialty: 'Cardiologist',
            experience: '15 yrs exp',
            rating: 4.8,
            reviews: 240,
            fee: 500,
            availability: 'Today 10:30 AM',
            hasClinic: true,
            hasTelemedicine: true,
            image: null,
        },
        {
            id: 2,
            name: 'Dr. Priya Mehta',
            specialty: 'Gynecologist',
            experience: '12 yrs exp',
            rating: 4.9,
            reviews: 180,
            fee: 600,
            availability: 'Tomorrow 11:00 AM',
            hasClinic: true,
            hasTelemedicine: false,
            image: null,
        },
    ];

    useEffect(() => {
        fetchDoctors();
    }, [selectedSpecialty, selectedAvailability]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: Replace with actual API call
            // const response = await doctorService.findSpecialists({
            //     specialty: selectedSpecialty,
            //     availability: selectedAvailability,
            //     feeRange: feeRange,
            // });
            // Update doctors list with response data
        } catch (err) {
            const errorMessage = 'Failed to load specialists';
            setError(errorMessage);
            logError(err, { context: 'SpecialistCareFinderScreen.fetchDoctors' });
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        fetchDoctors();
    };

    const renderDoctorCard = (doctor) => (
        <View key={doctor.id} style={styles.doctorCard}>
            <View style={styles.doctorHeader}>
                <View style={styles.doctorAvatar}>
                    <Ionicons name="person" size={32} color={healthColors.primary.main} />
                </View>
                <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorSpecialty}>
                        {doctor.specialty} • {doctor.experience}
                    </Text>
                    <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFB800" />
                        <Text style={styles.ratingText}>
                            {doctor.rating} ({doctor.reviews} reviews)
                        </Text>
                    </View>
                    <View style={styles.doctorDetails}>
                        <Text style={styles.feeText}>💰 ₹{doctor.fee}</Text>
                        <Text style={styles.availabilityText}>⏰ {doctor.availability}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.consultationTypes}>
                <View style={[styles.consultationType, doctor.hasClinic && styles.consultationTypeActive]}>
                    <Ionicons name="business" size={18} color={doctor.hasClinic ? healthColors.primary.main : healthColors.text.disabled} />
                    <Text style={[styles.consultationTypeText, doctor.hasClinic && styles.consultationTypeTextActive]}>
                        CLINIC
                    </Text>
                </View>
                <View style={[styles.consultationType, doctor.hasTelemedicine && styles.consultationTypeActive]}>
                    <Ionicons name="videocam" size={18} color={doctor.hasTelemedicine ? healthColors.primary.main : healthColors.text.disabled} />
                    <Text style={[styles.consultationTypeText, doctor.hasTelemedicine && styles.consultationTypeTextActive]}>
                        TELEMEDICINE {doctor.hasTelemedicine && '✓'}
                    </Text>
                </View>
            </View>

            <View style={styles.doctorActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('BookAppointment', { doctor })}
                >
                    <Text style={styles.actionButtonText}>Book Appointment</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.viewProfileButton}
                    onPress={() => navigation.navigate('DoctorProfile', { doctor })}
                >
                    <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
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
        <SafeAreaView style={styles.container} edges={['top']}>
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

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>👨‍⚕️ FIND YOUR SPECIALIST</Text>
                </View>

                {/* Filters */}
                <View style={styles.filtersSection}>
                    <View style={styles.filterCard}>
                        <View style={styles.filterRow}>
                            <Text style={styles.filterLabel}>🏥 Specialty:</Text>
                            <TouchableOpacity style={styles.filterDropdown}>
                                <Text style={styles.filterValue}>{selectedSpecialty}</Text>
                                <Ionicons name="chevron-down" size={20} color={healthColors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.filterRow}>
                            <Text style={styles.filterLabel}>📅 Availability:</Text>
                            <TouchableOpacity style={styles.filterDropdown}>
                                <Text style={styles.filterValue}>{selectedAvailability}</Text>
                                <Ionicons name="chevron-down" size={20} color={healthColors.text.secondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.filterRow}>
                            <Text style={styles.filterLabel}>💰 Fee Range:</Text>
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
                                <Text style={styles.specialtyIcon}>{specialty.icon}</Text>
                                <Text style={styles.specialtyText}>{specialty.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Doctor List */}
                <View style={styles.doctorsSection}>
                    <Text style={styles.sectionTitle}>DOCTOR LIST:</Text>
                    {doctors.map(renderDoctorCard)}
                </View>

                {/* View All Button */}
                <TouchableOpacity style={styles.viewAllButton}>
                    <Ionicons name="list" size={20} color={healthColors.primary.main} />
                    <Text style={styles.viewAllText}>View All Doctors (45)</Text>
                </TouchableOpacity>

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
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
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
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        ...createShadow(2),
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(12),
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
        backgroundColor: healthColors.background.card,
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(10),
        borderRadius: moderateScale(20),
        ...createShadow(1),
    },
    specialtyIcon: {
        fontSize: moderateScale(18),
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
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: moderateScale(12),
        ...createShadow(2),
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
        ...createShadow(2),
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
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        marginHorizontal: getScreenPadding(),
        paddingVertical: moderateScale(16),
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        ...createShadow(1),
    },
    viewAllText: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
});

export default SpecialistCareFinderScreen;
