const legacyDoctorController = require("../../controllers/doctorController");
const doctorService = require("./doctor.service");

exports.getDoctors = (req, res, next) => legacyDoctorController.getDoctors(req, res, next);
exports.getDoctor = (req, res, next) => legacyDoctorController.getDoctor(req, res, next);
exports.getDoctorStats = (req, res, next) => legacyDoctorController.getDoctorStats(req, res, next);
exports.getDoctorDashboard = (req, res, next) => legacyDoctorController.getDoctorDashboard(req, res, next);
exports.getTodaysAppointments = (req, res, next) => legacyDoctorController.getTodaysAppointments(req, res, next);
exports.getUpcomingAppointments = (req, res, next) => legacyDoctorController.getUpcomingAppointments(req, res, next);
exports.searchPatients = (req, res, next) => legacyDoctorController.searchPatients(req, res, next);
exports.getPatientDetails = (req, res, next) => legacyDoctorController.getPatientDetails(req, res, next);
exports.updateAppointmentStatus = (req, res, next) => legacyDoctorController.updateAppointmentStatus(req, res, next);
exports.getDoctorProfileStats = (req, res, next) => legacyDoctorController.getDoctorProfileStats(req, res, next);
exports.getConsultationHistory = (req, res, next) => legacyDoctorController.getConsultationHistory(req, res, next);
exports.getSchedule = (req, res, next) => legacyDoctorController.getSchedule(req, res, next);
exports.registerWalkInPatient = (req, res, next) => legacyDoctorController.registerWalkInPatient(req, res, next);
exports.updateProfile = (req, res, next) => legacyDoctorController.updateProfile(req, res, next);
exports.updateSchedule = (req, res, next) => legacyDoctorController.updateSchedule(req, res, next);
exports.toggleDayAvailability = (req, res, next) => legacyDoctorController.toggleDayAvailability(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = doctorService;
