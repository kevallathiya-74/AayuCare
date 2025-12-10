/**
 * AayuCare - Error Recovery Component
 * 
 * Provides user-friendly error recovery UI with actionable suggestions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { moderateScale, verticalScale, scaledFontSize } from '../../utils/responsive';

const ErrorRecovery = ({
    error,
    onRetry,
    onGoBack,
    onContactSupport,
    showRetry = true,
    showGoBack = true,
    showSupport = true,
    customMessage,
    customSuggestions,
}) => {
    // Determine error type and suggestions
    const getErrorInfo = () => {
        const errorMsg = error?.message || error || '';
        const lowerError = errorMsg.toLowerCase();

        // Network errors
        if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('offline')) {
            return {
                icon: 'cloud-offline-outline',
                iconColor: healthColors.warning.main,
                title: 'Connection Issue',
                message: customMessage || 'Unable to connect to the server',
                suggestions: customSuggestions || [
                    'Check your internet connection',
                    'Make sure WiFi or mobile data is enabled',
                    'Try again in a few moments',
                ],
            };
        }

        // Authentication errors
        if (lowerError.includes('unauthorized') || lowerError.includes('authentication') || lowerError.includes('session')) {
            return {
                icon: 'lock-closed-outline',
                iconColor: healthColors.error.main,
                title: 'Authentication Error',
                message: customMessage || 'Your session has expired',
                suggestions: customSuggestions || [
                    'Please login again',
                    'Check your credentials',
                    'Contact support if issue persists',
                ],
            };
        }

        // Server errors
        if (lowerError.includes('500') || lowerError.includes('server') || lowerError.includes('maintenance')) {
            return {
                icon: 'server-outline',
                iconColor: healthColors.error.main,
                title: 'Server Error',
                message: customMessage || 'Something went wrong on our end',
                suggestions: customSuggestions || [
                    'This is not your fault',
                    'Our team has been notified',
                    'Please try again later',
                ],
            };
        }

        // Data not found
        if (lowerError.includes('not found') || lowerError.includes('404')) {
            return {
                icon: 'search-outline',
                iconColor: healthColors.info.main,
                title: 'Not Found',
                message: customMessage || 'The requested information was not found',
                suggestions: customSuggestions || [
                    'Check if the information exists',
                    'Try searching again',
                    'Contact support for assistance',
                ],
            };
        }

        // Generic error
        return {
            icon: 'alert-circle-outline',
            iconColor: healthColors.error.main,
            title: 'Something Went Wrong',
            message: customMessage || 'An unexpected error occurred',
            suggestions: customSuggestions || [
                'Try again',
                'Check your internet connection',
                'Contact support if issue continues',
            ],
        };
    };

    const errorInfo = getErrorInfo();

    return (
        <View style={styles.container}>
            {/* Error Icon */}
            <View style={[styles.iconContainer, { backgroundColor: errorInfo.iconColor + '15' }]}>
                <Ionicons name={errorInfo.icon} size={60} color={errorInfo.iconColor} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{errorInfo.title}</Text>

            {/* Message */}
            <Text style={styles.message}>{errorInfo.message}</Text>

            {/* Suggestions */}
            <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>What you can do:</Text>
                {errorInfo.suggestions.map((suggestion, index) => (
                    <View key={index} style={styles.suggestionItem}>
                        <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={healthColors.success.main}
                            style={styles.suggestionIcon}
                        />
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                    </View>
                ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {showRetry && onRetry && (
                    <TouchableOpacity style={styles.primaryButton} onPress={onRetry} activeOpacity={0.8}>
                        <Ionicons name="refresh" size={20} color={healthColors.white} />
                        <Text style={styles.primaryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                )}

                {showGoBack && onGoBack && (
                    <TouchableOpacity style={styles.secondaryButton} onPress={onGoBack} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={20} color={healthColors.primary.main} />
                        <Text style={styles.secondaryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                )}

                {showSupport && onContactSupport && (
                    <TouchableOpacity style={styles.supportButton} onPress={onContactSupport} activeOpacity={0.8}>
                        <Ionicons name="headset" size={20} color={healthColors.text.secondary} />
                        <Text style={styles.supportButtonText}>Contact Support</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(indianDesign.spacing.xl),
        backgroundColor: healthColors.background.primary,
    },
    iconContainer: {
        width: moderateScale(120),
        height: moderateScale(120),
        borderRadius: moderateScale(60),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: verticalScale(indianDesign.spacing.xl),
    },
    title: {
        fontSize: scaledFontSize(indianDesign.fontSize.xxlarge),
        fontWeight: '700',
        color: healthColors.text.primary,
        marginBottom: verticalScale(indianDesign.spacing.sm),
        textAlign: 'center',
    },
    message: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        color: healthColors.text.secondary,
        textAlign: 'center',
        marginBottom: verticalScale(indianDesign.spacing.xl),
        paddingHorizontal: moderateScale(indianDesign.spacing.lg),
        lineHeight: scaledFontSize(indianDesign.fontSize.medium) * 1.5,
    },
    suggestionsContainer: {
        width: '100%',
        backgroundColor: healthColors.background.secondary,
        borderRadius: moderateScale(indianDesign.borderRadius.large),
        padding: moderateScale(indianDesign.spacing.lg),
        marginBottom: verticalScale(indianDesign.spacing.xl),
        ...createShadow({
            color: healthColors.shadows.light,
            offset: { width: 0, height: 2 },
            opacity: 0.1,
            radius: 8,
            elevation: 2,
        }),
    },
    suggestionsTitle: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        fontWeight: '600',
        color: healthColors.text.primary,
        marginBottom: verticalScale(indianDesign.spacing.md),
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(indianDesign.spacing.sm),
    },
    suggestionIcon: {
        marginRight: moderateScale(indianDesign.spacing.sm),
    },
    suggestionText: {
        flex: 1,
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        color: healthColors.text.secondary,
        lineHeight: scaledFontSize(indianDesign.fontSize.small) * 1.5,
    },
    actionsContainer: {
        width: '100%',
        gap: verticalScale(indianDesign.spacing.md),
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.primary.main,
        paddingVertical: verticalScale(indianDesign.spacing.md),
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        gap: moderateScale(indianDesign.spacing.sm),
        ...createShadow({
            color: healthColors.primary.main,
            offset: { width: 0, height: 4 },
            opacity: 0.3,
            radius: 8,
            elevation: 4,
        }),
    },
    primaryButtonText: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        fontWeight: '600',
        color: healthColors.white,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.white,
        paddingVertical: verticalScale(indianDesign.spacing.md),
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        borderWidth: 1,
        borderColor: healthColors.primary.main,
        gap: moderateScale(indianDesign.spacing.sm),
    },
    secondaryButtonText: {
        fontSize: scaledFontSize(indianDesign.fontSize.medium),
        fontWeight: '600',
        color: healthColors.primary.main,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: healthColors.background.secondary,
        paddingVertical: verticalScale(indianDesign.spacing.md),
        borderRadius: moderateScale(indianDesign.borderRadius.medium),
        gap: moderateScale(indianDesign.spacing.sm),
    },
    supportButtonText: {
        fontSize: scaledFontSize(indianDesign.fontSize.small),
        fontWeight: '500',
        color: healthColors.text.secondary,
    },
});

export default ErrorRecovery;
