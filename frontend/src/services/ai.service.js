/**
 * AI Service
 * Integrates with AI APIs (OpenAI/Gemini) for health insights
 * Provides symptom analysis, risk assessment, and health recommendations
 */

import axios from 'axios';

// Note: In production, use environment variables for API keys
// For now, we'll use a mock implementation and backend-based AI processing

class AIService {
    constructor() {
        this.baseURL = 'http://10.121.108.8:5000/api';
    }

    /**
     * Analyze symptoms and provide AI insights
     * @param {Object} data - { symptoms: string[], duration: string, severity: string }
     * @returns {Promise<Object>} - AI analysis results
     */
    async analyzeSymptoms(data) {
        try {
            const response = await axios.post(`${this.baseURL}/ai/analyze-symptoms`, data);
            return response.data;
        } catch (error) {
            // Fallback to mock analysis if backend not ready
            return this.mockSymptomAnalysis(data);
        }
    }

    /**
     * Get health insights from medical records
     * @param {String} patientId - Patient ID
     * @returns {Promise<Object>} - Health insights with risk score
     */
    async getHealthInsights(patientId) {
        try {
            const response = await axios.get(`${this.baseURL}/ai/health-insights/${patientId}`);
            return response.data;
        } catch (error) {
            return this.mockHealthInsights();
        }
    }

    /**
     * Calculate health risk score based on vitals and history
     * @param {Object} data - { age, bp, sugar, weight, height, medicalHistory }
     * @returns {Promise<Object>} - Risk score and recommendations
     */
    async calculateRiskScore(data) {
        try {
            const response = await axios.post(`${this.baseURL}/ai/risk-score`, data);
            return response.data;
        } catch (error) {
            return this.mockRiskScore(data);
        }
    }

    /**
     * Get personalized diet recommendations
     * @param {Object} data - { age, weight, height, conditions, allergies }
     * @returns {Promise<Object>} - Diet plan
     */
    async getDietRecommendations(data) {
        try {
            const response = await axios.post(`${this.baseURL}/ai/diet-recommendations`, data);
            return response.data;
        } catch (error) {
            return this.mockDietRecommendations(data);
        }
    }

    /**
     * Get exercise recommendations
     * @param {Object} data - { age, fitness, conditions }
     * @returns {Promise<Object>} - Exercise plan
     */
    async getExerciseRecommendations(data) {
        try {
            const response = await axios.post(`${this.baseURL}/ai/exercise-recommendations`, data);
            return response.data;
        } catch (error) {
            return this.mockExerciseRecommendations(data);
        }
    }

    // Mock implementations for development

    mockSymptomAnalysis(data) {
        const { symptoms = [], severity = 'moderate' } = data;
        
        const possibleConditions = [
            { name: 'Common Cold', probability: 85, severity: 'mild' },
            { name: 'Viral Fever', probability: 65, severity: 'moderate' },
            { name: 'Seasonal Flu', probability: 55, severity: 'moderate' },
        ];

        return {
            success: true,
            analysis: {
                possibleConditions,
                urgencyLevel: severity === 'severe' ? 'high' : 'medium',
                recommendations: [
                    'Rest and stay hydrated',
                    'Take prescribed medications',
                    'Monitor temperature regularly',
                    'Consult doctor if symptoms worsen',
                ],
                whenToSeekHelp: [
                    'Temperature above 103°F (39.4°C)',
                    'Difficulty breathing',
                    'Severe headache',
                    'Persistent vomiting',
                ],
                estimatedRecovery: '5-7 days',
            },
            tagline: 'Your health, enhanced by intelligence.',
        };
    }

    mockHealthInsights() {
        return {
            success: true,
            insights: {
                overallScore: 78,
                riskLevel: 'low',
                strengths: [
                    'Regular exercise routine',
                    'Balanced diet',
                    'Good sleep pattern',
                ],
                concerns: [
                    'Slightly elevated blood pressure',
                    'Irregular medication adherence',
                ],
                recommendations: {
                    diet: [
                        'Reduce sodium intake to <2300mg/day',
                        'Include more leafy greens',
                        'Stay hydrated (8-10 glasses/day)',
                    ],
                    exercise: [
                        '30 minutes of cardio daily',
                        'Yoga or meditation 3x/week',
                        'Strength training 2x/week',
                    ],
                    lifestyle: [
                        'Maintain consistent sleep schedule',
                        'Reduce screen time before bed',
                        'Practice stress management',
                    ],
                    waterIntake: '2.5-3 liters per day',
                },
                preventiveMeasures: [
                    'Regular health checkups every 6 months',
                    'Blood pressure monitoring weekly',
                    'Annual comprehensive blood tests',
                ],
            },
            tagline: 'Your health, enhanced by intelligence.',
        };
    }

