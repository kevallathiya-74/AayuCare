/**
 * Navigation Route Constants
 * Single source of truth for all screen names in the app.
 * Use these instead of raw string literals to prevent typo bugs.
 *
 * @example
 *   navigation.navigate(Routes.ADMIN.MANAGE_DOCTORS);
 *   navigation.navigate(Routes.TABS.ADMIN);
 */

// ─── Auth / Splash ───────────────────────────────────────────────────────────
export const AUTH = Object.freeze({
  SPLASH: "SplashScreen",
  BOX_SELECTION: "BoxSelection",
  LOGIN: "Login",
  FORGOT_PASSWORD: "ForgotPassword",
  RESET_PASSWORD: "ResetPassword",
});

// ─── Tab Navigators ───────────────────────────────────────────────────────────
export const TABS = Object.freeze({
  ADMIN: "AdminTabs",
  DOCTOR: "DoctorTabs",
  PATIENT: "PatientTabs",
});

// ─── Admin Tab Screens ────────────────────────────────────────────────────────
export const ADMIN_TABS = Object.freeze({
  DASHBOARD: "Dashboard",
  APPOINTMENTS: "Appointments",
  REPORTS: "Reports",
  SETTINGS: "Settings",
});

// ─── Admin Stack Screens ──────────────────────────────────────────────────────
export const ADMIN = Object.freeze({
  MANAGE_DOCTORS: "ManageDoctors",
  PATIENT_MANAGEMENT: "PatientManagement",
  CREATE_PRESCRIPTION: "CreatePrescription",
  REPORTS: "Reports",
  PHARMACY_MANAGEMENT: "PharmacyManagement",
  APPOINTMENTS: "Appointments",
  ADMIN_SETTINGS: "AdminSettings",
  SECURITY_SETTINGS: "SecuritySettings",
  NOTIFICATIONS: "NotificationsScreen",
  HOSPITAL_EVENTS: "HospitalEventsScreen",
  SETTINGS_ACCESSIBILITY: "SettingsAccessibility",
  SETTINGS: "Settings",
  EDIT_PROFILE: "EditProfile",
  CHANGE_PASSWORD: "ChangePassword",
});

// ─── Doctor Tab Screens ───────────────────────────────────────────────────────
export const DOCTOR_TABS = Object.freeze({
  DASHBOARD: "DoctorHome",
  TODAYS_APPOINTMENTS: "TodaysAppointments",
  PATIENTS: "DoctorPatients",
  PROFILE: "DoctorProfile",
});

// ─── Doctor Stack Screens ─────────────────────────────────────────────────────
export const DOCTOR = Object.freeze({
  EDIT_PROFILE: "EditProfile",
  CONSULTATION_HISTORY: "ConsultationHistory",
  SCHEDULE_AVAILABILITY: "ScheduleAvailability",
  WALK_IN_PATIENT: "WalkInPatient",
  PATIENT_MANAGEMENT: "PatientManagement",
  PATIENT_DETAILS: "PatientDetails",
  CREATE_PRESCRIPTION: "CreatePrescription",
  CONSULTATION: "Consultation",
  NOTIFICATIONS: "NotificationsScreen",
  SETTINGS_ACCESSIBILITY: "SettingsAccessibility",
  SETTINGS: "Settings",
});

// ─── Patient Tab Screens ──────────────────────────────────────────────────────
export const PATIENT_TABS = Object.freeze({
  HOME: "PatientHome",
  APPOINTMENTS: "PatientAppointments",
  REPORTS: "PatientReports",
  PROFILE: "PatientProfile",
});

// ─── Patient Stack Screens ────────────────────────────────────────────────────
export const PATIENT = Object.freeze({
  PROFILE: "Profile",
  EDIT_PROFILE: "PatientEditProfile",
  MY_PRESCRIPTIONS: "MyPrescriptions",
  DISEASE_INFO: "DiseaseInfo",
  HOSPITAL_EVENTS: "HospitalEvents",
  PHARMACY_BILLING: "PharmacyBilling",
  AI_HEALTH_ASSISTANT: "AIHealthAssistant",
  SPECIALIST_CARE_FINDER: "SpecialistCareFinder",
  DOCTOR_PROFILE_VIEW: "DoctorProfileView",
  APPOINTMENT_BOOKING: "AppointmentBooking",
  MEDICAL_RECORDS: "MedicalRecords",
  AI_SYMPTOM_CHECKER: "AISymptomChecker",
  EMERGENCY: "Emergency",
  NOTIFICATIONS: "Notifications",
  MY_APPOINTMENTS: "MyAppointments",
  MY_REPORTS: "MyReports",
  HEALTH_METRICS: "HealthMetrics",
  SETTINGS_ACCESSIBILITY: "SettingsAccessibility",
  SETTINGS: "Settings",
});

// ─── Shared / Common ─────────────────────────────────────────────────────────
export const SHARED = Object.freeze({
  CHANGE_PASSWORD: "ChangePassword",
});

// ─── Default export — full routes map ────────────────────────────────────────
const Routes = Object.freeze({
  AUTH,
  TABS,
  ADMIN_TABS,
  ADMIN,
  DOCTOR_TABS,
  DOCTOR,
  PATIENT_TABS,
  PATIENT,
  SHARED,
});

export default Routes;
