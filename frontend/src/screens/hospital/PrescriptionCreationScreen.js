/**
 * Prescription Creation Screen
 * Auto-sync to patient app with instant notifications
 * Medicine auto-complete with database
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { getScreenPadding, scaledFontSize, moderateScale, verticalScale } from '../../utils/responsive';
import prescriptionService from '../../services/prescription.service';
import patientService from '../../services/patient.service';

const PrescriptionCreationScreen = ({ navigation, route }) => {
    const { user } = useSelector((state) => state.auth);
    const preSelectedPatient = route?.params?.patient;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(preSelectedPatient || null);
    
    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [medications, setMedications] = useState([{ 
        name: '', 
        dosage: '', 
        frequency: '', 
        duration: '',
        instructions: '' 
    }]);
    const [tests, setTests] = useState('');
    const [notes, setNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    
    const [saving, setSaving] = useState(false);

    // Common medicines database for autocomplete
    const commonMedicines = [
        'Paracetamol 500mg',
        'Amoxicillin 500mg',
        'Ibuprofen 400mg',
        'Azithromycin 500mg',
        'Cetirizine 10mg',
        'Omeprazole 20mg',
        'Metformin 500mg',
        'Atorvastatin 10mg',
        'Aspirin 75mg',
        'Pantoprazole 40mg',
    ];

    // Search patients
    useEffect(() => {
        if (searchQuery.trim().length >= 2) {
            const timeoutId = setTimeout(async () => {
                setSearching(true);
                try {
                    const result = await patientService.searchPatients(searchQuery);
                    setSearchResults(result.patients || []);
                } catch (error) {
                    setSearchResults([]);
                } finally {
                    setSearching(false);
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setSearchQuery('');
        setSearchResults([]);
    };

    const addMedication = () => {
        setMedications([...medications, { 
            name: '', 
            dosage: '', 
            frequency: '', 
            duration: '',
            instructions: '' 
        }]);
    };

    const removeMedication = (index) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index));
        }
    };

    const updateMedication = (index, field, value) => {
        const newMedications = [...medications];
        newMedications[index][field] = value;
        setMedications(newMedications);
    };

    const validateForm = () => {
        if (!selectedPatient) {
            Alert.alert('Error', 'Please select a patient');
            return false;
        }

        if (!diagnosis.trim()) {
            Alert.alert('Error', 'Please enter diagnosis');
            return false;
        }

        const hasValidMedication = medications.some(med => 
            med.name.trim() && med.dosage.trim() && med.frequency.trim()
        );

        if (!hasValidMedication) {
            Alert.alert('Error', 'Please add at least one complete medication');
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        setSaving(true);
        try {
            // Filter out empty medications
            const validMedications = medications.filter(med => 
                med.name.trim() && med.dosage.trim() && med.frequency.trim()
            );

            const prescriptionData = {
                patientId: selectedPatient.userId,
                symptoms: symptoms.trim(),
                diagnosis: diagnosis.trim(),
                medications: validMedications,
                tests: tests.trim().split(',').map(t => t.trim()).filter(t => t),
                notes: notes.trim(),
                followUpDate: followUpDate || null,
            };

            const result = await prescriptionService.createPrescription(prescriptionData);

            Alert.alert(
                'Success',
                'Prescription created and sent to patient successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Error', error || 'Failed to create prescription');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Write Prescription</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Patient Selection */}
                {!selectedPatient ? (
                    <View style={styles.section}>
                        <Text style={styles.label}>Search Patient *</Text>
                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={20} color={healthColors.text.tertiary} />
                            <TextInput
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Type patient name or ID..."
                                placeholderTextColor={healthColors.text.tertiary}
                            />
                            {searching && <ActivityIndicator size="small" />}
                        </View>
                        {searchResults.length > 0 && (
                            <View style={styles.searchResults}>
                                {searchResults.map((patient) => (
                                    <TouchableOpacity
                                        key={patient.userId}
                                        style={styles.patientItem}
                                        onPress={() => handlePatientSelect(patient)}
                                    >
                                        <Text style={styles.patientName}>{patient.name}</Text>
                                        <Text style={styles.patientId}>{patient.userId}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.selectedPatientCard}>
                        <View style={styles.patientInfo}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {selectedPatient.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.selectedName}>{selectedPatient.name}</Text>
                                <Text style={styles.selectedId}>{selectedPatient.userId}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => setSelectedPatient(null)}>
                            <Ionicons name="close-circle" size={24} color={healthColors.error.main} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Symptoms */}
                <View style={styles.section}>
                    <Text style={styles.label}>Symptoms</Text>
                    <TextInput
                        style={styles.textArea}
                        value={symptoms}
                        onChangeText={setSymptoms}
                        placeholder="Patient's symptoms..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Diagnosis */}
                <View style={styles.section}>
                    <Text style={styles.label}>Diagnosis *</Text>
                    <TextInput
                        style={styles.textArea}
                        value={diagnosis}
                        onChangeText={setDiagnosis}
                        placeholder="Primary diagnosis..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                        numberOfLines={2}
                    />
                </View>

                {/* Medications */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.label}>Medications *</Text>
                        <TouchableOpacity onPress={addMedication}>
                            <Ionicons name="add-circle" size={28} color={healthColors.primary.main} />
                        </TouchableOpacity>
                    </View>

                    {medications.map((med, index) => (
                        <View key={index} style={styles.medicationCard}>
                            <View style={styles.medHeader}>
                                <Text style={styles.medNumber}>#{index + 1}</Text>
                                {medications.length > 1 && (
                                    <TouchableOpacity onPress={() => removeMedication(index)}>
                                        <Ionicons name="trash" size={20} color={healthColors.error.main} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                style={styles.medInput}
                                value={med.name}
                                onChangeText={(v) => updateMedication(index, 'name', v)}
                                placeholder="Medicine name"
                                placeholderTextColor={healthColors.text.tertiary}
                            />
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.medInput, { flex: 1 }]}
                                    value={med.dosage}
                                    onChangeText={(v) => updateMedication(index, 'dosage', v)}
                                    placeholder="Dosage"
                                    placeholderTextColor={healthColors.text.tertiary}
                                />
                                <View style={{ width: 8 }} />
                                <TextInput
                                    style={[styles.medInput, { flex: 1 }]}
                                    value={med.frequency}
                                    onChangeText={(v) => updateMedication(index, 'frequency', v)}
                                    placeholder="Frequency"
                                    placeholderTextColor={healthColors.text.tertiary}
                                />
                            </View>
                            <View style={styles.row}>
                                <TextInput
                                    style={[styles.medInput, { flex: 1 }]}
                                    value={med.duration}
                                    onChangeText={(v) => updateMedication(index, 'duration', v)}
                                    placeholder="Duration"
                                    placeholderTextColor={healthColors.text.tertiary}
                                />
                            </View>
                            <TextInput
                                style={styles.medInput}
                                value={med.instructions}
                                onChangeText={(v) => updateMedication(index, 'instructions', v)}
                                placeholder="Instructions (e.g., After meals)"
                                placeholderTextColor={healthColors.text.tertiary}
                            />
                        </View>
                    ))}
                </View>

                {/* Tests */}
                <View style={styles.section}>
                    <Text style={styles.label}>Recommended Tests</Text>
                    <TextInput
                        style={styles.textArea}
                        value={tests}
                        onChangeText={setTests}
                        placeholder="Comma-separated tests..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                    />
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={styles.label}>Additional Notes</Text>
                    <TextInput
                        style={styles.textArea}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Any additional advice or precautions..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Follow-up Date */}
                <View style={styles.section}>
                    <Text style={styles.label}>Follow-up Date (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={followUpDate}
                        onChangeText={setFollowUpDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={healthColors.text.tertiary}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    <LinearGradient
                        colors={[healthColors.primary.main, healthColors.primary.dark]}
                        style={styles.saveGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Ionicons name="send" size={20} color="#FFF" />
                                <Text style={styles.saveText}>Create & Send to Patient</Text>
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
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
        padding: getScreenPadding(),
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
    },
    headerTitle: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    content: {
        padding: getScreenPadding(),
    },
    section: {
        marginBottom: indianDesign.spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.sm,
    },
    label: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.sm,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: healthColors.card.border,
        paddingHorizontal: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
        height: moderateScale(48),
    },
    searchInput: {
        flex: 1,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    searchResults: {
        marginTop: indianDesign.spacing.sm,
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        ...createShadow(2),
    },
    patientItem: {
        padding: indianDesign.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: healthColors.card.border,
    },
    patientName: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    patientId: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
        marginTop: 2,
    },
    selectedPatientCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: healthColors.primary.main + '10',
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        marginBottom: indianDesign.spacing.lg,
        borderWidth: 1,
        borderColor: healthColors.primary.main + '30',
    },
    patientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
    },
    avatar: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: healthColors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: scaledFontSize(18),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.neutral.white,
    },
    selectedName: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    selectedId: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    input: {
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: healthColors.card.border,
        padding: indianDesign.spacing.md,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    textArea: {
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: healthColors.card.border,
        padding: indianDesign.spacing.md,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        minHeight: moderateScale(80),
        textAlignVertical: 'top',
    },
    medicationCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        padding: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.md,
        borderWidth: 1,
        borderColor: healthColors.card.border,
        ...createShadow(1),
    },
    medHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.sm,
    },
    medNumber: {
        fontSize: scaledFontSize(12),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.primary.main,
    },
    medInput: {
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 8,
        padding: indianDesign.spacing.sm,
        fontSize: scaledFontSize(13),
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.sm,
    },
    row: {
        flexDirection: 'row',
    },
    saveButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: indianDesign.spacing.lg,
        marginBottom: indianDesign.spacing.xl,
        ...createShadow(3),
    },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    saveText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
});

export default PrescriptionCreationScreen;
