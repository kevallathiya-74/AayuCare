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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';

const ForgotPasswordScreen = ({ navigation, route }) => {
  const userType = route?.params?.userType || 'user';
  const isHospital = userType === 'hospital';
  
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent] = useState(false);

  const handleSendOTP = () => {
    // Validation
    const newErrors = {};
    if (!email) newErrors.email = isHospital ? 'Hospital ID or Email is required' : 'Email or Phone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Implement actual OTP sending logic
    console.log('Send OTP to:', email);
    setEmailSent(true);
    
    // Navigate to reset password or OTP verification
    setTimeout(() => {
      navigation.navigate('ResetPassword', { email, userType });
    }, 1500);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const gradientColors = isHospital ? ['#E8F5E9', '#FFFFFF'] : ['#E3F2FD', '#FFFFFF'];
  const iconColor = isHospital ? '#2E7D32' : '#29B6F6';
  const iconGradient = isHospital ? ['#66BB6A', '#43A047'] : ['#4FC3F7', '#29B6F6'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={gradientColors}
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
            <Feather name="arrow-left" size={24} color={iconColor} />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Feather name="key" size={36} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={[styles.title, isHospital && styles.hospitalText]}>
              Forgot Password?
            </Text>
            <Text style={[styles.subtitle, isHospital && styles.hospitalSubtext]}>
              {emailSent 
                ? 'Check your email for reset instructions'
                : `Enter your ${isHospital ? 'Hospital ID or email' : 'registered email or phone'} to reset password`}
            </Text>
          </View>

          {!emailSent ? (
            <>
              {/* Form Section */}
              <View style={styles.form}>
                <Input
                  label={isHospital ? "Hospital ID or Email" : "Email or Phone"}
                  placeholder={isHospital ? "HOS123456" : "example@email.com"}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: '' });
                  }}
                  error={errors.email}
                  leftIcon={<Feather name="mail" size={20} color={iconColor} />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Button
                  variant="primary"
                  size="large"
                  onPress={handleSendOTP}
                  style={[styles.sendButton, isHospital && styles.hospitalButton]}
                >
                  Send Reset Link
                </Button>
              </View>

              {/* Back to Login */}
              <View style={styles.backToLogin}>
                <Text style={styles.backToLoginText}>Remember your password?</Text>
                <TouchableOpacity onPress={handleBack}>
                  <Text style={[styles.backToLoginLink, isHospital && styles.hospitalLink]}>
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Feather name="check-circle" size={64} color={iconColor} />
              </View>
              <Text style={styles.successText}>Email Sent Successfully!</Text>
              <Text style={styles.successSubtext}>
                We've sent password reset instructions to {email}
              </Text>
            </View>
          )}

          {/* Footer Info */}
          <View style={styles.footer}>
            {isHospital ? (
              <MaterialCommunityIcons name="shield-check" size={20} color="#2E7D32" />
            ) : (
              <Feather name="shield" size={16} color={colors.textSecondary} />
            )}
            <Text style={[styles.footerText, isHospital && styles.hospitalFooter]}>
              Secure password reset process
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  hospitalText: {
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
    paddingHorizontal: 20,
  },
  hospitalSubtext: {
    color: '#2E7D32',
  },
  form: {
    marginBottom: 32,
  },
  sendButton: {
    marginTop: 16,
  },
  hospitalButton: {
    backgroundColor: '#43A047',
  },
  backToLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  backToLoginLink: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  hospitalLink: {
    color: '#2E7D32',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  successSubtext: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  hospitalFooter: {
    color: '#2E7D32',
  },
});

export default ForgotPasswordScreen;
