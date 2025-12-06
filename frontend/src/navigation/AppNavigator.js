/**
 * AayuCare - App Navigator (Root Navigator)
 * 
 * Role-based navigation:
 * - Admin → Admin Dashboard
 * - Doctor → Doctor Dashboard
 * - Patient → Patient Dashboard
 * - User → Main App (Home, Doctors, etc.)
 */

import React, { useEffect } from 'react';
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

// Hospital Screens (Role-based)
import {
  AdminDashboard,
  DoctorDashboard,
  PatientDashboard,
  TodaysAppointmentsScreen,
  PrescriptionCreationScreen,
} from '../screens/hospital';

// Patient Screens
import {
  MyAppointmentsScreen,
  MyReportsScreen,
} from '../screens/patient';

// User Main App
import TabNavigator from './TabNavigator';
import { SettingsScreen } from '../screens/main';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // Determine user role
  const userRole = user?.role;

  return (
    <NavigationContainer>
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

        {/* Role-based Dashboards - Only when authenticated */}
        {isAuthenticated && (
          <>
            {userRole === 'admin' && (
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            )}

            {userRole === 'doctor' && (
              <>
                <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} />
                <Stack.Screen name="TodaysAppointments" component={TodaysAppointmentsScreen} />
                <Stack.Screen name="WritePrescription" component={PrescriptionCreationScreen} />
              </>
            )}

            {userRole === 'patient' && (
              <>
                <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
                <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
                <Stack.Screen name="MyReports" component={MyReportsScreen} />
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
