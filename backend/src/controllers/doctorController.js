const doctorService = require('../services/doctorService');

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public
 */
exports.getDoctors = async (req, res, next) => {
    try {
        const result = await doctorService.getDoctors(req.query);

        res.status(200).json({
            status: 'success',
            data: result
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
            status: 'success',
            data: { doctor }
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
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        next(error);
    }
};
