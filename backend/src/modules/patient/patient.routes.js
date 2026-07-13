const express = require("express");
const patientController = require("./patient.controller");
const { protect, authorize } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody, validateParams } = require("../../middleware/validation");
const {
  updatePatientProfileSchema,
  addHealthMetricSchema,
  updateHealthMetricSchema,
  activityUpdateSchema,
  getMetricTypeParamsSchema,
} = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");

const router = express.Router();

router.use(protect);
router.use(attachHospitalId);

router.get(
  "/search",
  authorize("doctor", "admin"),
  cacheMiddleware(60),
  patientController.searchPatients,
);

router.get(
  "/:patientId/complete-history",
  authorize("patient", "doctor", "admin"),
  cacheMiddleware(30),
  patientController.getCompleteHistory,
);

router.get(
  "/:patientId/profile",
  authorize("patient", "doctor", "admin"),
  cacheMiddleware(120),
  patientController.getPatientProfile,
);

router.patch(
  "/:patientId/profile",
  authorize("patient", "admin"),
  validateBody(updatePatientProfileSchema),
  patientController.updatePatientProfile,
);

router.get(
  "/:patientId/health-metrics",
  authorize("patient", "doctor", "admin"),
  patientController.getHealthMetrics,
);

router.get(
  "/:patientId/health-metrics/latest/:type",
  authorize("patient", "doctor", "admin"),
  validateParams(getMetricTypeParamsSchema),
  patientController.getLatestHealthMetric,
);

router.post(
  "/:patientId/health-metrics",
  authorize("patient", "doctor", "admin"),
  validateBody(addHealthMetricSchema),
  patientController.addHealthMetric,
);

router.put(
  "/:patientId/health-metrics/:metricId",
  authorize("patient", "admin", "doctor"),
  validateBody(updateHealthMetricSchema),
  patientController.updateHealthMetric,
);

router.delete(
  "/:patientId/health-metrics/:metricId",
  authorize("patient", "admin"),
  patientController.deleteHealthMetric,
);

router.get(
  "/:patientId/activity",
  authorize("patient", "doctor", "admin"),
  patientController.getActivityData,
);

router.post(
  "/:patientId/activity",
  authorize("patient", "admin"),
  validateBody(activityUpdateSchema),
  patientController.updateActivityData,
);

module.exports = router;
