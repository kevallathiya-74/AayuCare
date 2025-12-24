/**
 * Prescription Creation Screen (Screen 7)
 * AUTO-SYNC to patient app and pharmacy
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
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { moderateScale, verticalScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { prescriptionService, patientService } from '../../services';
import { logError } from '../../utils/errorHandler';

const EnhancedPrescriptionScreen = ({ navigation, route }) => {
    const { user } = useSelector((state) => state.auth);
    const { patientId, appointmentId } = route.params || {};
    
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date] = useState(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
    const [medications, setMedications] = useState([]);
    const [instructions, setInstructions] = useState('');
    const [nextVisit, setNextVisit] = useState('');
    const [sendOptions, setSendOptions] = useState({
        patientApp: true,
        hospitalPharmacy: true,
        externalPharmacy: false,
    });
    const [showAddMedicine, setShowAddMedicine] = useState(false);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [discount] = useState(15); // Hospital pharmacy discount percentage

    const fetchPatientDetails = useCallback(async () => {
        if (!patientId) {
            setLoading(false);
            Alert.alert('Error', 'Patient information is required');
            return;
        }

        try {
            const response = await patientService.getPatientById(patientId);
            if (response?.success) {
                setPatient(response.data);
            } else {
                Alert.alert('Error', 'Unable to fetch patient details');
            }
        } catch (err) {
            logError(err, 'EnhancedPrescriptionScreen.fetchPatientDetails');
            Alert.alert('Error', 'Unable to fetch patient details');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchPatientDetails();
    }, [fetchPatientDetails]);

    useEffect(() => {
        // Calculate estimated cost based on medications
        const cost = medications.reduce((total, med) => {
            // Simplified cost calculation - in real app, fetch from medicine database
            return total + (med.unitPrice || 50) * (parseInt(med.duration) || 5);
        }, 0);
        setEstimatedCost(cost);
    }, [medications]);

    const handleAddMedicine = () => {
        setShowAddMedicine(true);
    };

    const handleRemoveMedicine = (id) => {
        setMedications(medications.filter(med => med.id !== id));
    };

    const toggleSendOption = (option) => {
        setSendOptions(prev => ({
            ...prev,
            [option]: !prev[option],
        }));
    };

    const handleSavePrescription = async () => {
        if (medications.length === 0) {
            Alert.alert('Error', 'Please add at least one medicine');
            return;
        }

        if (!patient?._id) {
            Alert.alert('Error', 'Patient information is required');
            return;
        }

        setSaving(true);
        try {
            const prescriptionData = {
                patient: patient._id,
                doctor: user._id,
                appointment: appointmentId,
                medications: medications.map(med => ({
                    name: med.name,
                    dosage: med.dosage,
                    frequency: med.frequency || med.dosage,
                    duration: med.duration,
                    instructions: med.instructions || '',
                })),
                instructions,
                nextVisitDate: nextVisit || null,
                sendOptions,
            };

            const response = await prescriptionService.createPrescription(prescriptionData);
            
            if (response?.success) {
                Alert.alert(
                    'Prescription Saved',
                    `Prescription has been saved and will be sent to:\n${sendOptions.patientApp ? 'Patient Mobile App\n' : ''}${sendOptions.hospitalPharmacy ? 'Hospital Pharmacy\n' : ''}${sendOptions.externalPharmacy ? 'External Pharmacy' : ''}`,
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response?.message || 'Failed to save prescription');
            }
        } catch (err) {
            logError(err, 'EnhancedPrescriptionScreen.handleSavePrescription');
            Alert.alert('Error', 'Unable to save prescription. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const finalCost = estimatedCost - (estimatedCost * discount / 100);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={healthColors.primary.main} />
                    <Text style={styles.loadingText}>Loading patient details...</Text>
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
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Prescription</Text>
                <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSavePrescription}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Save prescription"
                >
                    {saving ? (
                        <ActivityIndicator size="small" color={healthColors.primary.main} />
                    ) : (
                        <Ionicons name="save" size={24} color={healthColors.primary.main} />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Basic Info */}
                <View style={styles.section}>
                    <View 
                        style={styles.infoCard}
                        accessible={true}
                        accessibilityLabel={`Prescription for ${patient?.name || 'Patient'}`}
                    >
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Patient:</Text>
                            <Text style={styles.infoValue}>{patient?.name || 'N/A'} ({patient?._id?.slice(-6) || 'N/A'})</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Doctor:</Text>
                            <Text style={styles.infoValue}>{user?.name || 'Doctor'} ({user?.specialization || 'Specialist'})</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Date:</Text>
                            <Text style={styles.infoValue}>{date}</Text>
                        </View>
                    </View>
                </View>

                {/* Medications */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MEDICATIONS:</Text>
                    <View style={styles.medicationsCard}>
                        {medications.map((med, index) => (
                            <View key={med.id} style={styles.medicationItem}>
                                <View style={styles.medicationHeader}>
                                    <Text style={styles.medicationNumber}>{index + 1}.</Text>
                                    <View style={styles.medicationInfo}>
                                        <Text style={styles.medicationName}>{med.name}</Text>
                                        <Text style={styles.medicationDosage}>
                                            Dosage: {med.dosage}  Duration: {med.duration}
                                        </Text>
                                        <View style={styles.timingsRow}>
                                            {med.timings.morning && (
                                                <View style={styles.timingChip}>
                                                    <Text style={styles.timingText}>Morning</Text>
                                                </View>
                                            )}
                                            {med.timings.afternoon && (
                                                <View style={styles.timingChip}>
                                                    <Text style={styles.timingText}>Afternoon</Text>
                                                </View>
                                            )}
                                            {med.timings.evening && (
                                                <View style={styles.timingChip}>
                                                    <Text style={styles.timingText}>Evening</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveMedicine(med.id)}
                                    >
                                        <Ionicons name="close-circle" size={24} color={healthColors.error.main} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.addMedicineButton} onPress={handleAddMedicine}>
                        <Ionicons name="add-circle" size={20} color={healthColors.primary.main} />
                        <Text style={styles.addMedicineText}>Add Medicine</Text>
                    </TouchableOpacity>
                </View>

                {/* Instructions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INSTRUCTIONS:</Text>
                    <TextInput
                        style={styles.instructionsInput}
                        placeholder="Enter instructions for patient..."
                        placeholderTextColor={healthColors.text.disabled}
                        value={instructions}
                        onChangeText={setInstructions}
                        multiline
                        numberOfLines={4}
                    />
                </View>

                {/* Next Visit */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>NEXT VISIT:</Text>
                    <TouchableOpacity style={styles.dateSelector}>
                        <Ionicons name="calendar" size={20} color={healthColors.primary.main} />
                        <Text style={styles.dateText}>{nextVisit}</Text>
                        <Ionicons name="chevron-down" size={20} color={healthColors.text.secondary} />
                    </TouchableOpacity>
                </View>

                {/* Send Options */}
                <View style={styles.section}>
                    <View style={styles.sendOptionsHeader}>
                        <Ionicons name="checkmark-circle" size={20} color={healthColors.success.main} />
                        <Text style={styles.sectionTitle}>SEND TO OPTIONS:</Text>
                    </View>
                    <View style={styles.sendOptionsCard}>
                        <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => toggleSendOption('patientApp')}
                        >
                            <Ionicons 
                                name={sendOptions.patientApp ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={sendOptions.patientApp ? healthColors.primary.main : healthColors.text.disabled} 
                            />
                            <Text style={styles.checkboxLabel}>Patient Mobile App (Auto-Sync)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => toggleSendOption('hospitalPharmacy')}
                        >
                            <Ionicons 
                                name={sendOptions.hospitalPharmacy ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={sendOptions.hospitalPharmacy ? healthColors.primary.main : healthColors.text.disabled} 
                            />
                            <Text style={styles.checkboxLabel}>Hospital Pharmacy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => toggleSendOption('externalPharmacy')}
                        >
                            <Ionicons 
                                name={sendOptions.externalPharmacy ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={sendOptions.externalPharmacy ? healthColors.primary.main : healthColors.text.disabled} 
                            />
                            <Text style={styles.checkboxLabel}>External Pharmacy (Patient Choice)</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Cost Summary */}
                <View style={styles.section}>
                    <View style={styles.costCard}>
                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Estimated Cost:</Text>
                            <Text style={styles.costValue}>₹{estimatedCost}</Text>
                        </View>
                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>Hospital Pharmacy Discount:</Text>
                            <Text style={styles.discountValue}>{discount}%</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.costRow}>
                            <Text style={styles.finalCostLabel}>Final Amount:</Text>
                            <Text style={styles.finalCostValue}>₹{finalCost}</Text>
                        </View>
                    </View>
                </View>

                {/* Save Button */}
                <View style={styles.section}>
                    <TouchableOpacity style={styles.saveAndSendButton} onPress={handleSavePrescription}>
                        <Text style={styles.saveAndSendText}>SAVE & SEND PRESCRIPTION</Text>
                    </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: moderateScale(12),
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
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
    saveButton: {
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
    infoCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(8),
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    infoLabel: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        fontWeight: '600',
    },
    medicationsCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    medicationItem: {
        marginBottom: moderateScale(16),
        paddingBottom: moderateScale(16),
        borderBottomWidth: 1,
        borderBottomColor: healthColors.border.light,
    },
    medicationHeader: {
        flexDirection: 'row',
        gap: moderateScale(8),
    },
    medicationNumber: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    medicationInfo: {
        flex: 1,
    },
    medicationName: {
        fontSize: scaledFontSize(15),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(6),
    },
    medicationDosage: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(8),
    },
    timingsRow: {
        flexDirection: 'row',
        gap: moderateScale(8),
        flexWrap: 'wrap',
    },
    timingChip: {
        paddingHorizontal: moderateScale(12),
        paddingVertical: moderateScale(6),
        backgroundColor: healthColors.primary.main + '15',
        borderRadius: moderateScale(16),
    },
    timingText: {
        fontSize: scaledFontSize(12),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
    removeButton: {
        padding: moderateScale(4),
    },
    addMedicineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        backgroundColor: healthColors.background.card,
        paddingVertical: moderateScale(14),
        borderRadius: moderateScale(12),
        marginTop: moderateScale(12),
        borderWidth: 1,
        borderColor: healthColors.border.light,
        borderStyle: 'dashed',
    },
    addMedicineText: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
    instructionsInput: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        textAlignVertical: 'top',
        minHeight: moderateScale(100),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    dateText: {
        flex: 1,
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.text.primary,
        marginLeft: moderateScale(12),
    },
    sendOptionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
    },
    sendOptionsCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(12),
        paddingVertical: moderateScale(10),
    },
    checkboxLabel: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        flex: 1,
    },
    costCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        borderWidth: 2,
        borderColor: healthColors.border.light,
    },
    costRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: moderateScale(8),
    },
    costLabel: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    costValue: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    discountValue: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.success.main,
    },
    divider: {
        height: 1,
        backgroundColor: healthColors.border.light,
        marginVertical: moderateScale(8),
    },
    finalCostLabel: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    finalCostValue: {
        fontSize: scaledFontSize(20),
        fontWeight: '700',
        color: healthColors.primary.main,
    },
    saveAndSendButton: {
        backgroundColor: healthColors.primary.main,
        borderRadius: moderateScale(12),
        paddingVertical: moderateScale(18),
        alignItems: 'center',
    },
    saveAndSendText: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default EnhancedPrescriptionScreen;
