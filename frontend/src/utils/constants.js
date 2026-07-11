/**
 * AayuCare - Application Constants
 *
 * Centralized constants for the app.
 * Note: API Configuration is in config/appConfig.js (APP_CONFIG)
 */

import {
  Calendar,
  Users,
  FileText,
  AlertCircle,
  Stethoscope,
  Search,
  FileEdit,
  Archive,
  Inbox,
  FileSpreadsheet,
  Pill,
} from "lucide-react-native";

// Storage Keys - SecureStore compatible (alphanumeric, dots, dashes, underscores only)
export const STORAGE_KEYS = {
  AUTH_TOKEN: "aayucare_auth_token",
  REFRESH_TOKEN: "aayucare_refresh_token",
  USER_DATA: "aayucare_user_data",
  SESSION_DATA: "aayucare_session_data",
  REQUEST_QUEUE: "aayucare_request_queue",
  ONBOARDING_COMPLETED: "aayucare_onboarding_completed",
  LANGUAGE: "aayucare_language",
  THEME: "aayucare_theme",
  NOTIFICATIONS_ENABLED: "aayucare_notifications_enabled",
};

export const EmptyStateConfig = {
  APPOINTMENTS: {
    icon: Calendar,
    title: "No Appointments",
    message: "You have no appointments scheduled at this time.",
  },
  PATIENTS: {
    icon: Users,
    title: "No Patients Found",
    message: "No patients match your current search or filter.",
  },
  DOCTORS: {
    icon: Stethoscope,
    title: "No Doctors Found",
    message: "No doctors are available or match your criteria.",
  },
  CONSULTATIONS: {
    icon: FileText,
    title: "No Consultations Yet",
    message: "Consultation history will appear here after the first visit.",
  },
  RECORDS: {
    icon: Archive,
    title: "No Health Records",
    message: "There are no health records available to display.",
  },
  PRESCRIPTIONS: {
    icon: FileEdit,
    title: "No Prescriptions",
    message: "No active or past prescriptions found.",
  },
  NOTIFICATIONS: {
    icon: AlertCircle,
    title: "No Notifications",
    message: "You're all caught up! No new notifications.",
  },
  SEARCH: {
    icon: Search,
    title: "No Results Found",
    message: "We couldn't find anything matching your search query.",
  },
  EVENTS: {
    icon: FileSpreadsheet,
    title: "No Events",
    message: "There are no upcoming events.",
  },
  PHARMACY: {
    icon: Pill,
    title: "No Orders Found",
    message: "Prescriptions will appear here once created by doctors.",
  },
  DEFAULT: {
    icon: Inbox,
    title: "No Data Available",
    message: "There is nothing to display at the moment.",
  },
};
