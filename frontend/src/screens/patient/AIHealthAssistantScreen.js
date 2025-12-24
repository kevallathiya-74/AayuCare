/**
 * AI Health Assistant Screen (Screen 10)
 * Chat interface with AI health insights and suggestions
 */

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { createShadow } from '../../theme/indianDesign';
import { moderateScale, verticalScale, scaledFontSize, getScreenPadding } from '../../utils/responsive';
import { ErrorRecovery, NetworkStatusIndicator } from '../../components/common';
import { showError, logError } from '../../utils/errorHandler';
import { useNetworkStatus } from '../../utils/offlineHandler';

const AIHealthAssistantScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isConnected } = useNetworkStatus();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'ai',
            text: "🤖 Hello Raj! I'm your AI Health Assistant. How can I help today?",
        },
    ]);
    const scrollViewRef = useRef();

    const quickSuggestions = [
        { id: 1, text: 'Medicine side effects?', icon: 'medical' },
        { id: 2, text: 'Diet plan for diabetes?', icon: 'restaurant' },
        { id: 3, text: 'Stress relief exercises?', icon: 'fitness' },
    ];

    const healthInsights = {
        bp: {
            value: '130/85',
            recommendations: [
                'DIET: Low salt, more vegetables',
                'EXERCISE: 30 min walk daily',
                'WATER: 8-10 glasses per day',
                'SLEEP: 7-8 hours recommended',
            ],
            risk: 'MODERATE (25/100)',
            preventiveCare: 'Regular checkups',
        },
    };

    const handleSend = async () => {
        if (message.trim()) {
            const newMessage = {
                id: messages.length + 1,
                type: 'user',
                text: message,
            };
            setMessages([...messages, newMessage]);
            setMessage('');

            try {
                setLoading(true);
                // TODO: Replace with actual AI API call
                // const response = await aiService.sendMessage(message);
                // Simulate AI response
                setTimeout(() => {
                    const aiResponse = {
                        id: messages.length + 2,
                        type: 'ai',
                        text: "I understand your concern. Based on your health profile, here's what I recommend...",
                    };
                    setMessages((prev) => [...prev, aiResponse]);
                    setLoading(false);
                }, 1000);
            } catch (err) {
                setLoading(false);
                const errorMessage = 'Failed to get AI response';
                logError(err, { context: 'AIHealthAssistantScreen.handleSend' });
                showError(errorMessage);
                const errorResponse = {
                    id: messages.length + 2,
                    type: 'ai',
                    text: "Sorry, I'm having trouble responding right now. Please try again.",
                };
                setMessages((prev) => [...prev, errorResponse]);
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
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
                <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />
            <NetworkStatusIndicator />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={healthColors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Health Assistant</Text>
                <TouchableOpacity style={styles.voiceButton}>
                    <Ionicons name="mic" size={24} color={healthColors.primary.main} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
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
                                msg.type === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
                            ]}
                        >
                            <View
                                style={[
                                    styles.messageBubble,
                                    msg.type === 'user' ? styles.userMessage : styles.aiMessage,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        msg.type === 'user' ? styles.userMessageText : styles.aiMessageText,
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
                                <Ionicons name="bar-chart" size={20} color={healthColors.primary.main} />
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
                                    <Text style={styles.riskLabel}>Risk Level: {healthInsights.bp.risk}</Text>
                                    <Text style={styles.preventiveText}>
                                        Preventive Care: {healthInsights.bp.preventiveCare}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.doctorButton}>
                                <Ionicons name="call" size={20} color="#FFFFFF" />
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
                            <Ionicons name="mic-outline" size={24} color={healthColors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!message.trim()}
                    >
                        <Ionicons name="send" size={20} color="#FFFFFF" />
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: getScreenPadding(),
        paddingVertical: moderateScale(12),
        backgroundColor: healthColors.background.card,
        ...createShadow(2),
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
    voiceButton: {
        padding: moderateScale(8),
        backgroundColor: healthColors.primary.main + '15',
        borderRadius: moderateScale(20),
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
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: moderateScale(12),
    },
    suggestionCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: moderateScale(8),
        ...createShadow(1),
    },
    suggestionText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
    },
    messageWrapper: {
        marginBottom: moderateScale(12),
        maxWidth: '80%',
    },
    userMessageWrapper: {
        alignSelf: 'flex-end',
    },
    aiMessageWrapper: {
        alignSelf: 'flex-start',
    },
    messageBubble: {
        borderRadius: moderateScale(16),
        padding: moderateScale(12),
    },
    userMessage: {
        backgroundColor: healthColors.primary.main,
    },
    aiMessage: {
        backgroundColor: healthColors.background.card,
        ...createShadow(1),
    },
    messageText: {
        fontSize: scaledFontSize(14),
        lineHeight: scaledFontSize(20),
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    aiMessageText: {
        color: healthColors.text.primary,
    },
    insightsSection: {
        marginTop: verticalScale(16),
    },
    insightsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(8),
        marginBottom: moderateScale(12),
    },
    insightsTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: '700',
        color: healthColors.text.primary,
    },
    insightsCard: {
        backgroundColor: healthColors.background.card,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        ...createShadow(2),
    },
    insightsSubtitle: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginBottom: moderateScale(12),
    },
    recommendationsContainer: {
        marginBottom: moderateScale(16),
    },
    recommendationText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        marginBottom: moderateScale(6),
        lineHeight: scaledFontSize(20),
    },
    riskContainer: {
        paddingTop: moderateScale(12),
        borderTopWidth: 1,
        borderTopColor: healthColors.border.light,
    },
    riskLabel: {
        fontSize: scaledFontSize(14),
        fontWeight: '600',
        color: healthColors.warning.main,
        marginBottom: moderateScale(6),
    },
    preventiveText: {
        fontSize: scaledFontSize(13),
        color: healthColors.text.secondary,
    },
    doctorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: moderateScale(8),
        backgroundColor: healthColors.primary.main,
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginTop: moderateScale(12),
        ...createShadow(2),
    },
    doctorButtonText: {
        fontSize: scaledFontSize(16),
        fontWeight: '600',
        color: '#FFFFFF',
    },
    inputSection: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: moderateScale(8),
        paddingHorizontal: getScreenPadding(),
        paddingVertical: moderateScale(12),
        backgroundColor: healthColors.background.card,
        borderTopWidth: 1,
        borderTopColor: healthColors.border.light,
    },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: healthColors.background.secondary,
        borderRadius: moderateScale(24),
        paddingHorizontal: moderateScale(16),
        paddingVertical: moderateScale(8),
    },
    input: {
        flex: 1,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        maxHeight: moderateScale(100),
        paddingVertical: moderateScale(4),
    },
    micButton: {
        padding: moderateScale(4),
        marginLeft: moderateScale(4),
    },
    sendButton: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: healthColors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        ...createShadow(2),
    },
    sendButtonDisabled: {
        backgroundColor: healthColors.text.disabled,
    },
});

export default AIHealthAssistantScreen;
