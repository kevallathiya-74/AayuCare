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
import { loadUser } from "@/store/slices/authSlice";
import { initializeNotificationPermissions } from "@/store/slices/permissionSlice";
import { healthColors } from "@/theme";
import { queryKeys } from "@/config/reactQueryConfig";
import Routes from "./routes";
import ErrorBoundary from "../components/common/ErrorBoundary";
import adminService from "@/services/admin.service";
import {
  appointmentService,
  doctorService,
  medicalRecordService,
  notificationService,
  prescriptionService,
} from "@/services";
import logger from "@/utils/logger";
import SplashScreen from "@/features/splash/screens/SplashScreen";
import BoxSelectionScreen from "@/features/splash/screens/BoxSelectionScreen";
import LoginScreen from "@/features/auth/screens/LoginScreen";
import ForgotPasswordScreen from "@/features/auth/screens/ForgotPasswordScreen";

import AdminTabNavigator from "./AdminTabNavigator";
import DoctorTabNavigator from "./DoctorTabNavigator";
import PatientTabNavigator from "./PatientTabNavigator";

import ManageDoctorsScreen from "@/features/hospital/screens/ManageDoctorsScreen";
import ManagePatientsScreen from "@/features/hospital/screens/ManagePatientsScreen";
import EnhancedPrescriptionScreen from "@/features/hospital/screens/EnhancedPrescriptionScreen";
import WalkInPatientScreen from "@/features/hospital/screens/WalkInPatientScreen";
import ReportsScreen from "@/features/hospital/screens/ReportsScreen";
import PharmacyManagementScreen from "@/features/hospital/screens/PharmacyManagementScreen";
import AppointmentsScreen from "@/features/hospital/screens/AppointmentsScreen";
import AdminSettingsScreen from "@/features/hospital/screens/AdminSettingsScreen";
import SecuritySettingsScreen from "@/features/hospital/screens/SecuritySettingsScreen";
import EditProfileScreen from "@/features/hospital/screens/EditProfileScreen";
import ConsultationHistoryScreen from "@/features/hospital/screens/ConsultationHistoryScreen";
import ConsultationScreen from "@/features/hospital/screens/ConsultationScreen";
import ScheduleAvailabilityScreen from "@/features/hospital/screens/ScheduleAvailabilityScreen";

import ProfileScreen from "@/features/patient/screens/ProfileScreen";
import PatientEditProfileScreen from "@/features/patient/screens/PatientEditProfileScreen";
import MyPrescriptionsScreen from "@/features/patient/screens/MyPrescriptionsScreen";
import NotificationsScreen from "@/features/patient/screens/NotificationsScreen";
import HealthMetricsScreen from "@/features/patient/screens/HealthMetricsScreen";
import DiseaseInfoScreen from "@/features/patient/screens/DiseaseInfoScreen";
import HospitalEventsScreen from "@/features/patient/screens/HospitalEventsScreen";
import PharmacyBillingScreen from "@/features/patient/screens/PharmacyBillingScreen";
import AIHealthAssistantScreen from "@/features/patient/screens/AIHealthAssistantScreen";
import SpecialistCareFinderScreen from "@/features/patient/screens/SpecialistCareFinderScreen";
import DoctorProfileViewScreen from "@/features/patient/screens/DoctorProfileViewScreen";
import AppointmentBookingScreen from "@/features/patient/screens/AppointmentBookingScreen";
import MedicalRecordsScreen from "@/features/patient/screens/MedicalRecordsScreen";
import AISymptomChecker from "@/features/patient/screens/AISymptomChecker";
import EmergencyServices from "@/features/patient/screens/EmergencyServices";
import MyAppointmentsScreen from "@/features/patient/screens/MyAppointmentsScreen";
import MyReportsScreen from "@/features/patient/screens/MyReportsScreen";

