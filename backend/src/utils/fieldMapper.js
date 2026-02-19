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
    type: dbAppointment.type || "in-person",
    symptoms: dbAppointment.symptoms || [],
    chiefComplaint: dbAppointment.chief_complaint,
    diagnosis: dbAppointment.diagnosis,
    treatmentPlan: dbAppointment.treatment_plan,
    followUpDate: dbAppointment.follow_up_date,
    notes: dbAppointment.notes,
    reason: dbAppointment.chief_complaint || dbAppointment.reason, // Alias for frontend compatibility
    // Patient info (if joined)
    patientName: dbAppointment.patient_name,
    patientEmail: dbAppointment.patient_email,
    patientPhone: dbAppointment.patient_phone,
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
    cancelledAt: dbAppointment.cancelled_at,
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

  return {
    _id: dbPrescription._id,
    prescriptionId: dbPrescription.prescriptionId,
    patientId: dbPrescription.patientId,
    doctorId: dbPrescription.doctorId,
    appointmentId: dbPrescription.appointmentId,
    hospitalId: dbPrescription.hospitalId,
    prescriptionDate: dbPrescription.prescriptionDate || dbPrescription.createdAt,
    diagnosis: dbPrescription.diagnosis,
    medicines: dbPrescription.medicines || [],
    tests: dbPrescription.tests || [],
    instructions: dbPrescription.instructions,
    followUpDate: dbPrescription.followUpDate,
    isActive: dbPrescription.isActive !== false,
    createdAt: dbPrescription.createdAt,
    updatedAt: dbPrescription.updatedAt,
  };
};

/**
 * Map medical record data from MongoDB to API response format
 * @param {Object} dbRecord - Medical record data from MongoDB
 * @returns {Object} Mapped medical record data
 */
const mapMedicalRecordData = (dbRecord) => {
  if (!dbRecord) return null;

  return {
    _id: dbRecord._id,
    patientId: dbRecord.patientId,
    doctorId: dbRecord.doctorId,
    appointmentId: dbRecord.appointmentId,
    hospitalId: dbRecord.hospitalId,
    recordType: dbRecord.recordType,
    title: dbRecord.title,
    date: dbRecord.date || dbRecord.createdAt,
    diagnosis: dbRecord.diagnosis,
    symptoms: dbRecord.symptoms || [],
    vitalSigns: dbRecord.vitalSigns || {},
    prescriptions: dbRecord.prescriptions || [],
    labResults: dbRecord.labResults || [],
    notes: dbRecord.notes,
    attachments: dbRecord.attachments || [],
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
