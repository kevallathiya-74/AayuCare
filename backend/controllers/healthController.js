const HealthRecord = require('../models/HealthRecord');

// @desc    Create health record
// @route   POST /api/health
// @access  Private
exports.createHealthRecord = async (req, res) => {
  try {
    const healthRecord = await HealthRecord.create({
      userId: req.user.id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      message: 'Health record created successfully',
      data: healthRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating health record',
      error: error.message
    });
  }
};

// @desc    Get all health records for user
// @route   GET /api/health
// @access  Private
exports.getHealthRecords = async (req, res) => {
  try {
    const healthRecords = await HealthRecord.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: healthRecords.length,
      data: healthRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching health records',
      error: error.message
    });
  }
};

// @desc    Get single health record
// @route   GET /api/health/:id
// @access  Private
exports.getHealthRecord = async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    // Make sure user owns health record
    if (healthRecord.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this health record'
      });
    }

    res.status(200).json({
      success: true,
      data: healthRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching health record',
      error: error.message
    });
  }
};

// @desc    Update health record
// @route   PUT /api/health/:id
// @access  Private
exports.updateHealthRecord = async (req, res) => {
  try {
    let healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    // Make sure user owns health record
    if (healthRecord.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this health record'
      });
    }

    healthRecord = await HealthRecord.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Health record updated successfully',
      data: healthRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating health record',
      error: error.message
    });
  }
};

// @desc    Delete health record
// @route   DELETE /api/health/:id
// @access  Private
exports.deleteHealthRecord = async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    // Make sure user owns health record
    if (healthRecord.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this health record'
      });
    }

    await healthRecord.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Health record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting health record',
      error: error.message
    });
  }
};

// @desc    Add vital signs
// @route   POST /api/health/vitals
// @access  Private
exports.addVitalSigns = async (req, res) => {
  try {
    const { vitalSigns } = req.body;

    const healthRecord = await HealthRecord.create({
      userId: req.user.id,
      vitalSigns
    });

    res.status(201).json({
      success: true,
      message: 'Vital signs added successfully',
      data: healthRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding vital signs',
      error: error.message
    });
  }
};