import SettingsScreen from "@/features/main/screens/SettingsScreen";
import SettingsAccessibilityScreen from "@/features/main/screens/SettingsAccessibilityScreen";
import ChangePasswordScreen from "@/features/main/screens/ChangePasswordScreen";

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
  }, [dispatch]); // dispatch is stable from Redux

  useEffect(() => {
    if (permissionsInitialized.current) {
      return;
    }

    permissionsInitialized.current = true;

    const initPermissions = async () => {
      try {
        await dispatch(initializeNotificationPermissions()).unwrap();
      } catch (error) {
        logger.warn(
          "AppNavigator",
          "Notification permission bootstrap failed",
          {
            error: error?.message || String(error),
          }
        );
      }
    };

    initPermissions();
  }, [dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        const becameActive =
          appStateRef.current.match(/inactive|background/) &&
          nextState === "active";

        appStateRef.current = nextState;

        if (!becameActive) {
          return;
        }

        try {
          await dispatch(initializeNotificationPermissions()).unwrap();
        } catch (error) {
          logger.warn(
            "AppNavigator",
            "Notification permission refresh on foreground failed",
            {
              error: error?.message || String(error),
            }
          );
        }

        // If we are not authenticated, attempt to reload/validate user session on focus (recovery)
        if (!isAuthenticated) {
          logger.debug(
            "AppNavigator",
            "App focused and unauthenticated, retrying loadUser..."
          );
          dispatch(loadUser());
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [dispatch, isAuthenticated]);

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
      if (currentRoute && currentRoute.name === Routes.AUTH.SPLASH) {
        logger.debug(
          "AppNavigator",
          "On splash screen, navigation handled there"
        );
        return;
      }

      // Only auto-navigate to tabs if coming from an auth/onboarding screen
      const authScreens = [
        Routes.AUTH.LOGIN,
        Routes.AUTH.FORGOT_PASSWORD,
        Routes.AUTH.SPLASH,
        Routes.AUTH.BOX_SELECTION,
      ];
      if (currentRoute && !authScreens.includes(currentRoute.name)) {
        logger.debug(
          "AppNavigator",
          "Already on protected screen, skipping auto-navigate",
          currentRoute.name
        );
        return;
      }

      // Don't navigate if already on correct tab screen
      const roleScreens = {
        admin: Routes.TABS.ADMIN,
        doctor: Routes.TABS.DOCTOR,
        patient: Routes.TABS.PATIENT,
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
            routes: [{ name: Routes.TABS.ADMIN }],
          });
        } else if (userRole === "doctor") {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: Routes.TABS.DOCTOR }],
          });
        } else if (userRole === "patient") {
          navigationRef.current?.reset({
            index: 0,
            routes: [{ name: Routes.TABS.PATIENT }],
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
        Routes.AUTH.LOGIN,
        Routes.AUTH.FORGOT_PASSWORD,
        Routes.AUTH.SPLASH,
        Routes.AUTH.BOX_SELECTION,
      ];

      if (currentRoute && !authScreens.includes(currentRoute.name)) {
        logger.debug("AppNavigator", "Logged out, navigating to Login");
        navigationRef.current.reset({
          index: 0,
          routes: [{ name: Routes.AUTH.LOGIN }],
        });
      }
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !user?.role ||
      !navigationRef.current?.isReady?.()
    ) {
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
      notificationPermission.granted &&
      notificationPermission.notificationsEnabled;

    if (role === "patient") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats.patient(user.id),
        queryFn: async () => {
          const [appointmentsRes, recordsRes, prescriptionsRes] =
            await Promise.allSettled([
              appointmentService.getPatientAppointments(user.id),
              medicalRecordService.getPatientRecords(user.id, {
                page: 1,
                limit: 10,
              }),
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
            appointments: getCount(appointmentsRes, [
              "appointments",
              "items",
              "rows",
            ]),
            records: getCount(recordsRes, [
              "medicalRecords",
              "records",
              "items",
              "rows",
            ]),
            prescriptions: getCount(prescriptionsRes, [
              "prescriptions",
              "items",
              "rows",
            ]),
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
        queryFn: () =>
          medicalRecordService.getPatientRecords(user.id, {
            page: 1,
            limit: 10,
          }),
        staleTime: 5 * 60 * 1000,
      });
    }

    if (role === "admin") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats.admin(),
        queryFn: () => adminService.getDashboardStats(),
        staleTime: 60 * 1000,
      });
    }

    if (role === "doctor") {
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboardStats.doctor(user.id),
        queryFn: () => doctorService.getDashboard(),
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
    <ErrorBoundary>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={Routes.AUTH.SPLASH}
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: healthColors.background.primary },
          }}
        >
          {/* Splash & Selection - Always available */}
          <Stack.Screen
            name={Routes.AUTH.SPLASH}
            component={SplashScreen}
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name={Routes.AUTH.BOX_SELECTION}
            component={BoxSelectionScreen}
            options={{ animation: "fade" }}
          />

          {/* Auth Screens - Always available */}
          <Stack.Screen name={Routes.AUTH.LOGIN} component={LoginScreen} />
          <Stack.Screen
            name={Routes.AUTH.FORGOT_PASSWORD}
            component={ForgotPasswordScreen}
          />

          {/* Role-based Tab Navigators - Only when authenticated */}
          {isAuthenticated && (
            <>
              <Stack.Screen
                name={Routes.SHARED.CHANGE_PASSWORD}
                component={ChangePasswordScreen}
              />
              {userRole === "admin" && (
                <>
                  <Stack.Screen
                    name={Routes.TABS.ADMIN}
                    component={AdminTabNavigator}
                  />
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
                    name={Routes.TABS.DOCTOR}
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
                      headerStyle: {
                        backgroundColor: healthColors.background.primary,
                      },
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
                    name={Routes.TABS.PATIENT}
                    component={PatientTabNavigator}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.PROFILE}
                    component={ProfileScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.EDIT_PROFILE}
                    component={PatientEditProfileScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.MY_PRESCRIPTIONS}
                    component={MyPrescriptionsScreen}
                  />

                  <Stack.Screen
                    name={Routes.PATIENT.DISEASE_INFO}
                    component={DiseaseInfoScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.HOSPITAL_EVENTS}
                    component={HospitalEventsScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.PHARMACY_BILLING}
                    component={PharmacyBillingScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.AI_HEALTH_ASSISTANT}
                    component={AIHealthAssistantScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.SPECIALIST_CARE_FINDER}
                    component={SpecialistCareFinderScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.DOCTOR_PROFILE_VIEW}
                    component={DoctorProfileViewScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.APPOINTMENT_BOOKING}
                    component={AppointmentBookingScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.MEDICAL_RECORDS}
                    component={MedicalRecordsScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.AI_SYMPTOM_CHECKER}
                    component={AISymptomChecker}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.EMERGENCY}
                    component={EmergencyServices}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.NOTIFICATIONS}
                    component={NotificationsScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.MY_APPOINTMENTS}
                    component={MyAppointmentsScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.MY_REPORTS}
                    component={MyReportsScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.HEALTH_METRICS}
                    component={HealthMetricsScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.SETTINGS_ACCESSIBILITY}
                    component={SettingsAccessibilityScreen}
                  />
                  <Stack.Screen
                    name={Routes.PATIENT.SETTINGS}
                    component={SettingsScreen}
                  />
                </>
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
};

export default AppNavigator;
