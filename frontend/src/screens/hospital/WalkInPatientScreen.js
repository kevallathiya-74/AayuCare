/**
 * Walk-in Patient Registration Screen
 * Quick registration for patients who walk in without appointment
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { moderateScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { Card } from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { doctorService } from '../../services';

const WalkInPatientScreen = ({ navigation }) => {
    const { user } = useSelector((state) => state.auth);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: 'male',
        phone: '',
        bloodGroup: '',
        chiefComplaint: '',
        emergencyContact: '',
    });

    const genderOptions = ['male', 'female', 'other'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            showError('Please enter patient name');
            return false;
        }
        if (!formData.age || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
            showError('Please enter valid age (1-120)');
            return false;
        }
        if (!formData.phone.trim() || formData.phone.length !== 10) {
            showError('Please enter valid 10-digit phone number');
            return false;
        }
        if (!formData.chiefComplaint.trim()) {
            showError('Please enter chief complaint/symptoms');
            return false;
        }
        return true;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            
            // Create patient data
            const patientData = {
                name: formData.name.trim(),
                age: parseInt(formData.age),
                gender: formData.gender,
                phone: formData.phone.trim(),
                bloodGroup: formData.bloodGroup || undefined,
                symptoms: formData.chiefComplaint.trim(),
                address: formData.emergencyContact || undefined,
            };

            const response = await doctorService.registerWalkInPatient(patientData);
            
            const { data, isExisting } = response;

            Alert.alert(
                'Success',
                isExisting 
                    ? `${data.name} (${data.userId}) - Patient already registered. Added to today's queue.`
                    : `${data.name} (${data.userId}) has been registered as a walk-in patient and added to today's queue.`,
                [
                    {
                        text: 'View Queue',
                        onPress: () => {
                            navigation.navigate('DoctorTabs', { screen: 'Today' });
                        },
                    },
                    {
                        text: 'Register Another',
                        onPress: () => {
                            setFormData({
                                name: '',
                                age: '',
                                gender: 'male',
                                phone: '',
                                bloodGroup: '',
                                chiefComplaint: '',
                                emergencyContact: '',
                            });
                        },
                    },
                ]
            );
        } catch (err) {
            logError(err, { context: 'WalkInPatientScreen.handleRegister' });
            showError('Failed to register patient. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            {/* Header */}
            <LinearGradient
                colors={[healthColors.primary.main, healthColors.primary.dark]}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="person-add" size={28} color="#FFF" />
                    <Text style={styles.headerTitle}>Walk-in Patient</Text>
                </View>
                <View style={{ width: 24 }} />
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>Quick Registration</Text>

                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Patient Name *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter full name"
                            value={formData.name}
                            onChangeText={(value) => handleInputChange('name', value)}
                            placeholderTextColor={healthColors.text.disabled}
                        />
                    </View>

                    {/* Age & Gender */}
                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>Age *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Age"
                                value={formData.age}
                                onChangeText={(value) => handleInputChange('age', value.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                                maxLength={3}
                                placeholderTextColor={healthColors.text.disabled}
                            />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>Gender *</Text>
                            <View style={styles.genderRow}>
                                {genderOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.genderButton,
                                            formData.gender === option && styles.genderButtonActive,
                                        ]}
                                        onPress={() => handleInputChange('gender', option)}
                                    >
                                        <Text
                                            style={[
                                                styles.genderText,
                                                formData.gender === option && styles.genderTextActive,
                                            ]}
                                        >
                                            {option.charAt(0).toUpperCase() + option.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="10-digit mobile number"
                            value={formData.phone}
                            onChangeText={(value) => handleInputChange('phone', value.replace(/[^0-9]/g, ''))}
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholderTextColor={healthColors.text.disabled}
                        />
                    </View>

                    {/* Blood Group */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Blood Group</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.bloodGroupRow}>
                                {bloodGroups.map((group) => (
                                    <TouchableOpacity
                                        key={group}
                                        style={[
                                            styles.bloodGroupButton,
                                            formData.bloodGroup === group && styles.bloodGroupButtonActive,
                                        ]}
                                        onPress={() => handleInputChange('bloodGroup', group)}
                                    >
                                        <Text
                                            style={[
                                                styles.bloodGroupText,
                                                formData.bloodGroup === group && styles.bloodGroupTextActive,
                                            ]}
                                        >
                                            {group}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Emergency Contact */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Emergency Contact</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Emergency contact number"
                            value={formData.emergencyContact}
                            onChangeText={(value) => handleInputChange('emergencyContact', value.replace(/[^0-9]/g, ''))}
                            keyboardType="phone-pad"
                            maxLength={10}
                            placeholderTextColor={healthColors.text.disabled}
                        />
                    </View>
                </Card>

                <Card style={styles.section}>
                    <Text style={styles.sectionTitle}>Medical Information</Text>

                    {/* Chief Complaint */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Chief Complaint / Symptoms *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe the symptoms or reason for visit"
                            value={formData.chiefComplaint}
                            onChangeText={(value) => handleInputChange('chiefComplaint', value)}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholderTextColor={healthColors.text.disabled}
                        />
                    </View>
                </Card>

                <Text style={styles.note}>* Required fields</Text>

                {/* Register Button */}
                <TouchableOpacity
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={loading ? [healthColors.button.disabled, healthColors.button.disabled] : [healthColors.success.main, healthColors.success.dark]}
                        style={styles.registerButtonGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                                <Text style={styles.registerButtonText}>Register Patient</Text>
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
        paddingHorizontal: getScreenPadding(),
        paddingVertical: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: scaledFontSize(20),
        fontWeight: '700',
        color: '#FFF',
        marginLeft: 12,
    },
    content: {
        padding: getScreenPadding(),
    },
    subtitle: {
        fontSize: scaledFontSize(16),
        color: healthColors.text.secondary,
        marginBottom: 16,
    },
    section: {
        marginBottom: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: '600',
        color: healthColors.text.primary,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: scaledFontSize(14),
        fontWeight: '500',
        color: healthColors.text.secondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: healthColors.border.main,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: scaledFontSize(15),
        color: healthColors.text.primary,
        backgroundColor: healthColors.background.primary,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    row: {
        flexDirection: 'row',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 8,
    },
    genderButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: healthColors.border.main,
        backgroundColor: healthColors.background.primary,
        alignItems: 'center',
    },
    genderButtonActive: {
        backgroundColor: healthColors.primary.main,
        borderColor: healthColors.primary.main,
    },
    genderText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        fontWeight: '500',
    },
    genderTextActive: {
        color: '#FFF',
    },
    bloodGroupRow: {
        flexDirection: 'row',
        gap: 8,
    },
    bloodGroupButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: healthColors.border.main,
        backgroundColor: healthColors.background.primary,
    },
    bloodGroupButtonActive: {
        backgroundColor: healthColors.error.main,
        borderColor: healthColors.error.main,
    },
    bloodGroupText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        fontWeight: '600',
    },
    bloodGroupTextActive: {
        color: '#FFF',
    },
    note: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.disabled,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    registerButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
    registerButtonDisabled: {
        opacity: 0.6,
    },
    registerButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    registerButtonText: {
        fontSize: scaledFontSize(16),
        fontWeight: '700',
        color: '#FFF',
    },
});

export default WalkInPatientScreen;
