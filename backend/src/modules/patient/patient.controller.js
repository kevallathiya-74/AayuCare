const legacyPatientController = require("../../controllers/patientController");
const patientService = require("./patient.service");

exports.searchPatients = (req, res, next) => legacyPatientController.searchPatients(req, res, next);
exports.getCompleteHistory = (req, res, next) => legacyPatientController.getCompleteHistory(req, res, next);
exports.getPatientProfile = (req, res, next) => legacyPatientController.getPatientProfile(req, res, next);
exports.updatePatientProfile = (req, res, next) => legacyPatientController.updatePatientProfile(req, res, next);
exports.getHealthMetrics = (req, res, next) => legacyPatientController.getHealthMetrics(req, res, next);
exports.getLatestHealthMetric = (req, res, next) => legacyPatientController.getLatestHealthMetric(req, res, next);
exports.addHealthMetric = (req, res, next) => legacyPatientController.addHealthMetric(req, res, next);
exports.updateHealthMetric = (req, res, next) => legacyPatientController.updateHealthMetric(req, res, next);
exports.deleteHealthMetric = (req, res, next) => legacyPatientController.deleteHealthMetric(req, res, next);
exports.getActivityData = (req, res, next) => legacyPatientController.getActivityData(req, res, next);
exports.updateActivityData = (req, res, next) => legacyPatientController.updateActivityData(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = patientService;
