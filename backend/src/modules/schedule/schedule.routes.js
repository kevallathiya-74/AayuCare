const express = require("express");
const scheduleController = require("./schedule.controller");
const { protect, restrictTo } = require("../../middleware/auth");
const { cache } = require("../../middleware/cache");
const {
  validateSchedule,
  validateTimeSlot,
} = require("../../validators/scheduleValidator");

const router = express.Router();

router.use(protect);

router.get(
  "/:doctorId",
  cache(
    300,
    (req) =>
      `aayucare:v1:schedule:doctor:${req.params.doctorId}:hospital:${req.hospitalId || "all"}`
  ),
  scheduleController.getDoctorSchedule
);

router.get("/:doctorId/slots", scheduleController.getAvailableSlots);

router.put(
  "/:doctorId/weekly",
  restrictTo("doctor", "admin", "super_admin"),
  validateSchedule,
  scheduleController.setWeeklySchedule
);

router.patch(
  "/:doctorId/day/:dayOfWeek",
  restrictTo("doctor", "admin", "super_admin"),
  scheduleController.updateDaySchedule
);

router.post(
  "/:doctorId/day/:dayOfWeek/slots",
  restrictTo("doctor", "admin", "super_admin"),
  validateTimeSlot,
  scheduleController.addTimeSlot
);

router.delete(
  "/:doctorId/day/:dayOfWeek/slots/:slotId",
  restrictTo("doctor", "admin", "super_admin"),
  scheduleController.removeTimeSlot
);

router.patch(
  "/entries/:scheduleId/availability",
  restrictTo("doctor", "admin", "super_admin"),
  scheduleController.toggleAvailability
);

module.exports = router;