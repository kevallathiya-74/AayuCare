/**
 * Patient Routes
 * Routes for patient management and search
 */

const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");

// All routes require authentication
router.use(protect);
router.use(attachHospitalId);

// @route   GET /api/patients/search
// @desc    Search patients by name, ID, or phone
// @access  Private (Doctor/Admin only)
router.get(
  "/search",
  authorize("doctor", "admin"),
  patientController.searchPatients
);

// @route   GET /api/patients/:patientId/complete-history
// @desc    Get complete medical history of a patient
// @access  Private (Doctor/Admin or Patient own data)
router.get(
  "/:patientId/complete-history",
  patientController.getCompleteHistory
);

// @route   GET /api/patients/:patientId/profile
// @desc    Get patient profile with basic info
// @access  Private (Doctor/Admin or Patient own data)
router.get("/:patientId/profile", patientController.getPatientProfile);

// @route   PATCH /api/patients/:patientId/profile
// @desc    Update patient profile
// @access  Private (Patient own data or Admin)
router.patch("/:patientId/profile", patientController.updatePatientProfile);

// @route   GET /api/patients/:patientId/health-metrics
// @desc    Get health metrics for a patient
// @access  Private (Patient own data, Doctor, or Admin)
router.get("/:patientId/health-metrics", patientController.getHealthMetrics);

// @route   GET /api/patients/:patientId/health-metrics/latest/:type
// @desc    Get latest health metric value by type (bp, sugar, weight, temp)
// @access  Private (Patient own data, Doctor, or Admin)
router.get(
  "/:patientId/health-metrics/latest/:type",
  patientController.getLatestHealthMetric
);

// @route   POST /api/patients/:patientId/health-metrics
// @desc    Add health metric for a patient
// @access  Private (Patient own data, Doctor, or Admin)
router.post("/:patientId/health-metrics", patientController.addHealthMetric);

// @route   DELETE /api/patients/:patientId/health-metrics/:metricId
// @desc    Delete a specific health metric entry
// @access  Private (Patient own data or Admin)
router.delete(
  "/:patientId/health-metrics/:metricId",
  patientController.deleteHealthMetric
);

// @route   GET /api/patients/:patientId/activity
// @desc    Get activity tracking data (steps, sleep, water, stress)
// @access  Private (Patient own data, Doctor, or Admin)
router.get("/:patientId/activity", patientController.getActivityData);

// @route   POST /api/patients/:patientId/activity
// @desc    Update activity data
// @access  Private (Patient own data or Admin)
router.post("/:patientId/activity", patientController.updateActivityData);

module.exports = router;
