/**
 * AayuCare - App Navigator (Root Navigator)
 * 
 * Role-based navigation:
 * - Admin → Admin Dashboard
 * - Doctor → Doctor Dashboard
 * - Patient → Patient Dashboard
 * - User → Main App (Home, Doctors, etc.)
 */

import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../store/slices/authSlice';
import { healthColors } from '../theme/healthColors';

// Splash & Selection
import AnimatedSplashScreen from '../screens/splash/AnimatedSplashScreen';
import BoxSelectionScreen from '../screens/splash/BoxSelectionScreen';

// Auth Screens
import HospitalLoginScreen from '../screens/auth/HospitalLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Tab Navigators (Role-based)
import AdminTabNavigator from './AdminTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import PatientTabNavigator from './PatientTabNavigator';

// Additional Screens (not in tabs)
import {
  ManageDoctorsScreen,
  ManagePatientsScreen,
} from '../screens/hospital';

import {
  MyPrescriptionsScreen,
  HealthStatusScreen,
  ChatWithHospitalScreen,
  BillingScreen,
} from '../screens/patient';

// User Main App
import TabNavigator from './TabNavigator';
import { SettingsScreen } from '../screens/main';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigationRef = useRef(null);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Auto-navigate after successful login
  useEffect(() => {
    if (isAuthenticated && user && navigationRef.current) {
      const userRole = user.role;

      // Navigate to appropriate tab navigator based on role
      setTimeout(() => {
        if (userRole === 'admin') {
          navigationRef.current?.navigate('AdminTabs');
        } else if (userRole === 'doctor') {
          navigationRef.current?.navigate('DoctorTabs');
        } else if (userRole === 'patient') {
          navigationRef.current?.navigate('PatientTabs');
        } else if (userRole === 'user') {
          navigationRef.current?.navigate('Main');
        }
      }, 100); // Small delay to ensure navigation is ready
    }
  }, [isAuthenticated, user]);

  // Determine user role
  const userRole = user?.role;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="AnimatedSplash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: healthColors.background.primary },
        }}
      >
        {/* Splash & Selection - Always available */}
        <Stack.Screen
          name="AnimatedSplash"
          component={AnimatedSplashScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="BoxSelection"
          component={BoxSelectionScreen}
          options={{ animation: 'fade' }}
        />

        {/* Auth Screens - Always available */}
        <Stack.Screen name="HospitalLogin" component={HospitalLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Role-based Tab Navigators - Only when authenticated */}
        {isAuthenticated && (
          <>
            {userRole === 'admin' && (
              <>
                <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
                <Stack.Screen name="ManageDoctors" component={ManageDoctorsScreen} />
                <Stack.Screen name="ManagePatients" component={ManagePatientsScreen} />
              </>
            )}

            {userRole === 'doctor' && (
              <>
                <Stack.Screen name="DoctorTabs" component={DoctorTabNavigator} />
              </>
            )}

            {userRole === 'patient' && (
              <>
                <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
                <Stack.Screen name="MyPrescriptions" component={MyPrescriptionsScreen} />
                <Stack.Screen name="HealthStatus" component={HealthStatusScreen} />
                <Stack.Screen name="ChatWithHospital" component={ChatWithHospitalScreen} />
                <Stack.Screen name="Billing" component={BillingScreen} />
              </>
            )}

            {userRole === 'user' && (
              <>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{
                    headerShown: true,
                    title: 'Settings',
                    headerStyle: { backgroundColor: healthColors.background.primary },
                    headerTintColor: healthColors.text.primary,
                  }}
                />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
