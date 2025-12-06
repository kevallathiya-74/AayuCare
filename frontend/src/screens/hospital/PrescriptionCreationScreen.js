/**
 * Prescription Creation Screen
 * Quick prescription creation for doctors
 * Auto-complete medicines, dosage, duration
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';

const PrescriptionCreationScreen = ({ navigation }) => {
    const [patientName, setPatientName] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
    const [tests, setTests] = useState('');
    const [advice, setAdvice] = useState('');

    const addMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
    };

    const removeMedicine = (index) => {
        const newMedicines = medicines.filter((_, i) => i !== index);
        setMedicines(newMedicines);
    };

    const updateMedicine = (index, field, value) => {
        const newMedicines = [...medicines];
        newMedicines[index][field] = value;
        setMedicines(newMedicines);
    };

    const handleSave = () => {
        // Save prescription logic
        alert('Prescription saved successfully!');
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Write Prescription</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Patient Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Patient</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="person-outline" size={20} color={healthColors.text.tertiary} />
                        <TextInput
                            style={styles.input}
                            value={patientName}
                            onChangeText={setPatientName}
                            placeholder="Search patient..."
                            placeholderTextColor={healthColors.text.tertiary}
                        />
                    </View>
                </View>

                {/* Symptoms */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Symptoms</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={symptoms}
                        onChangeText={setSymptoms}
                        placeholder="Enter symptoms..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Diagnosis */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Diagnosis</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={diagnosis}
                        onChangeText={setDiagnosis}
                        placeholder="Enter diagnosis..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Medicines */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Medicines</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={addMedicine}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add-circle" size={24} color={healthColors.primary.main} />
                        </TouchableOpacity>
                    </View>

                    {medicines.map((medicine, index) => (
                        <View key={index} style={styles.medicineCard}>
                            <View style={styles.medicineHeader}>
                                <Text style={styles.medicineNumber}>Medicine {index + 1}</Text>
                                {medicines.length > 1 && (
                                    <TouchableOpacity
                                        onPress={() => removeMedicine(index)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close-circle" size={20} color={healthColors.error.main} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TextInput
                                style={styles.medicineInput}
                                value={medicine.name}
                                onChangeText={(value) => updateMedicine(index, 'name', value)}
                                placeholder="Medicine name"
                                placeholderTextColor={healthColors.text.tertiary}
                            />
                            <View style={styles.medicineRow}>
                                <TextInput
                                    style={[styles.medicineInput, styles.halfInput]}
                                    value={medicine.dosage}
                                    onChangeText={(value) => updateMedicine(index, 'dosage', value)}
                                    placeholder="Dosage (e.g., 1-0-1)"
                                    placeholderTextColor={healthColors.text.tertiary}
                                />
                                <TextInput
                                    style={[styles.medicineInput, styles.halfInput]}
                                    value={medicine.duration}
                                    onChangeText={(value) => updateMedicine(index, 'duration', value)}
                                    placeholder="Duration (e.g., 7 days)"
                                    placeholderTextColor={healthColors.text.tertiary}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Tests Recommended */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tests Recommended</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={tests}
                        onChangeText={setTests}
                        placeholder="Enter recommended tests..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                        numberOfLines={2}
                    />
                </View>

                {/* Advice */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Advice</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={advice}
                        onChangeText={setAdvice}
                        placeholder="Enter advice for patient..."
                        placeholderTextColor={healthColors.text.tertiary}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-circle" size={24} color={healthColors.text.white} />
                    <Text style={styles.saveButtonText}>Save & Share</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
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
        paddingHorizontal: indianDesign.spacing.lg,
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
        fontSize: indianDesign.fontSize.xlarge,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    scrollContent: {
        padding: indianDesign.spacing.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: indianDesign.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.sm,
    },
    sectionTitle: {
        fontSize: indianDesign.fontSize.medium,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.medium,
        borderWidth: 1,
        borderColor: healthColors.border.light,
        paddingHorizontal: indianDesign.spacing.md,
        height: indianDesign.touchTarget.large,
        gap: indianDesign.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.primary,
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.medium,
        borderWidth: 1,
        borderColor: healthColors.border.light,
        paddingHorizontal: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.sm,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    addButton: {
        padding: 4,
    },
    medicineCard: {
        backgroundColor: healthColors.background.tertiary,
        borderRadius: indianDesign.borderRadius.medium,
        padding: indianDesign.spacing.md,
        marginBottom: indianDesign.spacing.sm,
    },
    medicineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.sm,
    },
    medicineNumber: {
        fontSize: indianDesign.fontSize.small,
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.secondary,
    },
    medicineInput: {
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.small,
        borderWidth: 1,
        borderColor: healthColors.border.light,
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: indianDesign.spacing.sm,
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.xs,
    },
    medicineRow: {
        flexDirection: 'row',
        gap: indianDesign.spacing.sm,
    },
    halfInput: {
        flex: 1,
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: healthColors.primary.main,
        height: indianDesign.touchTarget.large,
        borderRadius: indianDesign.borderRadius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        gap: indianDesign.spacing.sm,
        ...createShadow(3),
    },
    saveButtonText: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.white,
    },
});

export default PrescriptionCreationScreen;
