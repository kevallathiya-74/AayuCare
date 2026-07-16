/**
 * AayuCare - Auth Controller
 * Custom endpoints extending Better Auth
 * Fully refactored to use PostgreSQL repository pattern
 * Architecture: Controller -> Service -> Repository -> Database
 */

const authService = require("./auth.service");
const logger = require("../../utils/logger");
const { writeAuditLog, AUDIT_ACTIONS } = require("../../utils/audit");

/**
 * @desc    Get user email by userId (for Better Auth login)
 * @route   POST /api/user/email-by-userid
 * @access  Public
 */
exports.getEmailByUserId = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const result = await authService.getEmailByUserId(userId);
    return res.status(200).json({ success: true, message: "User email retrieved successfully", data: result });
  } catch (error) {
    logger.error("Error in getEmailByUserId", {
      error: error.message,
      stack: error.stack,
      userId: req.body.userId,
    });
    next(error);
  }
};

/**
 * @desc    Get current session token (for mobile apps after Better Auth login)
 * @route   POST /api/user/current-session
 * @access  Private (requires authentication)
 *
 * IMPORTANT (added 2026-06-30):
 *   The `token` value returned below is the Better Auth session identifier,
 *   which is stored in PostgreSQL as `session.token_hash` (see
 *   `lib/auth.js:158` — Better Auth maps its `token` field to the
 *   `token_hash` column). It is NOT a Bearer credential that can be sent
 *   as `Authorization: Bearer <value>` to authenticate subsequent
 *   requests — Bearer tokens are never persisted server-side, by design.
 *
 *   The endpoint is preserved for backwards compatibility with any client
 *   that needs to identify the active session, but new code should not
 *   treat this value as a Bearer token. Use the `token` returned by
 *   `/api/user/session-token` (which calls Better Auth's `signInEmail`)
 *   as the Bearer credential instead.
 */
exports.getCurrentSession = async (req, res, next) => {
  try {
    // Use authenticated user's UUID — never trust req.body.userId
    const userId = req.user.id;
    const result = await authService.getCurrentSession(userId);

    // The returned `token` is `session.token_hash` — see JSDoc above.
    // Logged at debug level so future developers see a hint in their terminal
    // when this endpoint is exercised. No change to the response payload.
    logger.debug(
      "[auth.getCurrentSession] returning session identifier (not a Bearer token)",
    );

    return res.status(200).json({ success: true, message: "Session token retrieved successfully", data: result });
  } catch (error) {
    logger.error("Error in getCurrentSession", {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * @desc    Get current session token after login (mobile bearer token exchange)
 * @route   POST /api/user/session-token
 * @access  Public (rate-limited, credential-verified)
 */
exports.getSessionTokenByCredentials = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const requestInfo = {
      ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "",
    };
    const result = await authService.getSessionTokenByCredentials(
      email,
      password,
      requestInfo,
    );
    return res.status(200).json({ success: true, message: "Session token retrieved successfully", data: result });
  } catch (error) {
    logger.error("Error in getSessionTokenByCredentials", {
      error: error.message,
      stack: error.stack,
      email: req.body?.email,
    });
    next(error);
  }
};

/**
 * @desc    Get user profile by email (for post-login data fetch)
 * @route   POST /api/user/profile-by-email
 * @access  Public (called after Better Auth login)
 */
exports.getProfileByEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.getProfileByEmail(email);
    return res.status(200).json({ success: true, message: "User profile retrieved successfully", data: result });
  } catch (error) {
    logger.error("Error in getProfileByEmail", {
      error: error.message,
      stack: error.stack,
      email: req.body.email,
    });
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user, req.session);
    return res.status(200).json({ success: true, message: "Current user retrieved successfully", data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile - Uses PostgreSQL
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.PROFILE_UPDATE,
      entityType: "user",
      entityId: req.user.id,
      newValues: req.body,
      req,
    });

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Profile updated successfully",
      data: { user: result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password - Uses PostgreSQL
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);

    await writeAuditLog({
      userId: req.user.id,
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      entityType: "user",
      entityId: req.user.id,
      req,
    });

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Password changed successfully",
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Expo push token
 * @route   PUT /api/user/push-token
 * @access  Private
 */
exports.updatePushToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    await authService.updatePushToken(req.user.id, token);
    return res.status(200).json({
      success: true,
      status: "success",
      message: "Push token updated successfully",
      data: {}
    });
  } catch (error) {
    logger.error("Error updating push token", {
      error: error.message,
      userId: req.user.id,
    });
    next(error);
  }
};
