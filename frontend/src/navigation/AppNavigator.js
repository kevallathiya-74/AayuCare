/**
 * AayuCare - App Navigator (Root Navigator)
 *
 * Role-based navigation:
 * - Admin → Admin Dashboard
 * - Doctor → Doctor Dashboard
 * - Patient → Patient Dashboard
 * - User → Main App (Home, Doctors, etc.)
 */

import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "../store/slices/authSlice";
import { healthColors } from "../theme/healthColors";

// Splash & Selection
import BoxSelectionScreen from "../screens/splash/BoxSelectionScreen";
import SplashScreen from "../screens/splash/SplashScreen";

// Auth Screens
import UnifiedLoginScreen from "../screens/auth/UnifiedLoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// Tab Navigators (Role-based)
import AdminTabNavigator from "./AdminTabNavigator";
import DoctorTabNavigator from "./DoctorTabNavigator";
import PatientTabNavigator from "./PatientTabNavigator";

// Additional Screens (not in tabs)
import {
  ManageDoctorsScreen,
  PatientManagementScreen,
  EnhancedPrescriptionScreen,
  WalkInPatientScreen,
  ReportsScreen,
  AppointmentsScreen,
  AdminSettingsScreen,
} from "../screens/hospital";

import SecuritySettingsScreen from "../screens/hospital/SecuritySettingsScreen";

// Doctor Profile Screens
import EditProfileScreen from "../screens/hospital/EditProfileScreen";
import ConsultationHistoryScreen from "../screens/hospital/ConsultationHistoryScreen";
import ScheduleAvailabilityScreen from "../screens/hospital/ScheduleAvailabilityScreen";

import { MyPrescriptionsScreen, ProfileScreen } from "../screens/patient";

// New Patient Screens
import NotificationsScreen from "../screens/patient/NotificationsScreen";
import ActivityTrackerScreen from "../screens/patient/ActivityTrackerScreen";
import WomensHealthScreen from "../screens/patient/WomensHealthScreen";
import DiseaseInfoScreen from "../screens/patient/DiseaseInfoScreen";
import HospitalEventsScreen from "../screens/patient/HospitalEventsScreen";
import PharmacyBillingScreen from "../screens/patient/PharmacyBillingScreen";
import AIHealthAssistantScreen from "../screens/patient/AIHealthAssistantScreen";
import SpecialistCareFinderScreen from "../screens/patient/SpecialistCareFinderScreen";
import AppointmentBookingScreen from "../screens/patient/AppointmentBookingScreen";
import MedicalRecordsScreen from "../screens/patient/MedicalRecordsScreen";
import HealthMetricsDashboard from "../screens/patient/HealthMetricsDashboard";
import AISymptomChecker from "../screens/patient/AISymptomChecker";
import EmergencyServices from "../screens/patient/EmergencyServices";

