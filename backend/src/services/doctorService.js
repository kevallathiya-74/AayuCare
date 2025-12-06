const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

/**
 * Doctor Service - Business Logic Layer
 */

class DoctorService {
    /**
     * Get all doctors with filters
     */
    async getDoctors(filters = {}) {
        const { specialization, search, page = 1, limit = 10, sortBy = 'name' } = filters;

        const query = { role: 'doctor', isActive: true };

        if (specialization) {
            query.specialization = specialization;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } },
                { qualification: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const doctors = await User.find(query)
            .select('name specialization qualification experience consultationFee avatar userId')
            .sort(sortBy)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        return {
            doctors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Get doctor by ID
     */
    async getDoctorById(doctorId) {
        const doctor = await User.findById(doctorId).select('-password -refreshToken');

        if (!doctor || doctor.role !== 'doctor') {
            throw new AppError('Doctor not found', 404);
        }

        return doctor;
    }

    /**
     * Get doctor statistics
     */
    async getDoctorStats(doctorId) {
        const Appointment = require('../models/Appointment');

        const totalAppointments = await Appointment.countDocuments({ doctorId });
        const completedAppointments = await Appointment.countDocuments({
            doctorId,
            status: 'completed'
        });
        const upcomingAppointments = await Appointment.countDocuments({
            doctorId,
            status: { $in: ['scheduled', 'confirmed'] },
            appointmentDate: { $gte: new Date() }
        });

        return {
            totalAppointments,
            completedAppointments,
            upcomingAppointments,
            experienceYears: (await User.findById(doctorId)).experience
        };
    }
}

module.exports = new DoctorService();
