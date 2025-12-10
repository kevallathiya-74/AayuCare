/**
 * AI Symptom Checker Screen
 * AI-powered symptom analysis with recommendations
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { AIIcon, IconWithBackground } from '../../components/common/CustomIcons';
import AITagline from '../../components/common/AITagline';
import LoadingIndicator from '../../components/common/LoadingIndicator';
import NetworkStatusIndicator from '../../components/common/NetworkStatusIndicator';
import ErrorRecovery from '../../components/common/ErrorRecovery';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';
import aiService from '../../services/ai.service';
import {
    getScreenPadding,
    scaledFontSize,
    moderateScale,
    verticalScale,
} from '../../utils/responsive';

const AISymptomChecker = ({ navigation }) => {
    const [symptoms, setSymptoms] = useState('');
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [duration, setDuration] = useState('');
    const [severity, setSeverity] = useState('moderate');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();

    const commonSymptoms = [
        { id: 1, name: 'Fever', icon: 'thermometer' },
        { id: 2, name: 'Headache', icon: 'head' },
        { id: 3, name: 'Cough', icon: 'medical' },
        { id: 4, name: 'Fatigue', icon: 'battery-dead' },
        { id: 5, name: 'Body ache', icon: 'body' },
        { id: 6, name: 'Sore throat', icon: 'mic-off' },
        { id: 7, name: 'Runny nose', icon: 'water' },
        { id: 8, name: 'Nausea', icon: 'sad' },
    ];

    const severityLevels = [
        { value: 'mild', label: 'Mild', color: '#10B981' },
        { value: 'moderate', label: 'Moderate', color: '#F59E0B' },
        { value: 'severe', label: 'Severe', color: '#EF4444' },
    ];

    const toggleSymptom = (symptom) => {
        if (selectedSymptoms.find(s => s.id === symptom.id)) {
            setSelectedSymptoms(selectedSymptoms.filter(s => s.id !== symptom.id));
        } else {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
        }
    };

    const handleAnalyze = async () => {
        if (selectedSymptoms.length === 0 && !symptoms.trim()) {
            showError('Please select or enter at least one symptom');
            return;
        }

        if (!isConnected) {
            showError('No internet connection. Please check your network.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const allSymptoms = [
                ...selectedSymptoms.map(s => s.name),
                ...symptoms.split(',').map(s => s.trim()).filter(s => s),
            ];

            const result = await aiService.analyzeSymptoms({
                symptoms: allSymptoms,
                duration,
                severity,
            });

            setResults(result);
        } catch (err) {
            logError(err, { context: 'AISymptomChecker.handleAnalyze', symptomsCount: selectedSymptoms.length });
            setError(err.message || 'Failed to analyze symptoms');
            showError('Failed to analyze symptoms. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderResults = () => {
        if (!results?.analysis) return null;

        const { analysis } = results;

        return (
            <View style={styles.resultsContainer}>
                <View style={styles.resultHeader}>
                    <AIIcon size={24} />
                    <Text style={styles.resultTitle}>Analysis Complete</Text>
                </View>

                {/* Possible Conditions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Possible Conditions</Text>
                    {analysis.possibleConditions.map((condition, index) => (
                        <View key={index} style={styles.conditionCard}>
                            <View style={styles.conditionHeader}>
                                <Text style={styles.conditionName}>{condition.name}</Text>
                                <View style={styles.probabilityBadge}>
                                    <Text style={styles.probabilityText}>
                                        {condition.probability}%
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${condition.probability}%` },
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Urgency Level */}
                <View style={styles.urgencyCard}>
                    <IconWithBackground
                        name={analysis.urgencyLevel === 'high' ? 'alert-circle' : 'information-circle'}
                        color={analysis.urgencyLevel === 'high' ? '#EF4444' : '#F59E0B'}
                        backgroundColor={
                            analysis.urgencyLevel === 'high' ? '#FEE2E2' : '#FEF3C7'
                        }
                        size={20}
                        padding={8}
                    />
                    <View style={styles.urgencyContent}>
                        <Text style={styles.urgencyLabel}>Urgency Level</Text>
                        <Text
                            style={[
                                styles.urgencyValue,
                                {
                                    color:
                                        analysis.urgencyLevel === 'high' ? '#EF4444' : '#F59E0B',
                                },
                            ]}
                        >
                            {analysis.urgencyLevel.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Recommendations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recommendations</Text>
                    {analysis.recommendations.map((rec, index) => (
                        <View key={index} style={styles.recommendationItem}>
                            <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={healthColors.primary.main}
                            />
                            <Text style={styles.recommendationText}>{rec}</Text>
                        </View>
                    ))}
                </View>

                {/* When to Seek Help */}
                <View style={styles.warningSection}>
                    <View style={styles.warningHeader}>
                        <Ionicons name="warning" size={20} color="#EF4444" />
                        <Text style={styles.warningTitle}>Seek Immediate Help If:</Text>
                    </View>
                    {analysis.whenToSeekHelp.map((item, index) => (
                        <Text key={index} style={styles.warningItem}>
                            • {item}
                        </Text>
                    ))}
                </View>

                {/* Estimated Recovery */}
                <View style={styles.recoveryCard}>
                    <Ionicons name="time-outline" size={24} color={healthColors.primary.main} />
                    <View>
                        <Text style={styles.recoveryLabel}>Estimated Recovery</Text>
                        <Text style={styles.recoveryValue}>{analysis.estimatedRecovery}</Text>
                    </View>
                </View>

                {/* AI Tagline */}
                <AITagline variant="gradient" style={{ marginTop: indianDesign.spacing.lg }} />

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                            setResults(null);
                            setSelectedSymptoms([]);
                            setSymptoms('');
                        }}
                    >
                        <Text style={styles.secondaryButtonText}>New Analysis</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('AppointmentBooking')}
                    >
                        <LinearGradient
                            colors={[healthColors.primary.main, healthColors.primary.dark]}
                            style={styles.primaryButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.primaryButtonText}>Book Appointment</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const handleRetry = () => {
        setError(null);
        setResults(null);
    };

    if (error && !results) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <NetworkStatusIndicator />
                <ErrorRecovery
                    error={error}
                    onRetry={handleRetry}
                    onDismiss={() => setError(null)}
                />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <NetworkStatusIndicator />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerContent}>
                        <AIIcon size={32} />
                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle}>AI Symptom Checker</Text>
                            <Text style={styles.headerSubtitle}>
                                Smart health analysis powered by AI
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {!results ? (
                    <View style={styles.formContainer}>
                        {/* Common Symptoms */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Select Common Symptoms</Text>
                            <View style={styles.symptomsGrid}>
                                {commonSymptoms.map((symptom) => {
                                    const isSelected = selectedSymptoms.find(
                                        (s) => s.id === symptom.id
                                    );
                                    return (
                                        <TouchableOpacity
                                            key={symptom.id}
                                            style={[
                                                styles.symptomChip,
                                                isSelected && styles.symptomChipSelected,
                                            ]}
                                            onPress={() => toggleSymptom(symptom)}
                                        >
                                            <Ionicons
                                                name={symptom.icon}
                                                size={18}
                                                color={
                                                    isSelected
                                                        ? healthColors.neutral.white
                                                        : healthColors.primary.main
                                                }
                                            />
                                            <Text
                                                style={[
                                                    styles.symptomChipText,
                                                    isSelected && styles.symptomChipTextSelected,
                                                ]}
                                            >
                                                {symptom.name}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Additional Symptoms */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Additional Symptoms (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g., chest pain, dizziness"
                                placeholderTextColor={healthColors.text.tertiary}
                                value={symptoms}
                                onChangeText={setSymptoms}
                                multiline
                            />
                        </View>

                        {/* Duration */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Duration</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 2 days, 1 week"
                                placeholderTextColor={healthColors.text.tertiary}
                                value={duration}
                                onChangeText={setDuration}
                            />
                        </View>

                        {/* Severity */}
                        <View style={styles.inputSection}>
                            <Text style={styles.label}>Severity Level</Text>
                            <View style={styles.severityContainer}>
                                {severityLevels.map((level) => (
                                    <TouchableOpacity
                                        key={level.value}
                                        style={[
                                            styles.severityButton,
                                            severity === level.value && {
                                                backgroundColor: level.color,
                                                borderColor: level.color,
                                            },
                                        ]}
                                        onPress={() => setSeverity(level.value)}
                                    >
                                        <Text
                                            style={[
                                                styles.severityText,
                                                severity === level.value &&
                                                    styles.severityTextSelected,
                                            ]}
                                        >
                                            {level.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Analyze Button */}
                        <TouchableOpacity
                            style={styles.analyzeButton}
                            onPress={handleAnalyze}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.analyzeButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={20} color="#FFF" />
                                        <Text style={styles.analyzeButtonText}>
                                            Analyze with AI
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Disclaimer */}
                        <View style={styles.disclaimer}>
                            <Ionicons
                                name="information-circle-outline"
                                size={16}
                                color={healthColors.text.tertiary}
                            />
                            <Text style={styles.disclaimerText}>
                                This is not a substitute for professional medical advice. Please
                                consult a doctor for accurate diagnosis.
                            </Text>
                        </View>
                    </View>
                ) : (
                    renderResults()
                )}

                {loading && (
                    <View style={styles.loadingContainer}>
                        <LoadingIndicator type="medical" message="Analyzing symptoms..." />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        padding: getScreenPadding(),
        paddingTop: verticalScale(20),
        paddingBottom: verticalScale(30),
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        marginTop: indianDesign.spacing.lg,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: scaledFontSize(24),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: scaledFontSize(13),
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
    },
    formContainer: {
        padding: getScreenPadding(),
    },
    inputSection: {
        marginBottom: indianDesign.spacing.xl,
    },
    label: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.sm,
    },
    symptomsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: indianDesign.spacing.sm,
    },
    symptomChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: indianDesign.spacing.sm,
        paddingHorizontal: indianDesign.spacing.md,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: healthColors.primary.main,
        backgroundColor: healthColors.background.card,
    },
    symptomChipSelected: {
        backgroundColor: healthColors.primary.main,
        borderColor: healthColors.primary.main,
    },
    symptomChipText: {
        fontSize: scaledFontSize(13),
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.medium,
    },
    symptomChipTextSelected: {
        color: healthColors.neutral.white,
    },
    textInput: {
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
    input: {
        backgroundColor: healthColors.background.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: healthColors.card.border,
        padding: indianDesign.spacing.md,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    severityContainer: {
        flexDirection: 'row',
        gap: indianDesign.spacing.sm,
    },
    severityButton: {
        flex: 1,
        paddingVertical: indianDesign.spacing.md,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: healthColors.card.border,
        backgroundColor: healthColors.background.card,
        alignItems: 'center',
    },
    severityText: {
        fontSize: scaledFontSize(13),
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.secondary,
    },
    severityTextSelected: {
        color: healthColors.neutral.white,
    },
    analyzeButton: {
        borderRadius: 12,
        overflow: 'hidden',
        ...createShadow(3),
    },
    analyzeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    analyzeButtonText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: indianDesign.spacing.xs,
        marginTop: indianDesign.spacing.lg,
        padding: indianDesign.spacing.md,
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 12,
    },
    disclaimerText: {
        flex: 1,
        fontSize: scaledFontSize(11),
        color: healthColors.text.tertiary,
        lineHeight: 16,
    },
    loadingContainer: {
        padding: indianDesign.spacing.xl,
        alignItems: 'center',
    },
    resultsContainer: {
        padding: getScreenPadding(),
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.sm,
        marginBottom: indianDesign.spacing.lg,
    },
    resultTitle: {
        fontSize: scaledFontSize(20),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    section: {
        marginBottom: indianDesign.spacing.xl,
    },
    sectionTitle: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
    },
    conditionCard: {
        backgroundColor: healthColors.background.card,
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        marginBottom: indianDesign.spacing.sm,
        ...createShadow(1),
    },
    conditionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.sm,
    },
    conditionName: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    probabilityBadge: {
        backgroundColor: healthColors.primary.main + '20',
        paddingHorizontal: indianDesign.spacing.sm,
        paddingVertical: 4,
        borderRadius: 12,
    },
    probabilityText: {
        fontSize: scaledFontSize(12),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.primary.main,
    },
    progressBar: {
        height: 6,
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: healthColors.primary.main,
        borderRadius: 3,
    },
    urgencyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        backgroundColor: healthColors.background.card,
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        marginBottom: indianDesign.spacing.xl,
        ...createShadow(2),
    },
    urgencyContent: {
        flex: 1,
    },
    urgencyLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    urgencyValue: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: indianDesign.spacing.sm,
        marginBottom: indianDesign.spacing.sm,
    },
    recommendationText: {
        flex: 1,
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
        lineHeight: 20,
    },
    warningSection: {
        backgroundColor: healthColors.error.light,
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FCA5A5',
        marginBottom: indianDesign.spacing.xl,
    },
    warningHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.sm,
        marginBottom: indianDesign.spacing.sm,
    },
    warningTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#DC2626',
    },
    warningItem: {
        fontSize: scaledFontSize(12),
        color: '#991B1B',
        lineHeight: 18,
        marginTop: 4,
    },
    recoveryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.md,
        backgroundColor: healthColors.background.card,
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        ...createShadow(1),
    },
    recoveryLabel: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.secondary,
    },
    recoveryValue: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.primary.main,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: indianDesign.spacing.md,
        marginTop: indianDesign.spacing.xl,
    },
    secondaryButton: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: healthColors.primary.main,
        paddingVertical: indianDesign.spacing.md,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.primary.main,
    },
    primaryButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        ...createShadow(2),
    },
    primaryButtonGradient: {
        paddingVertical: indianDesign.spacing.md,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: '#FFF',
    },
});

export default AISymptomChecker;
