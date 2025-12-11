/**
 * Patient Controller
 * Handles patient management, search, and medical history
 */

const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const logger = require('../utils/logger');

/**
 * @desc    Search patients by name, ID, phone, or email
 * @route   GET /api/patients/search?q=query
 * @access  Private (Doctor/Admin)
 */
exports.searchPatients = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters',
            });
        }

        // Sanitize search query to prevent regex injection
        const searchQuery = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Search in multiple fields
        const patients = await User.find({
            role: 'patient',
            $or: [
                { userId: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { phone: { $regex: searchQuery, $options: 'i' } },
            ],
        })
            .select('userId name email phone age gender bloodGroup allergies medicalHistory createdAt')
            .limit(20)
            .lean();

        res.json({
            success: true,
            count: patients.length,
            patients,
        });
    } catch (error) {
        logger.error('Patient search error:', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            message: 'Failed to search patients',
            error: error.message,
        });
    }
};

/**
 * @desc    Get complete medical history of a patient
 * @route   GET /api/patients/:patientId/complete-history
 * @access  Private (Doctor/Admin or Patient own data)
 */
exports.getCompleteHistory = async (req, res) => {
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
                message: 'Not authorized to view this patient data',
            });
        }

        // Get patient profile
        const patient = await User.findOne({ userId: patientId, role: 'patient' })
            .select('-password')
            .lean();

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Get all medical records (sorted by most recent)
        const medicalRecords = await MedicalRecord.find({ patientId })
            .populate('doctorId', 'name specialization userId')
            .sort({ createdAt: -1 })
            .lean();

        // Get all appointments (sorted by most recent)
        const appointments = await Appointment.find({ patientId })
            .populate('doctorId', 'name specialization userId')
            .sort({ appointmentDate: -1 })
            .lean();

        // Get all prescriptions (sorted by most recent)
        const prescriptions = await Prescription.find({ patientId })
            .populate('doctorId', 'name specialization userId')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate health statistics
        const stats = {
            totalVisits: appointments.filter(a => a.status === 'completed').length,
            totalRecords: medicalRecords.length,
            totalPrescriptions: prescriptions.length,
            upcomingAppointments: appointments.filter(
                a => a.status === 'scheduled' && new Date(a.appointmentDate) > new Date()
            ).length,
            lastVisit: appointments.length > 0 ? appointments[0].appointmentDate : null,
        };

        // Get recent vitals from medical records
        const recentVitals = medicalRecords
            .filter(r => r.vitals && Object.keys(r.vitals).length > 0)
            .slice(0, 5)
            .map(r => ({
                date: r.createdAt,
                vitals: r.vitals,
            }));

        // Compile complete history
        const completeHistory = {
            patient,
            stats,
            recentVitals,
            medicalRecords,
            appointments,
            prescriptions,
            summary: {
                allergies: patient.allergies || [],
                bloodGroup: patient.bloodGroup || 'Not specified',
                chronicConditions: patient.medicalHistory || [],
                age: patient.age,
                gender: patient.gender,
            },
        };

        res.json({
            success: true,
            data: completeHistory,
        });
    } catch (error) {
        logger.error('Complete history error:', { error: error.message, stack: error.stack, patientId: req.params.patientId });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient history',
            error: error.message,
        });
    }
};

/**
 * @desc    Get patient profile with basic info
 * @route   GET /api/patients/:patientId/profile
 * @access  Private (Doctor/Admin or Patient own data)
 */
exports.getPatientProfile = async (req, res) => {
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
                message: 'Not authorized to view this patient data',
            });
        }

        const patient = await User.findOne({ userId: patientId, role: 'patient' })
            .select('-password')
            .lean();

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        // Get quick stats
        const [recordCount, appointmentCount, prescriptionCount] = await Promise.all([
            MedicalRecord.countDocuments({ patientId }),
            Appointment.countDocuments({ patientId }),
            Prescription.countDocuments({ patientId }),
        ]);

        res.json({
            success: true,
            data: {
                ...patient,
                stats: {
                    totalRecords: recordCount,
                    totalAppointments: appointmentCount,
                    totalPrescriptions: prescriptionCount,
                },
            },
        });
    } catch (error) {
        logger.error('Patient profile error:', { error: error.message, stack: error.stack, patientId: req.params.patientId });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch patient profile',
            error: error.message,
        });
    }
};

/**
 * @desc    Update patient profile
 * @route   PATCH /api/patients/:patientId/profile
 * @access  Private (Patient own data or Admin)
 */
exports.updatePatientProfile = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check access rights
        if (req.user.role !== 'admin' && req.user.userId !== patientId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this patient data',
            });
        }

        const allowedUpdates = [
            'name',
            'age',
            'gender',
            'phone',
            'address',
            'bloodGroup',
            'allergies',
            'medicalHistory',
            'emergencyContact',
        ];

        const updates = {};
        Object.keys(req.body).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        });

        const patient = await User.findOneAndUpdate(
            { userId: patientId, role: 'patient' },
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found',
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: patient,
        });
    } catch (error) {
        logger.error('Patient profile update error:', { error: error.message, stack: error.stack, patientId: req.params.patientId });
        res.status(500).json({
            success: false,
            message: 'Failed to update patient profile',
            error: error.message,
        });
    }
};
