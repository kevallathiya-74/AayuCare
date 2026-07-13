const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const adminController = require("./admin.controller");
const { protect, authorize } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody } = require("../../middleware/validation");
const {
  registerSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  bulkUpdateUsersSchema,
  updateUserStatusSchema,
} = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");

const criticalOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many permanent delete attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);
router.use(authorize("admin", "super_admin"));
router.use(attachHospitalId);

router.get(
  "/dashboard/stats",
  cacheMiddleware(60, (req) => {
    const hospitalId = req.hospitalId || "all";
    const role = req.user?.role || "admin";
    return `cache:admin:dashboard:${hospitalId}:${role}`;
  }),
  adminController.getDashboardStats,
);
router.get(
  "/activities",
  cacheMiddleware(15),
  adminController.getRecentActivities,
);

router.get("/users", cacheMiddleware(60), adminController.getUsers);
router.post("/users", validateBody(registerSchema), adminController.createUser);
router.put(
  "/users/:userId",
  validateBody(updateProfileSchema),
  adminController.updateUserProfile,
);
router.delete("/users/:userId", adminController.deleteUser);
router.delete(
  "/users/:userId/permanent",
  authorize("super_admin"),
  criticalOperationLimiter,
  adminController.permanentDeleteUser,
);
router.patch(
  "/users/:userId/status",
  validateBody(updateUserStatusSchema),
  adminController.updateUserStatus,
);
router.patch(
  "/users/:userId/role",
  validateBody(updateUserRoleSchema),
  adminController.updateUserRole,
);

router.post(
  "/users/bulk",
  validateBody(bulkUpdateUsersSchema),
  adminController.bulkUpdateUsers,
);
router.get(
  "/system/health",
  cacheMiddleware(10),
  adminController.getSystemHealth,
);
router.get(
  "/system/metrics",
  cacheMiddleware(30),
  adminController.getSystemMetrics,
);

router.get(
  "/medical-records",
  cacheMiddleware(60),
  adminController.getMedicalRecordsOverview,
);
router.get("/audit-logs", cacheMiddleware(30), adminController.getAuditLogs);
router.get(
  "/notifications/manage",
  cacheMiddleware(30),
  adminController.getNotificationsManagement,
);

router.get(
  "/security",
  cacheMiddleware(60),
  adminController.getSecuritySettings,
);
router.post(
  "/security/change-password",
  validateBody(changePasswordSchema),
  adminController.changePassword,
);
router.post("/security/logout-all", adminController.logoutAllDevices);

module.exports = router;
