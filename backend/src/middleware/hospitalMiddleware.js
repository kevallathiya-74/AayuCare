/**
 * Hospital Middleware
 * Enforces multi-tenancy data isolation
 * Ensures users can only access data from their hospital
 */

const { AppError } = require("./errorHandler");
const userRepository = require("../modules/auth/user.repository");

/**
 * Attach hospitalId to request based on authenticated user
 * @middleware
 */
exports.attachHospitalId = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Attach user's hospitalId to request for easy access
    req.hospitalId = req.user.hospitalId;
    req.hospitalName = req.user.hospitalName;

    next();
  } catch (error) {
    next(error);
  }
};


/**
 * Restrict access to users from the same hospital
 * For operations like viewing other users' profiles
 * @middleware
 */
exports.restrictToSameHospital = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return next();
    }

    // Super admins can access all users
    if (req.user.role === "super_admin") {
      return next();
    }

    // Get target user
    const targetUser = await userRepository.findById(userId);

    if (!targetUser) {
      return next(new AppError("User not found", 404));
    }

    // Verify same hospital — handle both camelCase (normalized) and snake_case (raw DB column)
    const targetHospitalId = targetUser.hospitalId || targetUser.hospital_id;
    if (targetHospitalId !== req.user.hospitalId) {
      return next(
        new AppError("Cannot access users from other hospitals", 403),
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Add hospital filter to Database query
 * Helper function for use in services/controllers
 */
exports.addHospitalFilter = (query, user, options = {}) => {
  const { allowSuperAdmin = true } = options;

  // Super admins can query all data
  if (allowSuperAdmin && user.role === "super_admin") {
    return query;
  }

  // Add hospital filter
  if (user.hospitalId) {
    query.hospitalId = user.hospitalId;
  }

  return query;
};

module.exports = exports;
