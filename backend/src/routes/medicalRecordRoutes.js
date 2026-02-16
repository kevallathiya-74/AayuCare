const express = require("express");
const router = express.Router();
const medicalRecordController = require("../controllers/medicalRecordController");
const { protect, restrictTo } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");
const { validateBody } = require("../middleware/validation");
const { createMedicalRecordSchema } = require("../validators/schemas");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");

// All routes require authentication
router.use(protect);
router.use(attachHospitalId);

// Get all medical records (Admin only) - must be before /:id route
router.get(
  "/",
  restrictTo("admin"),
  cacheMiddleware(60),
  medicalRecordController.getAllMedicalRecords
);

// Create medical record (Doctor only)
router.post(
  "/",
  restrictTo("doctor", "admin"),
  validateBody(createMedicalRecordSchema),
  medicalRecordController.createMedicalRecord,
  invalidateCache("cache:medicalrecord:*")
);

// Get patient's medical records
router.get(
  "/patient/:patientId",
  cacheMiddleware(120),
  medicalRecordController.getPatientMedicalRecords
);

// Get patient's complete history (Doctor, Admin only)
router.get(
  "/history/:patientId",
  restrictTo("doctor", "admin"),
  cacheMiddleware(120),
  medicalRecordController.getPatientHistory
);

// Get single medical record
router.get(
  "/:id",
  cacheMiddleware(120),
  medicalRecordController.getMedicalRecord
);

// Update medical record (Doctor, Admin only)
router.put(
  "/:id",
  restrictTo("doctor", "admin"),
  validateBody(createMedicalRecordSchema),
  medicalRecordController.updateMedicalRecord,
  invalidateCache("cache:medicalrecord:*")
);

// Delete medical record (Doctor, Admin only)
router.delete(
  "/:id",
  restrictTo("doctor", "admin"),
  medicalRecordController.deleteMedicalRecord,
  invalidateCache("cache:medicalrecord:*")
);

module.exports = router;
