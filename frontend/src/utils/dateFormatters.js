/**
 * Date Formatting Utilities
 * Reduces duplicate date formatting code
 */

/**
 * Format date to readable string (Jan 15, 2026)
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format date with time (Jan 15, 2026 10:30 AM)
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date for API (YYYY-MM-DD)
 */
