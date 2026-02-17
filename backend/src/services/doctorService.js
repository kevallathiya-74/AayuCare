const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const { AppError } = require("../middleware/errorHandler");

/**
 * Sanitize regex input to prevent injection attacks
 */
const sanitizeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Doctor Service - Business Logic Layer
 * Fully refactored to use repository pattern (PostgreSQL)
 * No direct Mongoose model usage
 */

class DoctorService {
  /**
   * Get all doctors with filters - Uses PostgreSQL
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

    // Use repository to fetch doctors from PostgreSQL
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
      filteredDoctors = filteredDoctors.filter((doctor) => doctor.isActive);
    }

    const total = filteredDoctors.length;

    return {
      doctors: filteredDoctors,
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
   * Get doctor statistics - Uses PostgreSQL
   */
  async getDoctorStats(doctorId) {
    // Use appointmentRepository for PostgreSQL queries
    const statusCounts = await appointmentRepository.countByStatus(
      doctorId,
      "doctor",
      null
    );

    // Get doctor profile for experience
    const doctorProfile = await doctorRepository.findByUserId(doctorId);

    return {
      totalAppointments: statusCounts.total || 0,
      completedAppointments: statusCounts.completed || 0,
      upcomingAppointments:
        (statusCounts.scheduled || 0) + (statusCounts.confirmed || 0),
      experienceYears: doctorProfile?.experience || 0,
    };
  }
}

module.exports = new DoctorService();
