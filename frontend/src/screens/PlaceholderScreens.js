/**
 * AayuCare - Placeholder Screens
 * 
 * Simplified implementations for core screens to establish structure.
 * These will be enhanced with full UI/UX in subsequent phases.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { textStyles } from '../theme/typography';
import { spacing, componentSpacing } from '../theme/spacing';

const createPlaceholderScreen = (title, description) => {
  return ({ navigation }) => (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderText}>UI Component Placeholder</Text>
          <Text style={styles.placeholderSubtext}>
            Full implementation coming in next phase
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: componentSpacing.screenPadding,
  },
  title: {
    ...textStyles.displayMedium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  placeholderBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: colors.borderRadius.medium,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  placeholderText: {
    ...textStyles.h4,
    color: colors.text.tertiary,
  },
  placeholderSubtext: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
});

// Auth Screens
export const LoginScreen = createPlaceholderScreen('Login', 'Sign in to your AayuCare account');
export const RegisterScreen = createPlaceholderScreen('Register', 'Create your AayuCare account');
export const OTPScreen = createPlaceholderScreen('Verify OTP', 'Enter the verification code');
export const ForgotPasswordScreen = createPlaceholderScreen('Forgot Password', 'Reset your password');
export const ResetPasswordScreen = createPlaceholderScreen('Reset Password', 'Create a new password');

// Main Screens
export const HomeScreen = createPlaceholderScreen('Home', 'Welcome to AayuCare');
export const AppointmentsScreen = createPlaceholderScreen('Appointments', 'Manage your appointments');
export const HealthRecordsScreen = createPlaceholderScreen('Health Records', 'Your medical history');
export const ProfileScreen = createPlaceholderScreen('Profile', 'Your account & settings');

// Doctor Screens
export const DoctorListScreen = createPlaceholderScreen('Find Doctors', 'Search for healthcare professionals');
export const DoctorProfileScreen = createPlaceholderScreen('Doctor Profile', 'Doctor details & booking');

// Appointment Screens
export const BookAppointmentScreen = createPlaceholderScreen('Book Appointment', 'Schedule your visit');
export const AppointmentDetailScreen = createPlaceholderScreen('Appointment Details', 'View appointment information');

// Health Screens
export const HealthRecordDetailScreen = createPlaceholderScreen('Record Details', 'View health record');
export const AddHealthRecordScreen = createPlaceholderScreen('Add Record', 'Add new health record');
export const VitalsScreen = createPlaceholderScreen('Track Vitals', 'Monitor your health metrics');

// Profile Screens
export const SettingsScreen = createPlaceholderScreen('Settings', 'App preferences & privacy');
export const EditProfileScreen = createPlaceholderScreen('Edit Profile', 'Update your information');
