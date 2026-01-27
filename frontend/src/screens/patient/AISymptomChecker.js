/**
 * AI Symptom Checker Screen
 * AI-powered symptom analysis with recommendations
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme, healthColors } from "../../theme";
import {
  AIIcon,
  IconWithBackground,
} from "../../components/common/CustomIcons";
import AITagline from "../../components/common/AITagline";
import NetworkStatusIndicator from "../../components/common/NetworkStatusIndicator";
import ErrorRecovery from "../../components/common/ErrorRecovery";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import aiService from "../../services/ai.service";
import {
  getScreenPadding,
  verticalScale,
} from "../../utils/responsive";

const AISymptomChecker = ({ navigation }) => {
  const [symptoms, setSymptoms] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("moderate");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const commonSymptoms = [
    { id: 1, name: "Fever", icon: "thermometer" },
    { id: 2, name: "Headache", icon: "skull-outline" },
    { id: 3, name: "Cough", icon: "medical" },
    { id: 4, name: "Fatigue", icon: "battery-dead" },
    { id: 5, name: "Body ache", icon: "fitness-outline" },
    { id: 6, name: "Sore throat", icon: "mic-off" },
    { id: 7, name: "Runny nose", icon: "water" },
    { id: 8, name: "Nausea", icon: "sad" },
  ];

  const severityLevels = [
    { value: "mild", label: "Mild", color: theme.colors.success.main },
    { value: "moderate", label: "Moderate", color: theme.colors.warning.main },
    { value: "severe", label: "Severe", color: theme.colors.error.main },
  ];

  const toggleSymptom = (symptom) => {
    if (selectedSymptoms.find((s) => s.id === symptom.id)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s.id !== symptom.id));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !symptoms.trim()) {
      showError("Please select or enter at least one symptom");
      return;
    }

    if (!isConnected) {
      showError("No internet connection. Please check your network.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const allSymptoms = [
        ...selectedSymptoms.map((s) => s.name),
        ...symptoms
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      ];

      const result = await aiService.analyzeSymptoms({
        symptoms: allSymptoms,
        duration,
        severity,
      });

      setResults(result);
    } catch (err) {
      logError(err, {
        context: "AISymptomChecker.handleAnalyze",
        symptomsCount: selectedSymptoms.length,
      });
      setError(err.message || "Failed to analyze symptoms");
      showError("Failed to analyze symptoms. Please try again.");
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
            name={
              analysis.urgencyLevel === "high"
                ? "alert-circle"
                : "information-circle"
            }
            color={analysis.urgencyLevel === "high" ? theme.colors.error.main : theme.colors.warning.main}
            backgroundColor={
              analysis.urgencyLevel === "high" ? theme.colors.error.light : theme.colors.warning.light
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
                    analysis.urgencyLevel === "high" ? theme.colors.error.main : theme.colors.warning.main,
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
            <Ionicons name="warning" size={20} color={theme.colors.error.main} />
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
          <Ionicons
            name="time-outline"
            size={24}
            color={healthColors.primary.main}
          />
          <View>
            <Text style={styles.recoveryLabel}>Estimated Recovery</Text>
            <Text style={styles.recoveryValue}>
              {analysis.estimatedRecovery}
            </Text>
          </View>
        </View>

        {/* AI Tagline */}
        <AITagline variant="gradient" style={{ marginTop: theme.spacing.lg }} />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setResults(null);
              setSelectedSymptoms([]);
              setSymptoms("");
            }}
          >
            <Text style={styles.secondaryButtonText}>New Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("AppointmentBooking")}
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
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <NetworkStatusIndicator />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) },
        ]}
      >
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.info.main, theme.colors.healthcare.purple]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
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
                        severity === level.value && styles.severityTextSelected,
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
                colors={[theme.colors.info.main, theme.colors.healthcare.purple]}
                style={styles.analyzeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color={theme.colors.white} />
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
            <ActivityIndicator size="large" color={healthColors.primary.main} />
            <Text style={styles.loadingText}>Analyzing symptoms...</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.withOpacity(theme.colors.white, 0.9),
    marginTop: 4,
  },
  formContainer: {
    padding: getScreenPadding(),
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  symptomsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  symptomChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
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
    fontSize: 13,
    color: healthColors.primary.main,
    fontWeight: theme.typography.weights.medium,
  },
  symptomChipTextSelected: {
    color: healthColors.neutral.white,
  },
  textInput: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.card.border,
    padding: theme.spacing.md,
    fontSize: 14,
    color: healthColors.text.primary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  input: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: healthColors.card.border,
    padding: theme.spacing.md,
    fontSize: 14,
    color: healthColors.text.primary,
  },
  severityContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  severityButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: healthColors.card.border,
    backgroundColor: healthColors.background.card,
    alignItems: "center",
  },
  severityText: {
    fontSize: 13,
    fontWeight: theme.typography.weights.medium,
    color: healthColors.text.secondary,
  },
  severityTextSelected: {
    color: healthColors.neutral.white,
  },
  analyzeButton: {
    borderRadius: 12,
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  analyzeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.white,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: healthColors.background.tertiary,
    borderRadius: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: healthColors.text.tertiary,
    lineHeight: 16,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: healthColors.text.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  resultsContainer: {
    padding: getScreenPadding(),
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
    marginBottom: theme.spacing.md,
  },
  conditionCard: {
    backgroundColor: healthColors.background.card,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  conditionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  conditionName: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.text.primary,
  },
  probabilityBadge: {
    backgroundColor: healthColors.primary.main + "20",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  probabilityText: {
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
  },
  progressBar: {
    height: 6,
    backgroundColor: healthColors.background.tertiary,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: healthColors.primary.main,
    borderRadius: 3,
  },
  urgencyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: 12,
    color: healthColors.text.secondary,
  },
  urgencyValue: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: healthColors.text.secondary,
    lineHeight: 20,
  },
  warningSection: {
    backgroundColor: healthColors.error.light,
    padding: theme.spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error.light,
    marginBottom: theme.spacing.xl,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.error.dark,
  },
  warningItem: {
    fontSize: 12,
    color: theme.colors.error.dark,
    lineHeight: 18,
    marginTop: 4,
  },
  recoveryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: healthColors.background.card,
    padding: theme.spacing.md,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  recoveryLabel: {
    fontSize: 12,
    color: healthColors.text.secondary,
  },
  recoveryValue: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.primary.main,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: healthColors.primary.main,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.primary.main,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  primaryButtonGradient: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
});

export default AISymptomChecker;



