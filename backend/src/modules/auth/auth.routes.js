const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("./auth.controller");
const { protect } = require("../../middleware/auth");
const { validateBody } = require("../../middleware/validation");
const {
  updateProfileSchema,
  changePasswordSchema,
} = require("../../validators/schemas");

const router = express.Router();

const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password change attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  "/email-by-userid",
  sensitiveAuthLimiter,
  authController.getEmailByUserId,
);
router.post(
  "/profile-by-email",
  sensitiveAuthLimiter,
  authController.getProfileByEmail,
);
router.post(
  "/session-token",
  sensitiveAuthLimiter,
  authController.getSessionTokenByCredentials,
);

router.use(protect);

router.post(
  "/current-session",
  sensitiveAuthLimiter,
  authController.getCurrentSession,
);
router.get("/me", authController.getMe);
router.put(
  "/profile",
  validateBody(updateProfileSchema),
  authController.updateProfile,
);
router.put(
  "/change-password",
  passwordChangeLimiter,
  validateBody(changePasswordSchema),
  authController.changePassword,
);
router.put("/push-token", authController.updatePushToken);

module.exports = router;
