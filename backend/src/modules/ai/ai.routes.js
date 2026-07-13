const express = require("express");
const router = express.Router();
const aiController = require("./ai.controller");
const { protect, authorize } = require("../../middleware/auth");
const {
  validateAnalyzeSymptoms,
  validateRiskScore,
  validateDietRecommendations,
  validateExerciseRecommendations,
  validatePatientId,
  validateRecordId,
} = require("../../validators/aiValidator");
const { cacheMiddleware } = require("../../middleware/cache");

router.use(protect);

router.post(
  "/analyze-symptoms",
  validateAnalyzeSymptoms,
  aiController.analyzeSymptoms,
);

router.get(
  "/health-insights/:patientId",
  authorize("patient", "doctor", "admin"),
  validatePatientId,
  cacheMiddleware(120),
  aiController.getHealthInsights,
);

router.post("/risk-score", validateRiskScore, aiController.calculateRiskScore);

router.post(
  "/diet-recommendations",
  validateDietRecommendations,
  aiController.getDietRecommendations,
);

router.post(
  "/exercise-recommendations",
  validateExerciseRecommendations,
  aiController.getExerciseRecommendations,
);

router.post(
  "/analyze-medical-record/:recordId",
  authorize("doctor", "admin"),
  validateRecordId,
  aiController.analyzeMedicalRecord,
);

module.exports = router;
