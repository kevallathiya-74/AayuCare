const legacyMedicalRecordController = require("../../controllers/medicalRecordController");
const medicalRecordService = require("./medical-record.service");

exports.getAllMedicalRecords = (req, res, next) => legacyMedicalRecordController.getAllMedicalRecords(req, res, next);
exports.createMedicalRecord = (req, res, next) => legacyMedicalRecordController.createMedicalRecord(req, res, next);
exports.getPatientMedicalRecords = (req, res, next) => legacyMedicalRecordController.getPatientMedicalRecords(req, res, next);
exports.getMedicalRecord = (req, res, next) => legacyMedicalRecordController.getMedicalRecord(req, res, next);
exports.updateMedicalRecord = (req, res, next) => legacyMedicalRecordController.updateMedicalRecord(req, res, next);
exports.deleteMedicalRecord = (req, res, next) => legacyMedicalRecordController.deleteMedicalRecord(req, res, next);
exports.getPatientHistory = (req, res, next) => legacyMedicalRecordController.getPatientHistory(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = medicalRecordService;