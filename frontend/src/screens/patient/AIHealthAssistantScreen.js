/**
 * AI Health Assistant Screen (Screen 10)
 * Chat interface with AI health insights and suggestions
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { theme, healthColors } from "../../theme";
import {
  verticalScale,
  getScreenPadding,
} from "../../utils/responsive";
import { ErrorRecovery, NetworkStatusIndicator } from "../../components/common";
import { showError, logError } from "../../utils/errorHandler";
import { useNetworkStatus } from "../../utils/offlineHandler";
import { aiService } from "../../services";

const AIHealthAssistantScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
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

  const quickSuggestions = [
    { id: 1, text: "I have a headache and fever", icon: "medical" },
    { id: 2, text: "Diet tips for better health", icon: "restaurant" },
    { id: 3, text: "Feeling stressed and anxious", icon: "fitness" },
  ];

  const healthInsights = {
    bp: {
      value: "130/85",
      recommendations: [
        "DIET: Low salt, more vegetables",
        "EXERCISE: 30 min walk daily",
        "WATER: 8-10 glasses per day",
        "SLEEP: 7-8 hours recommended",
      ],
      risk: "MODERATE (25/100)",
      preventiveCare: "Regular checkups",
    },
  };

  const handleSend = async () => {
    if (message.trim()) {
      const userMessage = message.trim();
      const newMessage = {
        id: messages.length + 1,
        type: "user",
        text: userMessage,
      };
      setMessages([...messages, newMessage]);
      setMessage("");

      try {
        setLoading(true);

        // Extract symptoms from user message (simple parsing)
        const symptoms = userMessage
          .split(/,|\band\b/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        // Call real AI service
        const response = await aiService.analyzeSymptoms({
          symptoms: symptoms,
          duration: "unknown",
          severity: "moderate",
        });

        // Format AI response
        let aiText = "";
        if (response.success && response.data) {
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
          aiText =
            response.data?.message ||
            "I've noted your concern. For accurate diagnosis, please consult with a doctor.";
        }

        const aiResponse = {
          id: messages.length + 2,
          type: "ai",
          text:
            aiText ||
            "Based on what you've shared, I recommend consulting with a healthcare professional for proper evaluation.",
        };
        setMessages((prev) => [...prev, aiResponse]);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        logError(err, { context: "AIHealthAssistantScreen.handleSend" });

        // Provide helpful fallback response instead of error
        const fallbackResponse = {
          id: messages.length + 2,
          type: "ai",
          text: "I'm having trouble connecting right now. In the meantime, here are general tips:\n\n• Stay hydrated\n• Get adequate rest\n• If symptoms persist or worsen, please consult a doctor\n\nPlease try again later for AI-powered analysis.",
        };
        setMessages((prev) => [...prev, fallbackResponse]);
      }
    }
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
          onBack={() => navigation.goBack()}
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
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={healthColors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Health Assistant</Text>
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic" size={24} color={healthColors.primary.main} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
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
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}

          {/* Health Insights */}
          {messages.length <= 1 && (
            <View style={styles.insightsSection}>
              <View style={styles.insightsHeader}>
                <Ionicons
                  name="bar-chart"
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

              <TouchableOpacity style={styles.doctorButton}>
                <Ionicons name="call" size={20} color={theme.colors.white} />
                <Text style={styles.doctorButtonText}>Talk to Real Doctor</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything about your health..."
              placeholderTextColor={healthColors.text.disabled}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.micButton}>
              <Ionicons
                name="mic-outline"
                size={24}
                color={healthColors.text.secondary}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
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
    ...theme.shadows.md,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: healthColors.text.primary,
    flex: 1,
    marginLeft: 12,
  },
  voiceButton: {
    padding: 8,
    backgroundColor: healthColors.primary.main + "15",
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
    fontSize: 14,
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
    fontSize: 14,
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
  messageText: {
    fontSize: 14,
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
    fontSize: 14,
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
    fontSize: 14,
    color: healthColors.text.secondary,
    marginBottom: 12,
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: theme.typography.weights.semiBold,
    color: healthColors.warning.main,
    marginBottom: 6,
  },
  preventiveText: {
    fontSize: 13,
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
    fontSize: 16,
    fontWeight: theme.typography.weights.semiBold,
    color: theme.colors.white,
  },
  inputSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: getScreenPadding(),
    paddingVertical: 12,
    backgroundColor: healthColors.background.card,
    borderTopWidth: 1,
    borderTopColor: healthColors.border.light,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: healthColors.background.secondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: healthColors.text.primary,
    maxHeight: 100,
    paddingVertical: 4,
  },
  micButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: healthColors.primary.main,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  sendButtonDisabled: {
    backgroundColor: healthColors.text.disabled,
  },
});

export default AIHealthAssistantScreen;



