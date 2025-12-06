/**
 * AayuCare - App Navigator (Root Navigator)
 * 
 * Clean navigation structure:
 * - Splash Screen
 * - Box Selection (Hospital/User)
 * - Auth Screens (Hospital Login, User Login, Forgot Password, OTP, Create Account)
 * - Main App (After Login)
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import colors from '../theme/colors';

// Splash & Selection
import SplashScreen from '../screens/splash/SplashScreen';
import BoxSelectionScreen from '../screens/splash/BoxSelectionScreen';

// Auth Screens
import HospitalLoginScreen from '../screens/auth/HospitalLoginScreen';
import UserLoginScreen from '../screens/auth/UserLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginWithOTPScreen from '../screens/auth/LoginWithOTPScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';

// Main App
import TabNavigator from './TabNavigator';
import { SettingsScreen } from '../screens/main';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        {/* Splash & Selection - Always available */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="BoxSelection"
          component={BoxSelectionScreen}
          options={{ animation: 'fade' }}
        />

        {!isAuthenticated ? (
          // Auth Flow
          <>
            <Stack.Screen name="HospitalLogin" component={HospitalLoginScreen} />
            <Stack.Screen name="UserLogin" component={UserLoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="LoginWithOTP" component={LoginWithOTPScreen} />
            <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
          </>
        ) : (
          // Main App
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                headerShown: true,
                title: 'Settings',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
