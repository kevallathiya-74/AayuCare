const express = require("express");
const router = express.Router();
const medicalRecordController = require("./medical-record.controller");
const { protect, authorize } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody } = require("../../middleware/validation");
const { createMedicalRecordSchema } = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");

router.use(protect);
router.use(attachHospitalId);

router.get(
  "/",
  authorize("admin"),
  cacheMiddleware(60),
  medicalRecordController.getAllMedicalRecords
);

router.post(
  "/",
  authorize("doctor", "admin"),
  validateBody(createMedicalRecordSchema),
  medicalRecordController.createMedicalRecord
);

router.get(
  "/patient/:patientId",
  authorize("patient", "doctor", "admin"),
  cacheMiddleware(120),
  medicalRecordController.getPatientMedicalRecords
);

router.get(
  "/history/:patientId",
  authorize("doctor", "admin"),
  cacheMiddleware(120),
  medicalRecordController.getPatientHistory
);

router.get("/:id", cacheMiddleware(120), medicalRecordController.getMedicalRecord);

router.put(
  "/:id",
  authorize("doctor", "admin"),
  validateBody(createMedicalRecordSchema),
  medicalRecordController.updateMedicalRecord
);

router.delete(
  "/:id",
  authorize("doctor", "admin"),
  medicalRecordController.deleteMedicalRecord
);

router.post(
  "/upload",
  authorize("doctor", "admin"),
  medicalRecordController.uploadAttachment
);

router.get(
  "/files/:id",
  medicalRecordController.downloadAttachment
);

module.exports = router;