    mockRiskScore(data) {
        const { age = 30, bp = '120/80', sugar = 90, weight = 70, height = 170 } = data;
        
        // Simple BMI calculation
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        
        // Simple risk calculation
        let riskScore = 0;
        if (bmi > 25) riskScore += 15;
        if (bmi > 30) riskScore += 10;
        if (age > 40) riskScore += 10;
        if (age > 60) riskScore += 15;
        
        const [systolic] = bp.split('/').map(Number);
        if (systolic > 130) riskScore += 20;
        if (sugar > 100) riskScore += 15;

        return {
            success: true,
            riskScore: Math.min(riskScore, 100),
            riskLevel: riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high',
            factors: {
                bmi: {
                    value: bmi.toFixed(1),
                    status: bmi < 25 ? 'healthy' : bmi < 30 ? 'overweight' : 'obese',
                },
                bloodPressure: {
                    value: bp,
                    status: systolic < 120 ? 'normal' : systolic < 140 ? 'elevated' : 'high',
                },
                bloodSugar: {
                    value: sugar,
                    status: sugar < 100 ? 'normal' : sugar < 126 ? 'prediabetic' : 'diabetic',
                },
            },
            recommendations: [
                'Maintain healthy weight through balanced diet',
                'Regular physical activity (150 min/week)',
                'Monitor vitals regularly',
                'Reduce processed foods and sugar',
            ],
            tagline: 'Your health, enhanced by intelligence.',
        };
    }

    mockDietRecommendations(data) {
        return {
            success: true,
            dietPlan: {
                breakfast: [
                    'Oatmeal with fruits and nuts',
                    'Whole wheat toast with avocado',
                    'Greek yogurt with berries',
                ],
                lunch: [
                    'Grilled chicken/fish with vegetables',
                    'Brown rice with dal and salad',
                    'Quinoa bowl with roasted vegetables',
                ],
                dinner: [
                    'Vegetable soup with whole grain bread',
                    'Grilled vegetables with paneer',
                    'Lentil curry with roti',
                ],
                snacks: [
                    'Fresh fruits',
                    'Nuts and seeds (handful)',
                    'Vegetable sticks with hummus',
                ],
            },
            nutritionGoals: {
                calories: '1800-2200 kcal/day',
                protein: '50-60g/day',
                fiber: '25-30g/day',
                water: '2.5-3 liters/day',
            },
            avoidFoods: [
                'Processed and fried foods',
                'Sugary beverages',
                'Excessive salt',
                'Refined carbohydrates',
            ],
            tagline: 'Your health, enhanced by intelligence.',
        };
    }

    mockExerciseRecommendations(data) {
        return {
            success: true,
            exercisePlan: {
                monday: {
                    type: 'Cardio',
                    exercises: ['Brisk walking 30 min', 'Cycling 20 min'],
                    duration: '50 minutes',
                },
                tuesday: {
                    type: 'Strength',
                    exercises: ['Push-ups 3x10', 'Squats 3x15', 'Planks 3x30sec'],
                    duration: '40 minutes',
                },
                wednesday: {
                    type: 'Yoga',
                    exercises: ['Sun salutations', 'Standing poses', 'Meditation'],
                    duration: '45 minutes',
                },
                thursday: {
                    type: 'Cardio',
                    exercises: ['Jogging 25 min', 'Jump rope 10 min'],
                    duration: '35 minutes',
                },
                friday: {
                    type: 'Strength',
                    exercises: ['Lunges 3x12', 'Dumbbell curls 3x10', 'Core exercises'],
                    duration: '40 minutes',
                },
                saturday: {
                    type: 'Flexibility',
                    exercises: ['Stretching routine', 'Yoga', 'Light cardio'],
                    duration: '30 minutes',
                },
                sunday: {
                    type: 'Rest',
                    exercises: ['Light walking', 'Leisure activity'],
                    duration: '20 minutes',
                },
            },
            tips: [
                'Always warm up before exercise',
                'Stay hydrated during workouts',
                'Listen to your body and rest when needed',
                'Gradually increase intensity',
            ],
            tagline: 'Your health, enhanced by intelligence.',
        };
    }
}

export default new AIService();
