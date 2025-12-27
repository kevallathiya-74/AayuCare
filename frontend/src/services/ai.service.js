/**
 * AI Service
 * Integrates with backend AI APIs for health insights
 * Provides symptom analysis, risk assessment, and health recommendations
 */

import api from "./api";
import { logError } from "../utils/errorHandler";

class AIService {
  /**
   * Analyze symptoms and provide AI insights
   * @param {Object} data - { symptoms: string[], duration: string, severity: string }
   * @returns {Promise<Object>} - AI analysis results
   */
  async analyzeSymptoms(data) {
    try {
      if (!data.symptoms || data.symptoms.length === 0) {
        throw new Error("Please provide at least one symptom");
      }
      const response = await api.post("/ai/analyze-symptoms", data);
      return response.data;
    } catch (error) {
      logError(error, { context: "AIService.analyzeSymptoms" });
      throw error;
    }
  }

  /**
   * Get health insights from medical records
   * @param {String} patientId - Patient ID
   * @returns {Promise<Object>} - Health insights with risk score
   */
  async getHealthInsights(patientId) {
    try {
      if (!patientId) {
        throw new Error("Patient ID is required");
      }
      const response = await api.get(`/ai/health-insights/${patientId}`);
      return response.data;
    } catch (error) {
      logError(error, { context: "AIService.getHealthInsights", patientId });
      throw error;
    }
  }

  /**
   * Calculate health risk score based on vitals and history
   * @param {Object} data - { age, bp, sugar, weight, height, medicalHistory }
   * @returns {Promise<Object>} - Risk score and recommendations
   */
  async calculateRiskScore(data) {
    try {
      const response = await api.post("/ai/risk-score", data);
      return response.data;
    } catch (error) {
      logError(error, { context: "AIService.calculateRiskScore" });
      throw error;
    }
  }

  /**
   * Get personalized diet recommendations
   * @param {Object} data - { age, weight, height, conditions, allergies }
   * @returns {Promise<Object>} - Diet plan
   */
  async getDietRecommendations(data) {
    try {
      const response = await api.post("/ai/diet-recommendations", data);
      return response.data;
    } catch (error) {
      logError(error, { context: "AIService.getDietRecommendations" });
      throw error;
    }
  }

  /**
   * Get exercise recommendations
   * @param {Object} data - { age, fitness, conditions }
   * @returns {Promise<Object>} - Exercise plan
   */
  async getExerciseRecommendations(data) {
    try {
      const response = await api.post("/ai/exercise-recommendations", data);
      return response.data;
    } catch (error) {
      logError(error, { context: "AIService.getExerciseRecommendations" });
      throw error;
    }
  }
}

export default new AIService();
