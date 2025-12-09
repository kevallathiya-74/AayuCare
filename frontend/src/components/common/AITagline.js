/**
 * AI Tagline Component
 * "Your health, enhanced by intelligence."
 * Shows at bottom of all AI-powered features
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { healthColors } from '../../theme/healthColors';
import { indianDesign } from '../../theme/indianDesign';
import { scaledFontSize, moderateScale } from '../../utils/responsive';

const AITagline = ({ 
    animated = true, 
    variant = 'default', // 'default', 'gradient', 'minimal'
    style 
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (animated) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    delay: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    delay: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(1);
            scaleAnim.setValue(1);
        }
    }, [animated]);

    if (variant === 'gradient') {
        return (
            <Animated.View 
                style={[
                    styles.container, 
                    style,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#A855F7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientContainer}
                >
                    <Ionicons name="sparkles" size={16} color={healthColors.neutral.white} />
                    <Text style={styles.gradientText}>
                        Your health, enhanced by intelligence.
                    </Text>
                </LinearGradient>
            </Animated.View>
        );
    }

    if (variant === 'minimal') {
        return (
            <Animated.View 
                style={[
                    styles.minimalContainer, 
                    style,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                <Text style={styles.minimalText}>
                    Your health, enhanced by intelligence.
                </Text>
            </Animated.View>
        );
    }

    // Default variant
    return (
        <Animated.View 
            style={[
                styles.container, 
                style,
                {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <View style={styles.iconCircle}>
                <Ionicons name="sparkles" size={16} color="#8B5CF6" />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.text}>
                    Your health, enhanced by intelligence.
                </Text>
                <View style={styles.aiIndicator}>
                    <View style={styles.aiDot} />
                    <Text style={styles.aiLabel}>AI POWERED</Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F3FF',
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
        gap: indianDesign.spacing.sm,
    },
    iconCircle: {
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: healthColors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        fontSize: scaledFontSize(13),
        color: '#6B21A8',
        fontWeight: indianDesign.fontWeight.medium,
        lineHeight: 18,
        marginBottom: 4,
    },
    aiIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    aiDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    aiLabel: {
        fontSize: scaledFontSize(10),
        color: '#8B5CF6',
        fontWeight: indianDesign.fontWeight.bold,
        letterSpacing: 0.5,
    },
    gradientContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: indianDesign.spacing.md,
        borderRadius: 12,
        gap: indianDesign.spacing.sm,
    },
    gradientText: {
        fontSize: scaledFontSize(13),
        color: healthColors.neutral.white,
        fontWeight: indianDesign.fontWeight.semibold,
    },
    minimalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.sm,
        gap: indianDesign.spacing.xs,
    },
    minimalText: {
        fontSize: scaledFontSize(11),
        color: '#6B21A8',
        fontWeight: indianDesign.fontWeight.medium,
        fontStyle: 'italic',
    },
});

export default AITagline;
