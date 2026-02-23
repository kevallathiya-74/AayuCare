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

    const [hourPart, minutePart] = String(appointmentTime).split(":");
    const appointmentDateTime = new Date(appointmentDate);
    if (
      Number.isNaN(appointmentDateTime.getTime()) ||
      Number.isNaN(Number(hourPart)) ||
      Number.isNaN(Number(minutePart))
    ) {
      throw new AppError("Invalid appointment date or time", 400);
    }
    appointmentDateTime.setHours(Number(hourPart), Number(minutePart), 0, 0);
    if (appointmentDateTime <= new Date()) {
      throw new AppError("Cannot book appointment in the past", 400);
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
      cursor = 0,
      patientId,
      doctorId,
      hospitalId,
    } = filters;

    const parsedLimit = parseInt(limit, 10);
    const offset = parseInt(cursor, 10) || 0;

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findAll({
      hospitalId,
      patientId,
      doctorId,
      status,
      startDate,
      endDate,
      limit: parsedLimit,
      offset,
    });

    const hasMore = appointments.length === parsedLimit;
    const nextCursor = hasMore ? offset + parsedLimit : null;

    return {
      appointments,
      pagination: {
        limit: parsedLimit,
        hasMore,
        nextCursor,
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
      cursor = 0,
      hospitalId,
    } = filters;

    const parsedLimit = parseInt(limit, 10);
    const offset = parseInt(cursor, 10) || 0;

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findByPatient(patientId, {
      status,
      startDate,
      endDate,
      limit: parsedLimit,
      offset,
    });

    const hasMore = appointments.length === parsedLimit;
    const nextCursor = hasMore ? offset + parsedLimit : null;

    return {
      appointments,
      pagination: {
        limit: parsedLimit,
        hasMore,
        nextCursor,
      },
    };
  }

  /**
   * Get appointments for a doctor - Uses PostgreSQL
   */
  async getDoctorAppointmentsCursor(doctorId, filters = {}) {
    const { status, date, startDate, endDate, limit = 20, cursor = 0, hospitalId } = filters;

    const parsedLimit = parseInt(limit, 10);
    const offset = parseInt(cursor, 10) || 0;

    let normalizedStartDate = startDate;
    let normalizedEndDate = endDate;
    if (date) {
      normalizedStartDate = new Date(date);
      normalizedStartDate.setHours(0, 0, 0, 0);
      normalizedEndDate = new Date(date);
      normalizedEndDate.setHours(23, 59, 59, 999);
    }

    // Use appointmentRepository for PostgreSQL queries
    const appointments = await appointmentRepository.findByDoctor(doctorId, {
      status,
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      limit: parsedLimit,
      offset,
    });

    const hasMore = appointments.length === parsedLimit;
    const nextCursor = hasMore ? offset + parsedLimit : null;

    return {
      appointments,
      pagination: {
        limit: parsedLimit,
        hasMore,
        nextCursor,
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

    // Get accurate total count from DB (not just current page length)
    const total = await appointmentRepository.countAll({
      hospitalId, patientId, doctorId, status, startDate, endDate,
    });

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

    // Get accurate total count from DB
    const total = await appointmentRepository.countByPatient(patientId, {
      status, startDate, endDate,
    });

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

    // Get accurate total count from DB
    const total = await appointmentRepository.countByDoctor(doctorId, {
      status, startDate, endDate,
    });

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
      confirmed: ["in_progress", "completed", "cancelled", "no_show"],
      in_progress: ["completed", "cancelled"],
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

    const requestedDate = new Date(date);
    if (Number.isNaN(requestedDate.getTime())) {
      throw new AppError("Invalid date format", 400);
    }

    // Get doctor profile for consultation fee
    const doctorProfile = await doctorRepository.findByUserId(doctorId);

    // Get all appointments for the doctor on the specified date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    if (endOfDay < todayStart) {
      return {
        date,
        doctor: {
          id: doctor.id,
          name: doctor.name,
          specialization: doctorProfile?.specialization,
          consultationFee: doctorProfile?.consultation_fee,
        },
        availableSlots: [],
        slots: [],
        bookedSlots: [],
      };
    }

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

    const slotsAfterBookedFilter = allSlots.filter(
      (slot) => !bookedSlots.includes(slot)
    );

    const isToday = startOfDay.getTime() === todayStart.getTime();
    const minimumBookableTime = new Date(now.getTime() + 30 * 60 * 1000);

    const availableSlots = isToday
      ? slotsAfterBookedFilter.filter((slot) => {
          const [slotHour, slotMinute] = slot
            .split(":")
            .map((value) => Number(value));
          const slotDateTime = new Date(startOfDay);
          slotDateTime.setHours(slotHour, slotMinute, 0, 0);
          return slotDateTime > minimumBookableTime;
        })
      : slotsAfterBookedFilter;

    return {
      date,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctorProfile?.specialization,
        consultationFee: doctorProfile?.consultation_fee,
      },
      availableSlots,
      slots: availableSlots,
      bookedSlots,
    };
  }

  /**
   * Get appointment statistics - Uses PostgreSQL
   */
  async getAppointmentStats(userId, userRole) {
    // Use repository-level aggregations for status and date filters
    const [statusCounts, dateRanges] = await Promise.all([
      appointmentRepository.countByStatus(userId, userRole, null),
      appointmentRepository.countByDateRanges(userId, userRole, null),
    ]);

    return {
      statusCounts,
      dateRanges,
    };
  }
}

module.exports = new AppointmentService();
