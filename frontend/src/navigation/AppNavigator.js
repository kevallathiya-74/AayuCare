/**
 * AayuCare - App Navigator (Root Navigator)
 * 
 * Main navigation container with auth flow conditional rendering.
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import { loadUser } from '../store/slices/authSlice';
import colors from '../theme/colors';

// Import splash and selection screens
import SplashScreen from '../screens/splash/SplashScreen';
import BoxSelectionScreen from '../screens/splash/BoxSelectionScreen';
import HospitalLoginScreen from '../screens/auth/HospitalLoginScreen';
import UserLoginScreen from '../screens/auth/UserLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginWithOTPScreen from '../screens/auth/LoginWithOTPScreen';
import CreateAccountScreen from '../screens/auth/CreateAccountScreen';

// Import additional screens
import {
  DoctorListScreen,
  DoctorProfileScreen,
  BookAppointmentScreen,
  AppointmentDetailScreen,
  HealthRecordDetailScreen,
  AddHealthRecordScreen,
  VitalsScreen,
  SettingsScreen,
  EditProfileScreen,
} from '../screens/PlaceholderScreens';

const Stack = createNativeStackNavigator();

// Deep linking configuration
const linking = {
  prefixes: ['aayucare://', 'https://aayucare.com'],
  config: {
    screens: {
      Splash: 'splash',
      BoxSelection: 'select',
      HospitalLogin: 'hospital-login',
      UserLogin: 'user-login',
      ForgotPassword: 'forgot-password',
      LoginWithOTP: 'login-otp',
      CreateAccount: 'create-account',
      Auth: {
        screens: {
          Login: 'auth/login',
          Register: 'auth/register',
          ForgotPassword: 'auth/forgot-password',
          OTP: 'auth/otp',
          ResetPassword: 'auth/reset-password',
        },
      },
      Main: {
        screens: {
          Home: 'home',
          Appointments: 'appointments',
          Health: 'health',
          Profile: 'profile',
        },
      },
      DoctorList: 'doctors',
      DoctorProfile: 'doctors/:id',
      BookAppointment: 'book-appointment',
      AppointmentDetail: 'appointments/:id',
    },
  },
};

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Load user on app start
    dispatch(loadUser());
  }, [dispatch]);

  // Don't show loading screen - let Splash handle initial display
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        {/* Splash and Box Selection Screens - Always available */}
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
        <Stack.Screen name="HospitalLogin" component={HospitalLoginScreen} />
        <Stack.Screen name="UserLogin" component={UserLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="LoginWithOTP" component={LoginWithOTPScreen} />
        <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />

        {!isAuthenticated ? (
          // Auth screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // Main app screens
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            
            {/* Doctors */}
            <Stack.Screen 
              name="DoctorList" 
              component={DoctorListScreen}
              options={{
                headerShown: true,
                title: 'Find Doctors',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
            <Stack.Screen 
              name="DoctorProfile" 
              component={DoctorProfileScreen}
              options={{
                headerShown: true,
                title: 'Doctor Profile',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
            
            {/* Appointments */}
            <Stack.Screen 
              name="BookAppointment" 
              component={BookAppointmentScreen}
              options={{
                headerShown: true,
                title: 'Book Appointment',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
            <Stack.Screen 
              name="AppointmentDetail" 
              component={AppointmentDetailScreen}
              options={{
                headerShown: true,
                title: 'Appointment Details',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
            
            {/* Health Records */}
            <Stack.Screen 
              name="HealthRecordDetail" 
              component={HealthRecordDetailScreen}
              options={{
                headerShown: true,
                title: 'Health Record',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
            <Stack.Screen 
              name="AddHealthRecord" 
              component={AddHealthRecordScreen}
              options={{
                headerShown: true,
                title: 'Add Health Record',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
            <Stack.Screen 
              name="Vitals" 
              component={VitalsScreen}
              options={{
                headerShown: true,
                title: 'Track Vitals',
                headerStyle: { backgroundColor: colors.background.primary },
                headerTintColor: colors.text.primary,
              }}
            />
            
            {/* Profile */}
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
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{
                headerShown: true,
                title: 'Edit Profile',
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
