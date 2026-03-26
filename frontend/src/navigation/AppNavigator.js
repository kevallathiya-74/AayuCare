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
import { AppState } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { loadUser } from "../store/slices/authSlice";
import { initializeNotificationPermissions } from "../store/slices/permissionSlice";
import { healthColors } from "../theme";
import { queryKeys } from "../config/reactQueryConfig";
import adminService from "../services/admin.service";
import {
  appointmentService,
  medicalRecordService,
  notificationService,
  prescriptionService,
} from "../services";
import logger from "../utils/logger";
import SplashScreen from "../screens/splash/SplashScreen";
import BoxSelectionScreen from "../screens/splash/BoxSelectionScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

import AdminTabNavigator from "./AdminTabNavigator";
import DoctorTabNavigator from "./DoctorTabNavigator";
import PatientTabNavigator from "./PatientTabNavigator";

import ManageDoctorsScreen from "../screens/hospital/ManageDoctorsScreen";
import ManagePatientsScreen from "../screens/hospital/ManagePatientsScreen";
import EnhancedPrescriptionScreen from "../screens/hospital/EnhancedPrescriptionScreen";
import WalkInPatientScreen from "../screens/hospital/WalkInPatientScreen";
import ReportsScreen from "../screens/hospital/ReportsScreen";
import PharmacyManagementScreen from "../screens/hospital/PharmacyManagementScreen";
import AppointmentsScreen from "../screens/hospital/AppointmentsScreen";
import AdminSettingsScreen from "../screens/hospital/AdminSettingsScreen";
import SecuritySettingsScreen from "../screens/hospital/SecuritySettingsScreen";
import EditProfileScreen from "../screens/hospital/EditProfileScreen";
import ConsultationHistoryScreen from "../screens/hospital/ConsultationHistoryScreen";
import ConsultationScreen from "../screens/hospital/ConsultationScreen";
import ScheduleAvailabilityScreen from "../screens/hospital/ScheduleAvailabilityScreen";

import ProfileScreen from "../screens/patient/ProfileScreen";
import PatientEditProfileScreen from "../screens/patient/PatientEditProfileScreen";
import MyPrescriptionsScreen from "../screens/patient/MyPrescriptionsScreen";
import NotificationsScreen from "../screens/patient/NotificationsScreen";
import ActivityTrackerScreen from "../screens/patient/ActivityTrackerScreen";
import HealthMetricsScreen from "../screens/patient/HealthMetricsScreen";
import WomensHealthScreen from "../screens/patient/WomensHealthScreen";
import DiseaseInfoScreen from "../screens/patient/DiseaseInfoScreen";
import HospitalEventsScreen from "../screens/patient/HospitalEventsScreen";
import PharmacyBillingScreen from "../screens/patient/PharmacyBillingScreen";
import AIHealthAssistantScreen from "../screens/patient/AIHealthAssistantScreen";
import SpecialistCareFinderScreen from "../screens/patient/SpecialistCareFinderScreen";
import AppointmentBookingScreen from "../screens/patient/AppointmentBookingScreen";
import MedicalRecordsScreen from "../screens/patient/MedicalRecordsScreen";
import AISymptomChecker from "../screens/patient/AISymptomChecker";
import EmergencyServices from "../screens/patient/EmergencyServices";
import MyAppointmentsScreen from "../screens/patient/MyAppointmentsScreen";
import MyReportsScreen from "../screens/patient/MyReportsScreen";

