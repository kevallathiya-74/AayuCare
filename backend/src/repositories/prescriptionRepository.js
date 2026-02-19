const Prescription = require("../models/Prescription");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Prescription Repository - MongoDB data access layer
 * No business logic - pure database operations only
 */
class PrescriptionRepository {
  /**
   * Create a new prescription
   * @param {Object} prescriptionData - Prescription data
   * @returns {Promise<Object>} Created prescription
   */
  async create(prescriptionData) {
    const prescription = new Prescription(prescriptionData);
    return await prescription.save();
  }

  /**
   * Find prescription by ID
   * @param {string} id - Prescription ID
   * @returns {Promise<Object|null>} Prescription object or null
   */
  async findById(id) {
    return await Prescription.findById(id)
      .populate("patientId", "name email phone userId")
      .populate("doctorId", "name specialization userId")
      .lean();
  }

  /**
   * Find prescriptions by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of prescriptions
   */
  async findByPatient(patientId, filters = {}) {
    const {
      limit = 20,
      skip = 0,
      pharmacyStatus,
      startDate,
      endDate,
    } = filters;

    const query = { patientId };

    if (pharmacyStatus) {
      query.pharmacyStatus = pharmacyStatus;
    }

    if (startDate || endDate) {
      query.prescriptionDate = {};
      if (startDate) query.prescriptionDate.$gte = new Date(startDate);
      if (endDate) query.prescriptionDate.$lte = new Date(endDate);
    }

    return await Prescription.find(query)
      .populate("doctorId", "name specialization userId")
      .sort({ prescriptionDate: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  /**
   * Find prescriptions by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of prescriptions
   */
  async findByDoctor(doctorId, filters = {}) {
    const {
      limit = 20,
      skip = 0,
      pharmacyStatus,
      startDate,
      endDate,
    } = filters;

    const query = { doctorId };

    if (pharmacyStatus) {
      query.pharmacyStatus = pharmacyStatus;
    }

    if (startDate || endDate) {
      query.prescriptionDate = {};
      if (startDate) query.prescriptionDate.$gte = new Date(startDate);
      if (endDate) query.prescriptionDate.$lte = new Date(endDate);
    }

    return await Prescription.find(query)
      .populate("patientId", "name email phone userId")
      .sort({ prescriptionDate: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  /**
   * Find prescription by appointment ID
   * @param {string} appointmentId - Appointment ID
   * @returns {Promise<Object|null>} Prescription object or null
   */
  async findByAppointment(appointmentId) {
    return await Prescription.findOne({ appointmentId })
      .populate("patientId", "name email phone userId")
      .populate("doctorId", "name specialization userId")
      .lean();
  }

  /**
   * Find all prescriptions (admin only)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of prescriptions
   */
  async findAll(filters = {}) {
    const {
      limit = 50,
      skip = 0,
      pharmacyStatus,
      startDate,
      endDate,
    } = filters;

    const query = {};

    if (pharmacyStatus) {
      query.pharmacyStatus = pharmacyStatus;
    }

    if (startDate || endDate) {
      query.prescriptionDate = {};
      if (startDate) query.prescriptionDate.$gte = new Date(startDate);
      if (endDate) query.prescriptionDate.$lte = new Date(endDate);
    }

    return await Prescription.find(query)
      .populate("patientId", "name email phone userId")
      .populate("doctorId", "name specialization userId")
      .sort({ prescriptionDate: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  /**
   * Find prescriptions by hospital ID
   * @param {string} hospitalId - Hospital ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of prescriptions
   */
  async findByHospital(hospitalId, filters = {}) {
    const {
      limit = 50,
      skip = 0,
      pharmacyStatus,
      startDate,
      endDate,
    } = filters;

    const query = { hospitalId };

    if (pharmacyStatus) {
      query.pharmacyStatus = pharmacyStatus;
    }

    if (startDate || endDate) {
      query.prescriptionDate = {};
      if (startDate) query.prescriptionDate.$gte = new Date(startDate);
      if (endDate) query.prescriptionDate.$lte = new Date(endDate);
    }

    return await Prescription.find(query)
      .populate("patientId", "name email phone userId")
      .populate("doctorId", "name specialization userId")
      .sort({ prescriptionDate: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }

  /**
   * Update prescription
   * @param {string} id - Prescription ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated prescription
   */
  async update(id, updates) {
    return await Prescription.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate("patientId", "name email phone userId")
      .populate("doctorId", "name specialization userId")
      .lean();
  }

  /**
   * Update pharmacy status
   * @param {string} id - Prescription ID
   * @param {string} status - New pharmacy status
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePharmacyStatus(id, status) {
    return await this.update(id, { pharmacyStatus: status });
  }

  /**
   * Update payment status
   * @param {string} id - Prescription ID
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Updated prescription
   */
  async updatePayment(id, paymentData) {
    return await this.update(id, { payment: paymentData });
  }

  /**
   * Mark prescription as sent to patient
   * @param {string} id - Prescription ID
   * @returns {Promise<Object>} Updated prescription
   */
  async markAsSent(id) {
    return await this.update(id, {
      isSentToPatient: true,
      sentToPatientAt: new Date(),
    });
  }

  /**
   * Delete prescription (soft delete)
   * @param {string} id - Prescription ID
   * @returns {Promise<Object>} Deleted prescription
   */
  async delete(id) {
    return await Prescription.findByIdAndDelete(id);
  }

  /**
   * Count prescriptions by filters
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count of prescriptions
   */
  async count(filters = {}) {
    return await Prescription.countDocuments(filters);
  }

  /**
   * Get prescription statistics for a hospital
   * @param {string} hospitalId - Hospital ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(hospitalId, startDate, endDate) {
    const matchStage = { hospitalId };

    if (startDate || endDate) {
      matchStage.prescriptionDate = {};
      if (startDate) matchStage.prescriptionDate.$gte = startDate;
      if (endDate) matchStage.prescriptionDate.$lte = endDate;
    }

    const stats = await Prescription.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$pharmacyStatus", "pending"] }, 1, 0] },
          },
          dispensed: {
            $sum: { $cond: [{ $eq: ["$pharmacyStatus", "dispensed"] }, 1, 0] },
          },
          totalAmount: { $sum: "$payment.finalAmount" },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$payment.status", "paid"] }, "$payment.finalAmount", 0],
            },
          },
        },
      },
    ]);

    return stats[0] || {
      total: 0,
      pending: 0,
      dispensed: 0,
      totalAmount: 0,
      paidAmount: 0,
    };
  }
}

module.exports = new PrescriptionRepository();
