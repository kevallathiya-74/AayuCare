const userRepository = require("../repositories/userRepository");
const appointmentRepository = require("../repositories/appointmentRepository");
const paymentRepository = require("../repositories/paymentRepository");
const doctorRepository = require("../repositories/doctorRepository");
const patientRepository = require("../repositories/patientRepository");
const { createAppointmentWithPayment } = require("../utils/transaction");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Appointment Service - Business Logic Layer
 * Fully refactored to use repository pattern (PostgreSQL)
 * No direct Mongoose model usage
 */

class AppointmentService {
  /**
   * Create new appointment with payment (ACID transaction)
   */
  async createAppointment(appointmentData) {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      type,
      symptoms,
      chiefComplaint,
      hospitalId,
    } = appointmentData;

    // Verify patient exists
    const patient = await userRepository.findById(patientId);
    if (!patient || patient.role !== "patient") {
      throw new AppError("Patient not found", 404);
    }

    // Verify doctor exists
    const doctor = await userRepository.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new AppError("Doctor not found", 404);
    }

    // Get doctor details for consultation fee
    const doctorProfile = await doctorRepository.findByUserId(doctorId);
    if (!doctorProfile) {
      throw new AppError("Doctor profile not found", 404);
    }

    // Verify patient and doctor belong to same hospital (multi-tenancy)
    if (patient.hospital_id !== doctor.hospital_id) {
      throw new AppError(
        "Cannot book appointment with doctor from different hospital",
        400
      );
    }

    // Check if slot is available
    const isAvailable = await appointmentRepository.isSlotAvailable(
      doctorId,
      appointmentDate,
      appointmentTime,
      hospitalId || doctor.hospital_id
    );

    if (!isAvailable) {
      throw new AppError("This time slot is already booked", 400);
    }

    // Create appointment and payment atomically using transaction
    const { appointment, payment } = await createAppointmentWithPayment(
      {
        appointmentId: `APT-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,
        patientId,
        doctorId,
        hospitalId: hospitalId || doctor.hospital_id,
        appointmentDate,
        appointmentTime,
        type,
        symptoms,
        chiefComplaint,
      },
      {
        paymentId: `PAY-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)
          .toUpperCase()}`,
        amount: doctorProfile.consultation_fee || 0,
        currency: "INR",
      }
    );

    logger.info(
      `Appointment created: ${appointment.id} for patient ${patient.user_id} with doctor ${doctor.user_id} at hospital ${doctor.hospital_id}`
    );

    // Invalidate cache
    const { deleteCacheByPattern } = require("../config/redis");
    await deleteCacheByPattern("cache:appointments:*");
    await deleteCacheByPattern(`cache:doctor:${doctorId}:*`);

    return appointment;
  }

  /**
   * Get all appointments (admin only) - Uses PostgreSQL
   * @param {Object} filters - Filter options including hospitalId for multi-tenancy
   */
  async getAllAppointmentsCursor(filters = {}) {
    const {
      status,
      startDate,
      endDate,
      limit = 20,
      patientId,
      doctorId,
      hospitalId,
    } = filters;

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findAll({
      hospitalId,
      patientId,
      doctorId,
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: 0,
    });

    return {
      appointments,
      pagination: {
        limit: parseInt(limit),
        hasMore: appointments.length === parseInt(limit),
      },
    };
  }

  /**
   * Get appointments for a patient - Uses PostgreSQL
   */
  async getPatientAppointmentsCursor(patientId, filters = {}) {
    const {
      status,
      startDate,
      endDate,
      limit = 20,
      hospitalId,
    } = filters;

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findByPatient(patientId, {
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: 0,
    });

    return {
      appointments,
      pagination: {
        limit: parseInt(limit),
        hasMore: appointments.length === parseInt(limit),
      },
    };
  }

  /**
   * Get appointments for a doctor - Uses PostgreSQL
   */
  async getDoctorAppointmentsCursor(doctorId, filters = {}) {
    const { status, date, limit = 20, hospitalId } = filters;

    let startDate, endDate;
    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    }

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findByDoctor(doctorId, {
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: 0,
    });

    return {
      appointments,
      pagination: {
        limit: parseInt(limit),
        hasMore: appointments.length === parseInt(limit),
      },
    };
  }

  /**
   * Get all appointments (admin only) - Uses PostgreSQL
   */
  async getAllAppointments(filters = {}) {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      patientId,
      doctorId,
      hospitalId,
    } = filters;

    const offset = (page - 1) * limit;

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findAll({
      hospitalId,
      patientId,
      doctorId,
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset,
    });

    // Get total count (approximation)
    const total = appointments.length;

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get appointments for a patient - Uses PostgreSQL
   */
  async getPatientAppointments(patientId, filters = {}) {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      hospitalId,
    } = filters;

    const offset = (page - 1) * limit;

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findByPatient(patientId, {
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset,
    });

    const total = appointments.length;

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get appointments for a doctor - Uses PostgreSQL
   */
  async getDoctorAppointments(doctorId, filters = {}) {
    const { status, date, page = 1, limit = 10, hospitalId } = filters;

    let startDate, endDate;
    if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    }

    const offset = (page - 1) * limit;

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findByDoctor(doctorId, {
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset,
    });

    const total = appointments.length;

    return {
      appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single appointment - Uses PostgreSQL
   */
  async getAppointmentById(appointmentId) {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }

    return appointment;
  }

  /**
   * Update appointment status - Uses PostgreSQL
   */
  async updateAppointmentStatus(appointmentId, status, userId, userRole) {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }

    // Validate status transition
    const validTransitions = {
      scheduled: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled", "no_show"],
      completed: [],
      cancelled: [],
      no_show: [],
    };

    if (!validTransitions[appointment.status].includes(status)) {
      throw new AppError(
        `Cannot change status from ${appointment.status} to ${status}`,
        400
      );
    }

    const updates = { status };

    if (status === "cancelled") {
      updates.cancelled_by = userId;
    }

    const updatedAppointment = await appointmentRepository.update(
      appointmentId,
      updates
    );

    logger.info(
      `Appointment ${appointmentId} status updated to ${status} by ${userRole}`
    );

    // Invalidate cache
    const { deleteCacheByPattern } = require("../config/redis");
    await deleteCacheByPattern("cache:appointments:*");

    return updatedAppointment;
  }

  /**
   * Cancel appointment - Uses PostgreSQL
   */
  async cancelAppointment(appointmentId, userId, userRole, cancelReason) {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }

    if (
      appointment.status === "cancelled" ||
      appointment.status === "completed"
    ) {
      throw new AppError(
        `Cannot cancel ${appointment.status} appointment`,
        400
      );
    }

    // Check cancellation time (at least 2 hours before appointment)
    const appointmentDateTime = new Date(appointment.appointment_date);
    const [hours, minutes] = appointment.appointment_time.split(":");
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

    const now = new Date();
    const timeDiff = appointmentDateTime - now;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2 && userRole === "patient") {
      throw new AppError(
        "Appointments can only be cancelled at least 2 hours before the scheduled time",
        400
      );
    }

    const updates = {
      status: "cancelled",
      cancellation_reason: cancelReason,
      cancelled_by: userId,
    };

    const updatedAppointment = await appointmentRepository.update(
      appointmentId,
      updates
    );

    logger.info(
      `Appointment ${appointmentId} cancelled by ${userRole}: ${userId}`
    );

    // Invalidate cache
    const { deleteCacheByPattern } = require("../config/redis");
    await deleteCacheByPattern("cache:appointments:*");

    return updatedAppointment;
  }

  /**
   * Update appointment details - Uses PostgreSQL
   */
  async updateAppointment(appointmentId, updateData, userId, userRole) {
    const appointment = await appointmentRepository.findById(appointmentId);

    if (!appointment) {
      throw new AppError("Appointment not found", 404);
    }

    const updates = {};

    // Only doctor can update notes
    if (userRole === "doctor") {
      if (updateData.notes) updates.notes = updateData.notes;
    }

    // Patient can update symptoms and chief complaint before appointment
    if (userRole === "patient" && appointment.status === "scheduled") {
      if (updateData.symptoms) updates.symptoms = updateData.symptoms;
      if (updateData.chiefComplaint)
        updates.chief_complaint = updateData.chiefComplaint;
    }

    const updatedAppointment = await appointmentRepository.update(
      appointmentId,
      updates
    );

    logger.info(
      `Appointment ${appointmentId} updated by ${userRole}: ${userId}`
    );

    // Invalidate cache
    const { deleteCacheByPattern } = require("../config/redis");
    await deleteCacheByPattern("cache:appointments:*");

    return updatedAppointment;
  }

  /**
   * Get available time slots for a doctor - Uses PostgreSQL
   */
  async getAvailableSlots(doctorId, date) {
    const doctor = await userRepository.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      throw new AppError("Doctor not found", 404);
    }

    // Get doctor profile for consultation fee
    const doctorProfile = await doctorRepository.findByUserId(doctorId);

    // Get all appointments for the doctor on the specified date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await appointmentRepository.findByDoctor(doctorId, {
      startDate: startOfDay,
      endDate: endOfDay,
      limit: 100,
    });

    const bookedSlots = appointments
      .filter((apt) => apt.status !== "cancelled")
      .map((apt) => apt.appointment_time);

    // Define all possible time slots (9 AM to 8 PM, 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute of [0, 30]) {
        if (hour === 20 && minute === 30) break; // Stop at 8:00 PM
        const timeSlot = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        allSlots.push(timeSlot);
      }
    }

    // Filter out booked slots
    const availableSlots = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    return {
      date,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctorProfile?.specialization,
        consultationFee: doctorProfile?.consultation_fee,
      },
      availableSlots,
      bookedSlots,
    };
  }

  /**
   * Get appointment statistics - Uses PostgreSQL
   */
  async getAppointmentStats(userId, userRole) {
    // Use appointmentRepository countByStatus method
    const stats = await appointmentRepository.countByStatus(userId, userRole, null);

    return stats;
  }
}

module.exports = new AppointmentService();
