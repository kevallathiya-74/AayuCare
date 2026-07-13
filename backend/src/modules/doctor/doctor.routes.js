const express = require("express");
const doctorController = require("./doctor.controller");
const { protect, authorize, optionalAuth } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody, validateParams } = require("../../middleware/validation");
const {
  validateUpdateAppointmentStatus,
} = require("../../validators/appointmentValidator");
const {
  updateDoctorProfileSchema,
  walkInPatientSchema,
  scheduleUpdateSchema,
  scheduleParamsSchema,
} = require("../../validators/schemas");
const {
  cacheDoctorList,
  cacheDoctorAvailability,
  cacheDashboard,
} = require("../../middleware/cache");
const { sendError } = require("../../utils/apiResponse");

const router = express.Router();

router.get(
  "/me/dashboard",
  protect,
  attachHospitalId,
  authorize("doctor"),
  cacheDashboard,
  doctorController.getDoctorDashboard,
);

router.get(
  "/me/appointments/today",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getTodaysAppointments,
);

router.get(
  "/me/appointments/upcoming",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getUpcomingAppointments,
);

router.get(
  "/me/patients/search",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.searchPatients,
);

router.get(
  "/me/patients/:patientId",
  protect,
  attachHospitalId,
  authorize("doctor", "admin"),
  doctorController.getPatientDetails,
);

router.patch(
  "/me/appointments/:id/status",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateUpdateAppointmentStatus,
  doctorController.updateAppointmentStatus,
);

router.get(
  "/me/profile/stats",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getDoctorProfileStats,
);

router.get(
  "/",
  optionalAuth,
  (req, res, next) => {
    if (!req.query.hospitalId) {
      if (req.user?.hospitalId) {
        req.query.hospitalId = req.user.hospitalId;
      } else {
        return sendError(
          res,
          req,
          "hospitalId query parameter is required",
          400,
          "VALIDATION_ERROR",
        );
      }
    }
    next();
  },
  cacheDoctorList,
  doctorController.getDoctors,
);

router.get(
  "/me/consultation-history",
  protect,
  attachHospitalId,
  authorize("doctor"),
  doctorController.getConsultationHistory,
);

router.get(
  "/me/schedule",
  protect,
  attachHospitalId,
  authorize("doctor"),
  cacheDoctorAvailability,
  doctorController.getSchedule,
);

router.get("/:id", optionalAuth, doctorController.getDoctor);

router.post(
  "/me/walk-in-patient",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateBody(walkInPatientSchema),
  doctorController.registerWalkInPatient,
);

router.put(
  "/me/profile",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateBody(updateDoctorProfileSchema),
  doctorController.updateProfile,
);

router.put(
  "/me/schedule/:dayOfWeek",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateParams(scheduleParamsSchema),
  validateBody(scheduleUpdateSchema),
  doctorController.updateSchedule,
);

router.patch(
  "/me/schedule/:dayOfWeek/toggle",
  protect,
  attachHospitalId,
  authorize("doctor"),
  validateParams(scheduleParamsSchema),
  doctorController.toggleDayAvailability,
);

router.get(
  "/:id/stats",
  protect,
  attachHospitalId,
  authorize("doctor", "admin"),
  doctorController.getDoctorStats,
);

module.exports = router;
