/**
 * AI Health Assistant Screen (Screen 10)
 * Chat interface with AI health insights and suggestions
 */

import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ArrowLeft, Mic, BarChart2, PhoneCall } from "lucide-react-native";
import { useSelector } from "react-redux";
import { theme, healthColors } from '@/theme';
import {
  verticalScale,
  getScreenPadding,
  getKeyboardConfig,
} from '@/utils/responsive';
import { ChatComposer, ErrorRecovery, NetworkStatusIndicator } from '@/components/common';
import { showError, logError } from '@/utils/errorHandler';
import { useNetworkStatus } from '@/utils/offlineHandler';
import { aiService, healthMetricsService } from '@/services';
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryKeys } from '@/config/reactQueryConfig';
import { handleSmartBack } from '@/utils/navigation';
import Routes from '@/navigation/routes';

const AIHealthAssistantScreen = ({ navigation }) => {
  const [error, setError] = useState(null);
  const { isConnected } = useNetworkStatus();
  const { user } = useSelector((state) => state.auth);
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      text: `🤖 Hello ${user?.name || "there"}! I'm your AI Health Assistant. How can I help today? You can describe your symptoms or ask health questions.`,
    },
  ]);
  const scrollViewRef = useRef();

  const { data: metricsData = [] } = useQuery({
    queryKey: queryKeys.healthMetrics.patient(user?.id || "unknown"),
    queryFn: async () => {
      const response = await healthMetricsService.getMetrics(user.id);
      return response?.data || [];
    },
    enabled: !!user?.id && isConnected,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const healthInsights = useMemo(() => {
    if (!Array.isArray(metricsData) || metricsData.length === 0) {
      return null;
    }

    const bpMetrics = metricsData
      .filter((m) => m.type === "bp")
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latestBP = bpMetrics[0];

    if (!latestBP?.value) {
      return null;
    }

    const bpValue = `${latestBP.value.systolic}/${latestBP.value.diastolic}`;
    const sys = latestBP.value.systolic;
    const dia = latestBP.value.diastolic;

    let riskLevel = "NORMAL (0/100)";
    let recommendations = [
      "DIET: Balanced nutrition and hydration",
      "EXERCISE: 30 min walk daily",
      "WATER: 8-10 glasses per day",
      "SLEEP: 7-8 hours recommended",
    ];

    if (sys > 140 || dia > 90) {
      riskLevel = "HIGH (70/100)";
      recommendations = [
        "DIET: Low salt, more vegetables, avoid processed foods",
        "EXERCISE: Light walking, avoid strenuous activity",
        "MEDICATION: Follow prescribed BP medication",
        "CONSULT: Visit doctor within 1 week",
      ];
    } else if (sys > 130 || dia > 85) {
      riskLevel = "MODERATE (40/100)";
      recommendations = [
        "DIET: Reduce salt intake, increase potassium",
        "EXERCISE: 30 min moderate walk daily",
        "MONITOR: Check BP weekly",
        "SLEEP: 7-8 hours, reduce stress",
      ];
    }

    return {
      bp: {
        value: bpValue,
        recommendations,
        risk: riskLevel,
        preventiveCare: sys > 130 ? "Monthly BP monitoring" : "Regular annual checkups",
      },
    };
  }, [metricsData]);

  const analyzeSymptomsMutation = useMutation({
    mutationFn: (payload) => aiService.analyzeSymptoms(payload),
    onSuccess: (response) => {
      let aiText = "";
      if (response?.success && response?.data) {
        const {
          analysis,
          recommendations,
          urgencyLevel,
          possibleConditions,
        } = response.data;

        aiText = `🔍 **Analysis:** ${analysis || "Based on your symptoms..."}\n\n`;

        if (possibleConditions?.length > 0) {
          aiText += `📋 **Possible Conditions:**\n${possibleConditions.map((c) => `• ${c}`).join("\n")}\n\n`;
        }

        if (recommendations?.length > 0) {
          aiText += `💡 **Recommendations:**\n${recommendations.map((r) => `• ${r}`).join("\n")}\n\n`;
        }

        if (urgencyLevel) {
          aiText += `⚠️ **Urgency:** ${urgencyLevel}`;
        }
      } else {
        aiText = "I've noted your concern. For accurate diagnosis, please consult with a doctor.";
      }

      const aiResponse = {
        id: Date.now() + 1,
        type: "ai",
        text:
          aiText ||
          "Based on what you've shared, I recommend consulting with a healthcare professional for proper evaluation.",
      };
      setMessages((prev) => [...prev, aiResponse]);
    },
    onError: (err) => {
      logError(err, { context: "AIHealthAssistantScreen.handleSend" });
      const fallbackResponse = {
        id: Date.now() + 1,
        type: "ai",
        text: "I'm having trouble connecting right now. In the meantime, here are general tips:\n\n• Stay hydrated\n• Get adequate rest\n• If symptoms persist or worsen, please consult a doctor\n\nPlease try again later for AI-powered analysis.",
      };
      setMessages((prev) => [...prev, fallbackResponse]);
    },
  });

  const quickSuggestions = [
    { id: 1, text: "I have a headache and fever", icon: "medical" },
    { id: 2, text: "Diet tips for better health", icon: "restaurant" },
    { id: 3, text: "Feeling stressed and anxious", icon: "fitness" },
  ];

  const formatAssistantText = (rawText = "") => {
    // Strip markdown markers and normalize line breaks for cleaner mobile chat rendering.
    return String(rawText)
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\r\n/g, "\n")
      .trim();
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    if (!isConnected) {
      showError("No internet connection. Please try again when online.");
      return;
    }

    const newMessage = {
      id: Date.now(),
      type: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    const symptoms = trimmed
      .split(/,|\band\b/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await analyzeSymptomsMutation.mutateAsync({
      symptoms,
      duration: "unknown",
      severity: "moderate",
    });
  };

  const handleRetry = () => {
    setError(null);
  };

  const handleSuggestionPress = (suggestion) => {
    setMessage(suggestion.text);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={healthColors.background.primary}
        />
        <NetworkStatusIndicator />
        <ErrorRecovery
          error={error}
          onRetry={handleRetry}
          onBack={() => handleSmartBack(navigation, "PatientTabs")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={healthColors.background.primary}
      />
      <NetworkStatusIndicator />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => handleSmartBack(navigation, "PatientTabs")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to patient dashboard"
        >
          <ArrowLeft
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Health Assistant</Text>
        <TouchableOpacity
          style={styles.voiceButton}
          onPress={() => Alert.alert("Voice Input", "Voice input will be available in a future update.")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Voice input"
          accessibilityHint="Opens voice input"
        >
          <Mic size={24} color={healthColors.primary.main} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={getKeyboardConfig().behavior}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
        style={styles.keyboardContainer}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {/* Quick Suggestions */}
          {messages.length <= 1 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>QUICK SUGGESTIONS:</Text>
              {quickSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionCard}
                  onPress={() => handleSuggestionPress(suggestion)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Use suggestion: ${suggestion.text}`}
                >
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageWrapper,
                msg.type === "user"
                  ? styles.userMessageWrapper
                  : styles.aiMessageWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.type === "user" ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.type === "user"
                      ? styles.userMessageText
                      : styles.aiMessageText,
                  ]}
                >
                  {msg.type === "ai" ? formatAssistantText(msg.text) : msg.text}
                </Text>
              </View>
            </View>
          ))}

          {analyzeSymptomsMutation.isPending && (
            <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
              <View style={[styles.messageBubble, styles.aiMessage, styles.typingBubble]}>
                <ActivityIndicator size="small" color={healthColors.primary.main} />
                <Text style={styles.typingText}>Analyzing your symptoms...</Text>
              </View>
            </View>
          )}

          {/* Health Insights */}
          {messages.length <= 1 && healthInsights && (
            <View style={styles.insightsSection}>
              <View style={styles.insightsHeader}>
                <BarChart2
                  size={20}
                  color={healthColors.primary.main}
                />
                <Text style={styles.insightsTitle}>YOUR HEALTH INSIGHTS:</Text>
              </View>

              <View style={styles.insightsCard}>
                <Text style={styles.insightsSubtitle}>
                  Based on your BP reading ({healthInsights.bp.value}):
                </Text>

                <View style={styles.recommendationsContainer}>
                  {healthInsights.bp.recommendations.map((rec, index) => (
                    <Text key={index} style={styles.recommendationText}>
                      {rec}
                    </Text>
                  ))}
                </View>

                <View style={styles.riskContainer}>
                  <Text style={styles.riskLabel}>
                    Risk Level: {healthInsights.bp.risk}
                  </Text>
                  <Text style={styles.preventiveText}>
                    Preventive Care: {healthInsights.bp.preventiveCare}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.doctorButton}
                onPress={() => navigation.navigate(Routes.PATIENT.APPOINTMENT_BOOKING)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Talk to real doctor"
                accessibilityHint="Opens appointment booking"
              >
                <PhoneCall size={20} color={theme.colors.white} />
                <Text style={styles.doctorButtonText}>Talk to Real Doctor</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Input Section */}
        <ChatComposer
          value={message}
          onChangeText={setMessage}
          onSend={handleSend}
          onVoicePress={() => Alert.alert("Voice Input", "Voice input will be available in a future update.")}
          sending={analyzeSymptomsMutation.isPending}
          sendDisabled={!message.trim() || analyzeSymptomsMutation.isPending}
          placeholder="Ask anything about your health..."
          maxLength={500}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: healthColors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: healthColors.border.light,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.h5,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  voiceButton: {
    padding: 8,
    backgroundColor: theme.withOpacity(healthColors.primary.main, 0.08),
    borderRadius: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: getScreenPadding(),
    paddingBottom: verticalScale(16),
  },
  suggestionsSection: {
    marginBottom: verticalScale(16),
  },
  suggestionsTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    ...theme.shadows.sm,
  },
  suggestionText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
  },
  messageWrapper: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  userMessageWrapper: {
    alignSelf: "flex-end",
  },
  aiMessageWrapper: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: healthColors.primary.main,
  },
  aiMessage: {
    backgroundColor: healthColors.background.card,
    ...theme.shadows.sm,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    fontSize: theme.typography.sizes.bodySmall,
    color: healthColors.text.secondary,
  },
  messageText: {
    fontSize: theme.typography.sizes.bodyMedium,
    lineHeight: 20,
  },
  userMessageText: {
    color: theme.colors.white,
  },
  aiMessageText: {
    color: healthColors.text.primary,
  },
  insightsSection: {
    marginTop: verticalScale(16),
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
  },
  insightsCard: {
    backgroundColor: healthColors.background.card,
    borderRadius: 12,
    padding: 16,
    ...theme.shadows.md,
  },
  insightsSubtitle: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
    marginBottom: 12,
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.primary,
    marginBottom: 6,
    lineHeight: 20,
  },
  riskContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  riskLabel: {
    fontSize: theme.typography.sizes.bodyMedium,
    fontWeight: theme.typography.weights.semibold,
    color: healthColors.warning.main,
    marginBottom: 6,
  },
  preventiveText: {
    fontSize: theme.typography.sizes.bodyMedium,
    color: healthColors.text.secondary,
  },
  doctorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: healthColors.primary.main,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    ...theme.shadows.md,
  },
  doctorButtonText: {
    fontSize: theme.typography.sizes.bodyLarge,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.white,
  },
  keyboardContainer: {
    flex: 1,
  },
});

export default AIHealthAssistantScreen;