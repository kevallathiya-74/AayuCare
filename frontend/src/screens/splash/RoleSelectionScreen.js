/**
 * Role Selection Screen
 * Choose between Hospital (Admin/Doctor) and Patient roles
 * Includes language selector
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { scaledFontSize, moderateScale, getScreenPadding, verticalScale } from '../../utils/responsive';
import { changeLanguage } from '../../i18n';

const RoleSelectionScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

    const handleRoleSelection = (role) => {
        // Navigate to unified login screen for all roles
        navigation.navigate('Login');
    };

    const handleLanguageChange = async (lang) => {
        setSelectedLanguage(lang);
        await changeLanguage(lang);
    };

    const languages = [
        { code: 'en', label: 'EN', name: 'English' },
        { code: 'hi', label: 'हि', name: 'हिन्दी' },
        { code: 'gu', label: 'ગુ', name: 'ગુજરાતી' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={[healthColors.background.primary, '#E8F5E9']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="medical" size={60} color={healthColors.primary.main} />
                    <Text style={styles.appName}>AayuCare</Text>
                    <Text style={styles.subtitle}>Smart Healthcare Management</Text>
                </View>

                {/* Role Selection */}
                <View style={styles.content}>
                    <Text style={styles.title}>Choose Your Role</Text>

                    {/* Hospital Role */}
                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleRoleSelection('hospital')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[healthColors.primary.main, healthColors.primary.dark]}
                            style={styles.roleGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.roleIcon}>
                                <Ionicons name="business" size={48} color="#FFF" />
                            </View>
                            <Text style={styles.roleTitle}>🏥 HOSPITAL</Text>
                            <Text style={styles.roleSubtitle}>Admin/Doctor</Text>
                            <View style={styles.roleArrow}>
                                <Ionicons name="arrow-forward" size={24} color="#FFF" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Patient Role */}
                    <TouchableOpacity
                        style={styles.roleCard}
                        onPress={() => handleRoleSelection('patient')}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#00ACC1', '#00838F']}
                            style={styles.roleGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.roleIcon}>
                                <Ionicons name="person" size={48} color="#FFF" />
                            </View>
                            <Text style={styles.roleTitle}>👤 PATIENT</Text>
                            <Text style={styles.roleSubtitle}>Book & Manage</Text>
                            <View style={styles.roleArrow}>
                                <Ionicons name="arrow-forward" size={24} color="#FFF" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Language Selector */}
                <View style={styles.languageSection}>
                    <View style={styles.languageHeader}>
                        <Ionicons name="globe" size={20} color={healthColors.text.secondary} />
                        <Text style={styles.languageTitle}>Language:</Text>
                    </View>
                    <View style={styles.languageButtons}>
                        {languages.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.languageButton,
                                    selectedLanguage === lang.code && styles.languageButtonActive,
                                ]}
                                onPress={() => handleLanguageChange(lang.code)}
                            >
                                <Text
                                    style={[
                                        styles.languageLabel,
                                        selectedLanguage === lang.code && styles.languageLabelActive,
                                    ]}
                                >
                                    {lang.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>Secure • Private • AI-Powered</Text>
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
    },
    gradient: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: verticalScale(40),
        paddingBottom: verticalScale(20),
    },
    appName: {
        fontSize: scaledFontSize(32),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginTop: indianDesign.spacing.md,
    },
    subtitle: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginTop: indianDesign.spacing.xs,
    },
    content: {
        flex: 1,
        padding: getScreenPadding(),
        justifyContent: 'center',
    },
    title: {
        fontSize: scaledFontSize(24),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        textAlign: 'center',
        marginBottom: indianDesign.spacing.xl,
    },
    roleCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: indianDesign.spacing.xl,
        ...createShadow(8),
    },
    roleGradient: {
        padding: indianDesign.spacing.xl,
        alignItems: 'center',
        minHeight: moderateScale(180),
        justifyContent: 'center',
    },
    roleIcon: {
        width: moderateScale(80),
        height: moderateScale(80),
        borderRadius: moderateScale(40),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    roleTitle: {
        fontSize: scaledFontSize(24),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
        marginBottom: 4,
    },
    roleSubtitle: {
        fontSize: scaledFontSize(14),
        color: 'rgba(255, 255, 255, 0.9)',
    },
    roleArrow: {
        position: 'absolute',
        right: indianDesign.spacing.lg,
        top: '50%',
        marginTop: -12,
    },
    languageSection: {
        padding: getScreenPadding(),
        paddingBottom: verticalScale(30),
    },
    languageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: indianDesign.spacing.md,
        gap: indianDesign.spacing.xs,
    },
    languageTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.medium,
        color: healthColors.text.secondary,
    },
    languageButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: indianDesign.spacing.md,
    },
    languageButton: {
        paddingHorizontal: indianDesign.spacing.lg,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: 20,
        backgroundColor: healthColors.background.card,
        borderWidth: 2,
        borderColor: 'transparent',
        minWidth: moderateScale(60),
        alignItems: 'center',
        ...createShadow(2),
    },
    languageButtonActive: {
        backgroundColor: healthColors.primary.main,
        borderColor: healthColors.primary.dark,
    },
    languageLabel: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
    },
    languageLabelActive: {
        color: '#FFF',
    },
    footer: {
        textAlign: 'center',
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        paddingBottom: indianDesign.spacing.md,
    },
});

export default RoleSelectionScreen;
