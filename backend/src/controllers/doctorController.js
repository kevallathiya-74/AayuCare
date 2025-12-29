const doctorService = require("../services/doctorService");
const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const User = require("../models/User");
const Schedule = require("../models/Schedule");
const logger = require("../utils/logger");

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public
 */
exports.getDoctors = async (req, res, next) => {
  try {
    const result = await doctorService.getDoctors(req.query);

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
    const doctorId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all queries in parallel
    const [
      todaysAppointments,
      completedToday,
      totalPatients,
      upcomingAppointments,
      recentPrescriptions,
    ] = await Promise.all([
      // Today's appointments
      Appointment.find({
        doctorId,
        appointmentDate: { $gte: today, $lt: tomorrow },
      })
        .populate("patientId", "name userId age gender phone")
        .sort({ appointmentDate: 1 })
        .lean(),
      // Completed today
      Appointment.countDocuments({
        doctorId,
        appointmentDate: { $gte: today, $lt: tomorrow },
        status: "completed",
      }),
      // Total unique patients
      Appointment.distinct("patientId", { doctorId }),
      // Upcoming appointments (next 7 days)
      Appointment.countDocuments({
        doctorId,
        appointmentDate: { $gte: today },
        status: { $in: ["scheduled", "confirmed"] },
      }),
      // Recent prescriptions
      Prescription.find({ doctorId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("patientId", "name userId")
        .lean(),
    ]);

    const schedule = {
      totalAppointments: todaysAppointments.length,
      completed: completedToday,
      pending: todaysAppointments.length - completedToday,
      nextPatient:
        todaysAppointments.find((apt) => apt.status !== "completed")?.patientId
          ?.name || "No pending",
      nextTime: todaysAppointments.find((apt) => apt.status !== "completed")
        ?.appointmentDate
        ? new Date(
            todaysAppointments.find(
              (apt) => apt.status !== "completed"
            ).appointmentDate
          ).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
        : "N/A",
    };

    // Format appointments for frontend
    const formattedAppointments = todaysAppointments.map((apt) => ({
      _id: apt._id,
      id: apt._id,
      time: new Date(apt.appointmentDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      patientName: apt.patientId?.name || "Unknown",
      patientId: apt.patientId?.userId || apt.patientId?._id,
      age: apt.patientId?.age || "N/A",
      reason: apt.reason || "Consultation",
      status: apt.status,
      type: apt.appointmentType || "in-person",
    }));

    res.json({
      success: true,
      data: {
        schedule,
        todaysAppointments: formattedAppointments,
        stats: {
          totalPatients: totalPatients.length,
          upcomingAppointments,
          prescriptionsToday: recentPrescriptions.filter(
            (p) => new Date(p.createdAt) >= today
          ).length,
        },
        recentPrescriptions: recentPrescriptions.map((p) => ({
          id: p._id,
          patientName: p.patientId?.name || "Unknown",
          date: p.createdAt,
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
    const doctorId = req.user._id;
    const { filter = "all" } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = {
      doctorId,
      appointmentDate: { $gte: today, $lt: tomorrow },
    };

    // Apply filter
    if (filter === "completed") {
      query.status = "completed";
    } else if (filter === "pending") {
      query.status = { $in: ["scheduled", "confirmed"] };
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "name userId age gender phone email")
      .sort({ appointmentDate: 1 })
      .lean();

    res.json({
      success: true,
      count: appointments.length,
      data: appointments.map((apt) => ({
        _id: apt._id,
        id: apt._id,
        time: new Date(apt.appointmentDate).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        patientName: apt.patientId?.name || "Unknown",
        patientId: apt.patientId?.userId || apt.patientId?._id,
        patientPhoto: apt.patientId?.avatar || null,
        age: apt.patientId?.age || "N/A",
        gender: apt.patientId?.gender || "N/A",
        phone: apt.patientId?.phone || "N/A",
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.appointmentType || "in-person",
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
    const doctorId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      doctorId,
      appointmentDate: { $gte: tomorrow },
      status: { $in: ["scheduled", "confirmed"] },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate("patientId", "name userId age gender phone")
        .sort({ appointmentDate: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: appointments.map((apt) => ({
        _id: apt._id,
        id: apt._id,
        date: apt.appointmentDate,
        time: new Date(apt.appointmentDate).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        patientName: apt.patientId?.name || "Unknown",
        patientId: apt.patientId?.userId || apt.patientId?._id,
        reason: apt.reason || "Consultation",
        status: apt.status,
        type: apt.appointmentType || "in-person",
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
    const doctorId = req.user._id;
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

    // Sanitize search query for regex
    const sanitizedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Find patients who have appointments with this doctor
    const patientIds = await Appointment.distinct("patientId", { doctorId });

    logger.info("Found patient IDs:", { patientIds, count: patientIds.length });

    const patients = await User.find({
      _id: { $in: patientIds },
      $or: [
        { name: { $regex: sanitizedQuery, $options: "i" } },
        { userId: { $regex: sanitizedQuery, $options: "i" } },
        { phone: { $regex: sanitizedQuery, $options: "i" } },
      ],
    })
      .select("name userId age gender phone email dateOfBirth")
      .limit(10)
      .lean({ virtuals: true });

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
 * @desc    Update appointment status (start consultation, complete, etc.)
 * @route   PATCH /api/doctors/appointments/:id/status
 * @access  Private (Doctor only)
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const doctorId = req.user._id;

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

    const appointment = await Appointment.findOne({ _id: id, doctorId });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or unauthorized",
      });
    }

    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }
    if (status === "completed") {
      appointment.completedAt = new Date();
    }

    await appointment.save();

    logger.info("Appointment status updated", {
      appointmentId: id,
      doctorId,
      oldStatus: appointment.status,
      newStatus: status,
    });

    res.json({
      success: true,
      message: "Appointment status updated",
      data: appointment,
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
    const doctorId = req.user._id;

    const [totalPatients, completedAppointments, doctor] = await Promise.all([
      Appointment.distinct("patientId", { doctorId }),
      Appointment.countDocuments({ doctorId, status: "completed" }),
      User.findById(doctorId).select("experience rating").lean(),
    ]);

    res.json({
      success: true,
      data: {
        totalPatients: totalPatients.length,
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
    const doctorId = req.user._id;

    // Validate required fields
    if (!name || !age || !gender || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, age, gender, and phone are required",
      });
    }

    // Check if patient with this phone already exists
    let patient = await User.findOne({ phone, role: "patient" });

    if (patient) {
      // Patient exists, return existing patient
      return res.status(200).json({
        success: true,
        message: "Patient already registered",
        data: patient,
        isExisting: true,
      });
    }

    // Generate unique userId
    const patientCount = await User.countDocuments({ role: "patient" });
    const userId = `P${String(patientCount + 1).padStart(6, "0")}`;

    // Create new walk-in patient
    patient = await User.create({
      name,
      userId,
      phone,
      role: "patient",
      age,
      gender,
      bloodGroup,
      address,
      isWalkIn: true,
      registeredBy: doctorId,
      // No password needed for walk-in patients (admin creates later if needed)
    });

    // Create appointment immediately if needed
    if (symptoms) {
      await Appointment.create({
        patientId: patient._id,
        doctorId,
        appointmentDate: new Date(),
        appointmentTime: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        reason: symptoms,
        status: "pending",
        type: "walk-in",
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
    const doctorId = req.user._id;

    // Get total unique patients treated
    const uniquePatients = await Appointment.distinct("patientId", {
      doctorId,
      status: { $in: ["completed", "confirmed"] },
    });

    // Get years of experience from user profile
    const doctor = await User.findById(doctorId);
    const yearsExperience =
      doctor?.yearsOfExperience ||
      (doctor?.createdAt
        ? new Date().getFullYear() - new Date(doctor.createdAt).getFullYear()
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
    const doctorId = req.user._id;
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
      updateData.yearsOfExperience = yearsOfExperience;

    const doctor = await User.findByIdAndUpdate(doctorId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

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
    const doctorId = req.user._id;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = { doctorId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.appointmentDate = {};
      if (startDate) query.appointmentDate.$gte = new Date(startDate);
      if (endDate) query.appointmentDate.$lte = new Date(endDate);
    }

    const total = await Appointment.countDocuments(query);
    const appointments = await Appointment.find(query)
      .populate("patientId", "name userId age gender phone")
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

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
    const doctorId = req.user._id;

    const schedules = await Schedule.find({ doctorId }).sort({ dayOfWeek: 1 });

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
      const defaultSchedules = daysOfWeek.map((day) => ({
        doctorId,
        dayOfWeek: day,
        isAvailable: ["saturday", "sunday"].includes(day) ? false : true,
        timeSlots: ["saturday", "sunday"].includes(day)
          ? []
          : [
              { startTime: "09:00", endTime: "12:00", isAvailable: true },
              { startTime: "14:00", endTime: "17:00", isAvailable: true },
            ],
        breakTime: { startTime: "12:00", endTime: "14:00" },
      }));

      const created = await Schedule.insertMany(defaultSchedules);
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
    const doctorId = req.user._id;
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
    let schedule = await Schedule.findOne({
      doctorId,
      dayOfWeek: dayOfWeek.toLowerCase(),
    });

    if (schedule) {
      schedule.isAvailable =
        isAvailable !== undefined ? isAvailable : schedule.isAvailable;
      schedule.timeSlots = timeSlots || schedule.timeSlots;
      schedule.breakTime = breakTime || schedule.breakTime;
      schedule.notes = notes !== undefined ? notes : schedule.notes;
      await schedule.save();
    } else {
      schedule = await Schedule.create({
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
    const doctorId = req.user._id;
    const { dayOfWeek } = req.params;

    const schedule = await Schedule.findOne({
      doctorId,
      dayOfWeek: dayOfWeek.toLowerCase(),
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found for this day",
      });
    }

    schedule.isAvailable = !schedule.isAvailable;
    await schedule.save();

    logger.info("Day availability toggled:", {
      doctorId,
      dayOfWeek,
      isAvailable: schedule.isAvailable,
    });

    res.status(200).json({
      success: true,
      message: `${dayOfWeek} availability updated`,
      data: schedule,
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
