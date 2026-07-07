/**
 * Field Mapper Utility
 * Maps PostgreSQL snake_case fields to JavaScript camelCase
 * Ensures proper end-to-end data flow between backend and frontend
 */

/**
 * Convert snake_case to camelCase
 * @param {string} str - snake_case string
 * @returns {string} camelCase string
 */
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Map patient data from database to API response format
 * @param {Object} dbPatient - Patient data from database (snake_case)
 * @returns {Object} Mapped patient data (camelCase)
 */
const mapPatientData = (dbPatient) => {
  if (!dbPatient) return null;

  return {
    id: dbPatient.internal_id || dbPatient.user_id,
    userId: dbPatient.formatted_user_id || dbPatient.user_id,
    name: dbPatient.name,
    email: dbPatient.email,
    phone: dbPatient.phone,
    hospitalId: dbPatient.hospital_id,
    hospitalName: dbPatient.hospital_name,
    isActive: dbPatient.is_active !== false, // Default to true if undefined
    dateOfBirth: dbPatient.date_of_birth,
    gender: dbPatient.gender,
    bloodGroup: dbPatient.blood_group,
    address: dbPatient.address,
    emergencyContact: {
      name: dbPatient.emergency_contact_name || null,
      phone: dbPatient.emergency_contact_phone || null,
      relation: dbPatient.emergency_contact_relation || null,
    },
    allergies: dbPatient.allergies || [],
    chronicConditions: dbPatient.chronic_conditions || [],
    // Fields that don't exist in DB but frontend expects
    currentMedications: [],
    medicalHistory: (dbPatient.chronic_conditions || []).map((condition) => ({
      condition,
      status: "ongoing",
    })),
    createdAt: dbPatient.created_at,
    updatedAt: dbPatient.updated_at,
  };
};

/**
 * Map appointment data from database to API response format
 * @param {Object} dbAppointment - Appointment data from database (snake_case)
 * @returns {Object} Mapped appointment data (camelCase)
 */
const mapAppointmentData = (dbAppointment) => {
  if (!dbAppointment) return null;

  return {
    id: dbAppointment.id,
    appointmentId: dbAppointment.appointment_id,
    patientId: dbAppointment.patient_id,
    doctorId: dbAppointment.doctor_id,
    hospitalId: dbAppointment.hospital_id,
    appointmentDate: dbAppointment.appointment_date,
    appointmentTime: dbAppointment.appointment_time,
    status: dbAppointment.status,
    type: dbAppointment.type || "consultation",
    symptoms: dbAppointment.symptoms || [],
    chiefComplaint: dbAppointment.chief_complaint,
    notes: dbAppointment.notes,
    reason: dbAppointment.chief_complaint || dbAppointment.reason, // Alias for frontend compatibility
    // Patient info (if joined)
    patientName: dbAppointment.patient_name,
    patientEmail: dbAppointment.patient_email,
    patientPhone: dbAppointment.patient_phone,
    patientUserId: dbAppointment.patient_user_id,
    // Doctor info (if joined)
    doctorName: dbAppointment.doctor_name,
    doctorEmail: dbAppointment.doctor_email,
    specialization: dbAppointment.specialization,
    consultationFee: dbAppointment.consultation_fee,
    // Patient details (if joined)
    dateOfBirth: dbAppointment.date_of_birth,
    gender: dbAppointment.gender,
    bloodGroup: dbAppointment.blood_group,
    createdAt: dbAppointment.created_at,
    updatedAt: dbAppointment.updated_at,
    cancelledBy: dbAppointment.cancelled_by,
    cancellationReason: dbAppointment.cancellation_reason,
  };
};

/**
 * Map prescription data from database to API response format
 * @param {Object} dbPrescription - Prescription data from database
 * @returns {Object} Mapped prescription data (camelCase)
 */
const mapPrescriptionData = (dbPrescription) => {
  if (!dbPrescription) return null;

  // Extract medicines from medications (jsonb array in PG) or fallback
  let rawMedicines = dbPrescription.medications || dbPrescription.medicines;
  if (typeof rawMedicines === "string") {
    try {
      rawMedicines = JSON.parse(rawMedicines);
    } catch {
      rawMedicines = [];
    }
  }

  return {
    // NOTE: `_id` MongoDB-shape residue was removed on 2026-06-30.
    // PostgreSQL exposes a UUID `id` via the `prescriptions.id` column.
    id: dbPrescription.id,
    prescriptionId: dbPrescription.prescription_id || dbPrescription.prescriptionId,
    patientId: dbPrescription.patient_id || dbPrescription.patientId,
    doctorId: dbPrescription.doctor_id || dbPrescription.doctorId,
    appointmentId: dbPrescription.appointment_id || dbPrescription.appointmentId,
    hospitalId: dbPrescription.hospital_id || dbPrescription.hospitalId,
    prescriptionDate: dbPrescription.prescription_date || dbPrescription.prescriptionDate || dbPrescription.created_at || dbPrescription.createdAt,
    diagnosis: dbPrescription.diagnosis,
    medicines: Array.isArray(rawMedicines) ? rawMedicines : [],
    instructions: dbPrescription.instructions,
    followUpDate: dbPrescription.follow_up_date || dbPrescription.followUpDate,
    isActive: dbPrescription.is_active !== false && dbPrescription.isActive !== false,
    pharmacyStatus: dbPrescription.pharmacy_status || dbPrescription.pharmacyStatus || "pending",
    createdAt: dbPrescription.created_at || dbPrescription.createdAt,
    updatedAt: dbPrescription.updated_at || dbPrescription.updatedAt,
  };
};

/**
 * Map medical record data from Database to API response format
 * @param {Object} dbRecord - Medical record data from Database
 * @returns {Object} Mapped medical record data
 */
const mapMedicalRecordData = (dbRecord) => {
  if (!dbRecord) return null;

  return {
    // NOTE: `_id` MongoDB-shape residue was removed on 2026-06-30.
    // PostgreSQL exposes a UUID `id` via the `medical_records.id` column.
    patientId: dbRecord.patientId,
    doctorId: dbRecord.doctorId,
    hospitalId: dbRecord.hospitalId,
    recordType: dbRecord.recordType,
    title: dbRecord.title,
    date: dbRecord.date || dbRecord.createdAt,
    diagnosis: dbRecord.diagnosis,
    symptoms: dbRecord.symptoms || [],
    labResults: dbRecord.labResults || [],
    medications: dbRecord.medications || [],
    description: dbRecord.description || null,
    files: dbRecord.files || [],
    aiAnalysis: dbRecord.aiAnalysis || null,
    isShared: dbRecord.isShared || false,
    sharedWith: dbRecord.sharedWith || [],
    createdAt: dbRecord.createdAt,
    updatedAt: dbRecord.updatedAt,
  };
};

/**
 * Map array of objects from database to API response format
 * @param {Array} data - Array of database objects
 * @param {Function} mapperFunc - Mapper function to apply
 * @returns {Array} Mapped array
 */
const mapArray = (data, mapperFunc) => {
  if (!Array.isArray(data)) return [];
  return data.map(mapperFunc).filter(Boolean); // Filter out null/undefined
};

module.exports = {
  snakeToCamel,
  mapPatientData,
  mapAppointmentData,
  mapPrescriptionData,
  mapMedicalRecordData,
  mapArray,
};
