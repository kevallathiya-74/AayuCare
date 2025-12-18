/**
 * Enhanced Patient Management Screen (Screen 6)
 * ONE-CLICK ACCESS - Instant search with auto-load full history
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { moderateScale, verticalScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { patientService, prescriptionService, appointmentService, medicalRecordService } from '../../services';
import { logError } from '../../utils/errorHandler';

const PatientManagementScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchPatientData = useCallback(async (patientId) => {
        try {
            // Fetch all patient data in parallel
            const [patientRes, prescriptionsRes, appointmentsRes, recordsRes] = await Promise.allSettled([
                patientService.getPatientById(patientId),
                prescriptionService.getPatientPrescriptions(patientId),
                appointmentService.getPatientAppointments(patientId),
                medicalRecordService.getPatientRecords(patientId),
            ]);

            const patient = patientRes.status === 'fulfilled' ? patientRes.value?.data : null;
            const prescriptions = prescriptionsRes.status === 'fulfilled' ? prescriptionsRes.value?.data || [] : [];
            const appointments = appointmentsRes.status === 'fulfilled' ? appointmentsRes.value?.data || [] : [];
            const records = recordsRes.status === 'fulfilled' ? recordsRes.value?.data || [] : [];

            if (!patient) {
                return null;
            }

            // Format patient data with full history
            return {
                id: patient.userId || patient._id,
                name: patient.name || 'Unknown',
                age: patient.age || 'N/A',
                bloodGroup: patient.bloodGroup || 'Unknown',
                lastVisit: patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('en-IN') : 'Never',
                vitals: patient.vitals || { bp: 'N/A', sugar: 'N/A', status: 'Unknown' },
                medicalRecords: records.slice(0, 10).map(rec => ({
                    id: rec._id,
                    type: rec.recordType || rec.type || 'Record',
                    date: new Date(rec.createdAt).toLocaleDateString('en-IN'),
                    icon: rec.recordType === 'Blood Test' ? 'water' : 'document',
                })),
                prescriptions: prescriptions.slice(0, 10).map(presc => ({
                    id: presc._id,
                    medicine: presc.medicines?.[0]?.name || presc.medicineName || 'Unknown',
                    status: presc.status || 'Active',
                    date: new Date(presc.createdAt).toLocaleDateString('en-IN'),
                })),
                appointments: appointments.slice(0, 10).map(apt => ({
                    id: apt._id,
                    doctor: apt.doctorId?.name || apt.doctorName || 'Doctor',
                    date: new Date(apt.appointmentDate).toLocaleDateString('en-IN'),
                    status: apt.status || 'Scheduled',
                    specialty: apt.doctorId?.specialization || apt.specialty || 'General',
                })),
                allergies: patient.allergies || [],
                phone: patient.phone || 'N/A',
                email: patient.email || 'N/A',
                address: patient.address || 'N/A',
            };
        } catch (err) {
            logError(err, { context: 'fetchPatientData', patientId });
            throw err;
        }
    }, []);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) {
            Alert.alert('Search Required', 'Please enter a patient name or ID');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Search for patients
            const searchRes = await patientService.searchPatients(searchQuery.trim());
            const patients = searchRes?.data || [];

            if (patients.length === 0) {
                setSelectedPatient(null);
                setError('No patient found matching your search');
                return;
            }

            // Get full data for first matching patient
            const patientData = await fetchPatientData(patients[0]._id);
            if (patientData) {
                setSelectedPatient(patientData);
            } else {
                setError('Failed to load patient details');
            }
        } catch (err) {
            logError(err, { context: 'PatientManagementScreen.handleSearch' });
            setError('Search failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, fetchPatientData]);

    const onRefresh = useCallback(async () => {
        if (!selectedPatient?.id) return;
        
        setRefreshing(true);
        try {
            const patientData = await fetchPatientData(selectedPatient.id);
            if (patientData) {
                setSelectedPatient(patientData);
            }
        } catch (err) {
            logError(err, { context: 'PatientManagementScreen.onRefresh' });
        } finally {
            setRefreshing(false);
        }
    }, [selectedPatient?.id, fetchPatientData]);

    const handleAddRecord = useCallback(() => {
        if (!selectedPatient?.id) {
            Alert.alert('Error', 'Please select a patient first');
            return;
        }
        navigation.navigate('AddMedicalRecord', { patientId: selectedPatient.id });
    }, [navigation, selectedPatient?.id]);

    const handlePrintSummary = useCallback(() => {
        if (!selectedPatient) {
            Alert.alert('Error', 'No patient data to print');
            return;
        }
        Alert.alert('Print', 'Preparing patient summary for printing...');
    }, [selectedPatient]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Patient Management</Text>
                <TouchableOpacity 
                    style={styles.notificationButton}
                    accessibilityRole="button"
                    accessibilityLabel="Notifications"
                >
                    <Ionicons name="notifications-outline" size={24} color={healthColors.text.primary} />
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
                                accessibilityLabel="Search patients"
                                accessibilityHint="Enter patient name or ID to search"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity 
                                    onPress={() => setSearchQuery('')}
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear search"
                                >
                                    <Ionicons name="close-circle" size={20} color={healthColors.text.disabled} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity 
                            style={styles.searchButton} 
                            onPress={handleSearch}
                            disabled={loading}
                            accessibilityRole="button"
                            accessibilityLabel="Search"
                            accessibilityState={{ disabled: loading }}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="search" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
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
        borderBottomWidth: 2,
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
        borderWidth: 2,
        borderColor: healthColors.border.light,
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
        borderWidth: 2,
        borderColor: healthColors.border.light,
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
        borderWidth: 2,
        borderColor: healthColors.border.light,
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
    errorText: {
        fontSize: scaledFontSize(14),
        color: healthColors.error.main,
        marginTop: moderateScale(8),
        textAlign: 'center',
    },
});

export default PatientManagementScreen;
