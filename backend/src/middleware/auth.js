/**
 * AayuCare - Better Auth Middleware
 * Authentication and authorization using Better Auth
 */

const { getAuth } = require("../lib/auth");
const { AppError } = require("./errorHandler");
const { query } = require("../config/postgres");
const logger = require("../utils/logger");
const crypto = require("crypto");

const resolveSession = async (req) => {
  const auth = getAuth();
  let session = null;
  try {
    session = await auth.api.getSession({ headers: req.headers });
  } catch {}

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
          `SELECT token_hash as token, user_id as "userId", expires_at as "expiresAt" FROM session WHERE (token_hash = $1 OR token_hash = $2) AND expires_at > NOW() LIMIT 1`,
          [token, hashedToken],
        );
        if (sessionResult.rows.length > 0) {
          const userResult = await query(
            `SELECT id, user_id as "userId", name, email, phone, role, hospital_id as "hospitalId", hospital_name as "hospitalName", is_active as "isActive", email_verified as "emailVerified" FROM users WHERE id = $1`,
            [sessionResult.rows[0].userId],
          );
          if (userResult.rows.length > 0 && userResult.rows[0].isActive) {
            session = {
              user: userResult.rows[0],
              session: sessionResult.rows[0],
            };
          }
        }
      } catch (e) {
        logger.error("[Auth] Token verification failed:", e.message);
      }
    }
  }
  return session;
};

exports.protect = async (req, res, next) => {
  try {
    const session = await resolveSession(req);
    if (!session?.user) {
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

exports.authorize = exports.restrictTo;

exports.optionalAuth = async (req, res, next) => {
  try {
    const session = await resolveSession(req);
    if (session?.user?.isActive) {
      Object.assign(req, { user: session.user, session: session.session });
    }
  } catch {}
  next();
};
