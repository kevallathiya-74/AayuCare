/**
 * Admin Routes
 * All routes require authentication and admin role
 */

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const {
  getDashboardStats,
  getRecentActivities,
  getUsers,
  updateUserStatus,
  updateUserRole,
  bulkUpdateUsers,
  getSystemHealth,
  getSecuritySettings,
  changePassword,
  logoutAllDevices,
  getMedicalRecordsOverview,
  getSystemMetrics,
  getNotificationsManagement,
  createUser,
  updateUserProfile,
  deleteUser,
  permanentDeleteUser,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");
const { validateBody } = require("../middleware/validation");
const {
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("../validators/schemas");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");

// Rate limiter for critical operations (permanent delete)
const criticalOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 permanent deletions per hour
  message: 'Too many permanent delete attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize("admin", "super_admin"));
router.use(attachHospitalId);

// Dashboard routes
router.get("/dashboard/stats", cacheMiddleware(30), getDashboardStats);
router.get("/activities", cacheMiddleware(15), getRecentActivities);

// User management routes
router.get("/users", cacheMiddleware(60), getUsers);
router.post(
  "/users",
  validateBody(registerSchema),
  createUser
  // Cache invalidation now handled inside controller
);
router.put(
  "/users/:userId",
  validateBody(updateProfileSchema),
  updateUserProfile
  // Cache invalidation now handled inside controller
);
router.delete("/users/:userId", deleteUser
  // Cache invalidation now handled inside controller
);
// PERMANENT DELETE - Use with extreme caution (violates healthcare compliance)
// Rate limited to 5 deletions per hour for security
router.delete(
  "/users/:userId/permanent", 
  criticalOperationLimiter,
  permanentDeleteUser
  // Cache invalidation now handled inside controller  
);
router.patch(
  "/users/:userId/status",
  updateUserStatus
  // Cache invalidation now handled inside controller
);
router.patch(
  "/users/:userId/role",
  updateUserRole
  // Cache invalidation now handled inside controller
);

router.post(
  "/users/bulk",
  bulkUpdateUsers
  // Cache invalidation now handled inside controller
);
router.get("/system/health", cacheMiddleware(10), getSystemHealth);
router.get("/system/metrics", cacheMiddleware(30), getSystemMetrics);

// Medical records routes
router.get("/medical-records", cacheMiddleware(60), getMedicalRecordsOverview);

// Notifications routes
router.get(
  "/notifications/manage",
  cacheMiddleware(30),
  getNotificationsManagement
);

// Security routes
router.get("/security", cacheMiddleware(60), getSecuritySettings);
router.post(
  "/security/change-password",
  validateBody(changePasswordSchema),
  changePassword
  // Cache invalidation now handled inside controller
);
router.post(
  "/security/logout-all",
  logoutAllDevices
  // Cache invalidation now handled inside controller
);

module.exports = router;
