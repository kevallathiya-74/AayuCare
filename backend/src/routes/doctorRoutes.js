const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/betterAuth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");

/**
 * Protected routes (Doctor only) - Must come before public routes
 * These use /me to avoid conflicts with /:id
 */

/**
 * @route   GET /api/doctors/me/dashboard
 * @desc    Get doctor dashboard data
 * @access  Private (Doctor)
 */
router.get(
  "/me/dashboard",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getDoctorDashboard
);

/**
 * @route   GET /api/doctors/me/appointments/today
 * @desc    Get today's appointments for logged-in doctor
 * @access  Private (Doctor)
 */
router.get(
  "/me/appointments/today",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getTodaysAppointments
);

/**
 * @route   GET /api/doctors/me/appointments/upcoming
 * @desc    Get upcoming appointments for logged-in doctor
 * @access  Private (Doctor)
 */
router.get(
  "/me/appointments/upcoming",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getUpcomingAppointments
);

/**
 * @route   GET /api/doctors/me/patients/search
 * @desc    Search patients who have visited this doctor
 * @access  Private (Doctor)
 */
router.get(
  "/me/patients/search",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.searchPatients
);

/**
 * @route   PATCH /api/doctors/me/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (Doctor)
 */
router.patch(
  "/me/appointments/:id/status",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.updateAppointmentStatus
);

/**
 * @route   GET /api/doctors/me/profile/stats
 * @desc    Get profile statistics for logged-in doctor
 * @access  Private (Doctor)
 */
router.get(
  "/me/profile/stats",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getDoctorProfileStats
);

/**
 * Public routes
 */

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors
 * @access  Public
 */
router.get("/", doctorController.getDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get single doctor
 * @access  Public
 */
router.get("/:id", doctorController.getDoctor);

/**
 * @route   POST /api/doctors/walk-in-patient
 * @desc    Register walk-in patient
 * @access  Private (Doctor)
 */
router.post(
  "/me/walk-in-patient",
  protect,
  authorize("doctor"),
  doctorController.registerWalkInPatient
);

/**
 * @route   GET /api/doctors/profile/stats
 * @desc    Get profile statistics for logged-in doctor
 * @access  Private (Doctor)
 */
router.get(
  "/me/profile/stats",
  protect,
  authorize("doctor"),
  doctorController.getProfileStats
);

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor profile
 * @access  Private (Doctor)
 */
router.put(
  "/me/profile",
  protect,
  authorize("doctor"),
  doctorController.updateProfile
);

/**
 * @route   GET /api/doctors/consultation-history
 * @desc    Get consultation history for logged-in doctor
 * @access  Private (Doctor)
 */
router.get(
  "/me/consultation-history",
  protect,
  authorize("doctor"),
  doctorController.getConsultationHistory
);

/**
 * @route   GET /api/doctors/schedule
 * @desc    Get doctor's weekly schedule
 * @access  Private (Doctor)
 */
router.get(
  "/me/schedule",
  protect,
  authorize("doctor"),
  doctorController.getSchedule
);

/**
 * @route   PUT /api/doctors/schedule/:dayOfWeek
 * @desc    Update schedule for a specific day
 * @access  Private (Doctor)
 */
router.put(
  "/me/schedule/:dayOfWeek",
  protect,
  authorize("doctor"),
  doctorController.updateSchedule
);

/**
 * @route   PATCH /api/doctors/schedule/:dayOfWeek/toggle
 * @desc    Toggle availability for a specific day
 * @access  Private (Doctor)
 */
router.patch(
  "/me/schedule/:dayOfWeek/toggle",
  protect,
  authorize("doctor"),
  doctorController.toggleDayAvailability
);

/**
 * @route   GET /api/doctors/:id/stats
 * @desc    Get doctor statistics
 * @access  Private (Doctor, Admin)
 */
router.get(
  "/:id/stats",
  protect,
  authorize("doctor", "admin"),
  doctorController.getDoctorStats
);

module.exports = router;
