/**
 * Prescription Controller
 * Handles prescription creation, retrieval, and management
 */

const Prescription = require('../models/Prescription');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    Create a new prescription
 * @route   POST /api/prescriptions
 * @access  Private (Doctor/Admin)
 */
exports.createPrescription = async (req, res) => {
    try {
        const {
            patientId,
            medications,
            diagnosis,
            symptoms,
            notes,
            followUpDate,
            tests,
        } = req.body;

        // Validate required fields
        if (!patientId || !medications || medications.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Patient ID and at least one medication are required',
            });
        }

        // Verify patient exists
        const patient = await User.findOne({ userId: patientId, role: 'patient' });
        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Create prescription
        const prescription = await Prescription.create({
            patientId,
            doctorId: req.user.userId,
            medications,
            diagnosis,
            symptoms,
            notes,
            followUpDate,
            tests,
        });

        // Populate doctor details
        await prescription.populate('doctorId', 'name specialization userId');

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully. Patient will be notified.',
            data: prescription,
        });
    } catch (error) {
        logger.error('Create prescription error:', { error: error.message, stack: error.stack, patientId: req.body.patientId });
        res.status(500).json({
            success: false,
            message: 'Failed to create prescription',
            error: error.message,
        });
    }
};

/**
 * @desc    Get all prescriptions for a patient
 * @route   GET /api/prescriptions/patient/:patientId
 * @access  Private (Patient own data or Doctor/Admin)
 */
exports.getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check access rights
        if (
            req.user.role !== 'admin' &&
            req.user.role !== 'doctor' &&
            req.user.userId !== patientId
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these prescriptions',
            });
        }

        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name specialization userId')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: prescriptions.length,
            data: prescriptions,
        });
    } catch (error) {
        logger.error('Get patient prescriptions error:', { error: error.message, stack: error.stack, patientId: req.params.patientId });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions',
            error: error.message,
        });
    }
};

/**
 * @desc    Get all prescriptions created by a doctor
 * @route   GET /api/prescriptions/doctor/:doctorId
 * @access  Private (Doctor own data or Admin)
 */
exports.getDoctorPrescriptions = async (req, res) => {
    try {
        const { doctorId } = req.params;

        // Check access rights
        if (req.user.role !== 'admin' && req.user.userId !== doctorId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these prescriptions',
            });
        }

        const prescriptions = await Prescription.find({ doctorId })
            .populate('patientId', 'name userId age gender')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: prescriptions.length,
            data: prescriptions,
        });
    } catch (error) {
        logger.error('Get doctor prescriptions error:', { error: error.message, stack: error.stack, doctorId: req.params.doctorId });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions',
            error: error.message,
        });
    }
};

/**
 * @desc    Get prescription by ID
 * @route   GET /api/prescriptions/:prescriptionId
 * @access  Private
 */
exports.getPrescriptionById = async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const prescription = await Prescription.findById(prescriptionId)
            .populate('doctorId', 'name specialization userId phone')
            .populate('patientId', 'name userId age gender bloodGroup');

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found',
            });
        }

        // Check access rights
        if (
            req.user.role !== 'admin' &&
            req.user.userId !== prescription.doctorId.userId &&
            req.user.userId !== prescription.patientId
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this prescription',
            });
        }

        res.json({
            success: true,
            data: prescription,
        });
    } catch (error) {
        logger.error('Get prescription by ID error:', { error: error.message, stack: error.stack, prescriptionId: req.params.prescriptionId });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescription',
            error: error.message,
        });
    }
};

/**
 * @desc    Update prescription status
 * @route   PATCH /api/prescriptions/:prescriptionId/status
 * @access  Private (Doctor/Admin)
 */
exports.updatePrescriptionStatus = async (req, res) => {
    try {
        const { prescriptionId } = req.params;
        const { status } = req.body;

        const validStatuses = ['active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active, completed, or cancelled',
            });
        }

        const prescription = await Prescription.findByIdAndUpdate(
            prescriptionId,
            { status },
            { new: true, runValidators: true }
        ).populate('doctorId', 'name specialization');

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found',
            });
        }

        res.json({
            success: true,
            message: 'Prescription status updated successfully',
            data: prescription,
        });
    } catch (error) {
        logger.error('Update prescription status error:', { error: error.message, stack: error.stack, prescriptionId: req.params.prescriptionId, status: req.body.status });
        res.status(500).json({
            success: false,
            message: 'Failed to update prescription status',
            error: error.message,
        });
    }
};

/**
 * @desc    Delete a prescription
 * @route   DELETE /api/prescriptions/:prescriptionId
 * @access  Private (Admin only)
 */
exports.deletePrescription = async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const prescription = await Prescription.findByIdAndDelete(prescriptionId);

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found',
            });
        }

        res.json({
            success: true,
            message: 'Prescription deleted successfully',
        });
    } catch (error) {
        logger.error('Delete prescription error:', { error: error.message, stack: error.stack, prescriptionId: req.params.prescriptionId });
        res.status(500).json({
            success: false,
            message: 'Failed to delete prescription',
            error: error.message,
        });
    }
};
