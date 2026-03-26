const legacyAppointmentController = require("../../controllers/appointmentController");
const appointmentService = require("./appointment.service");

exports.createAppointment = (req, res, next) =>
  legacyAppointmentController.createAppointment(req, res, next);

exports.getAllAppointmentsCursor = (req, res, next) =>
  legacyAppointmentController.getAllAppointmentsCursor(req, res, next);

exports.getAppointmentsCursor = (req, res, next) =>
  legacyAppointmentController.getAppointmentsCursor(req, res, next);

exports.getAllAppointments = (req, res, next) =>
  legacyAppointmentController.getAllAppointments(req, res, next);

exports.getAppointments = (req, res, next) =>
  legacyAppointmentController.getAppointments(req, res, next);

exports.getAppointment = (req, res, next) =>
  legacyAppointmentController.getAppointment(req, res, next);

exports.updateAppointmentStatus = (req, res, next) =>
  legacyAppointmentController.updateAppointmentStatus(req, res, next);

exports.cancelAppointment = (req, res, next) =>
  legacyAppointmentController.cancelAppointment(req, res, next);

exports.getPatientAppointments = (req, res, next) =>
  legacyAppointmentController.getPatientAppointments(req, res, next);

exports.getDoctorAppointments = (req, res, next) =>
  legacyAppointmentController.getDoctorAppointments(req, res, next);

exports.getAvailableSlots = (req, res, next) =>
  legacyAppointmentController.getAvailableSlots(req, res, next);

exports.getAppointmentStats = (req, res, next) =>
  legacyAppointmentController.getAppointmentStats(req, res, next);

exports.updateAppointment = (req, res, next) =>
  legacyAppointmentController.updateAppointment(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = appointmentService;
