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

// Protected routes
router.use(protect);

router.get("/me", authController.getMe);
router.put("/profile", authController.updateProfile);
router.put("/change-password", authController.changePassword);

module.exports = router;
