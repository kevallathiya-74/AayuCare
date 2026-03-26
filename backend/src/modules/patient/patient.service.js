const patientRepository = require("./patient.repository");

const patientService = {
  repository: patientRepository,
};

module.exports = patientService;
