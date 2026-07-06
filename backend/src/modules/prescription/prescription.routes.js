const express = require("express");
const router = express.Router();
const prescriptionController = require("./prescription.controller");
const { protect, authorize } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody } = require("../../middleware/validation");
const {
  createPrescriptionSchema,
  updatePrescriptionStatusSchema,
  updatePrescriptionPharmacySchema,
} = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");
const { idempotencyMiddleware } = require("../../middleware/idempotency");

router.use(protect);
router.use(attachHospitalId);

router.get(
  "/",
  authorize("admin"),
  cacheMiddleware(30),
  prescriptionController.getAllPrescriptions
);

router.post(
  "/",
  authorize("doctor", "admin"),
  idempotencyMiddleware,
  validateBody(createPrescriptionSchema),
  prescriptionController.createPrescription
);

router.get(
  "/patient/:patientId",
  authorize("patient", "doctor", "admin"),
  cacheMiddleware(60),
  prescriptionController.getPatientPrescriptions
);

router.get(
  "/doctor/:doctorId",
  authorize("doctor", "admin"),
  cacheMiddleware(60),
  prescriptionController.getDoctorPrescriptions
);

router.get(
  "/pharmacy/stats",
  authorize("admin"),
  cacheMiddleware(30),
  prescriptionController.getPharmacyStats
);

router.get(
  "/:prescriptionId",
  authorize("patient", "doctor", "admin"),
  cacheMiddleware(120),
  prescriptionController.getPrescriptionById
);

router.patch(
  "/:prescriptionId/status",
  authorize("doctor", "admin"),
  validateBody(updatePrescriptionStatusSchema),
  prescriptionController.updatePrescriptionStatus
);

router.patch(
  "/:prescriptionId/pharmacy-status",
  authorize("admin"),
  validateBody(updatePrescriptionPharmacySchema),
  prescriptionController.updatePharmacyStatus
);

router.delete(
  "/:prescriptionId",
  authorize("admin"),
  prescriptionController.deletePrescription
);

module.exports = router;