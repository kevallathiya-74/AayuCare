const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

/**
 * Public routes
 */

/**
 * @route   GET /api/doctors
 * @desc    Get all doctors
 * @access  Public
 */
router.get('/', doctorController.getDoctors);

/**
 * @route   GET /api/doctors/:id
 * @desc    Get single doctor
 * @access  Public
 */
router.get('/:id', doctorController.getDoctor);

/**
 * Protected routes (Doctor only)
 */

/**
 * @route   GET /api/doctors/dashboard
 * @desc    Get doctor dashboard data
 * @access  Private (Doctor)
 */
router.get('/me/dashboard', protect, authorize('doctor'), doctorController.getDoctorDashboard);

/**
 * @route   GET /api/doctors/appointments/today
 * @desc    Get today's appointments for logged-in doctor
 * @access  Private (Doctor)
 */
router.get('/me/appointments/today', protect, authorize('doctor'), doctorController.getTodaysAppointments);

/**
 * @route   GET /api/doctors/appointments/upcoming
 * @desc    Get upcoming appointments for logged-in doctor
 * @access  Private (Doctor)
 */
router.get('/me/appointments/upcoming', protect, authorize('doctor'), doctorController.getUpcomingAppointments);

/**
 * @route   GET /api/doctors/patients/search
 * @desc    Search patients who have visited this doctor
 * @access  Private (Doctor)
 */
router.get('/me/patients/search', protect, authorize('doctor'), doctorController.searchPatients);

/**
 * @route   PATCH /api/doctors/appointments/:id/status
 * @desc    Update appointment status
 * @access  Private (Doctor)
 */
router.patch('/me/appointments/:id/status', protect, authorize('doctor'), doctorController.updateAppointmentStatus);

/**
 * @route   GET /api/doctors/profile/stats
 * @desc    Get profile statistics for logged-in doctor
 * @access  Private (Doctor)
 */
router.get('/me/profile/stats', protect, authorize('doctor'), doctorController.getDoctorProfileStats);

/**
 * @route   GET /api/doctors/:id/stats
 * @desc    Get doctor statistics
 * @access  Private (Doctor, Admin)
 */
router.get('/:id/stats', protect, authorize('doctor', 'admin'), doctorController.getDoctorStats);

module.exports = router;
