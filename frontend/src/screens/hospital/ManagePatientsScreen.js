/**
 * Manage Patients Screen
 * Instant search with complete medical history auto-load
 * One-click access to full patient data
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { getScreenPadding, scaledFontSize, moderateScale, verticalScale } from '../../utils/responsive';
import patientService from '../../services/patient.service';
import LoadingIndicator from '../../components/common/LoadingIndicator';

const ManagePatientsScreen = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientHistory, setPatientHistory] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Instant search with debounce
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.trim().length >= 2) {
            setSearching(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const result = await patientService.searchPatients(searchQuery);
                    setSearchResults(result.patients || []);
                } catch (error) {
                    alert(error);
                    setSearchResults([]);
                } finally {
                    setSearching(false);
                }
            }, 300); // 300ms debounce
        } else {
            setSearchResults([]);
            setSearching(false);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Auto-load complete history when patient selected
    const handlePatientSelect = async (patient) => {
        setSelectedPatient(patient);
        setModalVisible(true);
        setLoadingHistory(true);

        try {
            const result = await patientService.getCompleteHistory(patient.userId);
            setPatientHistory(result.data);
        } catch (error) {
            alert(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const renderPatientCard = (patient) => (
        <TouchableOpacity
            key={patient.userId}
            style={styles.patientCard}
            onPress={() => handlePatientSelect(patient)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                    {patient.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <View style={styles.detailsRow}>
                    <Text style={styles.patientDetail}>ID: {patient.userId}</Text>
                    {patient.bloodGroup && (
                        <>
                            <View style={styles.separator} />
                            <Text style={styles.patientDetail}>{patient.bloodGroup}</Text>
                        </>
                    )}
                    {patient.age && (
                        <>
                            <View style={styles.separator} />
                            <Text style={styles.patientDetail}>{patient.age}y</Text>
                        </>
                    )}
                </View>
                {patient.phone && (
                    <Text style={styles.patientPhone}>{patient.phone}</Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={healthColors.text.tertiary} />
        </TouchableOpacity>
    );

    const renderHistoryModal = () => {
        if (!selectedPatient) return null;

        return (
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right', 'bottom']}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color={healthColors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Patient History</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    {loadingHistory ? (
                        <View style={styles.loadingContainer}>
                            <LoadingIndicator type="medical" message="Loading complete history..." />
                        </View>
                    ) : patientHistory ? (
                        <ScrollView contentContainerStyle={styles.historyContent}>
                            {/* Patient Summary */}
                            <View style={styles.summaryCard}>
                                <View style={styles.summaryHeader}>
                                    <View style={styles.largeAvatar}>
                                        <Text style={styles.largeAvatarText}>
                                            {patientHistory.patient.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.summaryInfo}>
                                        <Text style={styles.summaryName}>
                                            {patientHistory.patient.name}
                                        </Text>
                                        <Text style={styles.summaryId}>
                                            {patientHistory.patient.userId}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.summaryGrid}>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="water" size={20} color={healthColors.primary.main} />
                                        <Text style={styles.summaryLabel}>Blood Group</Text>
                                        <Text style={styles.summaryValue}>
                                            {patientHistory.summary.bloodGroup}
                                        </Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="person" size={20} color={healthColors.primary.main} />
                                        <Text style={styles.summaryLabel}>Age</Text>
                                        <Text style={styles.summaryValue}>
                                            {patientHistory.summary.age || 'N/A'}
                                        </Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Ionicons name="male-female" size={20} color={healthColors.primary.main} />
                                        <Text style={styles.summaryLabel}>Gender</Text>
                                        <Text style={styles.summaryValue}>
                                            {patientHistory.summary.gender || 'N/A'}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Statistics */}
                            <View style={styles.statsContainer}>
                                <View style={styles.statCard}>
                                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                                    <Text style={styles.statValue}>{patientHistory.stats.totalRecords}</Text>
                                    <Text style={styles.statLabel}>Records</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Ionicons name="calendar" size={24} color="#10B981" />
                                    <Text style={styles.statValue}>{patientHistory.stats.totalVisits}</Text>
                                    <Text style={styles.statLabel}>Visits</Text>
                                </View>
                                <View style={styles.statCard}>
                                    <Ionicons name="medical" size={24} color="#F59E0B" />
                                    <Text style={styles.statValue}>
                                        {patientHistory.stats.totalPrescriptions}
                                    </Text>
                                    <Text style={styles.statLabel}>Prescriptions</Text>
                                </View>
                            </View>

                            {/* Allergies */}
                            {patientHistory.summary.allergies.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Allergies</Text>
                                    <View style={styles.alertCard}>
                                        {patientHistory.summary.allergies.map((allergy, index) => (
                                            <Text key={index} style={styles.allergyText}>
                                                • {allergy}
                                            </Text>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Chronic Conditions */}
                            {patientHistory.summary.chronicConditions.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Chronic Conditions</Text>
                                    <View style={styles.conditionsCard}>
                                        {patientHistory.summary.chronicConditions.map((condition, index) => (
                                            <View key={index} style={styles.conditionChip}>
                                                <Text style={styles.conditionText}>{condition}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Recent Medical Records */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Recent Records</Text>
                                {patientHistory.medicalRecords.slice(0, 5).map((record, index) => (
                                    <View key={index} style={styles.recordCard}>
                                        <View style={styles.recordHeader}>
                                            <Text style={styles.recordDate}>
                                                {new Date(record.createdAt).toLocaleDateString()}
                                            </Text>
                                            <View style={styles.recordBadge}>
                                                <Text style={styles.recordBadgeText}>
                                                    {record.recordType}
                                                </Text>
                                            </View>
                                        </View>
                                        {record.diagnosis && (
                                            <Text style={styles.recordDiagnosis}>{record.diagnosis}</Text>
                                        )}
                                        {record.doctorId && (
                                            <Text style={styles.recordDoctor}>
                                                {record.doctorId.name}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                                {patientHistory.medicalRecords.length === 0 && (
                                    <Text style={styles.emptyText}>No medical records found</Text>
                                )}
                            </View>

                            {/* Recent Prescriptions */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Recent Prescriptions</Text>
                                {patientHistory.prescriptions.slice(0, 5).map((prescription, index) => (
                                    <View key={index} style={styles.prescriptionCard}>
                                        <View style={styles.prescriptionHeader}>
                                            <Ionicons name="medical" size={20} color={healthColors.primary.main} />
                                            <Text style={styles.prescriptionDate}>
                                                {new Date(prescription.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        {prescription.doctorId && (
                                            <Text style={styles.prescriptionDoctor}>
                                                By {prescription.doctorId.name}
                                            </Text>
                                        )}
                                        {prescription.medications && prescription.medications.length > 0 && (
                                            <Text style={styles.prescriptionMeds}>
                                                {prescription.medications.length} medication(s)
                                            </Text>
                                        )}
                                    </View>
                                ))}
                                {patientHistory.prescriptions.length === 0 && (
                                    <Text style={styles.emptyText}>No prescriptions found</Text>
                                )}
                            </View>
                        </ScrollView>
                    ) : null}
                </SafeAreaView>
            </Modal>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Patients</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={healthColors.text.tertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by name, ID, phone..."
                        placeholderTextColor={healthColors.text.tertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searching && <ActivityIndicator size="small" color={healthColors.primary.main} />}
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={healthColors.text.tertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {searchQuery.length >= 2 ? (
                    searchResults.length > 0 ? (
                        searchResults.map(renderPatientCard)
                    ) : !searching ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={60} color={healthColors.text.tertiary} />
                            <Text style={styles.emptyTitle}>No patients found</Text>
                            <Text style={styles.emptySubtitle}>
                                Try searching with a different name or ID
                            </Text>
                        </View>
                    ) : null
                ) : (
                    <View style={styles.instructionState}>
                        <Ionicons name="people" size={80} color={healthColors.primary.main} />
                        <Text style={styles.instructionTitle}>Search Patients</Text>
                        <Text style={styles.instructionText}>
                            Type patient name, ID, or phone number to search
                        </Text>
                        <Text style={styles.instructionSubtext}>
                            Complete medical history loads instantly on selection
                        </Text>
                    </View>
                )}
            </ScrollView>

            {renderHistoryModal()}
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
        paddingHorizontal: getScreenPadding(),
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
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    placeholder: { width: 40 },
    searchContainer: {
        padding: getScreenPadding(),
        backgroundColor: healthColors.background.card,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.card.border,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 12,
        paddingHorizontal: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
        height: moderateScale(48),
    },
    searchInput: {
        flex: 1,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    content: {
        flexGrow: 1,
        padding: getScreenPadding(),
    },
    patientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        marginBottom: indianDesign.spacing.md,
        ...createShadow(2),
    },
    avatarContainer: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        backgroundColor: healthColors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
    },
    avatarText: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.neutral.white,
    },
    patientInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
        marginBottom: 4,
    },
    patientDetail: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    separator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: healthColors.text.tertiary,
    },
    patientPhone: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
    },
    emptyTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.lg,
    },
    emptySubtitle: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.xs,
        textAlign: 'center',
    },
    instructionState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(60),
    },
    instructionTitle: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.lg,
        marginBottom: indianDesign.spacing.sm,
    },
    instructionText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        textAlign: 'center',
        marginBottom: indianDesign.spacing.xs,
    },
    instructionSubtext: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: getScreenPadding(),
        backgroundColor: healthColors.background.card,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.card.border,
    },
    modalTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyContent: {
        padding: getScreenPadding(),
    },
    summaryCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: 16,
        padding: indianDesign.spacing.lg,
        marginBottom: indianDesign.spacing.lg,
        ...createShadow(3),
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.lg,
    },
    largeAvatar: {
        width: moderateScale(70),
        height: moderateScale(70),
        borderRadius: moderateScale(35),
        backgroundColor: healthColors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
    },
    largeAvatarText: {
        fontSize: scaledFontSize(28),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.neutral.white,
    },
    summaryInfo: {
        flex: 1,
    },
    summaryName: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: 4,
    },
    summaryId: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryItem: {
        alignItems: 'center',
        flex: 1,
    },
    summaryLabel: {
        fontSize: scaledFontSize(11),
        color: healthColors.text.tertiary,
        marginTop: 4,
    },
    summaryValue: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginTop: 2,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.lg,
    },
    statCard: {
        flex: 1,
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        padding: indianDesign.spacing.md,
        alignItems: 'center',
        ...createShadow(2),
    },
    statValue: {
        fontSize: scaledFontSize(24),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.xs,
    },
    statLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginTop: 2,
    },
    section: {
        marginBottom: indianDesign.spacing.xl,
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
    },
    alertCard: {
        backgroundColor: healthColors.error.light,
        borderRadius: 12,
        padding: indianDesign.spacing.md,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    allergyText: {
        fontSize: scaledFontSize(13),
        color: '#991B1B',
        lineHeight: 20,
    },
    conditionsCard: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: indianDesign.spacing.sm,
    },
    conditionChip: {
        backgroundColor: healthColors.primary.main + '15',
        paddingHorizontal: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: 20,
    },
    conditionText: {
        fontSize: scaledFontSize(12),
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.medium,
    },
    recordCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        padding: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.sm,
        borderLeftWidth: 3,
        borderLeftColor: healthColors.primary.main,
        ...createShadow(1),
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    recordDate: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
    },
    recordBadge: {
        backgroundColor: healthColors.primary.main + '20',
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: 2,
        borderRadius: 8,
    },
    recordBadgeText: {
        fontSize: scaledFontSize(10),
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.semibold,
    },
    recordDiagnosis: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        fontWeight: indianDesign.fontWeight.medium,
        marginBottom: 4,
    },
    recordDoctor: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    prescriptionCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        padding: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.sm,
        ...createShadow(1),
    },
    prescriptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.xs,
        marginBottom: 4,
    },
    prescriptionDate: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
    },
    prescriptionDoctor: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.primary,
        fontWeight: indianDesign.fontWeight.medium,
        marginBottom: 2,
    },
    prescriptionMeds: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    emptyText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.tertiary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});

export default ManagePatientsScreen;
