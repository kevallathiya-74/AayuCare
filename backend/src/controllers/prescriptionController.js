/**
 * Prescription Controller
 * Handles prescription creation, retrieval, and management
 */

const Prescription = require("../models/Prescription");
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * @desc    Create a new prescription
 * @route   POST /api/prescriptions
 * @access  Private (Doctor/Admin)
 */
exports.createPrescription = async (req, res) => {
  try {
    const {
      patientId,
      medications,
      diagnosis,
      symptoms,
      notes,
      followUpDate,
      tests,
    } = req.body;

    // Validate required fields
    if (!patientId || !medications || medications.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Patient ID and at least one medication are required",
      });
    }

    // Verify patient exists - supports both userId and _id
    const query = { role: "patient" };
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ userId: patientId }, { _id: patientId }];
    } else {
      query.userId = patientId;
    }
    const patient = await User.findOne(query);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Create prescription using patient ObjectId
    const prescription = await Prescription.create({
      patientId: patient._id,
      doctorId: req.user._id,
      hospitalId: req.user.hospitalId || "MAIN",
      medicines: medications,
      diagnosis,
      instructions: notes,
      followUpDate,
    });

    // Populate doctor details
    await prescription.populate("doctorId", "name specialization userId");

    res.status(201).json({
      success: true,
      message: "Prescription created successfully. Patient will be notified.",
      data: prescription,
    });
  } catch (error) {
    logger.error("Create prescription error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.body.patientId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to create prescription",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all prescriptions for a patient
 * @route   GET /api/prescriptions/patient/:patientId
 * @access  Private (Patient own data or Doctor/Admin)
 */
exports.getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Check access rights - supports both _id and userId formats
    const isOwnData =
      req.user.userId === patientId || req.user._id.toString() === patientId;
    if (req.user.role !== "admin" && req.user.role !== "doctor" && !isOwnData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these prescriptions",
      });
    }

    // Find patient by either userId or _id
    const query = { role: "patient" };
    if (patientId.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ userId: patientId }, { _id: patientId }];
    } else {
      query.userId = patientId;
    }
    const patient = await User.findOne(query).select("_id");
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const prescriptions = await Prescription.find({ patientId: patient._id })
      .populate("doctorId", "name specialization userId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    logger.error("Get patient prescriptions error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all prescriptions created by a doctor
 * @route   GET /api/prescriptions/doctor/:doctorId
 * @access  Private (Doctor own data or Admin)
 */
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Check access rights - supports both _id and userId formats
    const isOwnData =
      req.user.userId === doctorId || req.user._id.toString() === doctorId;
    if (req.user.role !== "admin" && !isOwnData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these prescriptions",
      });
    }

    // Find doctor by either userId or _id
    const doctor = await User.findOne({
      role: "doctor",
      $or: [{ userId: doctorId }, { _id: doctorId }],
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const prescriptions = await Prescription.find({ doctorId: doctor._id })
      .populate("patientId", "name userId age gender")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions,
    });
  } catch (error) {
    logger.error("Get doctor prescriptions error:", {
      error: error.message,
      stack: error.stack,
      doctorId: req.params.doctorId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
};

/**
 * @desc    Get prescription by ID
 * @route   GET /api/prescriptions/:prescriptionId
 * @access  Private
 */
exports.getPrescriptionById = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId", "name specialization userId phone")
      .populate("patientId", "name userId age gender bloodGroup");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    // Check access rights - supports both _id and userId formats
    const isPatientOwner =
      prescription.patientId &&
      (req.user.userId === prescription.patientId.userId ||
        req.user._id.toString() === prescription.patientId._id.toString());
    const isDoctorOwner =
      prescription.doctorId &&
      (req.user.userId === prescription.doctorId.userId ||
        req.user._id.toString() === prescription.doctorId._id.toString());

    if (req.user.role !== "admin" && !isDoctorOwner && !isPatientOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this prescription",
      });
    }

    res.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    logger.error("Get prescription by ID error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
      error: error.message,
    });
  }
};

/**
 * @desc    Update prescription status
 * @route   PATCH /api/prescriptions/:prescriptionId/status
 * @access  Private (Doctor/Admin)
 */
exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be active, completed, or cancelled",
      });
    }

    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      { status },
      { new: true, runValidators: true }
    ).populate("doctorId", "name specialization");

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.json({
      success: true,
      message: "Prescription status updated successfully",
      data: prescription,
    });
  } catch (error) {
    logger.error("Update prescription status error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
      status: req.body.status,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update prescription status",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a prescription
 * @route   DELETE /api/prescriptions/:prescriptionId
 * @access  Private (Admin only)
 */
exports.deletePrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findByIdAndDelete(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    logger.error("Delete prescription error:", {
      error: error.message,
      stack: error.stack,
      prescriptionId: req.params.prescriptionId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to delete prescription",
      error: error.message,
    });
  }
};
