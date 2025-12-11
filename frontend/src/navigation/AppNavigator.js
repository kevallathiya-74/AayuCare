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
import SplashScreen from '../screens/splash/SplashScreen';
import RoleSelectionScreen from '../screens/splash/RoleSelectionScreen';

// Auth Screens
import UnifiedLoginScreen from '../screens/auth/UnifiedLoginScreen';
import HospitalLoginScreen from '../screens/auth/HospitalLoginScreen';
import PatientLoginScreen from '../screens/auth/PatientLoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Tab Navigators (Role-based)
import AdminTabNavigator from './AdminTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import PatientTabNavigator from './PatientTabNavigator';

// Additional Screens (not in tabs)
import {
  ManageDoctorsScreen,
  ManagePatientsScreen,
  PatientManagementScreen,
  EnhancedPrescriptionScreen,
} from '../screens/hospital';

import {
  MyPrescriptionsScreen,
  HealthStatusScreen,
  ChatWithHospitalScreen,
  BillingScreen,
} from '../screens/patient';

// New Patient Screens
import ActivityTrackerScreen from '../screens/patient/ActivityTrackerScreen';
import WomensHealthScreen from '../screens/patient/WomensHealthScreen';
import DiseaseInfoScreen from '../screens/patient/DiseaseInfoScreen';
import HospitalEventsScreen from '../screens/patient/HospitalEventsScreen';
import PharmacyBillingScreen from '../screens/patient/PharmacyBillingScreen';
import AIHealthAssistantScreen from '../screens/patient/AIHealthAssistantScreen';
import SpecialistCareFinderScreen from '../screens/patient/SpecialistCareFinderScreen';
import AppointmentBookingScreen from '../screens/patient/AppointmentBookingScreen';
import MedicalRecordsScreen from '../screens/patient/MedicalRecordsScreen';
import HealthMetricsDashboard from '../screens/patient/HealthMetricsDashboard';
import AISymptomChecker from '../screens/patient/AISymptomChecker';
import EmergencyServices from '../screens/patient/EmergencyServices';

// User Main App
import TabNavigator from './TabNavigator';
import { SettingsScreen, SettingsAccessibilityScreen } from '../screens/main';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth || {});
  const navigationRef = useRef(null);

  console.log('[AppNavigator] Initializing...');
  console.log('[AppNavigator] Auth state:', { isAuthenticated, user: user?.userId, isLoading });

  useEffect(() => {
    // Load user asynchronously with error handling
    const initAuth = async () => {
      try {
        console.log('[AppNavigator] Loading user...');
        await dispatch(loadUser());
        console.log('[AppNavigator] User loaded successfully');
      } catch (error) {
        console.error('[AppNavigator] ═══════════════════════════════════');
        console.error('[AppNavigator] Error loading user:', error);
        console.error('[AppNavigator] Error message:', error?.message);
        console.error('[AppNavigator] Error stack:', error?.stack);
        console.error('[AppNavigator] ═══════════════════════════════════');
        // Continue anyway - auth will default to logged out state
      }
    };
    
    initAuth();
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
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: healthColors.background.primary },
        }}
      >
        {/* Splash & Selection - Always available */}
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ animation: 'fade' }}
        />
        <Stack.Screen
          name="RoleSelection"
          component={RoleSelectionScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
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
        <Stack.Screen name="Login" component={UnifiedLoginScreen} />
        <Stack.Screen name="HospitalLogin" component={HospitalLoginScreen} />
        <Stack.Screen name="PatientLogin" component={PatientLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Role-based Tab Navigators - Only when authenticated */}
        {isAuthenticated && (
          <>
            {userRole === 'admin' && (
              <>
                <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
                <Stack.Screen name="ManageDoctors" component={ManageDoctorsScreen} />
                <Stack.Screen name="ManagePatients" component={ManagePatientsScreen} />
                <Stack.Screen name="PatientManagement" component={PatientManagementScreen} />
                <Stack.Screen name="CreatePrescription" component={EnhancedPrescriptionScreen} />
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
                <Stack.Screen name="ActivityTracker" component={ActivityTrackerScreen} />
                <Stack.Screen name="WomensHealth" component={WomensHealthScreen} />
                <Stack.Screen name="DiseaseInfo" component={DiseaseInfoScreen} />
                <Stack.Screen name="HospitalEvents" component={HospitalEventsScreen} />
                <Stack.Screen name="PharmacyBilling" component={PharmacyBillingScreen} />
                <Stack.Screen name="AIHealthAssistant" component={AIHealthAssistantScreen} />
                <Stack.Screen name="SpecialistCareFinder" component={SpecialistCareFinderScreen} />
                <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} />
                <Stack.Screen name="MedicalRecords" component={MedicalRecordsScreen} />
                <Stack.Screen name="HealthMetrics" component={HealthMetricsDashboard} />
                <Stack.Screen name="AISymptomChecker" component={AISymptomChecker} />
                <Stack.Screen name="Emergency" component={EmergencyServices} />
                <Stack.Screen name="SettingsAccessibility" component={SettingsAccessibilityScreen} />
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
