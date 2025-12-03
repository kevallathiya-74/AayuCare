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
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { createShadow } from '../../utils/platformStyles';

const CreateAccountScreen = ({ navigation, route }) => {
  const userType = route?.params?.userType || 'user';
  const isHospital = userType === 'hospital';
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleSignUp = () => {
    // Validation
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Implement actual signup logic
    console.log('Sign Up:', formData);
    // navigation.navigate('Home');
  };

  const handleLoginNavigation = () => {
    if (isHospital) {
      navigation.navigate('HospitalLogin');
    } else {
      navigation.navigate('UserLogin');
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('BoxSelection');
    }
  };

  const iconColor = isHospital ? '#2E7D32' : '#29B6F6';
  const gradientColors = isHospital ? ['#E8F5E9', '#FFFFFF'] : ['#E3F2FD', '#FFFFFF'];
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
                <Feather name="user-plus" size={36} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={[styles.title, isHospital && styles.hospitalText]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, isHospital && styles.hospitalSubtext]}>
              Join AayuCare today for better healthcare
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              error={errors.fullName}
              leftIcon={<Feather name="user" size={20} color={iconColor} />}
            />

            <Input
              label="Email Address"
              placeholder="john@example.com"
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              error={errors.email}
              leftIcon={<Feather name="mail" size={20} color={iconColor} />}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Phone Number"
              placeholder="9876543210"
              value={formData.phoneNumber}
              onChangeText={(text) => handleChange('phoneNumber', text)}
              error={errors.phoneNumber}
              leftIcon={<Feather name="smartphone" size={20} color={iconColor} />}
              keyboardType="phone-pad"
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(text) => handleChange('password', text)}
              error={errors.password}
              leftIcon={<Feather name="lock" size={20} color={iconColor} />}
              secureTextEntry
            />

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(text) => handleChange('confirmPassword', text)}
              error={errors.confirmPassword}
              leftIcon={<Feather name="lock" size={20} color={iconColor} />}
              secureTextEntry
            />

            <Button
              variant="primary"
              size="large"
              onPress={handleSignUp}
              style={[styles.signUpButton, isHospital && styles.hospitalButton]}
            >
              Create Account
            </Button>
          </View>

          {/* Login Section */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleLoginNavigation}>
              <Text style={[styles.loginLink, isHospital && styles.hospitalLink]}>
                Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Feather name="shield" size={16} color={iconColor} />
            <Text style={[styles.footerText, isHospital && styles.hospitalFooter]}>
              Your data is encrypted and secure
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
    ...createShadow({ offset: { width: 0, height: 6 }, opacity: 0.25, radius: 12, elevation: 8 }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  hospitalText: {
    color: '#1B5E20',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  hospitalSubtext: {
    color: '#2E7D32',
  },
  form: {
    marginBottom: 28,
  },
  signUpButton: {
    marginTop: 16,
    height: 56,
  },
  hospitalButton: {
    backgroundColor: '#43A047',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
  },
  loginLink: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary.main,
  },
  hospitalLink: {
    color: '#2E7D32',
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
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  hospitalFooter: {
    color: '#2E7D32',
  },
});

export default CreateAccountScreen;
