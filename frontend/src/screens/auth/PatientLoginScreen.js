/**
 * Patient Login Screen
 * Fixed hospital-provided credentials
 * Patient cannot change their ID
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { scaledFontSize, moderateScale, getScreenPadding, verticalScale } from '../../utils/responsive';
import { authService } from '../../services';
import { setUser, setToken } from '../../store/slices/authSlice';
import { showError, validateRequiredFields } from '../../utils/errorHandler';

const PatientLoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const [patientId, setPatientId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Validate inputs
        const validation = validateRequiredFields({ patientId, password });
        if (!validation.isValid) {
            showError('Please enter both Patient ID and Password');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.login(patientId, password);
            
            if (response.user && response.token) {
                if (response.user.role !== 'patient') {
                    showError('This login is for patients only. Please use the correct login portal.', 'Access Denied');
                    return;
                }

                dispatch(setUser(response.user));
                dispatch(setToken(response.token));
                navigation.replace('PatientDashboard');
            }
        } catch (error) {
            showError(error, 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    const fillDemoCredentials = () => {
        setPatientId('patient@aayucare.com');
        setPassword('patient123');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#00ACC1" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Patient Login</Text>
                    </View>

                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#00ACC1', '#00838F']}
                            style={styles.iconGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="person" size={48} color="#FFF" />
                        </LinearGradient>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <Text style={styles.label}>Patient ID</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="card" size={20} color={healthColors.text.tertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., ADM001 or email"
                                placeholderTextColor={healthColors.text.tertiary}
                                value={patientId}
                                onChangeText={setPatientId}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color="#FF9800" />
                            <Text style={styles.infoText}>
                                Patient ID is provided by the hospital and cannot be changed
                            </Text>
                        </View>

                        <Text style={styles.label}>Password (Hospital Provided - Fixed)</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed" size={20} color={healthColors.text.tertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={healthColors.text.tertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color={healthColors.text.tertiary}
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.warningBox}>
                            <Ionicons name="alert-circle" size={20} color="#F44336" />
                            <Text style={styles.warningText}>
                                ⚠️ Cannot Change ID{'\n'}
                                Contact Hospital for password reset
                            </Text>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#00ACC1', '#00838F']}
                                style={styles.loginGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.loginText}>
                                    {loading ? 'Logging in...' : 'LOGIN'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Demo Credentials */}
                        <View style={styles.demoSection}>
                            <Text style={styles.demoTitle}>🔒 Try Demo Login</Text>
                            <TouchableOpacity
                                style={styles.demoButton}
                                onPress={fillDemoCredentials}
                            >
                                <Text style={styles.demoButtonText}>Fill Demo Credentials</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Help Footer */}
                    <View style={styles.footer}>
                        <Ionicons name="call" size={16} color={healthColors.text.tertiary} />
                        <Text style={styles.footerText}>Help: 1800-XXX-XXXX</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: healthColors.background.primary,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: getScreenPadding(),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.xl,
    },
    backButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: healthColors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: indianDesign.spacing.md,
        ...createShadow(2),
    },
    headerTitle: {
        fontSize: scaledFontSize(24),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: indianDesign.spacing.xl,
    },
    iconGradient: {
        width: moderateScale(100),
        height: moderateScale(100),
        borderRadius: moderateScale(50),
        justifyContent: 'center',
        alignItems: 'center',
        ...createShadow(4),
    },
    form: {
        flex: 1,
    },
    label: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.sm,
        marginTop: indianDesign.spacing.md,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.medium,
        paddingHorizontal: indianDesign.spacing.md,
        height: moderateScale(56),
        borderWidth: 1,
        borderColor: healthColors.border.light,
        gap: indianDesign.spacing.sm,
        ...createShadow(1),
    },
    input: {
        flex: 1,
        fontSize: scaledFontSize(16),
        color: healthColors.text.primary,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.secondary,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.small,
        marginTop: indianDesign.spacing.sm,
        gap: indianDesign.spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: scaledFontSize(12),
        color: '#E65100',
        lineHeight: 18,
    },
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: healthColors.error.light,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.small,
        marginTop: indianDesign.spacing.lg,
        gap: indianDesign.spacing.sm,
    },
    warningText: {
        flex: 1,
        fontSize: scaledFontSize(12),
        color: '#C62828',
        lineHeight: 18,
        fontWeight: indianDesign.fontWeight.medium,
    },
    loginButton: {
        borderRadius: indianDesign.borderRadius.medium,
        overflow: 'hidden',
        marginTop: indianDesign.spacing.xl,
        ...createShadow(4),
    },
    loginGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    loginText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: '#FFF',
    },
    demoSection: {
        marginTop: indianDesign.spacing.xl,
        padding: indianDesign.spacing.md,
        backgroundColor: healthColors.background.tertiary,
        borderRadius: indianDesign.borderRadius.medium,
        alignItems: 'center',
    },
    demoTitle: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.semibold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.md,
    },
    demoButton: {
        paddingHorizontal: indianDesign.spacing.xl,
        paddingVertical: indianDesign.spacing.sm,
        backgroundColor: healthColors.info.main,
        borderRadius: indianDesign.borderRadius.small,
    },
    demoButtonText: {
        fontSize: scaledFontSize(14),
        fontWeight: indianDesign.fontWeight.medium,
        color: '#FFF',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: indianDesign.spacing.xl,
        gap: indianDesign.spacing.xs,
    },
    footerText: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
    },
});

export default PatientLoginScreen;
