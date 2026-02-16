/**
 * Admin Routes
 * All routes require authentication and admin role
 */

const express = require("express");
const router = express.Router();
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
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");
const { validateBody } = require("../middleware/validation");
const {
  registerSchema,
  updateProfileSchema,
} = require("../validators/schemas");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");

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
  createUser,
  invalidateCache("cache:user:*")
);
router.put(
  "/users/:userId",
  validateBody(updateProfileSchema),
  updateUserProfile,
  invalidateCache("cache:user:*")
);
router.delete("/users/:userId", deleteUser, invalidateCache("cache:user:*"));
router.patch(
  "/users/:userId/status",
  updateUserStatus,
  invalidateCache("cache:user:*")
);
router.patch(
  "/users/:userId/role",
  updateUserRole,
  invalidateCache("cache:user:*")
);
router.post("/users/bulk", bulkUpdateUsers, invalidateCache("cache:user:*"));

// System routes
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
  validateBody(updateProfileSchema),
  changePassword,
  invalidateCache("cache:session:*")
);
router.post(
  "/security/logout-all",
  logoutAllDevices,
  invalidateCache("cache:session:*")
);

module.exports = router;
