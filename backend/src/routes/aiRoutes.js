/**
 * AI Routes
 * Routes for AI-powered health analysis features
 */

const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { protect } = require("../middleware/auth");
const {
  validateAnalyzeSymptoms,
  validateRiskScore,
  validateDietRecommendations,
  validateExerciseRecommendations,
  validatePatientId,
} = require("../validators/aiValidator");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");

// All routes require authentication
router.use(protect);

// @route   POST /api/ai/analyze-symptoms
// @desc    Analyze symptoms and provide AI insights
// @access  Private
router.post(
  "/analyze-symptoms",
  validateAnalyzeSymptoms,
  aiController.analyzeSymptoms,
  invalidateCache("cache:ai:*")
);

// @route   GET /api/ai/health-insights/:patientId
// @desc    Get comprehensive health insights for a patient
// @access  Private (Patient own data or Doctor/Admin access)
router.get(
  "/health-insights/:patientId",
  validatePatientId,
  cacheMiddleware(120),
  aiController.getHealthInsights
);

// @route   POST /api/ai/risk-score
// @desc    Calculate health risk score
// @access  Private
router.post(
  "/risk-score",
  validateRiskScore,
  aiController.calculateRiskScore,
  invalidateCache("cache:ai:*")
);

// @route   POST /api/ai/diet-recommendations
// @desc    Get personalized diet recommendations
// @access  Private
router.post(
  "/diet-recommendations",
  validateDietRecommendations,
  aiController.getDietRecommendations,
  invalidateCache("cache:ai:*")
);

// @route   POST /api/ai/exercise-recommendations
// @desc    Get personalized exercise recommendations
// @access  Private
router.post(
  "/exercise-recommendations",
  validateExerciseRecommendations,
  aiController.getExerciseRecommendations,
  invalidateCache("cache:ai:*")
);

// @route   POST /api/ai/analyze-medical-record
// @desc    Analyze medical record and update AI insights
// @access  Private (Doctor/Admin only)
router.post(
  "/analyze-medical-record/:recordId",
  aiController.analyzeMedicalRecord
);

module.exports = router;
