/**
 * Date Helper Functions
 * Centralized date formatting and calculations
 * Per ENGINEERING_PROJECT_STANDARDS.md Section 2 - Single Source of Truth
 */

/**
 * Calculate age from date of birth
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number|null} - Age in years or null if invalid
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    // Validate date
    if (isNaN(birthDate.getTime())) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch {
    return null;
  }
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatDate = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return dateFormatter.format(d);
  } catch {
    return "N/A";
  }
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export const formatDateTime = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return dateTimeFormatter.format(d);
  } catch {
    return "N/A";
  }
};

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export const formatTime = (date) => {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return timeFormatter.format(d);
  } catch {
    return "N/A";
  }
};

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export const getRelativeTime = (date) => {
  if (!date) return "N/A";

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";

    const diffMs = d - new Date();
    const diffMins = Math.round(diffMs / 60000);
    if (Math.abs(diffMins) < 1) return "Just now";

    if (Math.abs(diffMins) < 60)
      return relativeTimeFormatter.format(diffMins, "minute");

    const diffHours = Math.round(diffMs / 3600000);
    if (Math.abs(diffHours) < 24)
      return relativeTimeFormatter.format(diffHours, "hour");

    const diffDays = Math.round(diffMs / 86400000);
    if (Math.abs(diffDays) < 7)
      return relativeTimeFormatter.format(diffDays, "day");

    const diffWeeks = Math.round(diffDays / 7);
    if (Math.abs(diffDays) < 30)
      return relativeTimeFormatter.format(diffWeeks, "week");

    const diffMonths = Math.round(diffDays / 30);
    if (Math.abs(diffDays) < 365)
      return relativeTimeFormatter.format(diffMonths, "month");

    const diffYears = Math.round(diffDays / 365);
    return relativeTimeFormatter.format(diffYears, "year");
  } catch {
    return "N/A";
  }
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;

  try {
    const d = new Date(date);
    const today = new Date();

    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export const isPast = (date) => {
  if (!date) return false;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return false;
    return d.getTime() < new Date().getTime();
  } catch {
    return false;
  }
};

/**
 * Format medical history date-range
 * @param {Date} diagnosedDate - Diagnosis date
 * @param {string} status - Status (active/resolved/chronic)
 * @returns {string} - Formatted string
 */
export const formatMedicalHistoryDuration = (diagnosedDate, status) => {
  if (!diagnosedDate) return "Unknown duration";

  try {
    const diagnosed = new Date(diagnosedDate);
    if (isNaN(diagnosed.getTime())) return "Unknown duration";

    if (status === "resolved") {
      return `Diagnosed ${formatDate(diagnosedDate)}`;
    }

    const years = calculateAge(diagnosedDate);
    const diagnosedYear = diagnosed.getFullYear();

    if (years === 0) return `Since ${diagnosedYear} (recent)`;
    if (years === 1) return `Since ${diagnosedYear} (1 year)`;
    return `Since ${diagnosedYear} (${years} years)`;
  } catch {
    return "Unknown duration";
  }
};
