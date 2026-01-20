const { AppError } = require("./errorHandler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

/**
 * Better Auth Middleware
 * Protects routes and manages role-based access control
 */

/**
 * Protect routes - requires authentication
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError(
          "You are not logged in. Please log in to access this resource",
          401
        )
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get full user from database with all fields
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.isActive) {
      return next(new AppError("Your account has been deactivated", 403));
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return next(
      new AppError("Authentication failed. Please log in again", 401)
    );
  }
};

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

/**
 * Hospital isolation middleware
 * Ensures users can only access data from their own hospital
 */
exports.hospitalIsolation = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401));
  }

  // Super admin can access all hospitals
  if (req.user.role === "super_admin") {
    return next();
  }

  // Ensure user has hospitalId
  if (!req.user.hospitalId) {
    return next(new AppError("Hospital association required", 403));
  }

  // Attach hospitalId to query/body for filtering
  if (req.method === "GET") {
    req.query.hospitalId = req.user.hospitalId;
  } else {
    req.body.hospitalId = req.user.hospitalId;
  }

  next();
};

/**
 * Verify user owns the resource or is admin/doctor
 */
exports.verifyOwnership = (resourceField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    // Admin and doctors can access any resource in their hospital
    if (["admin", "doctor", "super_admin"].includes(req.user.role)) {
      return next();
    }

    // Patients can only access their own resources
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    if (resourceUserId && resourceUserId !== req.user.userId) {
      return next(new AppError("You can only access your own resources", 403));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Silently continue without authentication
  }
  next();
};

// Alias for backwards compatibility
exports.authorize = exports.restrictTo;
