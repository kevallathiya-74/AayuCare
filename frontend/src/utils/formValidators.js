export {
  validateEmail,
  validatePhone,
  validateRequiredFields,
} from "./errorHandler";

/**
 * Validate that a numeric value is within [min, max].
 * Handles strings by converting with Number().
 * @param {string|number} val
 * @param {number} min
 * @param {number} max
 * @param {string} fieldName  Used in the returned error message.
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateRange = (val, min, max, fieldName = "Value") => {
  const n = Number(val);
  if (val === "" || val === null || val === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (isNaN(n)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  if (n < min || n > max) {
    return {
      valid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }
  return { valid: true, error: null };
};

/**
 * Validate a text field length.
 * @param {string} val
 * @param {number} min
 * @param {number} max
 * @param {string} fieldName
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateLength = (val, min, max, fieldName = "Field") => {
  const str = String(val ?? "").trim();
  if (str.length < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min} characters`,
    };
  }
  if (str.length > max) {
    return {
      valid: false,
      error: `${fieldName} must be ${max} characters or fewer`,
    };
  }
  return { valid: true, error: null };
};

// ---------------------------------------------------------------------------
// Domain helpers
// ---------------------------------------------------------------------------

/** Valid blood group values. */
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * Validate a blood group string.
 * @param {string} bg
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateBloodGroup = (bg) => {
  if (!bg) return { valid: true, error: null }; // blood group is optional
  if (!BLOOD_GROUPS.includes(bg)) {
    return {
      valid: false,
      error: `Blood group must be one of: ${BLOOD_GROUPS.join(", ")}`,
    };
  }
  return { valid: true, error: null };
};

/**
 * Validate that a time string is in strict HH:MM 24-hour format.
 * Prevents lexicographic comparison bugs with single-digit hours (e.g. "9:00").
 * @param {string} time
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateTimeHHMM = (time) => {
  if (!time) return { valid: false, error: "Time is required" };
  const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!HHMM.test(time)) {
    return {
      valid: false,
      error: "Time must be in HH:MM format (e.g. 09:00, 14:30)",
    };
  }
  return { valid: true, error: null };
};

/**
 * Convert an HH:MM string to total minutes for correct numeric comparison.
 * Use this instead of lexicographic string comparison.
 * @param {string} time - "HH:MM"
 * @returns {number} total minutes, or NaN if invalid
 */
export const timeToMinutes = (time) => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return NaN;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Validate an age string — must be purely numeric and in range [1, 120].
 * Rejects partial strings like "12abc" that parseInt() would silently accept.
 * @param {string} ageStr
 * @returns {{ valid: boolean, error: string|null }}
 */
export const validateAge = (ageStr) => {
  if (!ageStr || ageStr.trim() === "") {
    return { valid: false, error: "Age is required" };
  }
  if (!/^\d+$/.test(ageStr.trim())) {
    return { valid: false, error: "Age must be a whole number" };
  }
  const age = parseInt(ageStr.trim(), 10);
  if (age < 1 || age > 120) {
    return { valid: false, error: "Age must be between 1 and 120" };
  }
  return { valid: true, error: null };
};

/**
 * Validate all vitals at once. Returns an array of error strings (empty = valid).
 * All fields are optional — only validated when non-empty.
 *
 * Ranges (based on clinical reference values):
 *   Systolic BP  : 40–250 mmHg
 *   Diastolic BP : 20–150 mmHg
 *   Temperature  : 35–42 °C
 *   Pulse        : 20–220 bpm
 *
 * @param {{ bpSystolic?: string, bpDiastolic?: string, temperature?: string, pulse?: string }} vitals
 * @returns {string[]}  Array of error messages; empty array means all valid.
 */
export const validateVitals = ({
  bpSystolic,
  bpDiastolic,
  temperature,
  pulse,
} = {}) => {
  const errors = [];

  if (bpSystolic) {
    const { valid, error } = validateRange(bpSystolic, 40, 250, "Systolic BP");
    if (!valid) errors.push(error);
  }
  if (bpDiastolic) {
    const { valid, error } = validateRange(
      bpDiastolic,
      20,
      150,
      "Diastolic BP",
    );
    if (!valid) errors.push(error);
  }
  if (temperature) {
    const { valid, error } = validateRange(temperature, 35, 42, "Temperature");
    if (!valid) errors.push(error);
  }
  if (pulse) {
    const { valid, error } = validateRange(pulse, 20, 220, "Pulse");
    if (!valid) errors.push(error);
  }

  return errors;
};
