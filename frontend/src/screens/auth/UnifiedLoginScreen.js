/**
 * Unified Login Screen
 * Single authentication screen with role-based login
 * Supports: Admin, Doctor, Patient roles
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { 
    getScreenPadding, 
    moderateScale, 
    verticalScale,
    scaledFontSize,
} from '../../utils/responsive';

const UnifiedLoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [userIdFocused, setUserIdFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const passwordInputRef = useRef(null);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handleLogin = async () => {
        // Validate User ID
        if (!userId.trim()) {
            alert('Please enter User ID');
            return;
        }

        // Validate Password
        if (!password.trim()) {
            alert('Please enter Password');
            return;
        }

        // Animate button press
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            const result = await dispatch(loginUser({ 
                userId: userId.trim(), 
                password 
            })).unwrap();
            
            // Role-based navigation handled automatically by AppNavigator
        } catch (err) {
            // Show user-friendly error
            let errorMessage = 'Login failed. Please try again.';

            if (typeof err === 'string') {
                if (err.includes('ExpoSecureStore') || err.includes('is not a function')) {
                    errorMessage = 'Login failed. Please try again.';
                } else {
                    errorMessage = err;
                }
            }

            alert(errorMessage);
        }
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={healthColors.primary.main} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header with Gradient */}
                    <LinearGradient
                        colors={[healthColors.primary.main, healthColors.primary.dark]}
                        style={styles.header}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.logoContainer}>
                            <View style={styles.logo}>
                                <Ionicons
                                    name="medical"
                                    size={50}
                                    color={healthColors.neutral.white}
                                />
                            </View>
                            <Text style={styles.appName}>AayuCare</Text>
                            <Text style={styles.tagline}>Smart Healthcare Management</Text>
                        </View>
                    </LinearGradient>

                    {/* Login Form Card */}
                    <View style={styles.formCard}>
                        <Text style={styles.welcomeText}>Welcome Back!</Text>
                        <Text style={styles.subtitleText}>
                            Login with your User ID & Password
                        </Text>

                        {/* Role Indicator */}
                        <View style={styles.roleIndicator}>
                            <Ionicons name="people" size={16} color={healthColors.primary.main} />
                            <Text style={styles.roleText}>All Roles: Admin • Doctor • Patient</Text>
                        </View>

                        {/* User ID Input */}
                        <View style={styles.inputContainer}>
                            <Text
                                style={[
                                    styles.label,
                                    (userIdFocused || userId) && styles.labelFocused,
                                ]}
                            >
                                User ID / Employee ID / Patient ID
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    userIdFocused && styles.inputWrapperFocused,
                                ]}
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={20}
                                    color={
                                        userIdFocused
                                            ? healthColors.primary.main
                                            : healthColors.text.tertiary
                                    }
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    value={userId}
                                    onChangeText={setUserId}
                                    onFocus={() => setUserIdFocused(true)}
                                    onBlur={() => setUserIdFocused(false)}
                                    placeholder="Enter your ID (e.g., ADM001, DOC001, PAT001)"
                                    placeholderTextColor={healthColors.text.tertiary}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text
                                style={[
                                    styles.label,
                                    (passwordFocused || password) && styles.labelFocused,
                                ]}
                            >
                                Password
                            </Text>
                            <View
                                style={[
                                    styles.inputWrapper,
                                    passwordFocused && styles.inputWrapperFocused,
                                ]}
                            >
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={20}
                                    color={
                                        passwordFocused
                                            ? healthColors.primary.main
                                            : healthColors.text.tertiary
                                    }
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    ref={passwordInputRef}
                                    style={styles.input}
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    placeholder="Enter your password"
                                    placeholderTextColor={healthColors.text.tertiary}
                                    secureTextEntry={!showPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={20}
                                        color={healthColors.text.tertiary}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={handleForgotPassword}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Login Button */}
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                onPress={handleLogin}
                                activeOpacity={0.8}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={[healthColors.primary.main, healthColors.primary.dark]}
                                    style={styles.loginButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={healthColors.neutral.white} />
                                    ) : (
                                        <>
                                            <Text style={styles.loginButtonText}>Login</Text>
                                            <Ionicons
                                                name="arrow-forward"
                                                size={20}
                                                color={healthColors.neutral.white}
                                            />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Demo Credentials */}
                        <View style={styles.demoSection}>
                            <Text style={styles.demoTitle}>Demo Credentials:</Text>
                            <View style={styles.demoRow}>
                                <Text style={styles.demoLabel}>Admin:</Text>
                                <Text style={styles.demoValue}>ADM001 / admin123</Text>
                            </View>
                            <View style={styles.demoRow}>
                                <Text style={styles.demoLabel}>Doctor:</Text>
                                <Text style={styles.demoValue}>DOC001 / doctor123</Text>
                            </View>
                            <View style={styles.demoRow}>
                                <Text style={styles.demoLabel}>Patient:</Text>
                                <Text style={styles.demoValue}>PAT001 / patient123</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Ionicons
                            name="shield-checkmark"
                            size={16}
                            color={healthColors.text.tertiary}
                        />
                        <Text style={styles.footerText}>
                            Secure Login • Your data is protected
                        </Text>
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
    },
    header: {
        paddingTop: verticalScale(30),
        paddingBottom: verticalScale(50),
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.md,
        ...createShadow(3),
    },
    appName: {
        fontSize: scaledFontSize(32),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.neutral.white,
        marginBottom: indianDesign.spacing.xs,
    },
    tagline: {
        fontSize: scaledFontSize(14),
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: indianDesign.fontWeight.regular,
    },
    formCard: {
        marginTop: -30,
        marginHorizontal: getScreenPadding(),
        backgroundColor: healthColors.background.card,
        borderRadius: 20,
        padding: indianDesign.spacing.xl,
        ...createShadow(5),
    },
    welcomeText: {
        fontSize: scaledFontSize(24),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.xs,
    },
    subtitleText: {
        fontSize: scaledFontSize(14),
        color: healthColors.text.secondary,
        marginBottom: indianDesign.spacing.lg,
    },
    roleIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.primary.main + '10',
        paddingHorizontal: indianDesign.spacing.md,
        paddingVertical: indianDesign.spacing.sm,
        borderRadius: 8,
        marginBottom: indianDesign.spacing.lg,
    },
    roleText: {
        fontSize: scaledFontSize(12),
        color: healthColors.primary.main,
        marginLeft: indianDesign.spacing.xs,
        fontWeight: indianDesign.fontWeight.medium,
    },
    inputContainer: {
        marginBottom: indianDesign.spacing.lg,
    },
    label: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
        marginBottom: indianDesign.spacing.xs,
        fontWeight: indianDesign.fontWeight.medium,
    },
    labelFocused: {
        color: healthColors.primary.main,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: healthColors.card.border,
        paddingHorizontal: indianDesign.spacing.md,
        height: moderateScale(50),
    },
    inputWrapperFocused: {
        borderColor: healthColors.primary.main,
        backgroundColor: healthColors.background.card,
    },
    inputIcon: {
        marginRight: indianDesign.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: scaledFontSize(14),
        color: healthColors.text.primary,
        fontWeight: indianDesign.fontWeight.regular,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: indianDesign.spacing.xl,
    },
    forgotPasswordText: {
        fontSize: scaledFontSize(13),
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.medium,
    },
    loginButton: {
        borderRadius: 12,
        overflow: 'hidden',
        ...createShadow(3),
    },
    loginButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.md,
        gap: indianDesign.spacing.sm,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        fontSize: scaledFontSize(16),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.neutral.white,
    },
    demoSection: {
        marginTop: indianDesign.spacing.xl,
        padding: indianDesign.spacing.md,
        backgroundColor: healthColors.background.tertiary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: healthColors.card.border,
        borderStyle: 'dashed',
    },
    demoTitle: {
        fontSize: scaledFontSize(12),
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.secondary,
        marginBottom: indianDesign.spacing.sm,
    },
    demoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: indianDesign.spacing.xs,
    },
    demoLabel: {
        fontSize: scaledFontSize(11),
        color: healthColors.text.tertiary,
        fontWeight: indianDesign.fontWeight.medium,
    },
    demoValue: {
        fontSize: scaledFontSize(11),
        color: healthColors.text.primary,
        fontWeight: indianDesign.fontWeight.medium,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: indianDesign.spacing.xl,
        gap: indianDesign.spacing.xs,
    },
    footerText: {
        fontSize: scaledFontSize(12),
        color: healthColors.text.tertiary,
    },
});

export default UnifiedLoginScreen;
