/**
 * Prescription Routes
 * Routes for prescription management
 */

const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescriptionController");
const { protect, authorize } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");

// All routes require authentication
router.use(protect);
router.use(attachHospitalId);

// @route   POST /api/prescriptions
// @desc    Create a new prescription
// @access  Private (Doctor/Admin only)
router.post(
  "/",
  authorize("doctor", "admin"),
  prescriptionController.createPrescription
);

// @route   GET /api/prescriptions/patient/:patientId
// @desc    Get all prescriptions for a patient
// @access  Private (Patient own data or Doctor/Admin)
router.get(
  "/patient/:patientId",
  prescriptionController.getPatientPrescriptions
);

// @route   GET /api/prescriptions/doctor/:doctorId
// @desc    Get all prescriptions created by a doctor
// @access  Private (Doctor own data or Admin)
router.get("/doctor/:doctorId", prescriptionController.getDoctorPrescriptions);

// @route   GET /api/prescriptions/:prescriptionId
// @desc    Get prescription by ID
// @access  Private
router.get("/:prescriptionId", prescriptionController.getPrescriptionById);

// @route   PATCH /api/prescriptions/:prescriptionId/status
// @desc    Update prescription status
// @access  Private (Doctor/Admin only)
router.patch(
  "/:prescriptionId/status",
  authorize("doctor", "admin"),
  prescriptionController.updatePrescriptionStatus
);

// @route   DELETE /api/prescriptions/:prescriptionId
// @desc    Delete a prescription
// @access  Private (Admin only)
router.delete(
  "/:prescriptionId",
  authorize("admin"),
  prescriptionController.deletePrescription
);

module.exports = router;
