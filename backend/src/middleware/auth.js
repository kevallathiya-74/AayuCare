/**
 * AayuCare - Better Auth Middleware
 * Authentication and authorization using Better Auth
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("./errorHandler");
const mongoose = require("mongoose");

/**
 * Protect routes - requires valid Better Auth session
 * Supports both cookie-based (web) and token-based (mobile) authentication
 */
exports.protect = async (req, res, next) => {
  try {
    const auth = getAuth();
    let session = null;

    // Try cookie-based session first (for web clients)
    try {
      session = await auth.api.getSession({
        headers: req.headers,
      });
    } catch (cookieError) {
      // Cookie session failed, will try Bearer token
    }

    // If no cookie session, try Bearer token (for mobile clients)
    if (!session || !session.user) {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Query session directly from MongoDB
        try {
          const db = mongoose.connection.getClient().db("test");
          const sessionDoc = await db.collection("session").findOne({ token });

          if (sessionDoc && sessionDoc.expiresAt > new Date()) {
            // Session is valid, get user
            const userDoc = await db.collection("user").findOne({
              id: sessionDoc.userId,
            });

            if (userDoc) {
              session = {
                user: userDoc,
                session: sessionDoc,
              };
            }
          }
        } catch (tokenError) {
          console.error(
            "[Auth] Token verification failed:",
            tokenError.message
          );
        }
      }
    }

    // Check if we have a valid session
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
    console.error("[Auth] Protection error:", error.message);
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
