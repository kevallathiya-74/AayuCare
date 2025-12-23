const doctorService = require('../services/doctorService');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public
 */
exports.getDoctors = async (req, res, next) => {
    try {
        const result = await doctorService.getDoctors(req.query);

        res.status(200).json({
            status: 'success',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single doctor
 * @route   GET /api/doctors/:id
 * @access  Public
 */
exports.getDoctor = async (req, res, next) => {
    try {
        const doctor = await doctorService.getDoctorById(req.params.id);

        res.status(200).json({
            status: 'success',
            data: { doctor }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get doctor statistics
 * @route   GET /api/doctors/:id/stats
 * @access  Private (Doctor, Admin)
 */
exports.getDoctorStats = async (req, res, next) => {
    try {
        const stats = await doctorService.getDoctorStats(req.params.id);

        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get doctor dashboard data (schedule, stats, upcoming appointments)
 * @route   GET /api/doctors/dashboard
 * @access  Private (Doctor only)
 */
exports.getDoctorDashboard = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Run all queries in parallel
        const [
            todaysAppointments,
            completedToday,
            totalPatients,
            upcomingAppointments,
            recentPrescriptions,
        ] = await Promise.all([
            // Today's appointments
            Appointment.find({
                doctorId,
                appointmentDate: { $gte: today, $lt: tomorrow },
            })
                .populate('patientId', 'name userId age gender phone')
                .sort({ appointmentDate: 1 })
                .lean(),
            // Completed today
            Appointment.countDocuments({
                doctorId,
                appointmentDate: { $gte: today, $lt: tomorrow },
                status: 'completed',
            }),
            // Total unique patients
            Appointment.distinct('patientId', { doctorId }),
            // Upcoming appointments (next 7 days)
            Appointment.countDocuments({
                doctorId,
                appointmentDate: { $gte: today },
                status: { $in: ['scheduled', 'confirmed'] },
            }),
            // Recent prescriptions
            Prescription.find({ doctorId })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('patientId', 'name userId')
                .lean(),
        ]);

        const schedule = {
            totalAppointments: todaysAppointments.length,
            completed: completedToday,
            pending: todaysAppointments.length - completedToday,
            nextPatient: todaysAppointments.find(apt => apt.status !== 'completed')?.patientId?.name || 'No pending',
            nextTime: todaysAppointments.find(apt => apt.status !== 'completed')?.appointmentDate
                ? new Date(todaysAppointments.find(apt => apt.status !== 'completed').appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : 'N/A',
        };

        // Format appointments for frontend
        const formattedAppointments = todaysAppointments.map(apt => ({
            id: apt._id,
            time: new Date(apt.appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            patientName: apt.patientId?.name || 'Unknown',
            patientId: apt.patientId?.userId || apt.patientId?._id,
            age: apt.patientId?.age || 'N/A',
            reason: apt.reason || 'Consultation',
            status: apt.status,
            type: apt.appointmentType || 'in-person',
        }));

        res.json({
            success: true,
            data: {
                schedule,
                todaysAppointments: formattedAppointments,
                stats: {
                    totalPatients: totalPatients.length,
                    upcomingAppointments,
                    prescriptionsToday: recentPrescriptions.filter(p => 
                        new Date(p.createdAt) >= today
                    ).length,
                },
                recentPrescriptions: recentPrescriptions.map(p => ({
                    id: p._id,
                    patientName: p.patientId?.name || 'Unknown',
                    date: p.createdAt,
                    medicationsCount: p.medications?.length || 0,
                })),
            },
        });
    } catch (error) {
        logger.error('Doctor dashboard error:', { error: error.message, stack: error.stack, doctorId: req.user?._id });
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard data',
            error: error.message,
        });
    }
};

/**
 * @desc    Get today's appointments for doctor
 * @route   GET /api/doctors/appointments/today
 * @access  Private (Doctor only)
 */
exports.getTodaysAppointments = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { filter = 'all' } = req.query;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let query = {
            doctorId,
            appointmentDate: { $gte: today, $lt: tomorrow },
        };

        // Apply filter
        if (filter === 'completed') {
            query.status = 'completed';
        } else if (filter === 'pending') {
            query.status = { $in: ['scheduled', 'confirmed'] };
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name userId age gender phone email')
            .sort({ appointmentDate: 1 })
            .lean();

        res.json({
            success: true,
            count: appointments.length,
            data: appointments.map(apt => ({
                id: apt._id,
                time: new Date(apt.appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                patientName: apt.patientId?.name || 'Unknown',
                patientId: apt.patientId?.userId || apt.patientId?._id,
                patientPhoto: apt.patientId?.avatar || null,
                age: apt.patientId?.age || 'N/A',
                gender: apt.patientId?.gender || 'N/A',
                phone: apt.patientId?.phone || 'N/A',
                reason: apt.reason || 'Consultation',
                status: apt.status,
                type: apt.appointmentType || 'in-person',
            })),
        });
    } catch (error) {
        logger.error('Today appointments error:', { error: error.message, stack: error.stack, doctorId: req.user?._id });
        res.status(500).json({
            success: false,
            message: 'Failed to load appointments',
            error: error.message,
        });
    }
};

/**
 * @desc    Get upcoming appointments for doctor
 * @route   GET /api/doctors/appointments/upcoming
 * @access  Private (Doctor only)
 */
exports.getUpcomingAppointments = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { page = 1, limit = 10 } = req.query;
        
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const query = {
            doctorId,
            appointmentDate: { $gte: tomorrow },
            status: { $in: ['scheduled', 'confirmed'] },
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [appointments, total] = await Promise.all([
            Appointment.find(query)
                .populate('patientId', 'name userId age gender phone')
                .sort({ appointmentDate: 1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Appointment.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: appointments.map(apt => ({
                id: apt._id,
                date: apt.appointmentDate,
                time: new Date(apt.appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                patientName: apt.patientId?.name || 'Unknown',
                patientId: apt.patientId?.userId || apt.patientId?._id,
                reason: apt.reason || 'Consultation',
                status: apt.status,
                type: apt.appointmentType || 'in-person',
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        logger.error('Upcoming appointments error:', { error: error.message, stack: error.stack, doctorId: req.user?._id });
        res.status(500).json({
            success: false,
            message: 'Failed to load upcoming appointments',
            error: error.message,
        });
    }
};

/**
 * @desc    Search patients for doctor
 * @route   GET /api/doctors/patients/search
 * @access  Private (Doctor only)
 */
exports.searchPatients = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { q } = req.query;

        logger.info('Search patients request:', { doctorId, userId: req.user.userId, query: q });

        if (!q || q.length < 2) {
            return res.json({
                success: true,
                data: [],
            });
        }

        // Sanitize search query for regex
        const sanitizedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Find patients who have appointments with this doctor
        const patientIds = await Appointment.distinct('patientId', { doctorId });
        
        logger.info('Found patient IDs:', { patientIds, count: patientIds.length });

        const patients = await User.find({
            _id: { $in: patientIds },
            $or: [
                { name: { $regex: sanitizedQuery, $options: 'i' } },
                { userId: { $regex: sanitizedQuery, $options: 'i' } },
                { phone: { $regex: sanitizedQuery, $options: 'i' } },
            ],
        })
            .select('name userId age gender phone email dateOfBirth')
            .limit(10)
            .lean({ virtuals: true });

        logger.info('Search results:', { count: patients.length, patients });

        res.json({
            success: true,
            data: patients,
        });
    } catch (error) {
        logger.error('Patient search error:', { error: error.message, stack: error.stack, doctorId: req.user?._id });
        res.status(500).json({
            success: false,
            message: 'Failed to search patients',
            error: error.message,
        });
    }
};

/**
 * @desc    Update appointment status (start consultation, complete, etc.)
 * @route   PATCH /api/doctors/appointments/:id/status
 * @access  Private (Doctor only)
 */
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const doctorId = req.user._id;

        const validStatuses = ['confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const appointment = await Appointment.findOne({ _id: id, doctorId });

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found or unauthorized',
            });
        }

        appointment.status = status;
        if (notes) {
            appointment.notes = notes;
        }
        if (status === 'completed') {
            appointment.completedAt = new Date();
        }

        await appointment.save();

        logger.info('Appointment status updated', {
            appointmentId: id,
            doctorId,
            oldStatus: appointment.status,
            newStatus: status,
        });

        res.json({
            success: true,
            message: 'Appointment status updated',
            data: appointment,
        });
    } catch (error) {
        logger.error('Update appointment status error:', { error: error.message, stack: error.stack });
        res.status(500).json({
            success: false,
            message: 'Failed to update appointment status',
            error: error.message,
        });
    }
};

/**
 * @desc    Get doctor profile stats (for profile screen)
 * @route   GET /api/doctors/profile/stats
 * @access  Private (Doctor only)
 */
exports.getDoctorProfileStats = async (req, res) => {
    try {
        const doctorId = req.user._id;

        const [totalPatients, completedAppointments, doctor] = await Promise.all([
            Appointment.distinct('patientId', { doctorId }),
            Appointment.countDocuments({ doctorId, status: 'completed' }),
            User.findById(doctorId).select('experience rating').lean(),
        ]);

        res.json({
            success: true,
            data: {
                totalPatients: totalPatients.length,
                completedConsultations: completedAppointments,
                rating: doctor?.rating || 4.5,
                experienceYears: doctor?.experience || 0,
            },
        });
    } catch (error) {
        logger.error('Doctor profile stats error:', { error: error.message, stack: error.stack, doctorId: req.user?._id });
        res.status(500).json({
            success: false,
            message: 'Failed to load profile stats',
            error: error.message,
        });
    }
};
