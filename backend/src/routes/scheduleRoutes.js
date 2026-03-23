/**
 * Schedule Routes
 * Mounted at /api/schedules
 */

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect, restrictTo } = require('../middleware/auth');
const { cache } = require('../middleware/cache');
const { validateSchedule, validateTimeSlot } = require('../validators/scheduleValidator');

// All schedule routes require authentication
router.use(protect);

// GET /api/schedules/:doctorId — get full weekly schedule
router.get(
  '/:doctorId',
  cache(300, (req) => `aayucare:v1:schedule:doctor:${req.params.doctorId}:hospital:${req.hospitalId || 'all'}`),
  scheduleController.getDoctorSchedule
);

// GET /api/schedules/:doctorId/slots?day=monday — get available slots for booking
router.get(
  '/:doctorId/slots',
  scheduleController.getAvailableSlots
);

// PUT /api/schedules/:doctorId/weekly — create/replace full weekly schedule
router.put(
  '/:doctorId/weekly',
  restrictTo('doctor', 'admin', 'super_admin'),
  validateSchedule,
  scheduleController.setWeeklySchedule
);

// PATCH /api/schedules/:doctorId/day/:dayOfWeek — update a single day
router.patch(
  '/:doctorId/day/:dayOfWeek',
  restrictTo('doctor', 'admin', 'super_admin'),
  scheduleController.updateDaySchedule
);

// POST /api/schedules/:doctorId/day/:dayOfWeek/slots — add a time slot
router.post(
  '/:doctorId/day/:dayOfWeek/slots',
  restrictTo('doctor', 'admin', 'super_admin'),
  validateTimeSlot,
  scheduleController.addTimeSlot
);

// DELETE /api/schedules/:doctorId/day/:dayOfWeek/slots/:slotId — remove a time slot
router.delete(
  '/:doctorId/day/:dayOfWeek/slots/:slotId',
  restrictTo('doctor', 'admin', 'super_admin'),
  scheduleController.removeTimeSlot
);

// PATCH /api/schedules/entries/:scheduleId/availability — toggle availability
router.patch(
  '/entries/:scheduleId/availability',
  restrictTo('doctor', 'admin', 'super_admin'),
  scheduleController.toggleAvailability
);

module.exports = router;
