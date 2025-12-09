/**
 * Loading Indicator Component
 * Beautiful animated loading states for the app
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign } from '../../theme/indianDesign';
import { scaledFontSize, moderateScale } from '../../utils/responsive';

const LoadingIndicator = ({ 
    message = 'Loading...', 
    type = 'spinner', // 'spinner', 'dots', 'pulse', 'medical'
    size = 'medium', // 'small', 'medium', 'large'
    color = healthColors.primary.main 
}) => {
    const spinAnim = useRef(new Animated.Value(0)).current;
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const medicalAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (type === 'spinner') {
            // Continuous spin animation
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else if (type === 'dots') {
            // Staggered dot animation
            const dotAnimation = (animValue, delay) => {
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(delay),
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0,
                            duration: 400,
                            useNativeDriver: true,
                        }),
                    ])
                );
            };

            Animated.parallel([
                dotAnimation(dotAnim1, 0),
                dotAnimation(dotAnim2, 150),
                dotAnimation(dotAnim3, 300),
            ]).start();
        } else if (type === 'pulse') {
            // Pulse animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else if (type === 'medical') {
            // Medical cross rotation
            Animated.loop(
                Animated.timing(medicalAnim, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        }
    }, [type]);

    const sizeMap = {
        small: 24,
        medium: 40,
        large: 60,
    };

    const iconSize = sizeMap[size];

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const medicalSpin = medicalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const renderLoader = () => {
        switch (type) {
            case 'spinner':
                return (
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Ionicons name="reload" size={iconSize} color={color} />
                    </Animated.View>
                );

            case 'dots':
                return (
                    <View style={styles.dotsContainer}>
                        <Animated.View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: color,
                                    opacity: dotAnim1,
                                    transform: [
                                        {
                                            scale: dotAnim1.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1.2],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: color,
                                    opacity: dotAnim2,
                                    transform: [
                                        {
                                            scale: dotAnim2.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1.2],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: color,
                                    opacity: dotAnim3,
                                    transform: [
                                        {
                                            scale: dotAnim3.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1.2],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        />
                    </View>
                );

            case 'pulse':
                return (
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Ionicons name="heart" size={iconSize} color={color} />
                    </Animated.View>
                );

            case 'medical':
                return (
                    <Animated.View style={{ transform: [{ rotate: medicalSpin }] }}>
                        <Ionicons name="medical" size={iconSize} color={color} />
                    </Animated.View>
                );

            default:
                return (
                    <Ionicons name="hourglass-outline" size={iconSize} color={color} />
                );
        }
    };

    return (
        <View style={styles.container}>
            {renderLoader()}
            {message && (
                <Text style={[styles.message, { color }]}>{message}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: indianDesign.spacing.lg,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.sm,
    },
    dot: {
        width: moderateScale(10),
        height: moderateScale(10),
        borderRadius: moderateScale(5),
    },
    message: {
        marginTop: indianDesign.spacing.md,
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.medium,
    },
});

export default LoadingIndicator;
