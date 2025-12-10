/**
 * Animated Splash Screen
 * Hospital icon, app name, tagline, and loading animation
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign } from '../../theme/indianDesign';
import { scaledFontSize, moderateScale } from '../../utils/responsive';

const SplashScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const loadingAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Animate loading dots
        Animated.loop(
            Animated.timing(loadingAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Navigate to box selection after 3 seconds
        const timer = setTimeout(() => {
            navigation.replace('BoxSelection');
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const dotTranslateY = loadingAnim.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, -10, 0, -10, 0],
    });

    return (
        <LinearGradient
            colors={[healthColors.primary.main, healthColors.primary.dark, '#1B5E20']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Hospital Icon */}
                <View style={styles.iconContainer}>
                    <Ionicons name="medical" size={80} color="#FFF" />
                </View>

                {/* App Name */}
                <Text style={styles.appName}>🏥 AayuCare</Text>

                {/* Tagline */}
                <Text style={styles.tagline}>Smart Healthcare</Text>
                <Text style={styles.tagline}>Management</Text>

                {/* Loading Animation */}
                <View style={styles.loadingContainer}>
                    {[0, 1, 2, 3].map((index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    transform: [
                                        {
                                            translateY: loadingAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, index % 2 === 0 ? -10 : 10],
                                            }),
                                        },
                                    ],
                                    opacity: loadingAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [0.3, 1, 0.3],
                                    }),
                                },
                            ]}
                        />
                    ))}
                </View>
            </Animated.View>

            {/* Footer */}
            <Text style={styles.footer}>Your health, enhanced by intelligence</Text>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    iconContainer: {
        width: moderateScale(120),
        height: moderateScale(120),
        borderRadius: moderateScale(60),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.xl,
    },
    appName: {
        fontSize: scaledFontSize(36),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
        marginBottom: indianDesign.spacing.md,
    },
    tagline: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.medium,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    loadingContainer: {
        flexDirection: 'row',
        marginTop: indianDesign.spacing.xl,
        gap: indianDesign.spacing.sm,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: healthColors.white,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        fontSize: scaledFontSize(12),
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
});

export default SplashScreen;
