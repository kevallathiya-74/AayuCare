/**
 * AayuCare - Application Constants
 *
 * Centralized constants for the app.
 * Note: API Configuration is in config/app.js (AppConfig)
 */

// Storage Keys - SecureStore compatible (alphanumeric, dots, dashes, underscores only)
export const STORAGE_KEYS = {
  AUTH_TOKEN: "aayucare_auth_token",
  REFRESH_TOKEN: "aayucare_refresh_token",
  USER_DATA: "aayucare_user_data",
  SESSION_DATA: "aayucare_session_data",
  ONBOARDING_COMPLETED: "aayucare_onboarding_completed",
  LANGUAGE: "aayucare_language",
  THEME: "aayucare_theme",
  NOTIFICATIONS_ENABLED: "aayucare_notifications_enabled",
};

// App Configuration
export const APP_CONFIG = {
  NAME: "AayuCare",
  VERSION: "1.0.0",
  SUPPORT_EMAIL: "support@aayucare.com",
  SUPPORT_PHONE: "+91 1800 123 4567",
  PRIVACY_POLICY_URL: "https://aayucare.com/privacy",
  TERMS_URL: "https://aayucare.com/terms",
};

// Gender Options
export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

// Blood Group Options
export const BLOOD_GROUP_OPTIONS = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
];

// Health Record Types
export const HEALTH_RECORD_TYPES = [
  { label: "Prescription", value: "prescription", icon: "file-text" },
  { label: "Test Report", value: "test_report", icon: "clipboard" },
  { label: "Vaccination", value: "vaccination", icon: "shield" },
  { label: "Allergy", value: "allergy", icon: "alert-circle" },
  { label: "Surgery", value: "surgery", icon: "activity" },
  { label: "Other", value: "other", icon: "file" },
];

// Appointment Status
export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  IN_PROGRESS: "in-progress",
};

export const APPOINTMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "pending", color: "#FF9800" },
  { label: "Confirmed", value: "confirmed", color: "#4CAF50" },
  { label: "Cancelled", value: "cancelled", color: "#F44336" },
  { label: "Completed", value: "completed", color: "#9E9E9E" },
  { label: "In Progress", value: "in-progress", color: "#2196F3" },
];

// Doctor Specializations
export const DOCTOR_SPECIALIZATIONS = [
  { label: "General Physician", value: "general_physician" },
  { label: "Cardiologist", value: "cardiologist" },
  { label: "Dermatologist", value: "dermatologist" },
  { label: "Pediatrician", value: "pediatrician" },
  { label: "Gynecologist", value: "gynecologist" },
  { label: "Orthopedic", value: "orthopedic" },
  { label: "ENT Specialist", value: "ent_specialist" },
  { label: "Ophthalmologist", value: "ophthalmologist" },
  { label: "Dentist", value: "dentist" },
  { label: "Neurologist", value: "neurologist" },
  { label: "Psychiatrist", value: "psychiatrist" },
  { label: "Urologist", value: "urologist" },
  { label: "Gastroenterologist", value: "gastroenterologist" },
  { label: "Pulmonologist", value: "pulmonologist" },
  { label: "Diabetologist", value: "diabetologist" },
  { label: "Ayurveda", value: "ayurveda" },
  { label: "Homeopathy", value: "homeopathy" },
];

// Time Slots
export const TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
  "08:00 PM",
];

// Language Options
export const LANGUAGE_OPTIONS = [
  { label: "English", value: "en", flag: "GB" },
  { label: "हिंदी", value: "hi", flag: "IN" },
  { label: "தமிழ்", value: "ta", flag: "IN" },
  { label: "తెలుగు", value: "te", flag: "IN" },
  { label: "ಕನ್ನಡ", value: "kn", flag: "IN" },
  { label: "മലയാളം", value: "ml", flag: "IN" },
  { label: "मराठी", value: "mr", flag: "IN" },
  { label: "বাংলা", value: "bn", flag: "IN" },
  { label: "ગુજરાતી", value: "gu", flag: "IN" },
];

// Notification Types
export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: "appointment_reminder",
  APPOINTMENT_CONFIRMED: "appointment_confirmed",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  PRESCRIPTION_UPLOADED: "prescription_uploaded",
  TEST_RESULT_AVAILABLE: "test_result_available",
  MEDICINE_REMINDER: "medicine_reminder",
  GENERAL: "general",
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "DD/MM/YYYY",
  API: "YYYY-MM-DD",
  TIME: "hh:mm A",
  DATETIME: "DD/MM/YYYY hh:mm A",
};

// Regex Patterns
export const REGEX_PATTERNS = {
  PHONE: /^[6-9]\d{9}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  AADHAAR: /^\d{12}$/,
  PINCODE: /^\d{6}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  TIMEOUT_ERROR: "Request timeout. Please try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "Session expired. Please login again.",
  NOT_FOUND: "Resource not found.",
  VALIDATION_ERROR: "Please check the form and try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Login successful!",
  REGISTER_SUCCESS: "Registration successful!",
  PROFILE_UPDATED: "Profile updated successfully!",
  APPOINTMENT_BOOKED: "Appointment booked successfully!",
  APPOINTMENT_CANCELLED: "Appointment cancelled successfully!",
  RECORD_ADDED: "Health record added successfully!",
  RECORD_UPDATED: "Health record updated successfully!",
  PASSWORD_RESET: "Password reset successfully!",
};

// Loading Messages
export const LOADING_MESSAGES = {
  LOADING: "Loading...",
  SIGNING_IN: "Signing in...",
  SIGNING_UP: "Creating your account...",
  UPDATING: "Updating...",
  BOOKING: "Booking appointment...",
  UPLOADING: "Uploading...",
  PROCESSING: "Processing...",
};

// Onboarding Slides
export const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: "Find Trusted Doctors",
    description: "Connect with verified healthcare professionals near you",
    image: "doctor-search", // Replace with actual image
  },
  {
    id: 2,
    title: "Book Appointments Easily",
    description: "Schedule appointments in just a few taps, anytime, anywhere",
    image: "appointment-booking",
  },
  {
    id: 3,
    title: "Manage Health Records",
    description:
      "Keep all your medical records safe and accessible in one place",
    image: "health-records",
  },
];

// FAQ Data
export const FAQ_DATA = [
  {
    id: 1,
    question: "How do I book an appointment?",
    answer:
      "Go to the Appointments tab, select a doctor, choose a time slot, and confirm your booking.",
  },
  {
    id: 2,
    question: "Can I cancel or reschedule an appointment?",
    answer:
      "Yes, you can cancel or reschedule from the appointment details screen up to 2 hours before the scheduled time.",
  },
  {
    id: 3,
    question: "How are my medical records stored?",
    answer:
      "All your medical records are encrypted and stored securely in the cloud. Only you and your authorized doctors can access them.",
  },
  {
    id: 4,
    question: "What payment methods are supported?",
    answer:
      "We support UPI, credit/debit cards, net banking, and wallet payments.",
  },
  {
    id: 5,
    question: "How do I contact support?",
    answer: `You can reach us at ${APP_CONFIG.SUPPORT_EMAIL} or call ${APP_CONFIG.SUPPORT_PHONE}.`,
  },
];

// Indian States
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default {
  STORAGE_KEYS,
  APP_CONFIG,
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  HEALTH_RECORD_TYPES,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_OPTIONS,
  DOCTOR_SPECIALIZATIONS,
  TIME_SLOTS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_TYPES,
  PAGINATION,
  DATE_FORMATS,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  ONBOARDING_SLIDES,
  FAQ_DATA,
  INDIAN_STATES,
};
