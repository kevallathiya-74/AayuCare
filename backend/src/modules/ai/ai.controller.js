const legacyAiController = require("../../controllers/aiController");
const aiService = require("./ai.service");

exports.analyzeSymptoms = (req, res, next) => legacyAiController.analyzeSymptoms(req, res, next);
exports.getHealthInsights = (req, res, next) => legacyAiController.getHealthInsights(req, res, next);
exports.calculateRiskScore = (req, res, next) => legacyAiController.calculateRiskScore(req, res, next);
exports.getDietRecommendations = (req, res, next) => legacyAiController.getDietRecommendations(req, res, next);
exports.getExerciseRecommendations = (req, res, next) => legacyAiController.getExerciseRecommendations(req, res, next);
exports.analyzeMedicalRecord = (req, res, next) => legacyAiController.analyzeMedicalRecord(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = aiService;