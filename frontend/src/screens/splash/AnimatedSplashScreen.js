/**
 * Premium Animated Splash Screen
 * Beautiful gradient design with actual logo
 * Optimized for Indian users with calming colors
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    StatusBar,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { healthColors } from '../../theme/healthColors';
import { indianDesign } from '../../theme/indianDesign';

const { width, height } = Dimensions.get('window');

const AnimatedSplashScreen = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        // Beautiful staggered animation
        Animated.sequence([
            // Logo appears with scale and fade
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: false,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 10,
                    friction: 3,
                    useNativeDriver: false,
                }),
            ]),
            // Tagline slides up
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: false,
            }),
        ]).start();

        // Navigate after 2.5 seconds
        const timer = setTimeout(() => {
            navigation.replace('BoxSelection');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={healthColors.primary.main} />

            {/* Beautiful Gradient Background - Healing Teal → Fresh Aqua → Sky Blue */}
            <LinearGradient
                colors={healthColors.primary.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Decorative Circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />

            {/* Content */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../../assets/images/aayucare-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                {/* App Name */}
                <Text style={styles.appName}>AayuCare</Text>

                {/* Tagline */}
                <Animated.Text
                    style={[
                        styles.tagline,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    One App. Every Health Need.
                </Animated.Text>

                {/* Subtitle */}
                <Animated.Text
                    style={[
                        styles.subtitle,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    Your Complete Healthcare Companion
                </Animated.Text>
            </Animated.View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <View style={styles.footerDot} />
                <Text style={styles.footerText}>Trusted by thousands</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    circle2: {
        position: 'absolute',
        bottom: -150,
        left: -150,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    circle3: {
        position: 'absolute',
        top: height / 2 - 200,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.xl,
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.15)',
    },
    logo: {
        width: 100,
        height: 100,
    },
    appName: {
        fontSize: 42,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.white,
        letterSpacing: 1,
        marginBottom: indianDesign.spacing.md,
        textShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    },
    tagline: {
        fontSize: indianDesign.fontSize.xlarge,
        color: healthColors.text.white,
        textAlign: 'center',
        fontWeight: indianDesign.fontWeight.semibold,
        letterSpacing: 0.5,
        marginBottom: indianDesign.spacing.sm,
        textShadow: '0px 1px 4px rgba(0, 0, 0, 0.15)',
    },
    subtitle: {
        fontSize: indianDesign.fontSize.medium,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        fontWeight: indianDesign.fontWeight.regular,
        letterSpacing: 0.3,
        textShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: indianDesign.spacing.sm,
    },
    footerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: healthColors.success.main,
    },
    footerText: {
        fontSize: indianDesign.fontSize.small,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: indianDesign.fontWeight.medium,
    },
});

export default AnimatedSplashScreen;
