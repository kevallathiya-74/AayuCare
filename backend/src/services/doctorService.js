const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const { AppError } = require("../middleware/errorHandler");

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

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    let filteredDoctors;
    if (search) {
      filteredDoctors = await doctorRepository.search(search, hospitalId, {
        includeInactive,
        specialization,
        limit: parsedLimit,
        offset,
      });
    } else {
      const doctors = await doctorRepository.findAll({
        hospitalId,
        specialization,
        limit: parsedLimit,
        offset,
      });
      filteredDoctors = includeInactive
        ? doctors
        : doctors.filter((doctor) => doctor.isActive);
    }

    const total = filteredDoctors.length;

    return {
      doctors: filteredDoctors,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    };
  }

  /**
   * Get doctor by ID
   */
  async getDoctorById(doctorId) {
    const doctor = await userRepository.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
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
