const MedicalRecord = require("../models/MedicalRecord");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Medical Record Repository - MongoDB data access layer
 * No business logic - pure database operations only
 */
class MedicalRecordRepository {
  /**
   * Create a new medical record
   * @param {Object} recordData - Medical record data
   * @returns {Promise<Object>} Created medical record
   */
  async create(recordData) {
    const record = new MedicalRecord(recordData);
    return await record.save();
  }

  /**
   * Find medical record by ID
   * @param {string} id - Medical record ID
   * @returns {Promise<Object|null>} Medical record object or null
   */
  async findById(id) {
    return await MedicalRecord.findById(id).lean();
  }

  /**
   * Find medical records by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of medical records
   */
  async findByPatientId(patientId, options = {}) {
    const { limit = 50, offset = 0, sort = { createdAt: -1 } } = options;
    
    return await MedicalRecord.find({ patientId })
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find medical records by doctor ID
   * @param {string} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of medical records
   */
  async findByDoctorId(doctorId, options = {}) {
    const { limit = 50, offset = 0, sort = { createdAt: -1 } } = options;
    
    return await MedicalRecord.find({ doctorId })
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find medical records with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of medical records
   */
  async findWithFilters(filters = {}, options = {}) {
    const { limit = 50, offset = 0, sort = { createdAt: -1 } } = options;
    
    return await MedicalRecord.find(filters)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Count medical records
   * @param {Object} filters - Count filters
   * @returns {Promise<number>} Count of records
   */
  async count(filters = {}) {
    return await MedicalRecord.countDocuments(filters);
  }

  /**
   * Update medical record by ID
   * @param {string} id - Medical record ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated medical record or null
   */
  async update(id, updateData) {
    return await MedicalRecord.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Delete medical record by ID
   * @param {string} id - Medical record ID
   * @returns {Promise<Object|null>} Deleted medical record or null
   */
  async delete(id) {
    return await MedicalRecord.findByIdAndDelete(id);
  }

  /**
   * Get medical history for a patient
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of medical records with history
   */
  async getPatientHistory(patientId, options = {}) {
    const { limit = 20, offset = 0, startDate, endDate } = options;
    
    let query = { patientId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    return await MedicalRecord.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .select("-__v")
      .lean();
  }

  /**
   * Run aggregation pipeline on medical records
   * @param {Array} pipeline - MongoDB aggregation pipeline
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline) {
    return await MedicalRecord.aggregate(pipeline);
  }

  /**
   * Delete multiple medical records matching a filter
   * @param {Object} filter - MongoDB filter object
   * @returns {Promise<Object>} Deletion result
   */
  async deleteMany(filter) {
    return await MedicalRecord.deleteMany(filter);
  }
}

module.exports = new MedicalRecordRepository();