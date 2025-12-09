/**
 * Patient Routes
 * Routes for patient management and search
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/patients/search
// @desc    Search patients by name, ID, or phone
// @access  Private (Doctor/Admin only)
router.get('/search', authorize('doctor', 'admin'), patientController.searchPatients);

// @route   GET /api/patients/:patientId/complete-history
// @desc    Get complete medical history of a patient
// @access  Private (Doctor/Admin or Patient own data)
router.get('/:patientId/complete-history', patientController.getCompleteHistory);

// @route   GET /api/patients/:patientId/profile
// @desc    Get patient profile with basic info
// @access  Private (Doctor/Admin or Patient own data)
router.get('/:patientId/profile', patientController.getPatientProfile);

// @route   PATCH /api/patients/:patientId/profile
// @desc    Update patient profile
// @access  Private (Patient own data or Admin)
router.patch('/:patientId/profile', patientController.updatePatientProfile);

module.exports = router;
