const medicalRecordRepository = require("./medical-record.repository");

const medicalRecordService = {
  repository: medicalRecordRepository,
};

module.exports = medicalRecordService;
