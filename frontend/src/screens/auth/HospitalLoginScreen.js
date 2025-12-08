/**
 * Universal Hospital Login Screen
 * Single login for Admin, Doctor, and Patient
 * Optimized for Indian users with large inputs and auto-focus
 */

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { healthColors } from '../../theme/healthColors';
import { indianDesign, createShadow } from '../../theme/indianDesign';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { 
    getScreenPadding, 
    moderateScale, 
    verticalScale,
    scaledFontSize,
    touchTargets,
} from '../../utils/responsive';

const HospitalLoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [userIdFocused, setUserIdFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const passwordInputRef = useRef(null);

    // Auto-focus on userId input
    useEffect(() => {
        // Small delay to ensure smooth transition
        setTimeout(() => {
            // Auto-focus logic can be added here if needed
        }, 300);
    }, []);

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

        try {
            const result = await dispatch(loginUser({ userId: userId.trim(), password })).unwrap();
            // Navigation handled by AppNavigator based on user role
        } catch (err) {
            // Backend sends specific error messages
            let errorMessage = 'Login failed. Please try again.';

            if (typeof err === 'string') {
                // Filter out technical errors, show user-friendly backend messages
                if (err.includes('ExpoSecureStore') || err.includes('is not a function')) {
                    errorMessage = 'Login failed. Please try again.';
                } else {
                    // Show the exact backend error message
                    errorMessage = err;
                }
            }

            alert(errorMessage);
        }
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={healthColors.background.primary} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={handleBack}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="arrow-back"
                                size={24}
                                color={healthColors.text.primary}
                            />
                        </TouchableOpacity>

                        <View style={styles.logoContainer}>
                            <View style={styles.logo}>
                                <Ionicons
                                    name="medical"
                                    size={40}
                                    color={healthColors.primary.main}
                                />
                            </View>
                            <Text style={styles.title}>Hospital Login</Text>
                            <Text style={styles.subtitle}>
                                Enter your credentials to continue
                            </Text>
                        </View>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        {/* User ID Input */}
                        <View style={styles.inputContainer}>
                            <Text
                                style={[
                                    styles.label,
                                    (userIdFocused || userId) && styles.labelFocused,
                                ]}
                            >
                                Mobile / Email / Employee ID
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
                                    placeholder="Enter your ID"
                                    placeholderTextColor={healthColors.text.tertiary}
                                    autoCapitalize="none"
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
                                    style={styles.eyeIcon}
                                    activeOpacity={0.7}
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

                        {/* Error Message */}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Ionicons
                                    name="alert-circle"
                                    size={16}
                                    color={healthColors.error.main}
                                />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            activeOpacity={0.8}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={healthColors.text.white} />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </TouchableOpacity>
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
        </View>
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
        paddingHorizontal: getScreenPadding(),
    },
    header: {
        paddingTop: verticalScale(indianDesign.spacing.xl),
        marginBottom: verticalScale(indianDesign.spacing.xxxl),
    },
    backButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: 20,
        backgroundColor: healthColors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.xl,
        ...createShadow(2),
    },
    logoContainer: {
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: healthColors.primary.main + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: indianDesign.spacing.md,
    },
    title: {
        fontSize: indianDesign.fontSize.title,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.primary,
        marginBottom: indianDesign.spacing.xs,
    },
    subtitle: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.secondary,
        fontWeight: indianDesign.fontWeight.regular,
    },
    formContainer: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: indianDesign.spacing.lg,
    },
    label: {
        fontSize: indianDesign.fontSize.small,
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
        backgroundColor: healthColors.background.card,
        borderRadius: indianDesign.borderRadius.medium,
        borderWidth: 1,
        borderColor: healthColors.border.light,
        paddingHorizontal: indianDesign.spacing.md,
        height: indianDesign.touchTarget.large,
        ...createShadow(1),
    },
    inputWrapperFocused: {
        borderColor: healthColors.primary.main,
        ...createShadow(2),
    },
    inputIcon: {
        marginRight: indianDesign.spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.text.primary,
        fontWeight: indianDesign.fontWeight.regular,
        outlineStyle: 'none', // Remove web outline
        borderWidth: 0, // Remove default border
    },
    eyeIcon: {
        padding: indianDesign.spacing.xs,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: indianDesign.spacing.xl,
    },
    forgotPasswordText: {
        fontSize: indianDesign.fontSize.medium,
        color: healthColors.primary.main,
        fontWeight: indianDesign.fontWeight.semibold,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: healthColors.error.background,
        padding: indianDesign.spacing.md,
        borderRadius: indianDesign.borderRadius.medium,
        marginBottom: indianDesign.spacing.lg,
        gap: indianDesign.spacing.sm,
    },
    errorText: {
        flex: 1,
        fontSize: indianDesign.fontSize.small,
        color: healthColors.error.main,
        fontWeight: indianDesign.fontWeight.medium,
    },
    loginButton: {
        backgroundColor: healthColors.primary.main,
        height: indianDesign.touchTarget.large,
        borderRadius: indianDesign.borderRadius.medium,
        justifyContent: 'center',
        alignItems: 'center',
        ...createShadow(3),
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        fontSize: indianDesign.fontSize.large,
        fontWeight: indianDesign.fontWeight.bold,
        color: healthColors.text.white,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: indianDesign.spacing.xl,
        gap: indianDesign.spacing.xs,
    },
    footerText: {
        fontSize: indianDesign.fontSize.small,
        color: healthColors.text.tertiary,
        fontWeight: indianDesign.fontWeight.regular,
    },
});

export default HospitalLoginScreen;
