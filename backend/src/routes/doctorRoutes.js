const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");
const { validateBody, validateParams } = require("../middleware/validation");
const { validateUpdateAppointmentStatus } = require("../validators/appointmentValidator");
const { updateDoctorProfileSchema, walkInPatientSchema, scheduleUpdateSchema, scheduleParamsSchema } = require("../validators/schemas");
const { cacheDoctorList, cacheDoctorAvailability, cacheDashboard, invalidateCache } = require("../middleware/cache");

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
  cacheDashboard,
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
 * @route   GET /api/doctors/me/patients/:patientId
 * @desc    Get detailed patient information
 * @access  Private (Doctor, Admin)
 */
router.get(
  "/me/patients/:patientId",
  protect,
  attachHospitalId,
  authorize("doctor", "admin"),
  doctorController.getPatientDetails
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
  validateUpdateAppointmentStatus,
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
 * @access  Public (requires hospitalId query param)
 */
router.get("/",
  // Optional auth: if authenticated, derive hospitalId from token
  require("../middleware/auth").optionalAuth,
  (req, res, next) => {
    // Use hospitalId from query param, or fall back to authenticated user's hospitalId
    if (!req.query.hospitalId) {
      if (req.user?.hospitalId) {
        req.query.hospitalId = req.user.hospitalId;
      } else {
        return res.status(400).json({ status: "error", message: "hospitalId query parameter is required" });
      }
    }
    next();
  },
  cacheDoctorList,
  doctorController.getDoctors
);

/**
 * @route   GET /api/doctors/me/consultation-history
 * @desc    Get consultation history for logged-in doctor
 * @access  Private (Doctor)
 * NOTE: Must remain BEFORE /:id to avoid Express route shadowing
 */
router.get(
  "/me/consultation-history",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getConsultationHistory
);

/**
 * @route   GET /api/doctors/me/schedule
 * @desc    Get doctor's weekly schedule
 * @access  Private (Doctor)
 * NOTE: Must remain BEFORE /:id to avoid Express route shadowing
 */
router.get(
  "/me/schedule",
  protect,
  attachHospitalId,
  authorize("doctor"),
  cacheDoctorAvailability,
  doctorController.getSchedule
);

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
  attachHospitalId,
  authorize("doctor"),
  validateBody(walkInPatientSchema),
  doctorController.registerWalkInPatient
);

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor profile
 * @access  Private (Doctor)
 */
router.put(
  "/me/profile",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateBody(updateDoctorProfileSchema),
  doctorController.updateProfile
  // Cache invalidation now handled inside controller
);

/**
 * @route   PUT /api/doctors/schedule/:dayOfWeek
 * @desc    Update schedule for a specific day
 * @access  Private (Doctor)
 */
router.put(
  "/me/schedule/:dayOfWeek",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateParams(scheduleParamsSchema),
  validateBody(scheduleUpdateSchema),
  doctorController.updateSchedule
  // Cache invalidation now handled inside controller
);

/**
 * @route   PATCH /api/doctors/schedule/:dayOfWeek/toggle
 * @desc    Toggle availability for a specific day
 * @access  Private (Doctor)
 */
router.patch(
  "/me/schedule/:dayOfWeek/toggle",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateParams(scheduleParamsSchema),
  doctorController.toggleDayAvailability
  // Cache invalidation now handled inside controller
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
