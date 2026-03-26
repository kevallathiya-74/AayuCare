const express = require("express");
const appointmentController = require("./appointment.controller");
const { protect, authorize } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody } = require("../../middleware/validation");
const {
  createAppointmentSchema,
  updateAppointmentSchema,
} = require("../../validators/schemas");
const { cachePatientAppointments } = require("../../middleware/cache");
const {
  validateCreateAppointment,
  validateUpdateAppointmentStatus,
  validateCancelAppointment,
  validateGetAppointments,
  validateGetAvailableSlots,
} = require("../../validators/appointmentValidator");
const { idempotencyMiddleware } = require("../../middleware/idempotency");

const router = express.Router();

router.use(protect);
router.use(attachHospitalId);

router.get("/cursor", cachePatientAppointments, appointmentController.getAppointmentsCursor);
router.get("/stats", appointmentController.getAppointmentStats);
router.get("/patient/:patientId", appointmentController.getPatientAppointments);
router.get(
  "/slots/:doctorId",
  validateGetAvailableSlots,
  appointmentController.getAvailableSlots
);
router.get("/", validateGetAppointments, appointmentController.getAppointments);

router.post(
  "/",
  authorize("patient", "admin"),
  idempotencyMiddleware,
  validateBody(createAppointmentSchema),
  validateCreateAppointment,
  appointmentController.createAppointment
);

router.get("/:id", appointmentController.getAppointment);

router.put(
  "/:id",
  authorize("doctor", "admin"),
  validateBody(updateAppointmentSchema),
  appointmentController.updateAppointment
);

router.patch(
  "/:id/status",
  authorize("doctor", "admin"),
  validateUpdateAppointmentStatus,
  appointmentController.updateAppointmentStatus
);

router.post("/:id/cancel", validateCancelAppointment, appointmentController.cancelAppointment);

module.exports = router;
