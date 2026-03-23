/**
 * Prescription Routes
 * Routes for prescription management
 */

const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescriptionController");
const { protect, authorize } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");
const { validateBody } = require("../middleware/validation");
const { createPrescriptionSchema, updatePrescriptionStatusSchema, updatePrescriptionPharmacySchema } = require("../validators/schemas");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");
const { idempotencyMiddleware } = require("../middleware/idempotency");

// All routes require authentication
router.use(protect);
router.use(attachHospitalId);

// @route   GET /api/prescriptions
// @desc    Get all prescriptions (admin only)
// @access  Private (Admin only)
router.get(
  "/",
  authorize("admin"),
  cacheMiddleware(30),
  prescriptionController.getAllPrescriptions
);

// @route   POST /api/prescriptions
// @desc    Create a new prescription
// @access  Private (Doctor/Admin only)
router.post(
  "/",
  authorize("doctor", "admin"),
  idempotencyMiddleware,
  validateBody(createPrescriptionSchema),
  prescriptionController.createPrescription
  // Cache invalidation now handled inside controller
);

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get all prescriptions for a patient
// @access  Private (Patient own data or Doctor/Admin)
router.get(
  "/patient/:patientId",
  authorize("patient", "doctor", "admin"),
  cacheMiddleware(60),
  prescriptionController.getPatientPrescriptions
);

// @route   GET /api/prescriptions/doctor/:doctorId
// @desc    Get all prescriptions created by a doctor
// @access  Private (Doctor own data or Admin)
router.get(
  "/doctor/:doctorId",
  authorize("doctor", "admin"),
  cacheMiddleware(60),
  prescriptionController.getDoctorPrescriptions
);

// @route   GET /api/prescriptions/pharmacy/stats
// @desc    Get pharmacy dashboard stats
// @access  Private (Admin only)
router.get(
  "/pharmacy/stats",
  authorize("admin"),
  cacheMiddleware(30),
  prescriptionController.getPharmacyStats
);

// @route   GET /api/prescriptions/:prescriptionId
// @desc    Get prescription by ID
// @access  Private
router.get(
  "/:prescriptionId",
  cacheMiddleware(120),
  prescriptionController.getPrescriptionById
);

// @route   PATCH /api/prescriptions/:prescriptionId/status
// @desc    Update prescription status
// @access  Private (Doctor/Admin only)
router.patch(
  "/:prescriptionId/status",
  authorize("doctor", "admin"),
  validateBody(updatePrescriptionStatusSchema),
  prescriptionController.updatePrescriptionStatus
  // Cache invalidation now handled inside controller
);

// @route   PATCH /api/prescriptions/:prescriptionId/pharmacy-status
// @desc    Update pharmacy status
// @access  Private (Admin only)
router.patch(
  "/:prescriptionId/pharmacy-status",
  authorize("admin"),
  validateBody(updatePrescriptionPharmacySchema),
  prescriptionController.updatePharmacyStatus
  // Cache invalidation now handled inside controller
);

// @route   PATCH /api/prescriptions/:prescriptionId
// @desc    Legacy pharmacy status update route
// @access  Private (Admin only)
router.patch(
  "/:prescriptionId",
  authorize("admin"),
  validateBody(updatePrescriptionPharmacySchema),
  prescriptionController.updatePharmacyStatus
  // Cache invalidation now handled inside controller
);

// @route   DELETE /api/prescriptions/:prescriptionId
// @desc    Delete a prescription
// @access  Private (Admin only)
router.delete(
  "/:prescriptionId",
  authorize("admin"),
  prescriptionController.deletePrescription
  // Cache invalidation now handled inside controller
);

module.exports = router;
