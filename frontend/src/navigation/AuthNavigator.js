/**
 * AayuCare - Authentication Navigator
 * 
 * Handles onboarding, login, register, and password recovery flows.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import {
  LoginScreen,
  RegisterScreen,
  OTPScreen,
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '../screens/PlaceholderScreens';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen} 
      />
      <Stack.Screen 
        name="OTP" 
        component={OTPScreen} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
      />
      <Stack.Screen 
        name="ResetPassword" 
        component={ResetPasswordScreen} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
