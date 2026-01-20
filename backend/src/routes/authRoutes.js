const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect, restrictTo } = require("../middleware/betterAuth");
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
} = require("../validators/authValidator");

// Public routes
router.post("/register", validateRegister, authController.register);
router.post("/login", validateLogin, authController.login);
router.post("/refresh", authController.refreshToken);

// Protected routes
router.use(protect); // All routes after this require authentication

router.post("/logout", authController.logout);
router.get("/me", authController.getMe);
router.put("/profile", validateUpdateProfile, authController.updateProfile);

module.exports = router;
