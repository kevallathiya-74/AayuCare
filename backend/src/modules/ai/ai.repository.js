const medicalRecordRepository = require("../medical-record/medical-record.repository");
const healthMetricRepository = require("../patient/health-metric.repository");
const patientRepository = require("../patient/patient.repository");

module.exports = {
  medicalRecordRepository,
  healthMetricRepository,
  patientRepository,
};