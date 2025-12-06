const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

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
 * @route   GET /api/doctors/:id/stats
 * @desc    Get doctor statistics
 * @access  Private (Doctor, Admin)
 */
router.get('/:id/stats', protect, authorize('doctor', 'admin'), doctorController.getDoctorStats);

module.exports = router;
