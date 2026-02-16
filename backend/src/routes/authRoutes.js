/**
 * AayuCare - Auth Routes
 * Custom endpoints extending Better Auth
 * Better Auth handles: /api/auth/sign-in/email, /api/auth/sign-up/email, /api/auth/sign-out
 * Custom endpoints: /api/user/me, /api/user/profile, /api/user/change-password
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validateBody } = require("../middleware/validation");
const { loginSchema, updateProfileSchema } = require("../validators/schemas");
const { invalidateCache } = require("../middleware/cache");

// Public routes
router.post("/email-by-userid", authController.getEmailByUserId);
router.post("/profile-by-email", authController.getProfileByEmail);
router.post("/current-session", authController.getCurrentSession);

// Protected routes
router.use(protect);

router.get("/me", authController.getMe);
router.put(
  "/profile",
  validateBody(updateProfileSchema),
  authController.updateProfile,
  invalidateCache("cache:user:*")
);
router.put(
  "/change-password",
  authController.changePassword,
  invalidateCache("cache:session:*")
);

module.exports = router;
