const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Appointment Service - Business Logic Layer
 */

class AppointmentService {
    /**
     * Create new appointment
     */
    async createAppointment(appointmentData) {
        const { patientId, doctorId, appointmentDate, appointmentTime, type, symptoms, chiefComplaint } = appointmentData;

        // Verify patient exists
        const patient = await User.findById(patientId);
        if (!patient || patient.role !== 'patient') {
            throw new AppError('Patient not found', 404);
        }

        // Verify doctor exists
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            throw new AppError('Doctor not found', 404);
        }

        // Check if slot is available
        const existingAppointment = await Appointment.findOne({
            doctorId,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            status: { $nin: ['cancelled', 'completed'] }
        });

        if (existingAppointment) {
            throw new AppError('This time slot is already booked', 400);
        }

        // Create appointment
        const appointment = await Appointment.create({
            patientId,
            doctorId,
            hospitalId: doctor.hospitalId || 'MAIN',
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            type,
            symptoms,
            chiefComplaint,
            status: 'scheduled',
            payment: {
                amount: doctor.consultationFee,
                status: 'pending'
            }
        });

        logger.info(`Appointment created: ${appointment._id} for patient ${patient.userId} with doctor ${doctor.userId}`);

        return appointment;
    }

    /**
     * Get all appointments (admin only)
     */
    async getAllAppointments(filters = {}) {
        const { status, startDate, endDate, page = 1, limit = 10, patientId, doctorId } = filters;

        const query = {};

        if (patientId) {
            query.patientId = patientId;
        }

        if (doctorId) {
            query.doctorId = doctorId;
        }

        if (status) {
            // Handle comma-separated status values (e.g., "scheduled,confirmed")
            if (status.includes(',')) {
                query.status = { $in: status.split(',').map(s => s.trim()) };
            } else {
                query.status = status;
            }
        }

        if (startDate || endDate) {
            query.appointmentDate = {};
            if (startDate) query.appointmentDate.$gte = new Date(startDate);
            if (endDate) query.appointmentDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name userId phone email')
            .populate('doctorId', 'name specialization qualification consultationFee')
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Appointment.countDocuments(query);

        return {
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Get appointments for a patient
     */
    async getPatientAppointments(patientId, filters = {}) {
        const { status, startDate, endDate, page = 1, limit = 10 } = filters;

        const query = { patientId };

        if (status) {
            // Handle comma-separated status values (e.g., "scheduled,confirmed")
            if (status.includes(',')) {
                query.status = { $in: status.split(',').map(s => s.trim()) };
            } else {
                query.status = status;
            }
        }

        if (startDate || endDate) {
            query.appointmentDate = {};
            if (startDate) query.appointmentDate.$gte = new Date(startDate);
            if (endDate) query.appointmentDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const appointments = await Appointment.find(query)
            .populate('doctorId', 'name specialization qualification consultationFee')
            .populate('patientId', 'name userId phone')
            .sort({ appointmentDate: -1, appointmentTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Appointment.countDocuments(query);

        return {
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Get appointments for a doctor
     */
    async getDoctorAppointments(doctorId, filters = {}) {
        const { status, date, page = 1, limit = 10 } = filters;

        const query = { doctorId };

        if (status) {
            // Handle comma-separated status values (e.g., "scheduled,confirmed")
            if (status.includes(',')) {
                query.status = { $in: status.split(',').map(s => s.trim()) };
            } else {
                query.status = status;
            }
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
        }

        const skip = (page - 1) * limit;

        const appointments = await Appointment.find(query)
            .populate('patientId', 'name userId phone dateOfBirth gender bloodGroup')
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Appointment.countDocuments(query);

        return {
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Get single appointment
     */
    async getAppointmentById(appointmentId) {
        const appointment = await Appointment.findById(appointmentId)
            .populate('patientId', 'name userId email phone dateOfBirth gender bloodGroup allergies medicalHistory')
            .populate('doctorId', 'name specialization qualification experience consultationFee')
            .populate('prescription');

        if (!appointment) {
            throw new AppError('Appointment not found', 404);
        }

        return appointment;
    }

    /**
     * Update appointment status
     */
    async updateAppointmentStatus(appointmentId, status, userId, userRole) {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            throw new AppError('Appointment not found', 404);
        }

        // Validate status transition
        const validTransitions = {
            scheduled: ['confirmed', 'cancelled'],
            confirmed: ['completed', 'cancelled', 'no_show'],
            completed: [],
            cancelled: [],
            no_show: []
        };

        if (!validTransitions[appointment.status].includes(status)) {
            throw new AppError(`Cannot change status from ${appointment.status} to ${status}`, 400);
        }

        appointment.status = status;

        if (status === 'cancelled') {
            appointment.cancelledBy = userId;
            appointment.cancelledAt = new Date();
        }

        await appointment.save();

        logger.info(`Appointment ${appointmentId} status updated to ${status} by ${userRole}`);

        return appointment;
    }

    /**
     * Cancel appointment
     */
    async cancelAppointment(appointmentId, userId, userRole, cancelReason) {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            throw new AppError('Appointment not found', 404);
        }

        if (appointment.status === 'cancelled' || appointment.status === 'completed') {
            throw new AppError(`Cannot cancel ${appointment.status} appointment`, 400);
        }

        // Check cancellation time (at least 2 hours before appointment)
        const appointmentDateTime = new Date(appointment.appointmentDate);
        const [hours, minutes] = appointment.appointmentTime.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

        const now = new Date();
        const timeDiff = appointmentDateTime - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 2 && userRole === 'patient') {
            throw new AppError('Appointments can only be cancelled at least 2 hours before the scheduled time', 400);
        }

        appointment.status = 'cancelled';
        appointment.cancelReason = cancelReason;
        appointment.cancelledBy = userId;
        appointment.cancelledAt = new Date();

        // Update payment status if applicable
        if (appointment.payment.status === 'paid') {
            appointment.payment.status = 'refunded';
        }

        await appointment.save();

        logger.info(`Appointment ${appointmentId} cancelled by ${userRole}: ${userId}`);

        return appointment;
    }

    /**
     * Update appointment details
     */
    async updateAppointment(appointmentId, updateData, userId, userRole) {
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            throw new AppError('Appointment not found', 404);
        }

        // Only doctor can update diagnosis, prescription, notes
        if (userRole === 'doctor') {
            const allowedFields = ['diagnosis', 'prescription', 'notes', 'followUp'];
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    appointment[key] = updateData[key];
                }
            });
        }

        // Patient can update symptoms and chief complaint before appointment
        if (userRole === 'patient' && appointment.status === 'scheduled') {
            if (updateData.symptoms) appointment.symptoms = updateData.symptoms;
            if (updateData.chiefComplaint) appointment.chiefComplaint = updateData.chiefComplaint;
        }

        await appointment.save();

        logger.info(`Appointment ${appointmentId} updated by ${userRole}: ${userId}`);

        return appointment;
    }

    /**
     * Get available time slots for a doctor
     */
    async getAvailableSlots(doctorId, date) {
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            throw new AppError('Doctor not found', 404);
        }

        // Get all appointments for the doctor on the specified date
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedAppointments = await Appointment.find({
            doctorId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ['cancelled'] }
        }).select('appointmentTime');

        const bookedSlots = bookedAppointments.map(apt => apt.appointmentTime);

        // Define all possible time slots (9 AM to 8 PM, 30-minute intervals)
        const allSlots = [];
        for (let hour = 9; hour <= 20; hour++) {
            for (let minute of [0, 30]) {
                if (hour === 20 && minute === 30) break; // Stop at 8:00 PM
                const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                allSlots.push(timeSlot);
            }
        }

        // Filter out booked slots
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        return {
            date,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                specialization: doctor.specialization,
                consultationFee: doctor.consultationFee
            },
            availableSlots,
            bookedSlots
        };
    }

    /**
     * Get appointment statistics
     */
    async getAppointmentStats(userId, userRole) {
        const query = userRole === 'doctor' ? { doctorId: userId } : { patientId: userId };

        const stats = await Appointment.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = await Appointment.countDocuments(query);

        const statsObject = {
            total,
            scheduled: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            no_show: 0
        };

        stats.forEach(stat => {
            statsObject[stat._id] = stat.count;
        });

        return statsObject;
    }
}

module.exports = new AppointmentService();
