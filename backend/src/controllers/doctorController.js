const doctorService = require("../services/doctorService");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const userRepository = require("../repositories/userRepository");
const doctorRepository = require("../repositories/doctorRepository");
const scheduleRepository = require("../repositories/scheduleRepository");
const logger = require("../utils/logger");

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
exports.getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build query base with hospitalId filter
    const baseFilters = { 
      doctorId,
      hospitalId: (req.hospitalId && req.user.role !== "super_admin") ? req.hospitalId : null 
    };

    // Run all queries in parallel
    const [
      todaysAppointments,
      completedToday,
      totalPatientsData,
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
      // Total unique patients
      appointmentRepository.findByDoctor(doctorId, baseFilters),
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

    // Calculate total unique patients from appointments
    const uniquePatientIds = new Set(
      todaysAppointments
        .map((apt) => apt.patientId || apt.patient_id)
        .filter(Boolean)
    );
    const totalPatients = Array.from(uniquePatientIds);
    
    // Count completed appointments
    const completedCount = Array.isArray(completedToday) ? completedToday.length : 0;

    const schedule = {
      totalAppointments: todaysAppointments.length,
      completed: completedCount,
      pending: todaysAppointments.length - completedCount,
      nextPatient:
        todaysAppointments.find((apt) => apt.status !== "completed")
          ?.patientName || "No pending",
      nextTime: formatAppointmentTime(
        todaysAppointments.find((apt) => apt.status !== "completed")
      ),
    };

    // Format appointments for frontend
    const formattedAppointments = todaysAppointments.map((apt) => {
      const age = apt.dateOfBirth || apt.date_of_birth
        ? calculateAge(apt.dateOfBirth || apt.date_of_birth)
        : null;

      return {
        _id: apt.id,
        id: apt.id,
        time: formatAppointmentTime(apt),
        patientName: apt.patientName || apt.patient_name || "Unknown",
        patientId: apt.patientId || apt.patient_user_id || apt.patient_id,
        age: age !== null ? age : "N/A",
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.type || apt.appointment_type || "in-person",
      };
    });

    res.json({
      success: true,
      data: {
        schedule,
        todaysAppointments: formattedAppointments,
        stats: {
          totalPatients: totalPatients.length,
          upcomingAppointments: Array.isArray(upcomingAppointmentsCount) ? upcomingAppointmentsCount.length : 0,
          prescriptionsToday: recentPrescriptions.filter(
            (p) => new Date(p.createdAt || p.created_at) >= today
          ).length,
        },
        recentPrescriptions: recentPrescriptions.map((p) => ({
          id: p.id || p._id,
          patientName: p.patient_name || p.patientId?.name || "Unknown",
          date: p.createdAt || p.created_at,
          medicationsCount: p.medications?.length || 0,
        })),
      },
    });
  } catch (error) {
    logger.error("Doctor dashboard error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
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
    const doctorId = req.user.id || req.user._id;
    const { filter = "all" } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filters = {
      doctorId,
      startDate: today,
      endDate: today,
    };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    // Apply filter
    if (filter === "completed") {
      filters.status = "completed";
    } else if (filter === "pending") {
      filters.status = "scheduled,confirmed";
    }

    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments.map((apt) => ({
        _id: apt.id,
        id: apt.id,
        time: formatAppointmentTime(apt),
        patientName: apt.patientName || apt.patient_name || "Unknown",
        patientId: apt.patientId || apt.patient_user_id || apt.patient_id,
        patientPhoto: apt.patientAvatar || apt.patient_avatar || null,
        age: apt.patientAge || apt.patient_age || "N/A",
        gender: apt.patientGender || apt.patient_gender || "N/A",
        phone: apt.patientPhone || apt.patient_phone || "N/A",
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.type || apt.appointment_type || "in-person",
      })),
    });
  } catch (error) {
    logger.error("Today appointments error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to load appointments",
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
      data: appointments.map((apt) => ({
        _id: apt.id,
        id: apt.id,
        date: apt.appointmentDate || apt.appointment_date,
        time: formatAppointmentTime(apt),
        patientName: apt.patientName || apt.patient_name || "Unknown",
        patientId: apt.patientId || apt.patient_user_id || apt.patient_id,
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.type || apt.appointment_type || "in-person",
      })),
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
      doctorId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to load upcoming appointments",
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

    const result = await userRepository.findPatientsByHospital(
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
    res.status(500).json({
      success: false,
      message: "Failed to search patients",
      error: error.message,
    });
  }
};

/**
 * @desc    Get detailed patient information
 * @route   GET /api/doctors/me/patients/:patientId
 * @access  Private (Doctor, Admin)
 */
exports.getPatientDetails = async (req, res) => {
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

    // Get medical records from MongoDB
    const MedicalRecord = require("../models/MedicalRecord");
    const medicalRecordsQuery = {
      patientId: { $in: [resolvedPatientId, resolvedPatientUserId].filter(Boolean) },
    };
    
    if (req.hospitalId && req.user.role !== "super_admin") {
      medicalRecordsQuery.hospitalId = req.hospitalId;
    }

    const dbMedicalRecords = await MedicalRecord.find(medicalRecordsQuery)
      .select("recordType title date diagnosis symptoms vitalSigns createdAt")
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Map medical records to proper format
    const medicalRecords = mapArray(dbMedicalRecords, mapMedicalRecordData);

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
    res.status(500).json({
      success: false,
      message: "Failed to retrieve patient details",
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
    const doctorId = req.user.id || req.user._id;

    const normalizedStatus = String(status || "")
      .toLowerCase()
      .replace(/-/g, "_");

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

    const updateData = { status: normalizedStatus };
    if (notes) {
      updateData.notes = notes;
    }
    if (normalizedStatus === "completed") {
      updateData.completed_at = new Date();
    }

    const updatedAppointment = await appointmentRepository.update(id, updateData);

    // Invalidate appointment caches after status update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
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
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
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
    const doctorId = req.user.id || req.user._id;

    const [appointments, completedCounts, doctor] = await Promise.all([
      appointmentRepository.findByDoctor(doctorId, {}),
      appointmentRepository.countByStatus(doctorId, "doctor", {
        status: "completed",
      }),
      userRepository.findById(doctorId),
    ]);

    const uniquePatients = [
      ...new Set(appointments.map((apt) => apt.patientId || apt.patient_id).filter(Boolean)),
    ];

    res.json({
      success: true,
      data: {
        totalPatients: uniquePatients.length,
        completedConsultations: completedCounts.completed || 0,
        averageRating: doctor?.rating || 4.5,
        yearsExperience: doctor?.experience || 0,
      },
    });
  } catch (error) {
    logger.error("Doctor profile stats error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to load profile stats",
      error: error.message,
    });
  }
};

/**
 * @desc    Register walk-in patient
 * @route   POST /api/doctors/walk-in-patient
 * @access  Private (Doctor only)
 */
exports.registerWalkInPatient = async (req, res) => {
  try {
    const { name, age, gender, phone, bloodGroup, symptoms, address } =
      req.body;
    const doctorId = req.user.id || req.user._id;

    // Validate required fields
    if (!name || !age || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, age, gender, and phone are required",
      });
    }

    // Check if patient with this phone already exists
    let patient = await userRepository.findByPhone(phone);

    if (patient && patient.role === "patient") {
      // Patient exists, return existing patient
      return res.status(200).json({
        success: true,
        message: "Patient already registered",
        data: patient,
        isExisting: true,
      });
    }

    // Generate unique userId
    const allPatients = await userRepository.findByRole("patient");
    const userId = `P${String(allPatients.length + 1).padStart(6, "0")}`;

    // Create new walk-in patient (Note: userRepository.create not available, using User model)
    const User = require("../models/User");
    patient = await User.create({
      name,
      userId,
      phone,
      role: "patient",
      age,
      gender,
      bloodGroup,
      address,
      hospitalId: req.hospitalId || req.user.hospitalId || "MAIN",
      isWalkIn: true,
      registeredBy: doctorId,
      // No password needed for walk-in patients (admin creates later if needed)
    });

    // Create appointment immediately if needed
    if (symptoms) {
      // Format time in 24-hour HH:MM format (not 12-hour with AM/PM)
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const appointmentTime = `${hours}:${minutes}`; // e.g., "14:30"

      await appointmentRepository.create({
        patient_id: patient.id || patient._id,
        doctor_id: doctorId,
        hospital_id: req.hospitalId || req.user.hospitalId || "MAIN",
        appointment_date: new Date(),
        appointment_time: appointmentTime, // HH:MM format in 24-hour
        chief_complaint: symptoms,
        status: "scheduled",
        appointment_type: "walk-in",
      });
    }

    // Invalidate relevant caches after walk-in patient registration
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:user:*");
      await deleteCacheByPattern("v1:cache:patient:*");
      await deleteCacheByPattern("cache:patient:*");
      await deleteCacheByPattern("v1:cache:appointments:*");
      await deleteCacheByPattern("cache:appointments:*");
      logger.debug("Cache invalidated after walk-in patient registration");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    res.status(201).json({
      success: true,
      message: "Walk-in patient registered successfully",
      data: patient,
      isExisting: false,
    });
  } catch (error) {
    logger.error("Register walk-in patient error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to register walk-in patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Get doctor profile stats
 * @route   GET /api/doctors/profile/stats
 * @access  Private (Doctor)
 */
exports.getProfileStats = async (req, res, next) => {
  try {
    const doctorId = req.user.id || req.user._id;

    // Get total unique patients treated
    const filters = {
      doctorId,
      status: ["completed", "confirmed"],
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }
    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);
    const uniquePatients = [
      ...new Set(appointments.map((apt) => apt.patientId || apt.patient_id).filter(Boolean)),
    ];

    // Get years of experience from user profile
    const doctor = await userRepository.findById(doctorId);
    const yearsExperience =
      doctor?.years_of_experience ||
      (doctor?.created_at
        ? new Date().getFullYear() - new Date(doctor.created_at).getFullYear()
        : 0);

    // Calculate average rating
    // TODO: Implement actual rating system - requires ratings table in PostgreSQL
    //       with columns: id, doctor_id, patient_id, rating, review, created_at
    //       Then calculate: SELECT AVG(rating) FROM ratings WHERE doctor_id = $1
    const avgRating = null; // null indicates rating system not implemented

    res.status(200).json({
      success: true,
      data: {
        totalPatients: uniquePatients.length,
        averageRating: avgRating,
        yearsExperience,
      },
    });
  } catch (error) {
    logger.error("Get profile stats error:", {
      error: error.message,
      doctorId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile statistics",
    });
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
    const { deleteCacheByPattern } = require("../config/redis");
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
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
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
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    logger.error("Get consultation history error:", {
      error: error.message,
      doctorId: req.user?._id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch consultation history",
    });
  }
};

/**
 * @desc    Get doctor's weekly schedule
 * @route   GET /api/doctors/me/schedule
 * @access  Private (Doctor)
 */
exports.getSchedule = async (req, res) => {
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
      const created = [];
      for (const day of daysOfWeek) {
        const scheduleData = {
          doctor_id: doctorId,
          day_of_week: day,
          is_available: !["saturday", "sunday"].includes(day),
          time_slots: !["saturday", "sunday"].includes(day)
            ? [
                { start_time: "09:00", end_time: "12:00", is_available: true },
                { start_time: "14:00", end_time: "17:00", is_available: true },
              ]
            : [],
          break_time: { start_time: "12:00", end_time: "14:00" },
        };
        const schedule = await scheduleRepository.create(scheduleData);
        created.push(schedule);
      }
      
      // Invalidate relevant caches after default schedule creation
      const { deleteCacheByPattern } = require("../config/redis");
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedule",
    });
  }
};

