const appointmentService = require('../services/appointmentService');
const { AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

/**
 * @desc    Create new appointment
 * @route   POST /api/appointments
 * @access  Private (Patient)
 */
exports.createAppointment = async (req, res, next) => {
    try {
        const appointmentData = {
            ...req.body,
            patientId: req.user.role === 'patient' ? req.user.id : req.body.patientId
        };

        const appointment = await appointmentService.createAppointment(appointmentData);

        res.status(201).json({
            status: 'success',
            message: 'Appointment created successfully',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all appointments (admin only, with optional filters)
 * @route   GET /api/appointments (admin calls this)
 * @access  Private (Admin)
 */
exports.getAllAppointments = async (req, res, next) => {
    try {
        const result = await appointmentService.getAllAppointments(req.query);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get appointments (patient or doctor specific)
 * @route   GET /api/appointments
 * @access  Private
 */
exports.getAppointments = async (req, res, next) => {
    try {
        let result;

        if (req.user.role === 'patient') {
            result = await appointmentService.getPatientAppointments(req.user.id, req.query);
        } else if (req.user.role === 'doctor') {
            result = await appointmentService.getDoctorAppointments(req.user.id, req.query);
        } else if (req.user.role === 'admin') {
            // Admin can view all appointments or filter by patient/doctor
            const { patientId, doctorId } = req.query;
            if (patientId) {
                result = await appointmentService.getPatientAppointments(patientId, req.query);
            } else if (doctorId) {
                result = await appointmentService.getDoctorAppointments(doctorId, req.query);
            } else {
                // No filters - get all appointments (admin only)
                result = await appointmentService.getAllAppointments(req.query);
            }
        }

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single appointment
 * @route   GET /api/appointments/:id
 * @access  Private
 */
exports.getAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format to prevent casting errors
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return next(new AppError('Invalid appointment ID format', 400));
        }

        const appointment = await appointmentService.getAppointmentById(id);

        // Check authorization
        if (
            req.user.role !== 'admin' &&
            appointment.patientId._id.toString() !== req.user.id &&
            appointment.doctorId._id.toString() !== req.user.id
        ) {
            return next(new AppError('Not authorized to view this appointment', 403));
        }

        res.status(200).json({
            status: 'success',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update appointment status
 * @route   PATCH /api/appointments/:id/status
 * @access  Private (Doctor, Admin)
 */
exports.updateAppointmentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!status) {
            return next(new AppError('Status is required', 400));
        }

        const appointment = await appointmentService.updateAppointmentStatus(
            req.params.id,
            status,
            req.user.id,
            req.user.role
        );

        res.status(200).json({
            status: 'success',
            message: 'Appointment status updated successfully',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel appointment
 * @route   POST /api/appointments/:id/cancel
 * @access  Private
 */
exports.cancelAppointment = async (req, res, next) => {
    try {
        const { cancelReason } = req.body;

        const appointment = await appointmentService.cancelAppointment(
            req.params.id,
            req.user.id,
            req.user.role,
            cancelReason
        );

        res.status(200).json({
            status: 'success',
            message: 'Appointment cancelled successfully',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update appointment details
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
exports.updateAppointment = async (req, res, next) => {
    try {
        const appointment = await appointmentService.updateAppointment(
            req.params.id,
            req.body,
            req.user.id,
            req.user.role
        );

        res.status(200).json({
            status: 'success',
            message: 'Appointment updated successfully',
            data: { appointment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get available time slots for a doctor
 * @route   GET /api/appointments/slots/:doctorId
 * @access  Private
 */
exports.getAvailableSlots = async (req, res, next) => {
    try {
        const { date } = req.query;

        if (!date) {
            return next(new AppError('Date is required', 400));
        }

        const slots = await appointmentService.getAvailableSlots(req.params.doctorId, date);

        res.status(200).json({
            status: 'success',
            data: slots
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Private
 */
exports.getAppointmentStats = async (req, res, next) => {
    try {
        const stats = await appointmentService.getAppointmentStats(req.user.id, req.user.role);

        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get appointments for a specific patient
 * @route   GET /api/appointments/patient/:patientId
 * @access  Private (Doctor, Admin)
 */
exports.getPatientAppointments = async (req, res, next) => {
    try {
        const { patientId } = req.params;

        // Find patient by userId to get ObjectId
        const patient = await User.findOne({ userId: patientId, role: 'patient' }).select('_id');
        
        if (!patient) {
            return res.status(404).json({
                status: 'error',
                message: 'Patient not found'
            });
        }

        // Find appointments using the ObjectId
        const appointments = await Appointment.find({ patientId: patient._id })
            .populate('doctorId', 'name specialization')
            .populate('patientId', 'name email phone')
            .sort({ appointmentDate: -1 });

        res.status(200).json({
            status: 'success',
            data: { appointments }
        });
    } catch (error) {
        next(error);
    }
};

