/**
 * AayuCare - Better Auth Middleware
 * Authentication and authorization using Better Auth
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("./errorHandler");
const { query } = require("../config/postgres");
const logger = require("../utils/logger");
const crypto = require("crypto");

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
    } catch {
      // Cookie session failed, will try Bearer token
    }

    // If no cookie session, try Bearer token (for mobile clients)
    if (!session || !session.user) {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        const hashedToken = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");

        // Query session from PostgreSQL (Better Auth stores sessions in PostgreSQL)
        try {
          const sessionResult = await query(
            `SELECT token_hash as token, user_id as "userId", expires_at as "expiresAt"
             FROM session
             WHERE (token_hash = $1 OR token_hash = $2)
               AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [token, hashedToken],
          );

          if (sessionResult.rows.length > 0) {
            const sessionDoc = sessionResult.rows[0];

            // Get user from PostgreSQL users table
            const userResult = await query(
              `SELECT id, user_id as "userId", name, email, phone, role, 
                      hospital_id as "hospitalId", hospital_name as "hospitalName",
                      is_active as "isActive", email_verified as "emailVerified"
               FROM users
               WHERE id = $1`,
              [sessionDoc.userId],
            );

            if (userResult.rows.length > 0) {
              const userDoc = userResult.rows[0];
              session = {
                user: userDoc,
                session: sessionDoc,
              };

              if (process.env.NODE_ENV === "development") {
                logger.debug(
                  `[Auth] Token validated successfully for user: ${userDoc.email}`,
                );
              }
            }
          } else {
            logger.warn(
              "[Auth] Token not found or expired:",
              token.substring(0, 10) + "...",
            );
          }
        } catch (tokenError) {
          logger.error("[Auth] Token verification failed:", tokenError.message);
        }
      }
    }

    // Check if we have a valid session
    if (!session || !session.user) {
      logger.warn("[Auth] No valid session found");
      return next(new AppError("Authentication required", 401));
    }

    if (!session.user.isActive) {
      logger.warn("[Auth] Account deactivated for user:", session.user.email);
      return next(new AppError("Account deactivated", 403));
    }

    Object.assign(req, { user: session.user, session: session.session });

    next();
  } catch (error) {
    logger.error("[Auth] Protection error:", error.message);
    return next(new AppError("Authentication failed", 401));
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn("[Auth] Authorization failed: Authentication required");
      return next(new AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      const userEmail = req.user.email || "unknown";
      const userId = req.user.id || req.user.userId || "unknown";
      const role = req.user.role || "unknown";
      const hospitalId = req.user.hospitalId || "none";
      const route = req.originalUrl || req.url || "unknown";

      logger.warn(
        `[Auth] Access Denied Details:\n` +
          `  - User ID: ${userId} (${userEmail})\n` +
          `  - Current Role: ${role}\n` +
          `  - Hospital ID: ${hospitalId}\n` +
          `  - Requested Route: ${route}\n` +
          `  - Required Roles: ${roles.join(", ")}\n` +
          `  - Middleware Name: restrictTo (authorize)\n` +
          `  - Denied Reason: Current role '${role}' is not allowed to access this route.`,
      );

      return next(
        new AppError(
          `Access denied: role '${role}' cannot access this endpoint.`,
          403,
        ),
      );
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
 * Optional auth - doesn't fail if no token, supports both cookie and Bearer token
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const auth = getAuth();

    // Try cookie-based session first
    let session = null;
    try {
      session = await auth.api.getSession({ headers: req.headers });
    } catch {
      // Ignore cookie errors
    }

    // Fallback: try Bearer token (mobile clients)
    if (!session?.user) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const hashedToken = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");
        try {
          const sessionResult = await query(
            `SELECT token_hash as token, user_id as "userId", expires_at as "expiresAt"
             FROM session
             WHERE (token_hash = $1 OR token_hash = $2) AND expires_at > NOW()
             LIMIT 1`,
            [token, hashedToken],
          );
          if (sessionResult.rows.length > 0) {
            const userResult = await query(
              `SELECT id, user_id as "userId", name, email, phone, role,
                      hospital_id as "hospitalId", hospital_name as "hospitalName",
                      is_active as "isActive", email_verified as "emailVerified"
               FROM users WHERE id = $1`,
              [sessionResult.rows[0].userId],
            );
            if (userResult.rows.length > 0 && userResult.rows[0].isActive) {
              session = {
                user: userResult.rows[0],
                session: sessionResult.rows[0],
              };
            }
          }
        } catch {
          // Ignore token errors
        }
      }
    }

    if (session?.user?.isActive) {
      Object.assign(req, { user: session.user, session: session.session });
    }
  } catch {
    // Always continue - optional auth never blocks
  }
  next();
};
