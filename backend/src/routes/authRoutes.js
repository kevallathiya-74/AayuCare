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

// Public routes (with rate limiting for security)
router.post("/email-by-userid", sensitiveAuthLimiter, authController.getEmailByUserId);
router.post("/profile-by-email", sensitiveAuthLimiter, authController.getProfileByEmail);
router.post("/current-session", authController.getCurrentSession);

// Protected routes
router.use(protect);

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
