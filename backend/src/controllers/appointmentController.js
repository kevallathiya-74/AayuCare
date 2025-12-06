const appointmentService = require('../services/appointmentService');
const { AppError } = require('../middleware/errorHandler');

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
            // Admin can view all appointments with filters
            const { patientId, doctorId } = req.query;
            if (patientId) {
                result = await appointmentService.getPatientAppointments(patientId, req.query);
            } else if (doctorId) {
                result = await appointmentService.getDoctorAppointments(doctorId, req.query);
            } else {
                return next(new AppError('Please provide patientId or doctorId', 400));
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
        const appointment = await appointmentService.getAppointmentById(req.params.id);

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
