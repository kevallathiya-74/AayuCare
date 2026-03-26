const userRepository = require("../../repositories/userRepository");
const patientRepository = require("../../repositories/patientRepository");
const appointmentRepository = require("../../repositories/appointmentRepository");
const prescriptionRepository = require("../../repositories/prescriptionRepository");
const medicalRecordRepository = require("../../repositories/medicalRecordRepository");
const healthMetricRepository = require("../../repositories/healthMetricRepository");

module.exports = {
  userRepository,
  patientRepository,
  appointmentRepository,
  prescriptionRepository,
  medicalRecordRepository,
  healthMetricRepository,
};