import SettingsScreen from "../screens/main/SettingsScreen";
import SettingsAccessibilityScreen from "../screens/main/SettingsAccessibilityScreen";
import ChangePasswordScreen from "../screens/main/ChangePasswordScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth || {}
  );
  const notificationPermission = useSelector(
    (state) => state.permissions?.notification || {}
  );
  const navigationRef = useRef(null);
  const authInitialized = useRef(false); // Prevent multiple auth checks
  const permissionsInitialized = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  logger.debug("AppNavigator", "Rendering auth state", {
    isAuthenticated,
    user: user?.id,
    isLoading,
    authInitialized: authInitialized.current,
  });

  useEffect(() => {
    // Prevent multiple auth initializations
    if (authInitialized.current) {
      logger.debug("AppNavigator", "Auth already initialized, skipping");
      return;
    }

    authInitialized.current = true;

    // Load user asynchronously with error handling
    const initAuth = async () => {
      try {
        logger.debug("AppNavigator", "Initializing auth (once)");
        await dispatch(loadUser()).unwrap();
        logger.debug("AppNavigator", "Auth initialized successfully");
      } catch (error) {
        logger.error(
          "AppNavigator",
          "Auth initialization error",
          error?.message || error
        );
        // Continue anyway - auth will default to logged out state
      }
    };

    initAuth();
  }, []); // Empty deps - run ONCE on mount

  useEffect(() => {
    if (permissionsInitialized.current) {
      return;
    }

    permissionsInitialized.current = true;

    const initPermissions = async () => {
      try {
        await dispatch(initializeNotificationPermissions()).unwrap();
      } catch (error) {
        logger.warn("AppNavigator", "Notification permission bootstrap failed", {
          error: error?.message || String(error),
        });
      }
    };

    initPermissions();
  }, [dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      const becameActive =
        appStateRef.current.match(/inactive|background/) && nextState === "active";

      appStateRef.current = nextState;

      if (!becameActive) {
        return;
      }

      try {
        await dispatch(initializeNotificationPermissions()).unwrap();
      } catch (error) {
        logger.warn("AppNavigator", "Notification permission refresh on foreground failed", {
          error: error?.message || String(error),
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

  // Auto-navigate after successful login
  useEffect(() => {
    if (isAuthenticated && user && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      const userRole = user.role;

      logger.debug(
        "AppNavigator",
        "User authenticated on route",
        currentRoute?.name
      );
      logger.debug("AppNavigator", "User role", userRole);

      // Don't auto-navigate if on splash screen (let splash handle it)
      if (currentRoute && currentRoute.name === "SplashScreen") {
        logger.debug(
          "AppNavigator",
          "On splash screen, navigation handled there"
        );
        return;
      }

      // Only auto-navigate to tabs if coming from an auth/onboarding screen
      const authScreens = ["Login", "ForgotPassword", "SplashScreen", "BoxSelection"];
      if (currentRoute && !authScreens.includes(currentRoute.name)) {
        logger.debug("AppNavigator", "Already on protected screen, skipping auto-navigate", currentRoute.name);
        return;
      }

      // Don't navigate if already on correct tab screen
      const roleScreens = {
        admin: "AdminTabs",
        doctor: "DoctorTabs",
        patient: "PatientTabs",
      };

      const targetScreen = roleScreens[userRole];
      if (currentRoute && currentRoute.name === targetScreen) {
        logger.debug("AppNavigator", "Already on correct screen", targetScreen);
        return;
      }

      // Navigate to appropriate tab navigator based on role
      logger.debug("AppNavigator", "Navigating to target", targetScreen);
      if (navigationRef.current?.isReady()) {
        if (userRole === "admin") {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "AdminTabs" }],
          });
        } else if (userRole === "doctor") {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "DoctorTabs" }],
          });
        } else if (userRole === "patient") {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: "PatientTabs" }],
          });
        }
      }
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
        logger.debug("AppNavigator", "Logged out, navigating to Login");
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated || !user?.role || !navigationRef.current?.isReady?.()) {
      return;
    }

    const rolePreloadMap = {
      admin: [
        "AdminTabs",
        "ManageDoctors",
        "PatientManagement",
        "Appointments",
        "Reports",
        "PharmacyManagement",
      ],
      doctor: [
        "DoctorTabs",
        "ConsultationHistory",
        "ScheduleAvailability",
        "WalkInPatient",
        "Consultation",
      ],
      patient: [
        "PatientTabs",
        "Profile",
        "PatientEditProfile",
        "HospitalEvents",
        "MyAppointments",
        "MyPrescriptions",
        "Notifications",
        "AppointmentBooking",
        "SpecialistCareFinder",
        "MedicalRecords",
        "AIHealthAssistant",
        "AISymptomChecker",
        "Emergency",
        "PharmacyBilling",
        "MyReports",
        "DiseaseInfo",
        "WomensHealth",
        "HealthMetrics",
      ],
    };

    const preload = navigationRef.current?.preload;
    if (typeof preload !== "function") {
      return;
    }

    const timer = setTimeout(() => {
      const screens = rolePreloadMap[user.role] || [];
      screens.forEach((screenName) => {
        try {
          preload(screenName);
        } catch (error) {
          logger.warn("AppNavigator", "Screen preload skipped", {
            screenName,
            error: error?.message,
          });
        }
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const role = user.role;
    const canUseNotifications =
      notificationPermission.granted && notificationPermission.notificationsEnabled;

    if (role === "patient") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats.patient(user.id),
        queryFn: async () => {
          const [appointmentsRes, recordsRes, prescriptionsRes] = await Promise.allSettled([
            appointmentService.getPatientAppointments(user.id),
            medicalRecordService.getPatientRecords(user.id, { page: 1, limit: 10 }),
            prescriptionService.getPatientPrescriptions(user.id),
          ]);

          const getCount = (result, keys = []) => {
            if (result.status !== "fulfilled") return 0;
            const payload = result.value;
            if (Array.isArray(payload)) return payload.length;
            if (Array.isArray(payload?.data)) return payload.data.length;
            for (const key of keys) {
              const value = payload?.[key] || payload?.data?.[key];
              if (Array.isArray(value)) return value.length;
            }
            return 0;
          };

          return {
            appointments: getCount(appointmentsRes, ["appointments", "items", "rows"]),
            records: getCount(recordsRes, ["medicalRecords", "records", "items", "rows"]),
            prescriptions: getCount(prescriptionsRes, ["prescriptions", "items", "rows"]),
          };
        },
        staleTime: 60 * 1000,
      });

      if (canUseNotifications) {
        queryClient.prefetchQuery({
          queryKey: queryKeys.notifications.unreadCount(),
          queryFn: () => notificationService.getUnreadCount(),
          staleTime: 30 * 1000,
        });
      }

      queryClient.prefetchQuery({
        queryKey: queryKeys.appointments.patient(user.id),
        queryFn: () => appointmentService.getPatientAppointments(user.id),
        staleTime: 2 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: queryKeys.prescriptions.patient(user.id),
        queryFn: () => prescriptionService.getPatientPrescriptions(user.id),
        staleTime: 2 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: queryKeys.medicalRecords.patient(user.id),
        queryFn: () => medicalRecordService.getPatientRecords(user.id, {
          page: 1,
          limit: 10,
        }),
        staleTime: 5 * 60 * 1000,
      });
    }

    if (role === "admin" || role === "doctor") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats.admin(),
        queryFn: () => adminService.getDashboardStats(),
        staleTime: 60 * 1000,
      });
    }
  }, [
    isAuthenticated,
    user?.id,
    user?.role,
    queryClient,
    notificationPermission.granted,
    notificationPermission.notificationsEnabled,
  ]);

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
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Role-based Tab Navigators - Only when authenticated */}
        {isAuthenticated && (
          <>
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
            />
            {userRole === "admin" && (
              <>
                <Stack.Screen name="AdminTabs" component={AdminTabNavigator} />
                <Stack.Screen
                  name="ManageDoctors"
                  component={ManageDoctorsScreen}
                />
                <Stack.Screen
                  name="PatientManagement"
                  component={ManagePatientsScreen}
                />
                <Stack.Screen
                  name="CreatePrescription"
                  component={EnhancedPrescriptionScreen}
                />
                <Stack.Screen name="Reports" component={ReportsScreen} />
                <Stack.Screen
                  name="PharmacyManagement"
                  component={PharmacyManagementScreen}
                />
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
                <Stack.Screen
                  name="EditProfile"
                  component={EditProfileScreen}
                />
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
                  component={ManagePatientsScreen}
                />
                <Stack.Screen
                  name="PatientDetails"
                  component={ManagePatientsScreen}
                />
                <Stack.Screen
                  name="CreatePrescription"
                  component={EnhancedPrescriptionScreen}
                />
                <Stack.Screen
                  name="Consultation"
                  component={ConsultationScreen}
                  options={{
                    headerShown: true,
                    headerShadowVisible: false,
                    headerBackVisible: false,
                    headerStyle: { backgroundColor: healthColors.background.primary },
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="NotificationsScreen"
                  component={NotificationsScreen}
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
                  name="PatientEditProfile"
                  component={PatientEditProfileScreen}
                />
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
                  name="AISymptomChecker"
                  component={AISymptomChecker}
                />
                <Stack.Screen name="Emergency" component={EmergencyServices} />
                <Stack.Screen
                  name="Notifications"
                  component={NotificationsScreen}
                />
                <Stack.Screen
                  name="MyAppointments"
                  component={MyAppointmentsScreen}
                />
                <Stack.Screen
                  name="MyReports"
                  component={MyReportsScreen}
                />
                <Stack.Screen
                  name="HealthMetrics"
                  component={HealthMetricsScreen}
                />
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

