/**
 * Appointment Booking Screen (Screen 16)
 * Multi-step appointment booking with specialist selection
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

const AppointmentBookingScreen = ({ navigation, route }) => {
    const [selectedSpecialty, setSelectedSpecialty] = useState('Cardiology');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [appointmentType, setAppointmentType] = useState('in-person');
    const [selectedDate, setSelectedDate] = useState('15 Dec 2025');
    const [selectedTime, setSelectedTime] = useState('10:30');
    const [reason, setReason] = useState('');

    const specialties = ['Cardiology', 'Pulmonology', 'Neurology', 'Pediatrics', 'Orthopedics'];

    const doctors = [
        {
            id: 1,
            name: 'Dr. Rajesh Shah',
            specialty: 'Cardiologist',
            experience: '15 years exp',
            rating: 4.8,
            reviews: 240,
            fee: 500,
        },
        {
            id: 2,
            name: 'Dr. Priya Mehta',
            specialty: 'Cardiologist',
            experience: '12 years exp',
            rating: 4.9,
            reviews: 180,
            fee: 600,
        },
    ];

    const timeSlots = ['10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00'];

    const handleConfirm = () => {
        if (!selectedDoctor || !selectedTime) {
            alert('Please select a doctor and time slot');
            return;
        }
        // Navigate to confirmation or payment
        navigation.navigate('AppointmentConfirmation', {
            doctor: selectedDoctor,
            date: selectedDate,
            time: selectedTime,
            type: appointmentType,
            reason,
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Appointment</Text>
                <TouchableOpacity style={styles.calendarButton}>
                    <Ionicons name="calendar" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Step 1: Select Specialty */}
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>1️⃣</Text>
                        <Text style={styles.stepTitle}>SELECT SPECIALTY:</Text>
                    </View>
                    <View style={styles.specialtyCard}>
                        <Ionicons name="heart" size={20} color={healthColors.error.main} />
                        <Text style={styles.specialtyText}>{selectedSpecialty}</Text>
                        <Ionicons name="checkmark-circle" size={20} color={healthColors.success.main} />
                    </View>
                </View>

                {/* Step 2: Choose Doctor */}
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>2️⃣</Text>
                        <Text style={styles.stepTitle}>CHOOSE DOCTOR:</Text>
                    </View>
                    {doctors.map((doctor) => (
                        <TouchableOpacity
                            key={doctor.id}
                            style={[
                                styles.doctorCard,
                                selectedDoctor?.id === doctor.id && styles.doctorCardSelected,
                            ]}
                            onPress={() => setSelectedDoctor(doctor)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.doctorAvatar}>
                                <Ionicons name="person" size={24} color={healthColors.primary.main} />
                            </View>
                            <View style={styles.doctorInfo}>
                                <Text style={styles.doctorName}>👨‍⚕️ {doctor.name}</Text>
                                <Text style={styles.doctorDetails}>
                                    {doctor.specialty} • {doctor.experience}
                                </Text>
                                <View style={styles.doctorStats}>
                                    <View style={styles.ratingContainer}>
                                        <Ionicons name="star" size={14} color="#FFB800" />
                                        <Text style={styles.ratingText}>
                                            {doctor.rating} ({doctor.reviews} reviews)
                                        </Text>
                                    </View>
                                    <Text style={styles.feeText}>💰 Consultation: ₹{doctor.fee}</Text>
                                </View>
                            </View>
                            {selectedDoctor?.id === doctor.id && (
                                <Ionicons name="checkmark-circle" size={24} color={healthColors.success.main} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Step 3: Appointment Type */}
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>3️⃣</Text>
                        <Text style={styles.stepTitle}>APPOINTMENT TYPE:</Text>
                    </View>
                    <View style={styles.typeRow}>
                        <TouchableOpacity
                            style={[
                                styles.typeCard,
                                appointmentType === 'in-person' && styles.typeCardSelected,
                            ]}
                            onPress={() => setAppointmentType('in-person')}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="business"
                                size={28}
                                color={appointmentType === 'in-person' ? healthColors.primary.main : healthColors.text.secondary}
                            />
                            <Text
                                style={[
                                    styles.typeTitle,
                                    appointmentType === 'in-person' && styles.typeTextSelected,
                                ]}
                            >
                                🏥 IN-PERSON {appointmentType === 'in-person' && '✓'}
                            </Text>
                            <Text style={styles.typeSubtitle}>Visit Clinic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeCard,
                                appointmentType === 'telemedicine' && styles.typeCardSelected,
                            ]}
                            onPress={() => setAppointmentType('telemedicine')}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="videocam"
                                size={28}
                                color={appointmentType === 'telemedicine' ? healthColors.primary.main : healthColors.text.secondary}
                            />
                            <Text
                                style={[
                                    styles.typeTitle,
                                    appointmentType === 'telemedicine' && styles.typeTextSelected,
                                ]}
                            >
                                📹 TELEMEDICINE
                            </Text>
                            <Text style={styles.typeSubtitle}>Video Call</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Step 4: Select Date & Time */}
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>4️⃣</Text>
                        <Text style={styles.stepTitle}>SELECT DATE & TIME:</Text>
                    </View>
                    <View style={styles.dateCard}>
                        <Ionicons name="calendar" size={20} color={healthColors.primary.main} />
                        <Text style={styles.dateText}>📅 {selectedDate}</Text>
                    </View>
                    <Text style={styles.timeLabel}>⏰ Available Slots:</Text>
                    <View style={styles.timeSlotsGrid}>
                        {timeSlots.map((slot) => (
                            <TouchableOpacity
                                key={slot}
                                style={[
                                    styles.timeSlot,
                                    selectedTime === slot && styles.timeSlotSelected,
                                ]}
                                onPress={() => setSelectedTime(slot)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.timeSlotText,
                                        selectedTime === slot && styles.timeSlotTextSelected,
                                    ]}
                                >
                                    {slot}
                                </Text>
                                {selectedTime === slot && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Step 5: Reason for Visit */}
                <View style={styles.section}>
                    <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>5️⃣</Text>
                        <Text style={styles.stepTitle}>REASON FOR VISIT:</Text>
                    </View>
                    <TextInput
                        style={styles.reasonInput}
                        placeholder="Enter reason for visit..."
                        placeholderTextColor={healthColors.text.disabled}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Confirm Button */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                        <Text style={styles.confirmButtonText}>CONFIRM APPOINTMENT ➜</Text>
                    </TouchableOpacity>
                    <Text style={styles.paymentNote}>💳 Payment: Pay at hospital</Text>
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
    calendarButton: {
        padding: moderateScale(4),
    },
    section: {
        paddingHorizontal: getScreenPadding(),
        marginBottom: verticalScale(20),
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
        marginTop: verticalScale(8),
    },
    stepNumber: {
        fontSize: moderateScale(20),
    },
    stepTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    specialtyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(12),
        backgroundColor: healthColors.background.card,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        ...createShadow(2),
    },
    specialtyText: {
        flex: 1,
        fontSize: scaledFontSize(16),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    doctorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        marginBottom: moderateScale(12),
        ...createShadow(2),
        borderWidth: 2,
        borderColor: 'transparent',
    },
    doctorCardSelected: {
        borderColor: healthColors.success.main,
        backgroundColor: healthColors.success.main + '10',
    },
    doctorAvatar: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: scaledFontSize(15),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(4),
    },
    doctorDetails: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(6),
    },
    doctorStats: {
        gap: moderateScale(4),
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    ratingText: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.primary,
    },
    feeText: {
        fontSize: scaledFontSize(13),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    typeRow: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    typeCard: {
        flex: 1,
        backgroundColor: healthColors.background.card,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        ...createShadow(2),
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeCardSelected: {
        borderColor: healthColors.primary.main,
        backgroundColor: healthColors.primary.main + '10',
    },
    typeTitle: {
        fontSize: scaledFontSize(13),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginTop: moderateScale(8),
        textAlign: 'center',
    },
    typeTextSelected: {
        color: healthColors.primary.main,
    },
    typeSubtitle: {
        fontSize: scaledFontSize(11),
        color: healthColors.text.secondary,
        marginTop: moderateScale(4),
    },
    dateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(12),
        backgroundColor: healthColors.background.card,
        padding: moderateScale(16),
        borderRadius: moderateScale(12),
        marginBottom: moderateScale(16),
        ...createShadow(2),
    },
    dateText: {
        fontSize: scaledFontSize(15),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    timeLabel: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        marginBottom: moderateScale(12),
    },
    timeSlotsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: moderateScale(8),
    },
    timeSlot: {
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(12),
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(8),
        borderWidth: 2,
        borderColor: healthColors.border.light,
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(4),
    },
    timeSlotSelected: {
        backgroundColor: healthColors.primary.main,
        borderColor: healthColors.primary.main,
    },
    timeSlotText: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    timeSlotTextSelected: {
        color: '#FFFFFF',
    },
    checkmark: {
        fontSize: moderateScale(14),
        color: '#FFFFFF',
    },
    reasonInput: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        textAlignVertical: 'top',
        minHeight: moderateScale(80),
        ...createShadow(2),
    },
    confirmButton: {
        backgroundColor: healthColors.primary.main,
        padding: moderateScale(18),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        ...createShadow(3),
    },
    confirmButtonText: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
    paymentNote: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        textAlign: 'center',
        marginTop: moderateScale(12),
    },
});

export default AppointmentBookingScreen;
