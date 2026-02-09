/**
 * Date Helper Functions
 * Centralized date formatting and calculations
 * Per PROJECT_RULES.md Section 3 - Single Source of Truth
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
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : null;
  } catch (error) {
    return null;
  }
};

/**
 * Format date to readable string (DD MMM YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date or "N/A"
 */
export const formatDate = (date) => {
  if (!date) return "N/A";
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    return "N/A";
  }
};

/**
 * Format date with time (DD MMM YYYY, HH:MM AM/PM)
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date with time or "N/A"
 */
export const formatDateTime = (date) => {
  if (!date) return "N/A";
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    
    const dateStr = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    const timeStr = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    return `${dateStr}, ${timeStr}`;
  } catch (error) {
    return "N/A";
  }
};

/**
 * Format time only (HH:MM AM/PM)
 * @param {string|Date} date - Date to extract time from
 * @returns {string} - Formatted time or "N/A"
 */
export const formatTime = (date) => {
  if (!date) return "N/A";
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return "N/A";
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return "N/A";
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  } catch (error) {
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
    
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  } catch (error) {
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
    return d < new Date();
  } catch (error) {
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
    
    if (status === 'resolved') {
      return `Diagnosed ${formatDate(diagnosedDate)}`;
    }
    
    const years = calculateAge(diagnosedDate);
    const diagnosedYear = diagnosed.getFullYear();
    
    if (years === 0) return `Since ${diagnosedYear} (recent)`;
    if (years === 1) return `Since ${diagnosedYear} (1 year)`;
    return `Since ${diagnosedYear} (${years} years)`;
  } catch (error) {
    return "Unknown duration";
  }
};
