const express = require("express");
const router = express.Router();
const aiController = require("./ai.controller");
const { protect, authorize } = require("../../middleware/auth");
const { validateBody, validateParams } = require("../../middleware/validation");
const {
  analyzeSymptomsSchema,
  riskScoreSchema,
  dietRecommendationsSchema,
  exerciseRecommendationsSchema,
  aiPatientIdParamsSchema,
  aiRecordIdParamsSchema,
} = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");

router.use(protect);

router.post(
  "/analyze-symptoms",
  validateBody(analyzeSymptomsSchema),
  aiController.analyzeSymptoms,
);

router.get(
  "/health-insights/:patientId",
  authorize("patient", "doctor", "admin"),
  validateParams(aiPatientIdParamsSchema),
  cacheMiddleware(120),
  aiController.getHealthInsights,
);

router.post("/risk-score", validateBody(riskScoreSchema), aiController.calculateRiskScore);

router.post(
  "/diet-recommendations",
  validateBody(dietRecommendationsSchema),
  aiController.getDietRecommendations,
);

router.post(
  "/exercise-recommendations",
  validateBody(exerciseRecommendationsSchema),
  aiController.getExerciseRecommendations,
);

router.post(
  "/analyze-medical-record/:recordId",
  authorize("doctor", "admin"),
  validateParams(aiRecordIdParamsSchema),
  aiController.analyzeMedicalRecord,
);

module.exports = router;
