/**
 * AayuCare - Auth Routes
 * Custom endpoints extending Better Auth
 * Better Auth handles: /api/auth/sign-in/email, /api/auth/sign-up/email, /api/auth/sign-out
 * Custom endpoints: /api/user/me, /api/user/profile, /api/user/change-password
 */

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validateBody } = require("../middleware/validation");
const {
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("../validators/schemas");
const { invalidateCache } = require("../middleware/cache");

// Rate limiter for sensitive public endpoints (prevent user enumeration)
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for password changes
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 password change attempts per hour
  message: 'Too many password change attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strictly public: email-by-userid is rate-limited; used only for auth flow
router.post("/email-by-userid", sensitiveAuthLimiter, authController.getEmailByUserId);

// Protected routes — must be authenticated
router.use(protect);

// These require authentication as they return sensitive user/session data
router.post("/profile-by-email", sensitiveAuthLimiter, authController.getProfileByEmail);
router.post("/current-session", sensitiveAuthLimiter, authController.getCurrentSession);

router.get("/me", authController.getMe);
router.put(
  "/profile",
  validateBody(updateProfileSchema),
  authController.updateProfile
  // Cache invalidation now handled inside controller
);
router.put(
  "/change-password",
  passwordChangeLimiter,
  validateBody(changePasswordSchema),
  authController.changePassword
  // Cache invalidation now handled inside controller
);

module.exports = router;