// User Main App
import { SettingsScreen, SettingsAccessibilityScreen } from "../screens/main";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth || {}
  );
  const navigationRef = useRef(null);
  const authInitialized = useRef(false); // Prevent multiple auth checks

  console.log("[AppNavigator] Rendering - Auth state:", {
    isAuthenticated,
    user: user?.userId,
    isLoading,
    authInitialized: authInitialized.current,
  });

  useEffect(() => {
    // Prevent multiple auth initializations
    if (authInitialized.current) {
      console.log("[AppNavigator] Auth already initialized, skipping");
      return;
    }

    authInitialized.current = true;

    // Load user asynchronously with error handling
    const initAuth = async () => {
      try {
        console.log("[AppNavigator] Initializing auth (ONCE)...");
        await dispatch(loadUser()).unwrap();
        console.log("[AppNavigator] Auth initialized successfully");
      } catch (error) {
        console.error(
          "[AppNavigator] Auth initialization error:",
          error?.message || error
        );
        // Continue anyway - auth will default to logged out state
      }
    };

    initAuth();
  }, []); // Empty deps - run ONCE on mount

  // Auto-navigate after successful login
  useEffect(() => {
    if (isAuthenticated && user && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      const userRole = user.role;

      // Don't auto-navigate if on splash screen (let splash handle it)
      if (currentRoute && currentRoute.name === "SplashScreen") {
        console.log(
          "[AppNavigator] On splash screen, letting it handle navigation"
        );
        return;
      }

      // Navigate to appropriate tab navigator based on role
      setTimeout(() => {
        if (userRole === "admin") {
          navigationRef.current?.navigate("AdminTabs");
        } else if (userRole === "doctor") {
          navigationRef.current?.navigate("DoctorTabs");
        } else if (userRole === "patient") {
          navigationRef.current?.navigate("PatientTabs");
        }
      }, 100); // Small delay to ensure navigation is ready
    }
  }, [isAuthenticated, user]);

  // Auto-navigate to Login when logged out
  useEffect(() => {
    if (!isAuthenticated && !isLoading && navigationRef.current) {
      // Only navigate if we're not already on an auth screen
      const currentRoute = navigationRef.current.getCurrentRoute();
      const authScreens = [
        "Login",
        "ForgotPassword",
        "SplashScreen",
        "BoxSelection",
      ];

      if (currentRoute && !authScreens.includes(currentRoute.name)) {
        console.log("[AppNavigator] User logged out, navigating to Login");
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }
    }
  }, [isAuthenticated, isLoading]);

  // Determine user role
  const userRole = user?.role;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: healthColors.background.primary },
        }}
      >
        {/* Splash & Selection - Always available */}
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{ animation: "fade" }}
        />
        <Stack.Screen
          name="BoxSelection"
          component={BoxSelectionScreen}
          options={{ animation: "fade" }}
        />

        {/* Auth Screens - Always available */}
        <Stack.Screen name="Login" component={UnifiedLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Role-based Tab Navigators - Only when authenticated */}
        {isAuthenticated && (
          <>
            {userRole === "admin" && (
              <>
                <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
                <Stack.Screen
                  name="ManageDoctors"
                  component={ManageDoctorsScreen}
                />
                <Stack.Screen
                  name="PatientManagement"
                  component={PatientManagementScreen}
                />
                <Stack.Screen
                  name="CreatePrescription"
                  component={EnhancedPrescriptionScreen}
                />
                <Stack.Screen name="Reports" component={ReportsScreen} />
                <Stack.Screen
                  name="Appointments"
                  component={AppointmentsScreen}
                />
                <Stack.Screen
                  name="AdminSettings"
                  component={AdminSettingsScreen}
                />
                <Stack.Screen
                  name="SecuritySettings"
                  component={SecuritySettingsScreen}
                />
                <Stack.Screen
                  name="NotificationsScreen"
                  component={NotificationsScreen}
                />
                <Stack.Screen
                  name="HospitalEventsScreen"
                  component={HospitalEventsScreen}
                />
                <Stack.Screen
                  name="SettingsAccessibility"
                  component={SettingsAccessibilityScreen}
                />
                <Stack.Screen name="Settings" component={SettingsScreen} />
              </>
            )}

            {userRole === "doctor" && (
              <>
                <Stack.Screen
                  name="DoctorTabs"
                  component={DoctorTabNavigator}
                />
                <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                />
                <Stack.Screen
                  name="ConsultationHistory"
                  component={ConsultationHistoryScreen}
                />
                <Stack.Screen
                  name="ScheduleAvailability"
                  component={ScheduleAvailabilityScreen}
                />
                <Stack.Screen
                  name="WalkInPatient"
                  component={WalkInPatientScreen}
                />
                <Stack.Screen
                  name="PatientManagement"
                  component={PatientManagementScreen}
                />
                <Stack.Screen
                  name="CreatePrescription"
                  component={EnhancedPrescriptionScreen}
                />
                <Stack.Screen
                  name="SettingsAccessibility"
                  component={SettingsAccessibilityScreen}
                />
                <Stack.Screen name="Settings" component={SettingsScreen} />
              </>
            )}

            {userRole === "patient" && (
              <>
                <Stack.Screen
                  name="PatientTabs"
                  component={PatientTabNavigator}
                />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen
                  name="MyPrescriptions"
                  component={MyPrescriptionsScreen}
                />

                <Stack.Screen
                  name="ActivityTracker"
                  component={ActivityTrackerScreen}
                />
                <Stack.Screen
                  name="WomensHealth"
                  component={WomensHealthScreen}
                />
                <Stack.Screen
                  name="DiseaseInfo"
                  component={DiseaseInfoScreen}
                />
                <Stack.Screen
                  name="HospitalEvents"
                  component={HospitalEventsScreen}
                />
                <Stack.Screen
                  name="PharmacyBilling"
                  component={PharmacyBillingScreen}
                />
                <Stack.Screen
                  name="AIHealthAssistant"
                  component={AIHealthAssistantScreen}
                />
                <Stack.Screen
                  name="SpecialistCareFinder"
                  component={SpecialistCareFinderScreen}
                />
                <Stack.Screen
                  name="AppointmentBooking"
                  component={AppointmentBookingScreen}
                />
                <Stack.Screen
                  name="MedicalRecords"
                  component={MedicalRecordsScreen}
                />
                <Stack.Screen
                  name="HealthMetrics"
                  component={HealthMetricsDashboard}
                />
                <Stack.Screen
                  name="AISymptomChecker"
                  component={AISymptomChecker}
                />
                <Stack.Screen name="Emergency" component={EmergencyServices} />
                <Stack.Screen
                  name="SettingsAccessibility"
                  component={SettingsAccessibilityScreen}
                />
                <Stack.Screen name="Settings" component={SettingsScreen} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
