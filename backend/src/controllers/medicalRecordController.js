const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Get all medical records (admin only with filters)
 * @route   GET /api/medical-records
 * @access  Private (Admin)
 */
exports.getAllMedicalRecords = async (req, res, next) => {
    try {
        const { patientId, doctorId, recordType, startDate, endDate, page = 1, limit = 10 } = req.query;

        // Build query
        const query = {};

        if (patientId) {
            query.patientId = patientId;
        }

        if (doctorId) {
            query.doctorId = doctorId;
        }

        if (recordType) {
            query.recordType = recordType;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (page - 1) * limit;

        const medicalRecords = await MedicalRecord.find(query)
            .populate('patientId', 'name userId email phone')
            .populate('doctorId', 'name specialization')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MedicalRecord.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                medicalRecords,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new medical record
 * @route   POST /api/medical-records
 * @access  Private (Doctor)
 */
exports.createMedicalRecord = async (req, res, next) => {
    try {
        const {
            patientId,
            recordType,
            title,
            description,
            date,
            diagnosis,
            symptoms,
            medications,
            labResults,
            files,
        } = req.body;

        // Verify patient exists
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'patient') {
            return next(new AppError('Patient not found', 404));
        }

        const medicalRecord = await MedicalRecord.create({
            patientId,
            doctorId: req.user.id,
            hospitalId: req.user.hospitalId || 'MAIN',
            recordType,
            title,
            description,
            date: date || Date.now(),
            diagnosis,
            symptoms,
            medications,
            labResults,
            files,
        });

        logger.info(`Medical record created by ${req.user.userId} for patient ${patient.userId}`);

        res.status(201).json({
            status: 'success',
            message: 'Medical record created successfully',
            data: {
                medicalRecord,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all medical records for a patient
 * @route   GET /api/medical-records/patient/:patientId
 * @access  Private (Patient, Doctor, Admin)
 */
exports.getPatientMedicalRecords = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const { recordType, startDate, endDate, page = 1, limit = 10 } = req.query;

        // Build query
        const query = { patientId };

        if (recordType) {
            query.recordType = recordType;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (page - 1) * limit;

        const medicalRecords = await MedicalRecord.find(query)
            .populate('doctorId', 'name specialization')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MedicalRecord.countDocuments(query);

        res.status(200).json({
            status: 'success',
            data: {
                medicalRecords,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single medical record
 * @route   GET /api/medical-records/:id
 * @access  Private
 */
exports.getMedicalRecord = async (req, res, next) => {
    try {
        const medicalRecord = await MedicalRecord.findById(req.params.id)
            .populate('patientId', 'name userId email phone')
            .populate('doctorId', 'name specialization qualification');

        if (!medicalRecord) {
            return next(new AppError('Medical record not found', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                medicalRecord,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update medical record
 * @route   PUT /api/medical-records/:id
 * @access  Private (Doctor)
 */
exports.updateMedicalRecord = async (req, res, next) => {
    try {
        const medicalRecord = await MedicalRecord.findById(req.params.id);

        if (!medicalRecord) {
            return next(new AppError('Medical record not found', 404));
        }

        // Only the doctor who created it can update
        if (medicalRecord.doctorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to update this record', 403));
        }

        const updatedRecord = await MedicalRecord.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        logger.info(`Medical record ${req.params.id} updated by ${req.user.userId}`);

        res.status(200).json({
            status: 'success',
            data: {
                medicalRecord: updatedRecord,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete medical record
 * @route   DELETE /api/medical-records/:id
 * @access  Private (Doctor, Admin)
 */
exports.deleteMedicalRecord = async (req, res, next) => {
    try {
        const medicalRecord = await MedicalRecord.findById(req.params.id);

        if (!medicalRecord) {
            return next(new AppError('Medical record not found', 404));
        }

        // Only the doctor who created it or admin can delete
        if (medicalRecord.doctorId.toString() !== req.user.id && req.user.role !== 'admin') {
            return next(new AppError('Not authorized to delete this record', 403));
        }

        await medicalRecord.deleteOne();

        logger.info(`Medical record ${req.params.id} deleted by ${req.user.userId}`);

        res.status(200).json({
            status: 'success',
            message: 'Medical record deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get patient's complete medical history
 * @route   GET /api/medical-records/history/:patientId
 * @access  Private (Doctor, Admin)
 */
exports.getPatientHistory = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        const patient = await User.findById(patientId);
        if (!patient) {
            return next(new AppError('Patient not found', 404));
        }

        const medicalRecords = await MedicalRecord.find({ patientId })
            .populate('doctorId', 'name specialization')
            .sort({ date: -1 });

        // Group by record type
        const history = {
            patient: {
                name: patient.name,
                userId: patient.userId,
                dateOfBirth: patient.dateOfBirth,
                bloodGroup: patient.bloodGroup,
                allergies: patient.allergies,
                medicalHistory: patient.medicalHistory,
            },
            records: {
                labReports: medicalRecords.filter(r => r.recordType === 'lab_report'),
                prescriptions: medicalRecords.filter(r => r.recordType === 'prescription'),
                doctorVisits: medicalRecords.filter(r => r.recordType === 'doctor_visit'),
                testResults: medicalRecords.filter(r => r.recordType === 'test_result'),
                imaging: medicalRecords.filter(r => r.recordType === 'imaging'),
            },
            totalRecords: medicalRecords.length,
        };

        res.status(200).json({
            status: 'success',
            data: history,
        });
    } catch (error) {
        next(error);
    }
};