/**
 * @desc    Update doctor's schedule for a specific day
 * @route   PUT /api/doctors/me/schedule/:dayOfWeek
 * @access  Private (Doctor)
 */
exports.updateSchedule = async (req, res) => {
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
      if (isAvailable !== undefined) updateData.is_available = isAvailable;
      if (timeSlots) updateData.time_slots = timeSlots;
      if (breakTime) updateData.break_time = breakTime;
      if (notes !== undefined) updateData.notes = notes;
      
      schedule = await scheduleRepository.update(schedule.id, updateData);
    } else {
      schedule = await scheduleRepository.create({
        doctor_id: doctorId,
        day_of_week: dayOfWeek.toLowerCase(),
        is_available: isAvailable !== undefined ? isAvailable : true,
        time_slots: timeSlots || [],
        break_time: breakTime || null,
        notes: notes || "",
      });
    }

    logger.info("Schedule updated:", {
      doctorId,
      dayOfWeek,
    });

    // Invalidate relevant caches after schedule update
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
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
    res.status(500).json({
      success: false,
      message: "Failed to update schedule",
    });
  }
};

/**
 * @desc    Toggle availability for a specific day
 * @route   PATCH /api/doctors/me/schedule/:dayOfWeek/toggle
 * @access  Private (Doctor)
 */
exports.toggleDayAvailability = async (req, res) => {
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

    const updatedSchedule = await scheduleRepository.update(schedule.id, {
      is_available: !schedule.is_available,
    });

    logger.info("Day availability toggled:", {
      doctorId,
      dayOfWeek,
      isAvailable: updatedSchedule.is_available,
    });

    // Invalidate relevant caches after availability toggle
    const { deleteCacheByPattern } = require("../config/redis");
    try {
      await deleteCacheByPattern("v1:cache:doctors:*");
      await deleteCacheByPattern("v1:cache:doctor:*");
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
    res.status(500).json({
      success: false,
      message: "Failed to toggle availability",
    });
  }
};
