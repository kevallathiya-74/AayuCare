/**
 * AayuCare - Better Auth Middleware
 * Authentication and authorization using Better Auth
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("./errorHandler");

/**
 * Protect routes - requires valid Better Auth session
 */
exports.protect = async (req, res, next) => {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!session.user.isActive) {
      return next(new AppError("Account deactivated", 403));
    }

    // Attach user and session to request
    req.user = session.user;
    req.session = session.session;

    next();
  } catch (error) {
    return next(new AppError("Authentication failed", 401));
  }
};

/**
 * Restrict access to specific roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Access denied", 403));
    }
    next();
  };
};

/**
 * Alias for restrictTo (backwards compatibility)
 */
exports.authorize = exports.restrictTo;

/**
 * Hospital isolation - ensures data stays within hospital
 */
exports.hospitalIsolation = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  if (req.user.role === "super_admin") {
    return next();
  }

  if (!req.user.hospitalId) {
    return next(new AppError("Hospital association required", 403));
  }

  if (req.method === "GET") {
    req.query.hospitalId = req.user.hospitalId;
  } else {
    req.body.hospitalId = req.user.hospitalId;
  }

  next();
};

/**
 * Verify ownership - user can only access own resources
 */
exports.verifyOwnership = (field = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (["admin", "doctor", "super_admin"].includes(req.user.role)) {
      return next();
    }

    const resourceId = req.params[field] || req.body[field];
    if (resourceId && resourceId !== req.user.userId) {
      return next(new AppError("Access denied", 403));
    }

    next();
  };
};

/**
 * Optional auth - doesn't fail if no token
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (session && session.user && session.user.isActive) {
      req.user = session.user;
      req.session = session.session;
    }
  } catch (error) {
    // Continue without auth
  }
  next();
};
