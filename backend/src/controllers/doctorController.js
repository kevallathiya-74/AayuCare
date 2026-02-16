const doctorService = require("../services/doctorService");
const appointmentRepository = require("../repositories/appointmentRepository");
const prescriptionRepository = require("../repositories/prescriptionRepository");
const userRepository = require("../repositories/userRepository");
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
        endDate: tomorrow,
      }),
      // Completed today
      appointmentRepository.countByStatus(doctorId, 'completed', {
        startDate: today,
        endDate: tomorrow,
        hospitalId: baseFilters.hospitalId,
      }),
      // Total unique patients
      appointmentRepository.findByDoctor(doctorId, baseFilters),
      // Upcoming appointments (next 7 days)
      appointmentRepository.countByStatus(doctorId, ['scheduled', 'confirmed'], {
        startDate: today,
        hospitalId: baseFilters.hospitalId,
      }),
      // Recent prescriptions
      prescriptionRepository.findByDoctor(doctorId, {
        limit: 5,
        hospitalId: baseFilters.hospitalId,
      }),
    ]);

    // Calculate total unique patients from appointments
    const uniquePatientIds = new Set(todaysAppointments.map(apt => apt.patient_id));
    const totalPatients = Array.from(uniquePatientIds);

    const schedule = {
      totalAppointments: todaysAppointments.length,
      completed: completedToday,
      pending: todaysAppointments.length - completedToday,
      nextPatient:
        todaysAppointments.find((apt) => apt.status !== "completed")?.patient_name || "No pending",
      nextTime: todaysAppointments.find((apt) => apt.status !== "completed")
        ?.appointment_date
        ? new Date(
            todaysAppointments.find(
              (apt) => apt.status !== "completed"
            ).appointment_date
          ).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "N/A",
    };

    // Format appointments for frontend
    const formattedAppointments = todaysAppointments.map((apt) => {
      const age = apt.date_of_birth
        ? calculateAge(apt.date_of_birth)
        : null;

      return {
        _id: apt.id,
        id: apt.id,
        time: new Date(apt.appointment_date).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        patientName: apt.patient_name || "Unknown",
        patientId: apt.patient_user_id || apt.patient_id,
        age: age !== null ? age : "N/A",
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.appointment_type || "in-person",
      };
    });

    res.json({
      success: true,
      data: {
        schedule,
        todaysAppointments: formattedAppointments,
        stats: {
          totalPatients: totalPatients.length,
          upcomingAppointments: upcomingAppointmentsCount,
          prescriptionsToday: recentPrescriptions.filter(
            (p) => new Date(p.created_at) >= today
          ).length,
        },
        recentPrescriptions: recentPrescriptions.map((p) => ({
          id: p.id,
          patientName: p.patient_name || "Unknown",
          date: p.created_at,
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
      endDate: tomorrow,
    };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    // Apply filter
    if (filter === "completed") {
      filters.status = "completed";
    } else if (filter === "pending") {
      filters.status = ["scheduled", "confirmed"];
    }

    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);

    res.json({
      success: true,
      count: appointments.length,
      data: appointments.map((apt) => ({
        _id: apt.id,
        id: apt.id,
        time: new Date(apt.appointment_date).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        patientName: apt.patient_name || "Unknown",
        patientId: apt.patient_user_id || apt.patient_id,
        patientPhoto: apt.patient_avatar || null,
        age: apt.patient_age || "N/A",
        gender: apt.patient_gender || "N/A",
        phone: apt.patient_phone || "N/A",
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.appointment_type || "in-person",
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
      status: ["scheduled", "confirmed"],
      page: parseInt(page),
      limit: parseInt(limit),
    };

    // Add hospitalId filter for multi-tenancy (skip for super_admin)
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);
    const total = await appointmentRepository.countByStatus(doctorId, ["scheduled", "confirmed"], {
      startDate: tomorrow,
      hospitalId: filters.hospitalId,
    });

    res.json({
      success: true,
      data: appointments.map((apt) => ({
        _id: apt.id,
        id: apt.id,
        date: apt.appointment_date,
        time: new Date(apt.appointment_date).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        patientName: apt.patient_name || "Unknown",
        patientId: apt.patient_user_id || apt.patient_id,
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.appointment_type || "in-person",
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

    logger.info("Search patients request:", {
      doctorId,
      userId: req.user.userId,
      query: q,
    });

    if (!q || q.length < 1) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Find patients who have appointments with this doctor
    const filters = { doctorId };
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }
    
    const appointments = await appointmentRepository.findByDoctor(doctorId, filters);
    const patientIds = [...new Set(appointments.map(apt => apt.patient_id))];

    logger.info("Found patient IDs:", { patientIds, count: patientIds.length });

    // Search patients by name, userId, or phone
    const patients = [];
    for (const patientId of patientIds) {
      const patient = await userRepository.findById(patientId);
      if (patient && (
        patient.name?.toLowerCase().includes(q.toLowerCase()) ||
        patient.user_id?.toLowerCase().includes(q.toLowerCase()) ||
        patient.phone?.includes(q)
      )) {
        patients.push(patient);
        if (patients.length >= 10) break;
      }
    }

    logger.info("Search results:", { count: patients.length, patients });

    res.json({
      success: true,
      data: patients,
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
 * @access  Private (Doctor only)
 */
exports.getPatientDetails = async (req, res) => {
  try {
    const doctorId = req.user.id || req.user._id;
    const { patientId } = req.params;

    logger.info("Get patient details request:", {
      doctorId,
      patientId,
      userId: req.user.userId,
    });

    // Verify doctor has appointments with this patient
    const filters = {
      doctorId,
      patientId,
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      filters.hospitalId = req.hospitalId;
    }

    const patientAppointments = await appointmentRepository.findByDoctor(doctorId, filters);

    if (!patientAppointments || patientAppointments.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this patient's records",
      });
    }

    // Get patient details
    const patient = await userRepository.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Get appointment history (already fetched above)
    const appointments = patientAppointments.slice(0, 10);

    // Get medical records (note: medical record repository not available, keeping this as TODO)
    const MedicalRecord = require("../models/MedicalRecord");
    const medicalRecordsQuery = {
      patientId,
      doctorId,
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      medicalRecordsQuery.hospitalId = req.hospitalId;
    }

    const medicalRecords = await MedicalRecord.find(medicalRecordsQuery)
      .select("recordType title date diagnosis")
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Get prescriptions
    const prescriptionFilters = {
      doctorId,
      patientId,
      limit: 10,
    };
    if (req.hospitalId && req.user.role !== "super_admin") {
      prescriptionFilters.hospitalId = req.hospitalId;
    }

    const prescriptions = await prescriptionRepository.findByDoctor(doctorId, prescriptionFilters);

    logger.info("Patient details retrieved:", {
      patientId,
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
      doctorId: req.user?._id,
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

    const validStatuses = [
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
      "no-show",
    ];
    if (!validStatuses.includes(status)) {
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

    const updateData = { status };
    if (notes) {
      updateData.notes = notes;
    }
    if (status === "completed") {
      updateData.completed_at = new Date();
    }

    const updatedAppointment = await appointmentRepository.update(id, updateData);

    logger.info("Appointment status updated", {
      appointmentId: id,
      doctorId,
      newStatus: status,
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

    const [appointments, completedAppointments, doctor] = await Promise.all([
      appointmentRepository.findByDoctor(doctorId, {}),
      appointmentRepository.countByStatus(doctorId, "completed"),
      userRepository.findById(doctorId),
    ]);

    const uniquePatients = [...new Set(appointments.map(apt => apt.patient_id))];

    res.json({
      success: true,
      data: {
        totalPatients: uniquePatients.length,
        completedConsultations: completedAppointments,
        rating: doctor?.rating || 4.5,
        experienceYears: doctor?.experience || 0,
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
    const uniquePatients = [...new Set(appointments.map(apt => apt.patient_id))];

    // Get years of experience from user profile
    const doctor = await userRepository.findById(doctorId);
    const yearsExperience =
      doctor?.years_of_experience ||
      (doctor?.created_at
        ? new Date().getFullYear() - new Date(doctor.created_at).getFullYear()
        : 0);

    // Calculate average rating (mock for now, can be expanded)
    const avgRating = 4.5; // TODO: Implement actual rating system

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
      specialization,
      department,
      phone,
      email,
      yearsOfExperience,
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (specialization) updateData.specialization = specialization;
    if (department) updateData.department = department;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (yearsOfExperience !== undefined)
      updateData.years_of_experience = yearsOfExperience;

    const doctor = await userRepository.update(doctorId, updateData);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
    const total = await appointmentRepository.countByStatus(doctorId, status || null, {
      startDate: filters.startDate,
      endDate: filters.endDate,
      hospitalId: filters.hospitalId,
    });

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
