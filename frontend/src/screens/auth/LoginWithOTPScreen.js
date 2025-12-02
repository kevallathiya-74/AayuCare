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

const LoginWithOTPScreen = ({ navigation, route }) => {
  const userType = route?.params?.userType || 'user';
  const isHospital = userType === 'hospital';
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(30);

  const handleSendOTP = () => {
    // Validation
    const newErrors = {};
    if (!phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (phoneNumber.length < 10) newErrors.phoneNumber = 'Invalid phone number';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Implement actual OTP sending logic
    console.log('Send OTP to:', phoneNumber);
    setOtpSent(true);
    
    // Start countdown timer
    let count = 30;
    const interval = setInterval(() => {
      count--;
      setTimer(count);
      if (count === 0) {
        clearInterval(interval);
      }
    }, 1000);
  };

  const handleVerifyOTP = () => {
    // Validation
    const newErrors = {};
    if (!otp) newErrors.otp = 'OTP is required';
    else if (otp.length !== 6) newErrors.otp = 'OTP must be 6 digits';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Implement actual OTP verification logic
    console.log('Verify OTP:', otp);
    // navigation.navigate('Home');
  };

  const handleResendOTP = () => {
    if (timer === 0) {
      handleSendOTP();
    }
  };

  const handleBack = () => {
    navigation.goBack();
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
                <Feather name="smartphone" size={36} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={[styles.title, isHospital && styles.hospitalText]}>
              Login with OTP
            </Text>
            <Text style={[styles.subtitle, isHospital && styles.hospitalSubtext]}>
              {otpSent 
                ? `Enter the 6-digit code sent to ${phoneNumber}`
                : 'Enter your phone number to receive OTP'}
            </Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            {!otpSent ? (
              <>
                <Input
                  label="Phone Number"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setErrors({ ...errors, phoneNumber: '' });
                  }}
                  error={errors.phoneNumber}
                  leftIcon={<Feather name="smartphone" size={20} color={iconColor} />}
                  keyboardType="phone-pad"
                />

                <Button
                  variant="primary"
                  size="large"
                  onPress={handleSendOTP}
                  style={[styles.button, isHospital && styles.hospitalButton]}
                >
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <Input
                  label="Enter OTP"
                  placeholder="123456"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    setErrors({ ...errors, otp: '' });
                  }}
                  error={errors.otp}
                  leftIcon={<Feather name="lock" size={20} color={iconColor} />}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <View style={styles.resendContainer}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>
                      Resend OTP in {timer} seconds
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP}>
                      <Text style={[styles.resendText, isHospital && styles.hospitalLink]}>
                        Resend OTP
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Button
                  variant="primary"
                  size="large"
                  onPress={handleVerifyOTP}
                  style={[styles.button, isHospital && styles.hospitalButton]}
                >
                  Verify & Login
                </Button>

                <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.changeNumber}>
                  <Text style={[styles.changeNumberText, isHospital && styles.hospitalLink]}>
                    Change Phone Number
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <Feather name="shield" size={16} color={iconColor} />
            <Text style={[styles.footerText, isHospital && styles.hospitalFooter]}>
              OTP is valid for 10 minutes
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
  button: {
    marginTop: 16,
  },
  hospitalButton: {
    backgroundColor: '#43A047',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  hospitalLink: {
    color: '#2E7D32',
  },
  changeNumber: {
    alignItems: 'center',
    marginTop: 16,
  },
  changeNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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

export default LoginWithOTPScreen;
