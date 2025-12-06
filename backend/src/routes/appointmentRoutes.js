const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/appointments/stats
 * @desc    Get appointment statistics
 * @access  Private
 */
router.get('/stats', appointmentController.getAppointmentStats);

/**
 * @route   GET /api/appointments/slots/:doctorId
 * @desc    Get available time slots for a doctor
 * @access  Private
 */
router.get('/slots/:doctorId', appointmentController.getAvailableSlots);

/**
 * @route   GET /api/appointments
 * @desc    Get appointments (filtered by role)
 * @access  Private
 */
router.get('/', appointmentController.getAppointments);

/**
 * @route   POST /api/appointments
 * @desc    Create new appointment
 * @access  Private (Patient)
 */
router.post('/', authorize('patient', 'admin'), appointmentController.createAppointment);

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment
 * @access  Private
 */
router.get('/:id', appointmentController.getAppointment);

/**
 * @route   PUT /api/appointments/:id
 * @desc    Update appointment details
 * @access  Private
 */
router.put('/:id', appointmentController.updateAppointment);

/**
 * @route   PATCH /api/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (Doctor, Admin)
 */
router.patch('/:id/status', authorize('doctor', 'admin'), appointmentController.updateAppointmentStatus);

/**
 * @route   POST /api/appointments/:id/cancel
 * @desc    Cancel appointment
 * @access  Private
 */
router.post('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;
