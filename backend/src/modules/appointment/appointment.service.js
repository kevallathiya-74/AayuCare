const appointmentRepository = require("./appointment.repository");

const appointmentService = {
  repository: appointmentRepository,
};

module.exports = appointmentService;
