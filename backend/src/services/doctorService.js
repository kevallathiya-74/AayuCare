const User = require("../models/User");
const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const { AppError } = require("../middleware/errorHandler");

/**
 * Sanitize regex input to prevent injection attacks
 */
const sanitizeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Doctor Service - Business Logic Layer
 * Refactored to use repository pattern
 */

class DoctorService {
  /**
   * Get all doctors with filters
   * @param {Object} filters - Filter options including hospitalId for multi-tenancy
   */
  async getDoctors(filters = {}) {
    const {
      specialization,
      search,
      page = 1,
      limit = 10,
      sortBy = "name",
      includeInactive = false,
      hospitalId,
    } = filters;

    // Use repository to fetch doctors
    const doctors = await doctorRepository.findAll({
      hospitalId,
      specialization,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
    });

    // Apply search filter if provided
    let filteredDoctors = doctors;
    if (search) {
      const sanitizedSearch = sanitizeRegex(search).toLowerCase();
      filteredDoctors = doctors.filter(
        (doctor) =>
          doctor.name?.toLowerCase().includes(sanitizedSearch) ||
          doctor.specialization?.toLowerCase().includes(sanitizedSearch) ||
          doctor.qualification?.toLowerCase().includes(sanitizedSearch)
      );
    }

    // Filter inactive if needed
    if (!includeInactive) {
      filteredDoctors = filteredDoctors.filter((doctor) => doctor.is_active);
    }

    // For backward compatibility, also check MongoDB
    const mongoQuery = { role: "doctor" };
    if (hospitalId !== undefined && hospitalId !== null) {
      mongoQuery.hospitalId = hospitalId;
    }
    if (!includeInactive) {
      mongoQuery.isActive = true;
    }
    if (specialization) {
      mongoQuery.specialization = specialization;
    }
    if (search) {
      const sanitizedSearch = sanitizeRegex(search);
      mongoQuery.$or = [
        { name: { $regex: sanitizedSearch, $options: "i" } },
        { specialization: { $regex: sanitizedSearch, $options: "i" } },
        { qualification: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const mongoDoctors = await User.find(mongoQuery)
      .select(
        "name specialization qualification experience consultationFee avatar userId email phone isActive hospitalId hospitalName"
      )
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(mongoQuery);

    return {
      doctors: mongoDoctors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(doctorId) {
    // Try PostgreSQL first
    let doctor = await userRepository.findById(doctorId);

    // Fallback to MongoDB for backward compatibility
    if (!doctor) {
      doctor = await User.findById(doctorId).select("-password -refreshToken");
    }

    if (!doctor || (doctor.role !== "doctor" && doctor.role !== "doctor")) {
      throw new AppError("Doctor not found", 404);
    }

    return doctor;
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStats(doctorId) {
    const Appointment = require("../models/Appointment");
    const appointmentRepository = require("../repositories/appointmentRepository");

    // Try PostgreSQL first
    const statusCounts = await appointmentRepository.countByStatus(
      doctorId,
      "doctor"
    );

    // Fallback to MongoDB for backward compatibility
    const totalAppointments = await Appointment.countDocuments({ doctorId });
    const completedAppointments = await Appointment.countDocuments({
      doctorId,
      status: "completed",
    });
    const upcomingAppointments = await Appointment.countDocuments({
      doctorId,
      status: { $in: ["scheduled", "confirmed"] },
      appointmentDate: { $gte: new Date() },
    });

    return {
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      experienceYears: (await User.findById(doctorId)).experience,
    };
  }
}

module.exports = new DoctorService();
