const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Get all medical records (Admin only) - must be before /:id route
router.get(
    '/',
    restrictTo('admin'),
    medicalRecordController.getAllMedicalRecords
);

// Create medical record (Doctor only)
router.post(
    '/',
    restrictTo('doctor', 'admin'),
    medicalRecordController.createMedicalRecord
);

// Get patient's medical records
router.get(
    '/patient/:patientId',
    medicalRecordController.getPatientMedicalRecords
);

// Get patient's complete history (Doctor, Admin only)
router.get(
    '/history/:patientId',
    restrictTo('doctor', 'admin'),
    medicalRecordController.getPatientHistory
);

// Get single medical record
router.get('/:id', medicalRecordController.getMedicalRecord);

// Update medical record (Doctor, Admin only)
router.put(
    '/:id',
    restrictTo('doctor', 'admin'),
    medicalRecordController.updateMedicalRecord
);

// Delete medical record (Doctor, Admin only)
router.delete(
    '/:id',
    restrictTo('doctor', 'admin'),
    medicalRecordController.deleteMedicalRecord
);

module.exports = router;
