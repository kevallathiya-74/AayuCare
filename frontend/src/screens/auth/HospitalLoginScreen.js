/**
 * AayuCare - Unified Hospital Login Screen
 * 
 * Single login page for Admin, Doctor, and Patient roles
 * Redirects to role-specific dashboard after authentication
 */

import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { createShadow } from '../../utils/platformStyles';
import { loginUser } from '../../store/slices/authSlice';

const HospitalLoginScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Validation
        const newErrors = {};
        if (!userId) newErrors.userId = 'User ID is required';
        if (!password) newErrors.password = 'Password is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            // Dispatch login action
            const result = await dispatch(loginUser({ userId, password })).unwrap();

            console.log('Login successful:', result);

            // Navigate based on role
            const role = result.user.role;

            if (role === 'admin') {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'AdminDashboard' }],
                });
            } else if (role === 'doctor') {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'DoctorDashboard' }],
                });
            } else if (role === 'patient') {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'PatientDashboard' }],
                });
            } else {
                Alert.alert('Error', 'Invalid user role');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Login Failed', error || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword', { userType: 'hospital' });
    };

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('BoxSelection');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#E8F5E9', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Feather name="arrow-left" size={24} color="#2E7D32" />
                    </TouchableOpacity>

                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.iconWrapper}>
                            <LinearGradient
                                colors={['#66BB6A', '#43A047']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconGradient}
                            >
                                <MaterialCommunityIcons name="hospital-building" size={42} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Hospital Login</Text>
                        <Text style={styles.subtitle}>
                            Admin • Doctor • Patient
                        </Text>
                        <Text style={styles.description}>
                            Enter your credentials to access your dashboard
                        </Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.form}>
                        <Input
                            label="User ID"
                            placeholder="Enter your User ID (e.g., ADM001, DOC001, PAT001)"
                            value={userId}
                            onChangeText={(text) => {
                                setUserId(text.toUpperCase());
                                setErrors({ ...errors, userId: '' });
                            }}
                            error={errors.userId}
                            leftIcon={<Feather name="user" size={20} color="#2E7D32" />}
                            autoCapitalize="characters"
                        />

                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrors({ ...errors, password: '' });
                            }}
                            error={errors.password}
                            leftIcon={<Feather name="lock" size={20} color="#2E7D32" />}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={handleForgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <Button
                            variant="primary"
                            size="large"
                            onPress={handleLogin}
                            loading={loading}
                            disabled={loading}
                            style={styles.loginButton}
                        >
                            Login to Dashboard
                        </Button>
                    </View>

                    {/* Role Info */}
                    <View style={styles.roleInfo}>
                        <Text style={styles.roleInfoTitle}>Access Levels:</Text>
                        <View style={styles.roleItem}>
                            <MaterialCommunityIcons name="shield-account" size={20} color="#1976D2" />
                            <Text style={styles.roleText}>Admin - Full system access</Text>
                        </View>
                        <View style={styles.roleItem}>
                            <MaterialCommunityIcons name="doctor" size={20} color="#388E3C" />
                            <Text style={styles.roleText}>Doctor - Patient management</Text>
                        </View>
                        <View style={styles.roleItem}>
                            <MaterialCommunityIcons name="account" size={20} color="#F57C00" />
                            <Text style={styles.roleText}>Patient - Personal health records</Text>
                        </View>
                    </View>

                    {/* Footer Info */}
                    <View style={styles.footer}>
                        <MaterialCommunityIcons name="shield-check" size={20} color="#2E7D32" />
                        <Text style={styles.footerText}>
                            Secure hospital access with role-based authentication
                        </Text>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        ...createShadow({ color: '#000', offset: { width: 0, height: 2 }, opacity: 0.08, radius: 8, elevation: 2 }),
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconWrapper: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        ...createShadow({ color: '#43A047', offset: { width: 0, height: 6 }, opacity: 0.25, radius: 12, elevation: 8 }),
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1B5E20',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E7D32',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        fontWeight: '400',
        color: '#66BB6A',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    form: {
        marginBottom: 32,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 12,
        marginBottom: 28,
        paddingVertical: 4,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
    },
    loginButton: {
        marginTop: 8,
        backgroundColor: '#43A047',
        height: 56,
    },
    roleInfo: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        ...createShadow({ color: '#000', offset: { width: 0, height: 2 }, opacity: 0.05, radius: 8, elevation: 2 }),
    },
    roleInfoTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B5E20',
        marginBottom: 12,
    },
    roleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    roleText: {
        fontSize: 13,
        color: '#424242',
        marginLeft: 10,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#C8E6C9',
    },
    footerText: {
        marginLeft: 10,
        fontSize: 13,
        fontWeight: '500',
        color: '#2E7D32',
        textAlign: 'center',
        lineHeight: 18,
    },
});

export default HospitalLoginScreen;
