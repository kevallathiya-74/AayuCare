const legacyScheduleController = require("../../controllers/scheduleController");
const scheduleService = require("./schedule.service");

exports.getDoctorSchedule = (req, res, next) => legacyScheduleController.getDoctorSchedule(req, res, next);
exports.getAvailableSlots = (req, res, next) => legacyScheduleController.getAvailableSlots(req, res, next);
exports.setWeeklySchedule = (req, res, next) => legacyScheduleController.setWeeklySchedule(req, res, next);
exports.updateDaySchedule = (req, res, next) => legacyScheduleController.updateDaySchedule(req, res, next);
exports.addTimeSlot = (req, res, next) => legacyScheduleController.addTimeSlot(req, res, next);
exports.removeTimeSlot = (req, res, next) => legacyScheduleController.removeTimeSlot(req, res, next);
exports.toggleAvailability = (req, res, next) => legacyScheduleController.toggleAvailability(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = scheduleService;