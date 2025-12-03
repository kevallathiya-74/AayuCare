import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { createShadow } from '../../utils/platformStyles';

const UserLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const handleLogin = () => {
    // Validation
    const newErrors = {};
    if (!email) newErrors.email = 'Email or phone is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Implement actual login logic
    console.log('User Login:', { email, password });
    // navigation.navigate('Home');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { userType: 'user' });
  };

  const handleLoginWithOTP = () => {
    navigation.navigate('LoginWithOTP', { userType: 'user' });
  };

  const handleSignUp = () => {
    navigation.navigate('CreateAccount', { userType: 'user' });
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
        colors={['#E3F2FD', '#FFFFFF']}
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
            <Feather name="arrow-left" size={24} color={colors.primary.main} />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={['#4FC3F7', '#29B6F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Feather name="user" size={36} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>
              Login to access your health records and appointments
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Input
              label="Email or Phone"
              placeholder="example@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
              leftIcon={<Feather name="mail" size={20} color="#29B6F6" />}
              keyboardType="email-address"
              autoCapitalize="none"
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
              leftIcon={<Feather name="lock" size={20} color="#29B6F6" />}
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
              style={styles.loginButton}
            >
              Login
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Additional Options */}
          <View style={styles.additionalOptions}>
            <TouchableOpacity style={styles.optionButton} onPress={handleLoginWithOTP}>
              <Feather name="smartphone" size={20} color={colors.primary} />
              <Text style={styles.optionButtonText}>Login with OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionButton, styles.googleButton]}>
              <Feather name="mail" size={20} color="#4285F4" />
              <Text style={[styles.optionButtonText, styles.googleButtonText]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Section */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpText}>New to AayuCare?</Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpLink}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Feather name="shield" size={16} color={colors.textSecondary} />
            <Text style={styles.footerText}>
              Your health data is encrypted and secure
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
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.08,
      radius: 8,
      elevation: 2,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    ...createShadow({
      color: '#4FC3F7',
      offset: { width: 0, height: 6 },
      opacity: 0.25,
      radius: 12,
      elevation: 8,
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    marginBottom: 28,
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
    color: colors.primary.main,
  },
  loginButton: {
    marginTop: 8,
    height: 56,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.card.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  additionalOptions: {
    marginBottom: 28,
    gap: 14,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
    ...createShadow({
      color: '#000',
      offset: { width: 0, height: 2 },
      opacity: 0.05,
      radius: 4,
      elevation: 2,
    }),
  },
  optionButtonText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary.main,
  },
  googleButton: {
    borderColor: '#E0E0E0',
  },
  googleButtonText: {
    color: '#424242',
  },
  signUpSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  signUpLink: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: colors.card.border,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default UserLoginScreen;
