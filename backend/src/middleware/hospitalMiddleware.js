/**
 * Hospital Middleware
 * Enforces multi-tenancy data isolation
 * Ensures users can only access data from their hospital
 */

const { AppError } = require('./errorHandler');
const User = require('../models/User');

/**
 * Attach hospitalId to request based on authenticated user
 * @middleware
 */
exports.attachHospitalId = async (req, res, next) => {
    try {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
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
 * Enforce hospital-based data isolation
 * Automatically filters queries by hospitalId
 * @middleware
 */
exports.enforceHospitalScope = (options = {}) => {
    return async (req, res, next) => {
        try {
            const { allowSuperAdmin = true, modelName } = options;

            // Super admins can access all data
            if (allowSuperAdmin && req.user.role === 'super_admin') {
                return next();
            }

            // Ensure user has hospitalId
            if (!req.user.hospitalId) {
                return next(new AppError('Hospital association required', 403));
            }

            // For GET/query operations, add hospitalId to query
            if (req.method === 'GET') {
                req.query.hospitalId = req.user.hospitalId;
            }

            // For POST/PUT/PATCH operations, enforce hospitalId in body
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                if (req.body) {
                    // Don't allow user to set different hospitalId
                    if (req.body.hospitalId && req.body.hospitalId !== req.user.hospitalId) {
                        return next(new AppError('Cannot access data from other hospitals', 403));
                    }
                    // Set hospitalId from authenticated user
                    req.body.hospitalId = req.user.hospitalId;
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Validate resource belongs to user's hospital
 * Use this for specific resource access (e.g., before updating/deleting)
 * @middleware
 */
exports.validateHospitalAccess = (getResourceHospitalId) => {
    return async (req, res, next) => {
        try {
            // Super admins bypass validation
            if (req.user.role === 'super_admin') {
                return next();
            }

            // Get hospitalId from resource (passed as function)
            const resourceHospitalId = await getResourceHospitalId(req);

            if (!resourceHospitalId) {
                return next(new AppError('Resource hospital information not found', 404));
            }

            // Verify resource belongs to user's hospital
            if (resourceHospitalId !== req.user.hospitalId) {
                return next(new AppError('Cannot access resources from other hospitals', 403));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
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
        if (req.user.role === 'super_admin') {
            return next();
        }

        // Get target user
        const targetUser = await User.findById(userId).select('hospitalId');
        
        if (!targetUser) {
            return next(new AppError('User not found', 404));
        }

        // Verify same hospital
        if (targetUser.hospitalId !== req.user.hospitalId) {
            return next(new AppError('Cannot access users from other hospitals', 403));
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Add hospital filter to MongoDB query
 * Helper function for use in services/controllers
 */
exports.addHospitalFilter = (query, user, options = {}) => {
    const { allowSuperAdmin = true } = options;

    // Super admins can query all data
    if (allowSuperAdmin && user.role === 'super_admin') {
        return query;
    }

    // Add hospital filter
    if (user.hospitalId) {
        query.hospitalId = user.hospitalId;
    }

    return query;
};

module.exports = exports;
