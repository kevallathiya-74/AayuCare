const HealthMetric = require("../models/HealthMetric");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

/**
 * Health Metric Repository - MongoDB data access layer
 * No business logic - pure database operations only
 */
class HealthMetricRepository {
  /**
   * Create a new health metric
   * @param {Object} metricData - Health metric data
   * @returns {Promise<Object>} Created health metric
   */
  async create(metricData) {
    const metric = new HealthMetric(metricData);
    return await metric.save();
  }

  /**
   * Find health metric by ID
   * @param {string} id - Health metric ID
   * @returns {Promise<Object|null>} Health metric object or null
   */
  async findById(id) {
    return await HealthMetric.findById(id).lean();
  }

  /**
   * Find health metrics by patient ID
   * @param {string} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of health metrics
   */
  async findByPatientId(patientId, options = {}) {
    const { limit = 50, offset = 0, sort = { timestamp: -1 }, metricType } = options;
    
    let query = { patient: patientId };
    if (metricType) {
      query.type = metricType;
    }
    
    return await HealthMetric.find(query)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find health metrics by type
   * @param {string} patientId - Patient ID
   * @param {string} type - Metric type (blood_pressure, heart_rate, etc.)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of health metrics
   */
  async findByType(patientId, type, options = {}) {
    const { limit = 50, offset = 0, sort = { timestamp: -1 } } = options;
    
    return await HealthMetric.find({ 
      patient: patientId, 
      type 
    })
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find health metrics within date range
   * @param {string} patientId - Patient ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of health metrics
   */
  async findByDateRange(patientId, startDate, endDate, options = {}) {
    const { limit = 100, offset = 0, sort = { timestamp: 1 }, metricType } = options;
    
    let query = {
      patient: patientId,
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    if (metricType) {
      query.type = metricType;
    }
    
    return await HealthMetric.find(query)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Get latest metrics for patient
   * @param {string} patientId - Patient ID
   * @param {Array} metricTypes - Array of metric types to get
   * @returns {Promise<Array>} Array of latest metrics by type
   */
  async getLatestMetrics(patientId, metricTypes = []) {
    const pipeline = [
      {
        $match: {
          patient: patientId,
          ...(metricTypes.length > 0 && { type: { $in: metricTypes } })
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$type",
          latestMetric: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: { newRoot: "$latestMetric" }
      }
    ];
    
    return await HealthMetric.aggregate(pipeline);
  }

  /**
   * Get metrics for today
   * @param {string} patientId - Patient ID
   * @returns {Promise<Array>} Array of today's metrics
   */
  async getTodayMetrics(patientId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await HealthMetric.find({
      patient: patientId,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .sort({ timestamp: -1 })
      .lean();
  }

  /**
   * Count health metrics
   * @param {Object} filters - Count filters
   * @returns {Promise<number>} Count of metrics
   */
  async count(filters = {}) {
    return await HealthMetric.countDocuments(filters);
  }

  /**
   * Update health metric by ID
   * @param {string} id - Health metric ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated health metric or null
   */
  async update(id, updateData) {
    return await HealthMetric.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  /**
   * Delete health metric by ID
   * @param {string} id - Health metric ID
   * @returns {Promise<Object|null>} Deleted health metric or null
   */
  async delete(id) {
    return await HealthMetric.findByIdAndDelete(id);
  }

  /**
   * Delete metrics older than specified date
   * @param {Date} beforeDate - Delete metrics before this date
   * @returns {Promise<Object>} Delete result
   */
  async deleteOldMetrics(beforeDate) {
    return await HealthMetric.deleteMany({
      timestamp: { $lt: beforeDate }
    });
  }

  /**
   * Get metric statistics for patient
   * @param {string} patientId - Patient ID
   * @param {string} type - Metric type
   * @param {Date} startDate - Start date for stats
   * @param {Date} endDate - End date for stats
   * @returns {Promise<Object>} Metric statistics
   */
  async getMetricStats(patientId, type, startDate, endDate) {
    const pipeline = [
      {
        $match: {
          patient: patientId,
          type,
          timestamp: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          avg: { $avg: "$value" },
          min: { $min: "$value" },
          max: { $max: "$value" },
          count: { $sum: 1 },
          latest: { $last: "$value" },
          oldest: { $first: "$value" }
        }
      }
    ];
    
    const result = await HealthMetric.aggregate(pipeline);
    return result[0] || null;
  }

  /**
   * Find metrics with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of health metrics
   */
  async findWithFilters(filters = {}, options = {}) {
    const { limit = 50, offset = 0, sort = { timestamp: -1 } } = options;
    
    return await HealthMetric.find(filters)
      .sort(sort)
      .limit(limit)
      .skip(offset)
      .lean();
  }
}

module.exports = new HealthMetricRepository();