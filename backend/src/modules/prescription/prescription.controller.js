const legacyPrescriptionController = require("../../controllers/prescriptionController");
const prescriptionService = require("./prescription.service");

exports.getAllPrescriptions = (req, res, next) => legacyPrescriptionController.getAllPrescriptions(req, res, next);
exports.createPrescription = (req, res, next) => legacyPrescriptionController.createPrescription(req, res, next);
exports.getPatientPrescriptions = (req, res, next) => legacyPrescriptionController.getPatientPrescriptions(req, res, next);
exports.getDoctorPrescriptions = (req, res, next) => legacyPrescriptionController.getDoctorPrescriptions(req, res, next);
exports.getPrescriptionById = (req, res, next) => legacyPrescriptionController.getPrescriptionById(req, res, next);
exports.updatePrescriptionStatus = (req, res, next) => legacyPrescriptionController.updatePrescriptionStatus(req, res, next);
exports.updatePharmacyStatus = (req, res, next) => legacyPrescriptionController.updatePharmacyStatus(req, res, next);
exports.getPharmacyStats = (req, res, next) => legacyPrescriptionController.getPharmacyStats(req, res, next);
exports.deletePrescription = (req, res, next) => legacyPrescriptionController.deletePrescription(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = prescriptionService;