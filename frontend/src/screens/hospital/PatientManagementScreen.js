/**
 * Enhanced Patient Management Screen (Screen 6)
 * ONE-CLICK ACCESS - Instant search with auto-load full history
 */

import React, { useState } from 'react';
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

const PatientManagementScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loading, setLoading] = useState(false);

    // Mock patient data
    const mockPatient = {
        id: 'P-1234',
        name: 'Raj Patel',
        age: 45,
        bloodGroup: 'O+',
        lastVisit: '5 Dec 2025',
        vitals: {
            bp: '130/85',
            sugar: '110',
            status: 'Normal',
        },
        medicalRecords: [
            { id: 1, type: 'Blood Test', date: '3 Dec 2025', icon: 'water' },
            { id: 2, type: 'X-Ray Report', date: '1 Dec 2025', icon: 'body' },
        ],
        prescriptions: [
            { id: 1, medicine: 'Paracetamol 500mg', status: 'Current', date: '5 Dec 2025' },
            { id: 2, medicine: 'Crocin 650mg', status: 'Completed', date: '1 Dec 2025' },
        ],
        appointments: [
            { id: 1, doctor: 'Dr. Shah', date: '5 Dec', status: 'Completed', specialty: 'Cardiology' },
            { id: 2, doctor: 'Dr. Mehta', date: '15 Nov', status: 'Completed', specialty: 'General' },
        ],
        allergies: ['Penicillin'],
        phone: '+91 98765 43210',
        email: 'raj.patel@email.com',
        address: 'Ahmedabad, Gujarat',
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
                setSelectedPatient(mockPatient);
                setLoading(false);
            }, 800);
        }
    };

    const handleAddRecord = () => {
        navigation.navigate('AddMedicalRecord', { patientId: selectedPatient?.id });
    };

    const handlePrintSummary = () => {
        // Print functionality
        alert('Printing patient summary...');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Patient Management</Text>
                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications-outline" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Search Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔍 Search by Name or ID</Text>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search" size={20} color={healthColors.text.secondary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Enter patient name/ID..."
                                placeholderTextColor={healthColors.text.disabled}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={healthColors.text.disabled} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                            <Ionicons name="search" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Loading State */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={healthColors.primary.main} />
                        <Text style={styles.loadingText}>Searching patient records...</Text>
                    </View>
                )}

                {/* Patient Results */}
                {selectedPatient && !loading && (
                    <>
                        {/* Instant Results Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>⚡ INSTANT RESULTS:</Text>
                            <View style={styles.patientCard}>
                                <View style={styles.patientHeader}>
                                    <View style={styles.patientAvatar}>
                                        <Ionicons name="person" size={32} color={healthColors.primary.main} />
                                    </View>
                                    <View style={styles.patientBasicInfo}>
                                        <Text style={styles.patientName}>
                                            👤 {selectedPatient.name}  ID: {selectedPatient.id}  Age: {selectedPatient.age}
                                        </Text>
                                        <Text style={styles.patientDetail}>
                                            📍 Last Visit: {selectedPatient.lastVisit}
                                        </Text>
                                        <Text style={styles.patientVitals}>
                                            🩺 BP: {selectedPatient.vitals.bp}  Sugar: {selectedPatient.vitals.sugar}  {selectedPatient.vitals.status}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.quickActions}>
                                    <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('PatientHistory', { patient: selectedPatient })}>
                                        <Text style={styles.quickActionText}>View Full History</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.quickActionButton, styles.addRecordButton]} onPress={handleAddRecord}>
                                        <Text style={styles.quickActionTextWhite}>Add Record</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Patient Full History */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PATIENT FULL HISTORY (Auto-Load):</Text>

                            {/* Medical Records */}
                            <View style={styles.historyCard}>
                                <View style={styles.historyHeader}>
                                    <Ionicons name="document-text" size={20} color={healthColors.primary.main} />
                                    <Text style={styles.historyTitle}>📋 MEDICAL RECORDS</Text>
                                </View>
                                {selectedPatient.medicalRecords.map((record) => (
                                    <TouchableOpacity key={record.id} style={styles.historyItem}>
                                        <Ionicons name={record.icon} size={18} color={healthColors.text.secondary} />
                                        <Text style={styles.historyItemText}>
                                            • {record.type}  - {record.date}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Prescriptions */}
                            <View style={styles.historyCard}>
                                <View style={styles.historyHeader}>
                                    <Ionicons name="medkit" size={20} color={healthColors.success.main} />
                                    <Text style={styles.historyTitle}>💊 PRESCRIPTIONS ({selectedPatient.prescriptions.length})</Text>
                                </View>
                                {selectedPatient.prescriptions.map((prescription) => (
                                    <View key={prescription.id} style={styles.historyItem}>
                                        <View style={[styles.statusDot, prescription.status === 'Current' && styles.statusDotActive]} />
                                        <Text style={styles.historyItemText}>
                                            • {prescription.medicine} ({prescription.status})
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Appointment History */}
                            <View style={styles.historyCard}>
                                <View style={styles.historyHeader}>
                                    <Ionicons name="calendar" size={20} color={healthColors.info.main} />
                                    <Text style={styles.historyTitle}>📅 APPOINTMENT HISTORY ({selectedPatient.appointments.length})</Text>
                                </View>
                                {selectedPatient.appointments.map((appointment) => (
                                    <View key={appointment.id} style={styles.historyItem}>
                                        <Ionicons name="checkmark-circle" size={18} color={healthColors.success.main} />
                                        <Text style={styles.historyItemText}>
                                            • {appointment.doctor}  - {appointment.date} ({appointment.status})
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            {/* Critical Info */}
                            <View style={styles.criticalInfoCard}>
                                <View style={styles.criticalInfoRow}>
                                    <Text style={styles.criticalInfoLabel}>🚨 ALLERGIES:</Text>
                                    <Text style={styles.criticalInfoValue}>{selectedPatient.allergies.join(', ')}</Text>
                                </View>
                                <View style={styles.criticalInfoRow}>
                                    <Text style={styles.criticalInfoLabel}>🩸 BLOOD GROUP:</Text>
                                    <Text style={styles.criticalInfoValue}>{selectedPatient.bloodGroup}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Bottom Actions */}
                        <View style={styles.section}>
                            <View style={styles.bottomActions}>
                                <TouchableOpacity style={styles.bottomActionButton} onPress={handleAddRecord}>
                                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                                    <Text style={styles.bottomActionText}>Add New Record</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.bottomActionButton, styles.printButton]} onPress={handlePrintSummary}>
                                    <Ionicons name="print" size={20} color={healthColors.primary.main} />
                                    <Text style={[styles.bottomActionText, styles.printButtonText]}>Print Summary</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </>
                )}

                {/* Empty State */}
                {!selectedPatient && !loading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search" size={64} color={healthColors.text.disabled} />
                        <Text style={styles.emptyStateTitle}>Search for a Patient</Text>
                        <Text style={styles.emptyStateText}>
                            Enter patient name or ID to view complete medical history
                        </Text>
                    </View>
                )}

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
    notificationButton: {
        padding: moderateScale(4),
    },
    section: {
        paddingHorizontal: getScreenPadding(),
        marginTop: verticalScale(20),
    },
    sectionTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(12),
    },
    searchContainer: {
        flexDirection: 'row',
        gap: moderateScale(8),
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(12),
        gap: moderateScale(8),
        ...createShadow(2),
    },
    searchInput: {
        flex: 1,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    searchButton: {
        backgroundColor: healthColors.primary.main,
        borderRadius: moderateScale(12),
        width: moderateScale(48),
        height: moderateScale(48),
        justifyContent: 'center',
        alignItems: 'center',
        ...createShadow(2),
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: verticalScale(40),
    },
    loadingText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: moderateScale(12),
    },
    patientCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        ...createShadow(2),
    },
    patientHeader: {
        flexDirection: 'row',
        marginBottom: moderateScale(16),
    },
    patientAvatar: {
        width: moderateScale(56),
        height: moderateScale(56),
        borderRadius: moderateScale(28),
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: moderateScale(12),
    },
    patientBasicInfo: {
        flex: 1,
        gap: moderateScale(6),
    },
    patientName: {
        fontSize: scaledFontSize(15),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    patientDetail: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
    },
    patientVitals: {
        fontSize: scaledFontSize(13),
        color: healthColors.success.main,
        fontWeight: '600',
    },
    quickActions: {
        flexDirection: 'row',
        gap: moderateScale(8),
    },
    quickActionButton: {
        flex: 1,
        paddingVertical: moderateScale(12),
        paddingHorizontal: moderateScale(16),
        borderRadius: moderateScale(8),
        backgroundColor: healthColors.background.secondary,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    addRecordButton: {
        backgroundColor: healthColors.primary.main,
        borderColor: healthColors.primary.main,
    },
    quickActionText: {
        fontSize: scaledFontSize(13),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    quickActionTextWhite: {
        fontSize: scaledFontSize(13),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    historyCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: moderateScale(12),
        ...createShadow(2),
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
        paddingBottom: moderateScale(12),
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    historyTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        paddingVertical: moderateScale(8),
    },
    historyItemText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        flex: 1,
    },
    statusDot: {
        width: moderateScale(8),
        height: moderateScale(8),
        borderRadius: moderateScale(4),
        backgroundColor: healthColors.text.disabled,
    },
    statusDotActive: {
        backgroundColor: healthColors.success.main,
    },
    criticalInfoCard: {
        backgroundColor: healthColors.error.background,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 1,
        borderColor: healthColors.error.light,
    },
    criticalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: moderateScale(6),
    },
    criticalInfoLabel: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.error.main,
    },
    criticalInfoValue: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.text.primary,
    },
    bottomActions: {
        flexDirection: 'row',
        gap: moderateScale(12),
    },
    bottomActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        backgroundColor: healthColors.primary.main,
        paddingVertical: moderateScale(16),
        borderRadius: moderateScale(12),
        ...createShadow(2),
    },
    printButton: {
        backgroundColor: healthColors.background.card,
        borderWidth: 1,
        borderColor: healthColors.border.light,
    },
    bottomActionText: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    printButtonText: {
        color: healthColors.primary.main,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: verticalScale(60),
        paddingHorizontal: getScreenPadding(),
    },
    emptyStateTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginTop: moderateScale(16),
        marginBottom: moderateScale(8),
    },
    emptyStateText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        textAlign: 'center',
    },
});

export default PatientManagementScreen;
