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

const HospitalLoginScreen = ({ navigation }) => {
  const [hospitalId, setHospitalId] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const handleLogin = () => {
    // Validation
    const newErrors = {};
    if (!hospitalId) newErrors.hospitalId = 'Hospital ID is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Implement actual login logic
    console.log('Hospital Login:', { hospitalId, password });
    // navigation.navigate('HospitalDashboard');
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
              Secure access for healthcare facilities
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <Input
              label="Hospital ID"
              placeholder="HOS123456"
              value={hospitalId}
              onChangeText={(text) => {
                setHospitalId(text);
                setErrors({ ...errors, hospitalId: '' });
              }}
              error={errors.hospitalId}
              leftIcon={<Feather name="credit-card" size={20} color="#2E7D32" />}
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
              style={styles.loginButton}
            >
              Login to Dashboard
            </Button>
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#2E7D32" />
            <Text style={styles.footerText}>
              Secure hospital access with end-to-end encryption
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
    ...createShadow({ color: '#43A047', offset: { width: 0, height: 6 }, opacity: 0.25, radius: 12, elevation: 8 }),
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2E7D32',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  form: {
    marginBottom: 40,
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    paddingTop: 28,
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
