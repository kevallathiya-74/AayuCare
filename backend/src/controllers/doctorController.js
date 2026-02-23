const doctorService = require("../services/doctorService");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const scheduleRepository = require("../repositories/scheduleRepository");
const patientRepository = require("../repositories/patientRepository");
const medicalRecordRepository = require("../repositories/medicalRecordRepository");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const { deleteCacheByPattern } = require("../config/redis");

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {number|null} - Age in years or null if invalid
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    if (isNaN(birthDate.getTime())) return null;

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  } catch (error) {
    return null;
  }
};

const normalizeAppointmentStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/-/g, "_");

const APPOINTMENT_STATUS_TRANSITIONS = {
  scheduled: ["confirmed", "in_progress", "cancelled"],
  confirmed: ["in_progress", "completed", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

const formatAppointmentTime = (appointment) => {
  const rawTime = appointment?.appointmentTime || appointment?.appointment_time;
  if (rawTime) {
    const normalized = String(rawTime).slice(0, 8);
    const parsed = new Date(`1970-01-01T${normalized}`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  const rawDate = appointment?.appointmentDate || appointment?.appointment_date;
  if (rawDate) {
    const parsedDate = new Date(rawDate);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return "N/A";
};

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public
 */
exports.getDoctors = async (req, res, next) => {
  try {
    // Add hospitalId filter for multi-tenancy
    // If user is authenticated, filter by their hospital
    const filters = { ...req.query };

    // For authenticated users, filter by their hospital (skip for super_admin)
    if (req.hospitalId && (!req.user || req.user.role !== "super_admin")) {
      filters.hospitalId = req.hospitalId;
    }

    const result = await doctorService.getDoctors(filters);

    res.status(200).json({
      status: "success",
      data: result,
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
      status: "success",
      data: { doctor },
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
      status: "success",
      data: { stats },
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
exports.getDoctorDashboard = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build query base with hospitalId filter
    const baseFilters = { 
      doctorId,
      hospitalId: (req.hospitalId && req.user.role !== "super_admin") ? req.hospitalId : undefined
    };

    // Run all queries in parallel
    const [
      todaysAppointments,
      completedToday,
      totalUniquePatients,
      upcomingAppointmentsCount,
      recentPrescriptions,
    ] = await Promise.all([
      // Today's appointments
      appointmentRepository.findByDoctor(doctorId, {
        ...baseFilters,
        startDate: today,
        endDate: today,
      }),
      // Completed today - use findByDoctor with status filter and count
      appointmentRepository.findByDoctor(doctorId, {
        ...baseFilters,
        startDate: today,
        endDate: today,
        status: 'completed',
      }),
      // Total unique patients (completed appointments, all time)
      appointmentRepository.countUniquePatientsForDoctor(
        doctorId,
        (req.hospitalId && req.user.role !== "super_admin") ? req.hospitalId : "MAIN"
      ),
      // Upcoming appointments (next 7 days) - count scheduled/confirmed
      appointmentRepository.findByDoctor(doctorId, {
        ...baseFilters,
        startDate: today,
        status: 'scheduled,confirmed',
      }),
      // Recent prescriptions
      prescriptionRepository.findByDoctor(doctorId, {
        limit: 5,
        hospitalId: baseFilters.hospitalId,
      }),
    ]);


    const parseAppointmentDateTime = (appointment) => {
      const rawDate = appointment.appointmentDate || appointment.appointment_date;
      const rawTime = appointment.appointmentTime || appointment.appointment_time;

      if (!rawDate || !rawTime) return null;

      const datePart = String(rawDate).slice(0, 10);
      const timePart = String(rawTime).slice(0, 5);
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);

      if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day) ||
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
      ) {
        return null;
      }

      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    };

    const now = new Date();

    // Dashboard should only show actionable appointments for today.
    // - scheduled/confirmed: only future slots
    // - in_progress: always visible for today
    const visibleTodaysAppointments = todaysAppointments.filter((apt) => {
      const status = String(apt.status || "").toLowerCase();

      if (status === "in_progress") {
        return true;
      }

      if (status !== "scheduled" && status !== "confirmed") {
        return false;
      }

      const appointmentDateTime = parseAppointmentDateTime(apt);
      if (!appointmentDateTime) {
        return false;
      }

      return appointmentDateTime > now;
    });

    // Count completed appointments
    const completedCount = Array.isArray(completedToday) ? completedToday.length : 0;

    const pendingCount = visibleTodaysAppointments.filter((apt) => {
      const status = String(apt.status || "").toLowerCase();
      return status === "scheduled" || status === "confirmed";
    }).length;

    const nextVisibleAppointment = visibleTodaysAppointments.find((apt) => {
      const status = String(apt.status || "").toLowerCase();
      return status === "scheduled" || status === "confirmed";
    });

    const schedule = {
      totalAppointments: visibleTodaysAppointments.length + completedCount,
      completed: completedCount,
      pending: pendingCount,
      nextPatient: nextVisibleAppointment?.patientName || "No pending",
      nextTime: formatAppointmentTime(nextVisibleAppointment),
    };

    // Format appointments for frontend
    const formattedAppointments = visibleTodaysAppointments.map((apt) => {
      const age = apt.dateOfBirth || apt.date_of_birth
        ? calculateAge(apt.dateOfBirth || apt.date_of_birth)
        : null;

      return {
        _id: apt.id,
        appointmentId: apt.id,
        id: apt.id,
        time: formatAppointmentTime(apt),
        appointmentDate: apt.appointmentDate || apt.appointment_date || null,
        appointmentTime: apt.appointmentTime || apt.appointment_time || null,
        patientName: apt.patientName || apt.patient_name || "Unknown",
        patientId: apt.patientUserId || apt.patient_user_id || apt.patientId,
        patientUUID: apt.patientUserId || apt.patient_user_id || apt.patientId,
        age: age !== null ? age : "N/A",
        reason: apt.reason || apt.chiefComplaint || "Consultation",
        status: apt.status,
        type: apt.type || apt.appointment_type || "in-person",
      };
    });

    // Enrich recent prescriptions with patient names via batch lookup
    const enrichedPrescriptions = await (async () => {
      if (!Array.isArray(recentPrescriptions) || recentPrescriptions.length === 0) return [];
      const patientIds = [...new Set(recentPrescriptions.map(p => p.patientId).filter(Boolean))];
      const users = await userRepository.findByIds(patientIds);
      const userMap = new Map(users.map(u => [u.id, u]));
      return recentPrescriptions.map(p => ({
        ...p,
        patientName: userMap.get(p.patientId)?.name || "Unknown",
      }));
    })();

    res.json({
      success: true,
      data: {
        schedule,
        todaysAppointments: formattedAppointments,
        stats: {
          totalPatients: totalUniquePatients,
          upcomingAppointments: Array.isArray(upcomingAppointmentsCount) ? upcomingAppointmentsCount.length : 0,
          prescriptionsToday: recentPrescriptions.filter(
            (p) => new Date(p.createdAt || p.created_at) >= today
          ).length,
        },
        recentPrescriptions: enrichedPrescriptions.map((p) => ({
          id: p.id || p._id,
          patientName: p.patientName || "Unknown",
          date: p.createdAt || p.created_at,
          medicationsCount: p.medicines?.length || 0,
        })),
      },
    });
  } catch (error) {
    logger.error("Doctor dashboard error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?.id || req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Get today's appointments for doctor
 * @route   GET /api/doctors/appointments/today
 * @access  Private (Doctor only)
 */
exports.getTodaysAppointments = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { filter = "all" } = req.query;
    const normalizedFilter = String(filter || "all").toLowerCase();

    // Validate filter early - before any other work
    const allowedFilters = new Set(["all", "pending", "completed"]);
    if (!allowedFilters.has(normalizedFilter)) {
      return res.status(400).json({
        success: false,
        message: "Invalid filter. Allowed values: all, pending, completed",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For completed: show last 30 days of completed appointments (no date restriction)
    // For others: restrict to today only
    const filters = { doctorId };

    if (normalizedFilter !== "completed") {
      filters.startDate = today;
      filters.endDate = today;
    }

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    // Apply status filter
    if (normalizedFilter === "completed") {
      filters.status = "completed,cancelled,no_show";
      // Last 30 days
      const past30 = new Date(today);
      past30.setDate(past30.getDate() - 30);
      filters.startDate = past30;
    } else if (normalizedFilter === "pending") {
      filters.status = "scheduled,confirmed,in_progress";
    }

    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);

    const parseAppointmentDateTime = (appointment) => {
      const rawDate = appointment.appointmentDate || appointment.appointment_date;
      const rawTime = appointment.appointmentTime || appointment.appointment_time;

      if (!rawDate || !rawTime) return null;

      const datePart = String(rawDate).slice(0, 10);
      const timePart = String(rawTime).slice(0, 5);
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);

      if (
        Number.isNaN(year) ||
        Number.isNaN(month) ||
        Number.isNaN(day) ||
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
      ) {
        return null;
      }

      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    };

    // Strict upcoming-only for Today/Pending: hide completed/cancelled/no_show and past-time slots.
    const visibleAppointments =
      normalizedFilter === "completed"
        ? appointments
        : appointments.filter((apt) => {
            const status = normalizeAppointmentStatus(apt.status);

            if (status === "in_progress") {
              return true;
            }

            if (status !== "scheduled" && status !== "confirmed") {
              return false;
            }

            const appointmentDateTime = parseAppointmentDateTime(apt);
            if (!appointmentDateTime) {
              return false;
            }

            return appointmentDateTime > new Date();
          });

    res.json({
      success: true,
      count: visibleAppointments.length,
      data: visibleAppointments.map((apt) => {
        const formattedTime = formatAppointmentTime(apt);
        return {
          _id: apt.id,
          id: apt.id,
          time: formattedTime,
          timeSlot: formattedTime,
          appointmentDate: apt.appointmentDate || apt.appointment_date,
          patientName: apt.patientName || apt.patient_name || "Unknown",
          patientId: apt.patientUserId || apt.patientId || apt.patient_id,
          patientUserId: apt.patientUserId || apt.patientId || apt.patient_id,
          patientPhoto: null,
          age: apt.dateOfBirth ? calculateAge(apt.dateOfBirth) : (apt.patientAge || "N/A"),
          gender: apt.gender || "N/A",
          phone: apt.patientPhone || "N/A",
          reasonForVisit: apt.reason || apt.chiefComplaint || "Consultation",
          reason: apt.reason || apt.chiefComplaint || "Consultation",
          status: apt.status || "scheduled",
          type: apt.type || "in-person",
        };
      }),
    });
  } catch (error) {
    logger.error("Today appointments error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?.id || req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Get upcoming appointments for doctor
 * @route   GET /api/doctors/appointments/upcoming
 * @access  Private (Doctor only)
 */
exports.getUpcomingAppointments = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filters = {
      doctorId,
      startDate: tomorrow,
      status: "scheduled,confirmed",
      page: parseInt(page),
      limit: parseInt(limit),
    };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);
    const counts = await appointmentRepository.countByStatus(doctorId, "doctor", {
      status: ["scheduled", "confirmed"],
      startDate: tomorrow,
      hospitalId: filters.hospitalId,
    });
    const total = counts.total || 0;

    res.json({
      success: true,
      data: appointments.map((apt) => {
        const formattedTime = formatAppointmentTime(apt);
        return {
          _id: apt.id,
          id: apt.id,
          date: apt.appointmentDate || apt.appointment_date,
          time: formattedTime,
          timeSlot: formattedTime,
          appointmentDate: apt.appointmentDate || apt.appointment_date,
          patientName: apt.patientName || apt.patient_name || "Unknown",
          patientId: apt.patientUserId || apt.patientId || apt.patient_id,
          patientUserId: apt.patientUserId || apt.patientId || apt.patient_id,
          phone: apt.patientPhone || "N/A",
          reasonForVisit: apt.reason || apt.chiefComplaint || "Consultation",
          reason: apt.reason || apt.chiefComplaint || "Consultation",
          status: apt.status || "scheduled",
          type: apt.type || "in-person",
        };
      }),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Upcoming appointments error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?.id || req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Search patients for doctor
 * @route   GET /api/doctors/patients/search
 * @access  Private (Doctor only)
 */
exports.searchPatients = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { q } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 20;
    const limit = Math.min(Math.max(requestedLimit, 1), 100);
    const skip = (page - 1) * limit;
    const searchQuery = String(q || "").trim();

    logger.info("Search patients request:", {
      doctorId,
      userId: req.user.userId,
      query: q,
      page,
      limit,
    });

    const effectiveHospitalId =
      req.hospitalId || req.user.hospitalId || req.user.hospital_id || "MAIN";

    // Use findPatientsByDoctor so only patients who have had an appointment with
    // this specific doctor are returned - not all patients in the hospital.
    const result = await userRepository.findPatientsByDoctor(
      doctorId,
      effectiveHospitalId,
      limit,
      skip,
      searchQuery
    );

    const paginatedPatients = Array.isArray(result?.data) ? result.data : [];
    const total = Number(result?.total || paginatedPatients.length || 0);

    logger.info("Search results:", {
      count: paginatedPatients.length,
      total,
      doctorId,
      hospitalId: effectiveHospitalId,
    });

    res.json({
      success: true,
      data: paginatedPatients,
      patients: paginatedPatients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    logger.error("Patient search error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Get detailed patient information
 * @route   GET /api/doctors/me/patients/:patientId
 * @access  Private (Doctor, Admin)
 */
exports.getPatientDetails = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userRole = req.user.role;
    const { patientId } = req.params;

    logger.info("Get patient details request:", {
      userId,
      userRole,
      patientId,
      userIdString: req.user.userId,
    });

    // Get complete patient details (users + patients table joined)
    const patientRepository = require("../repositories/patientRepository");
    const {
      mapPatientData,
      mapPrescriptionData,
      mapMedicalRecordData,
      mapArray,
    } = require("../utils/fieldMapper");

    const patientLookupValue = String(patientId || "").trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        patientLookupValue
      );

    let patientUser = isUuid
      ? await userRepository.findById(patientLookupValue)
      : await userRepository.findByUserId(patientLookupValue);

    if (!patientUser && isUuid) {
      patientUser = await userRepository.findByUserId(patientLookupValue);
    }

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const resolvedPatientId = patientUser.id;
    const resolvedPatientUserId = patientUser.user_id;

    if (
      req.hospitalId &&
      req.user.role !== "super_admin" &&
      patientUser.hospital_id !== req.hospitalId
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this patient",
      });
    }

    const dbPatient = await patientRepository.findByUserId(resolvedPatientId);

    if (!dbPatient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Map patient data to camelCase format
    const patient = mapPatientData(dbPatient);

    const appointmentFilters = {
      patientId: resolvedPatientId,
      limit: 50,
      offset: 0,
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      appointmentFilters.hospitalId = req.hospitalId;
    }
    const patientAppointments = await appointmentRepository.findByPatient(
      resolvedPatientId,
      appointmentFilters
    );

    const appointments = patientAppointments.slice(0, 10);

    // Get medical records from MongoDB using repository
    const medicalRecordsFilters = {
      patientId: { $in: [resolvedPatientId, resolvedPatientUserId].filter(Boolean) },
    };
    
    if (req.hospitalId && req.user.role !== "super_admin") {
      medicalRecordsFilters.hospitalId = req.hospitalId;
    }

    const dbMedicalRecords = await medicalRecordRepository.findWithFilters(medicalRecordsFilters, 1, 10);
    const medicalRecords = dbMedicalRecords.data || [];

    const prescriptionFilters = {
      patientId: resolvedPatientId,
      limit: 10,
    };

    if (req.hospitalId && req.user.role !== "super_admin") {
      prescriptionFilters.hospitalId = req.hospitalId;
    }

    const dbPrescriptions = await prescriptionRepository.findByPatient(
      resolvedPatientId,
      prescriptionFilters
    );

    // Map prescriptions to proper format
    const prescriptions = mapArray(dbPrescriptions, mapPrescriptionData);

    logger.info("Patient details retrieved:", {
      patientId: resolvedPatientUserId || resolvedPatientId,
      role: userRole,
      appointmentsCount: appointments.length,
      medicalRecordsCount: medicalRecords.length,
      prescriptionsCount: prescriptions.length,
    });

    res.json({
      success: true,
      data: {
        patient,
        appointments,
        medicalRecords,
        prescriptions,
        stats: {
          totalAppointments: appointments.length,
          totalRecords: medicalRecords.length,
          totalPrescriptions: prescriptions.length,
        },
      },
    });
  } catch (error) {
    logger.error("Get patient details error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      role: req.user?.role,
      patientId: req.params?.patientId,
    });
    next(error);
  }
};

/**
 * @desc    Update appointment status (start consultation, complete, etc.)
 * @route   PATCH /api/doctors/appointments/:id/status
 * @access  Private (Doctor only)
 */
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const doctorId = req.user.id || req.user._id;

    const normalizedStatus = normalizeAppointmentStatus(status);

    const validStatuses = [
      "confirmed",
      "in_progress",
      "completed",
      "cancelled",
      "no_show",
    ];
    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const appointment = await appointmentRepository.findById(id);

    if (!appointment || appointment.doctor_id !== doctorId) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    const currentStatus = normalizeAppointmentStatus(
      appointment.status || appointment.appointment_status
    );
    const allowedTransitions = APPOINTMENT_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${normalizedStatus}`,
      });
    }

    const updateData = { status: normalizedStatus };
    if (notes) {
      updateData.notes = notes;
    }

    const updatedAppointment = await appointmentRepository.update(id, updateData);

    // Invalidate appointment caches after status update
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after appointment status update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    logger.info("Appointment status updated", {
      appointmentId: id,
      doctorId,
      newStatus: normalizedStatus,
    });

    res.json({
      success: true,
      message: "Appointment status updated",
      data: updatedAppointment,
    });
  } catch (error) {
    logger.error("Update appointment status error:", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get doctor profile stats (for profile screen)
 * @route   GET /api/doctors/profile/stats
 * @access  Private (Doctor only)
 */
exports.getDoctorProfileStats = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const effectiveHospitalId = (req.hospitalId && req.user.role !== "super_admin") ? req.hospitalId : undefined;

    const [totalPatients, completedCounts, doctor] = await Promise.all([
      appointmentRepository.countUniquePatientsForDoctor(doctorId, effectiveHospitalId),
      appointmentRepository.countByStatus(doctorId, "doctor", {
        status: "completed",
        hospitalId: effectiveHospitalId,
      }),
      doctorRepository.findByUserId(doctorId),
    ]);

    res.json({
      success: true,
      data: {
        totalPatients,
        completedConsultations: completedCounts.completed || 0,
        averageRating: null,  // No rating column in DB - rating system not yet implemented
        yearsExperience: doctor?.experience || 0,
      },
    });
  } catch (error) {
    logger.error("Doctor profile stats error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Register walk-in patient
 * @route   POST /api/doctors/walk-in-patient
 * @access  Private (Doctor only)
 */
exports.registerWalkInPatient = async (req, res, next) => {
  try {
    const { name, age, gender, phone, bloodGroup, symptoms, address } =
      req.body;
    const doctorId = req.user.id || req.user._id;
    const effectiveHospitalId =
      req.hospitalId || req.user.hospitalId || req.user.hospital_id || "MAIN";
    const normalizedPhone = String(phone || "").trim();

    // Check if patient with this phone already exists
    let patient = await userRepository.findByPhone(normalizedPhone);

    const ensurePatientProfile = async (userRecord) => {
      const existingProfile = await patientRepository.findByUserId(userRecord.id);
      if (existingProfile) return existingProfile;

      const today = new Date();
      const derivedBirthYear = today.getFullYear() - Number(age);
      const derivedDateOfBirth = new Date(derivedBirthYear, 0, 1);

      return patientRepository.create({
        userId: userRecord.id,
        dateOfBirth: Number.isNaN(derivedDateOfBirth.getTime())
          ? null
          : derivedDateOfBirth,
        gender,
        bloodGroup,
        address,
      });
    };

    // Helper to check appointment conflicts and get next available slot
    const getNextAvailableSlot = async (doctorId, hospitalId) => {
      const now = new Date();
      let proposedTime = new Date(now.getTime() + 15 * 60 * 1000); // Start with 15 minutes from now
      const maxAttempts = 12; // Check up to 3 hours ahead (12 x 15-minute slots)
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const localDate = `${proposedTime.getFullYear()}-${String(
          proposedTime.getMonth() + 1
        ).padStart(2, "0")}-${String(proposedTime.getDate()).padStart(2, "0")}`;
        const appointmentTime = `${String(proposedTime.getHours()).padStart(2, "0")}:${String(
          proposedTime.getMinutes()
        ).padStart(2, "0")}`;

        // Check if doctor has too many appointments in this time slot
        const conflictCount = await appointmentRepository.countByDoctorAtTime(
          doctorId,
          hospitalId,
          localDate,
          appointmentTime
        );

        // Allow maximum 2 appointments per 15-minute slot
        if (conflictCount < 2) {
          return {
            scheduledAt: proposedTime,
            localDate,
            appointmentTime
          };
        }

        // Move to next 15-minute slot
        proposedTime = new Date(proposedTime.getTime() + 15 * 60 * 1000);
      }

      // If no slot found within 3 hours, use original logic with warning
      logger.warn(`No available slots found for doctor ${doctorId}, scheduling anyway`);
      const fallbackTime = new Date(now.getTime() + 15 * 60 * 1000);
      return {
        scheduledAt: fallbackTime,
        localDate: `${fallbackTime.getFullYear()}-${String(
          fallbackTime.getMonth() + 1
        ).padStart(2, "0")}-${String(fallbackTime.getDate()).padStart(2, "0")}`,
        appointmentTime: `${String(fallbackTime.getHours()).padStart(2, "0")}:${String(
          fallbackTime.getMinutes()
        ).padStart(2, "0")}`
      };
    };

    if (patient && patient.role === "patient") {
      await ensurePatientProfile(patient);

      // Add walk-in appointment for existing patient when symptoms provided.
      if (symptoms) {
        const { scheduledAt, localDate, appointmentTime } = await getNextAvailableSlot(
          doctorId, 
          effectiveHospitalId
        );

        await appointmentRepository.create({
          appointmentId: `APT-WALKIN-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`,
          patientId: patient.id,
          doctorId,
          hospitalId: effectiveHospitalId,
          appointmentDate: localDate,
          appointmentTime,
          chiefComplaint: symptoms,
          type: "clinic_visit",
        });
      }

      // Patient exists, return existing patient
      return res.status(200).json({
        success: true,
        message: "Patient already registered",
        data: {
          ...patient,
          userId: patient.user_id || patient.userId,
          hospitalId: patient.hospital_id || patient.hospitalId,
        },
        isExisting: true,
      });
    }

    const nextPatientUserId = await userRepository.getNextUserId("patient");
    const generatedEmail = `${nextPatientUserId.toLowerCase()}@walkin.aayucare.local`;
    const { randomBytes } = require("crypto");
    const temporaryPasswordHash = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      12
    );

    patient = await userRepository.create({
      userId: nextPatientUserId,
      name,
      email: generatedEmail,
      phone: normalizedPhone,
      passwordHash: temporaryPasswordHash,
      role: "patient",
      hospitalId: effectiveHospitalId,
      hospitalName: req.user.hospitalName || req.user.hospital_name || null,
    });

    await ensurePatientProfile(patient);

    // Create appointment immediately if needed
    if (symptoms) {
      const { scheduledAt, localDate, appointmentTime } = await getNextAvailableSlot(
        doctorId, 
        effectiveHospitalId
      );

      await appointmentRepository.create({
        appointmentId: `APT-WALKIN-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`,
        patientId: patient.id,
        doctorId,
        hospitalId: effectiveHospitalId,
        appointmentDate: localDate,
        appointmentTime,
        chiefComplaint: symptoms,
        type: "clinic_visit",
      });
    }

    // Invalidate relevant caches after walk-in patient registration
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after walk-in patient registration");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      success: true,
      message: "Walk-in patient registered successfully",
      data: {
        ...patient,
        userId: patient.user_id || patient.userId,
        hospitalId: patient.hospital_id || patient.hospitalId,
      },
      isExisting: false,
    });
  } catch (error) {
    logger.error("Register walk-in patient error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Update doctor profile
 * @route   PUT /api/doctors/profile
 * @access  Private (Doctor)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const {
      name,
      email,
      phone,
      specialization,
      qualification,
      experience,
      consultationFee,
      department,
      licenseNumber,
      license_number,
      bio,
      availability,
    } = req.body;

    const userUpdateData = {};
    if (name !== undefined) userUpdateData.name = name;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (email !== undefined) userUpdateData.email = email;
    if (Object.keys(userUpdateData).length > 0) {
      await userRepository.update(doctorId, userUpdateData);
    }

    const doctorUpdateData = {};
    if (specialization !== undefined) doctorUpdateData.specialization = specialization;
    if (qualification !== undefined) doctorUpdateData.qualification = qualification;
    if (experience !== undefined) doctorUpdateData.experience = experience;
    if (consultationFee !== undefined) doctorUpdateData.consultationFee = consultationFee;
    if (department !== undefined) doctorUpdateData.department = department;
    const normalizedLicenseNumber = licenseNumber ?? license_number;
    if (normalizedLicenseNumber !== undefined) {
      doctorUpdateData.licenseNumber = normalizedLicenseNumber;
    }
    if (bio !== undefined) doctorUpdateData.bio = bio;
    if (availability !== undefined) doctorUpdateData.availability = availability;

    if (Object.keys(doctorUpdateData).length > 0) {
      await doctorRepository.update(doctorId, doctorUpdateData);
    }

    const doctor = await doctorRepository.findByUserId(doctorId);

    // Invalidate relevant caches after profile update
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after doctor profile update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
      data: doctor,
    });
  } catch (error) {
    logger.error("Update profile error:", {
      error: error.message,
      doctorId: req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Get doctor consultation history
 * @route   GET /api/doctors/consultation-history
 * @access  Private (Doctor)
 */
exports.getConsultationHistory = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const filters = { 
      doctorId,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    if (status) {
      filters.status = status;
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);
    const consultationCounts = await appointmentRepository.countByStatus(
      doctorId,
      "doctor",
      {
        status: status || null,
        startDate: filters.startDate,
        endDate: filters.endDate,
        hospitalId: filters.hospitalId,
      }
    );
    const total = consultationCounts.total || 0;

    res.status(200).json({
      success: true,
      data: {
        consultations: appointments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get consultation history error:", {
      error: error.message,
      doctorId: req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Get doctor's weekly schedule
 * @route   GET /api/doctors/me/schedule
 * @access  Private (Doctor)
 */
exports.getSchedule = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;

    const schedules = await scheduleRepository.findAvailableByDoctor(doctorId);

    // Create default schedule if none exists
    if (schedules.length === 0) {
      const daysOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const defaultSchedulePromises = daysOfWeek.map((day) => {
        const isWeekday = !["saturday", "sunday"].includes(day);
        return scheduleRepository.create({
          doctorId,
          dayOfWeek: day,
          isAvailable: isWeekday,
          timeSlots: isWeekday
            ? [
                { startTime: "09:00", endTime: "12:00", isAvailable: true },
                { startTime: "14:00", endTime: "17:00", isAvailable: true },
              ]
            : [],
          breakTime: isWeekday ? { startTime: "12:00", endTime: "14:00" } : null,
        });
      });
      const created = await Promise.all(defaultSchedulePromises);
      
      // Invalidate relevant caches after default schedule creation
      try {
        await deleteCacheByPattern("v1:cache:doctors:*");
        await deleteCacheByPattern("v1:cache:doctor:*");
        logger.debug("Cache invalidated after default schedule creation");
      } catch (cacheError) {
        logger.warn("Failed to invalidate cache:", cacheError.message);
      }
      
      return res.status(200).json({
        success: true,
        data: created,
      });
    }

    res.status(200).json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    logger.error("Get schedule error:", {
      error: error.message,
      doctorId: req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Update doctor's schedule for a specific day
 * @route   PUT /api/doctors/me/schedule/:dayOfWeek
 * @access  Private (Doctor)
 */
exports.updateSchedule = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { dayOfWeek } = req.params;
    const { isAvailable, timeSlots, breakTime, notes } = req.body;

    // Validate day of week
    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    if (!validDays.includes(dayOfWeek.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid day of week",
      });
    }

    // Find and update or create new schedule
    let schedule = await scheduleRepository.findByDoctorAndDay(doctorId, dayOfWeek.toLowerCase());

    if (schedule) {
      const updateData = {};
      if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
      if (timeSlots) updateData.timeSlots = timeSlots;
      if (breakTime) updateData.breakTime = breakTime;
      if (notes !== undefined) updateData.notes = notes;
      
      schedule = await scheduleRepository.update(schedule._id, updateData);
    } else {
      schedule = await scheduleRepository.create({
        doctorId,
        dayOfWeek: dayOfWeek.toLowerCase(),
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        timeSlots: timeSlots || [],
        breakTime: breakTime || null,
        notes: notes || "",
      });
    }

    logger.info("Schedule updated:", {
      doctorId,
      dayOfWeek,
    });

    // Invalidate relevant caches after schedule update
    try {
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after schedule update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(200).json({
      success: true,
      message: "Schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    logger.error("Update schedule error:", {
      error: error.message,
      doctorId: req.user?._id,
    });
    next(error);
  }
};

/**
 * @desc    Toggle availability for a specific day
 * @route   PATCH /api/doctors/me/schedule/:dayOfWeek/toggle
 * @access  Private (Doctor)
 */
exports.toggleDayAvailability = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { dayOfWeek } = req.params;

    const schedule = await scheduleRepository.findByDoctorAndDay(doctorId, dayOfWeek.toLowerCase());

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found for this day",
      });
    }

    const updatedSchedule = await scheduleRepository.update(schedule._id, {
      isAvailable: !schedule.isAvailable,
    });

    logger.info("Day availability toggled:", {
      doctorId,
      dayOfWeek,
      isAvailable: updatedSchedule?.isAvailable,
    });

    // Invalidate relevant caches after availability toggle
    try {
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
      await deleteCacheByPattern("v1:cache:dashboard:*");
      logger.debug("Cache invalidated after availability toggle");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(200).json({
      success: true,
      message: `${dayOfWeek} availability updated`,
      data: updatedSchedule,
    });
  } catch (error) {
    logger.error("Toggle availability error:", {
      error: error.message,
      doctorId: req.user?._id,
    });
    next(error);
  }
};


