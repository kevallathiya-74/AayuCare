/**
 * AI Controller
 * Handles AI-powered health analysis and recommendations
 */

const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const logger = require("../utils/logger");

/**
 * @desc    Analyze symptoms and provide AI insights
 * @route   POST /api/ai/analyze-symptoms
 * @access  Private
 */
exports.analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms = [], duration, severity = "moderate" } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one symptom",
      });
    }

    // AI Analysis Logic (Simplified version - can integrate with OpenAI/Gemini)
    const possibleConditions = analyzeSymptomsPattern(symptoms, severity);
    const urgencyLevel = determineUrgency(severity, symptoms);
    const recommendations = generateRecommendations(symptoms, severity);
    const whenToSeekHelp = getEmergencySignals(symptoms);

    res.json({
      success: true,
      analysis: {
        possibleConditions,
        urgencyLevel,
        recommendations,
        whenToSeekHelp,
        estimatedRecovery: calculateRecoveryTime(severity),
      },
      tagline: "Your health, enhanced by intelligence.",
    });
  } catch (error) {
    logger.error("Symptom analysis error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to analyze symptoms",
      error: error.message,
    });
  }
};

/**
 * @desc    Get comprehensive health insights for a patient
 * @route   GET /api/ai/health-insights/:patientId
 * @access  Private
 */
exports.getHealthInsights = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify access rights - supports both _id and userId formats
    const isOwnData =
      req.user.userId === patientId || req.user._id.toString() === patientId;
    if (req.user.role !== "admin" && req.user.role !== "doctor" && !isOwnData) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this data",
      });
    }

    // Get patient data - supports both userId and _id
    const patient = await User.findOne({
      role: "patient",
      $or: [{ userId: patientId }, { _id: patientId }],
    });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Get recent medical records using patient._id
    const records = await MedicalRecord.find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Generate comprehensive insights
    const insights = generateHealthInsights(patient, records);

    res.json({
      success: true,
      insights,
      tagline: "Your health, enhanced by intelligence.",
    });
  } catch (error) {
    logger.error("Health insights error:", {
      error: error.message,
      stack: error.stack,
      patientId: req.params.patientId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to generate health insights",
      error: error.message,
    });
  }
};

/**
 * @desc    Calculate health risk score
 * @route   POST /api/ai/risk-score
 * @access  Private
 */
exports.calculateRiskScore = async (req, res) => {
  try {
    const {
      age = 30,
      bp = "120/80",
      sugar = 90,
      weight = 70,
      height = 170,
      medicalHistory = [],
    } = req.body;

    // Calculate BMI
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    // Calculate risk score
    let riskScore = 0;
    const riskFactors = [];

    // BMI risk
    if (bmi > 25) {
      riskScore += 15;
      riskFactors.push("Overweight");
    }
    if (bmi > 30) {
      riskScore += 10;
      riskFactors.push("Obesity");
    }

    // Age risk
    if (age > 40) riskScore += 10;
    if (age > 60) riskScore += 15;

    // Blood pressure risk
    const [systolic] = bp.split("/").map(Number);
    if (systolic > 130) {
      riskScore += 20;
      riskFactors.push("High blood pressure");
    }

    // Blood sugar risk
    if (sugar > 100) {
      riskScore += 15;
      riskFactors.push("Elevated blood sugar");
    }
    if (sugar > 126) {
      riskScore += 10;
      riskFactors.push("Diabetes risk");
    }

    // Medical history risk
    const highRiskConditions = ["diabetes", "hypertension", "heart disease"];
    medicalHistory.forEach((condition) => {
      if (
        highRiskConditions.some((hrc) => condition.toLowerCase().includes(hrc))
      ) {
        riskScore += 15;
        riskFactors.push(condition);
      }
    });

    riskScore = Math.min(riskScore, 100);
    const riskLevel =
      riskScore < 30 ? "low" : riskScore < 60 ? "medium" : "high";

    res.json({
      success: true,
      riskScore,
      riskLevel,
      riskFactors,
      factors: {
        bmi: {
          value: bmi.toFixed(1),
          status: bmi < 25 ? "healthy" : bmi < 30 ? "overweight" : "obese",
        },
        bloodPressure: {
          value: bp,
          status:
            systolic < 120 ? "normal" : systolic < 140 ? "elevated" : "high",
        },
        bloodSugar: {
          value: sugar,
          status:
            sugar < 100 ? "normal" : sugar < 126 ? "prediabetic" : "diabetic",
        },
      },
      recommendations: generateRiskRecommendations(riskLevel, riskFactors),
      tagline: "Your health, enhanced by intelligence.",
    });
  } catch (error) {
    logger.error("Risk score calculation error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to calculate risk score",
      error: error.message,
    });
  }
};

/**
 * @desc    Get personalized diet recommendations
 * @route   POST /api/ai/diet-recommendations
 * @access  Private
 */
exports.getDietRecommendations = async (req, res) => {
  try {
    const {
      age,
      weight,
      height,
      conditions = [],
      allergies = [],
      goal = "maintain",
    } = req.body;

    const dietPlan = generateDietPlan(
      age,
      weight,
      height,
      conditions,
      allergies,
      goal
    );

    res.json({
      success: true,
      dietPlan,
      tagline: "Your health, enhanced by intelligence.",
    });
  } catch (error) {
    logger.error("Diet recommendations error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to generate diet recommendations",
      error: error.message,
    });
  }
};

/**
 * @desc    Get personalized exercise recommendations
 * @route   POST /api/ai/exercise-recommendations
 * @access  Private
 */
exports.getExerciseRecommendations = async (req, res) => {
  try {
    const {
      age,
      fitness = "moderate",
      conditions = [],
      goal = "fitness",
    } = req.body;

    const exercisePlan = generateExercisePlan(age, fitness, conditions, goal);

    res.json({
      success: true,
      exercisePlan,
      tagline: "Your health, enhanced by intelligence.",
    });
  } catch (error) {
    logger.error("Exercise recommendations error:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to generate exercise recommendations",
      error: error.message,
    });
  }
};

/**
 * @desc    Analyze medical record and update AI insights
 * @route   POST /api/ai/analyze-medical-record/:recordId
 * @access  Private (Doctor/Admin)
 */
exports.analyzeMedicalRecord = async (req, res) => {
  try {
    if (req.user.role !== "doctor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only doctors and admins can analyze medical records",
      });
    }

    const { recordId } = req.params;
    const record = await MedicalRecord.findById(recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Medical record not found",
      });
    }

    // Generate AI analysis
    const aiAnalysis = await analyzeRecordWithAI(record);

    // Update record with AI insights
    record.aiAnalysis = aiAnalysis;
    await record.save();

    res.json({
      success: true,
      message: "Medical record analyzed successfully",
      aiAnalysis,
      tagline: "Your health, enhanced by intelligence.",
    });
  } catch (error) {
    logger.error("Medical record analysis error:", {
      error: error.message,
      stack: error.stack,
      recordId: req.params.recordId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to analyze medical record",
      error: error.message,
    });
  }
};

// Helper Functions

function analyzeSymptomsPattern(symptoms, severity) {
  // Simplified pattern matching
  const conditions = [];

  const feverSymptoms = ["fever", "high temperature", "chills"];
  const coldSymptoms = ["runny nose", "cough", "sneezing", "sore throat"];
  const fluSymptoms = ["body ache", "fatigue", "headache"];

  const hasFever = symptoms.some((s) =>
    feverSymptoms.some((fs) => s.toLowerCase().includes(fs))
  );
  const hasCold = symptoms.some((s) =>
    coldSymptoms.some((cs) => s.toLowerCase().includes(cs))
  );
  const hasFlu = symptoms.some((s) =>
    fluSymptoms.some((fs) => s.toLowerCase().includes(fs))
  );

  if (hasCold) {
    conditions.push({ name: "Common Cold", probability: 85, severity: "mild" });
  }
  if (hasFever && hasFlu) {
    conditions.push({
      name: "Viral Fever",
      probability: 75,
      severity: "moderate",
    });
  }
  if (hasFever && hasCold && hasFlu) {
    conditions.push({
      name: "Seasonal Flu",
      probability: 70,
      severity: "moderate",
    });
  }

  // Default if no matches
  if (conditions.length === 0) {
    conditions.push({
      name: "General Illness",
      probability: 50,
      severity: severity,
    });
  }

  return conditions;
}

function determineUrgency(severity, symptoms) {
  const emergencyKeywords = [
    "chest pain",
    "difficulty breathing",
    "severe bleeding",
    "unconscious",
  ];
  const hasEmergency = symptoms.some((s) =>
    emergencyKeywords.some((ek) => s.toLowerCase().includes(ek))
  );

  if (hasEmergency || severity === "severe") return "high";
  if (severity === "moderate") return "medium";
  return "low";
}

function generateRecommendations(symptoms, severity) {
  return [
    "Rest and stay hydrated",
    "Take prescribed medications on time",
    "Monitor your symptoms regularly",
    severity === "severe"
      ? "Consult a doctor immediately"
      : "Consult a doctor if symptoms worsen",
    "Maintain good hygiene",
  ];
}

function getEmergencySignals(symptoms) {
  return [
    "Temperature above 103°F (39.4°C)",
    "Difficulty breathing or shortness of breath",
    "Persistent chest pain or pressure",
    "Severe headache with stiff neck",
    "Persistent vomiting or diarrhea",
  ];
}

function calculateRecoveryTime(severity) {
  if (severity === "mild") return "3-5 days";
  if (severity === "moderate") return "5-7 days";
  return "7-14 days";
}

function generateHealthInsights(patient, records) {
  // Calculate overall health score
  let overallScore = 75;
  const concerns = [];
  const strengths = [];

  // Analyze medical history
  if (patient.medicalHistory && patient.medicalHistory.length > 0) {
    overallScore -= patient.medicalHistory.length * 5;
    concerns.push(`${patient.medicalHistory.length} chronic condition(s)`);
  } else {
    strengths.push("No major medical history");
  }

  // Analyze recent records
  if (records.length > 5) {
    concerns.push("Frequent medical consultations");
  } else if (records.length > 0) {
    strengths.push("Regular health monitoring");
  }

  overallScore = Math.max(0, Math.min(100, overallScore));
  const riskLevel =
    overallScore > 70 ? "low" : overallScore > 40 ? "medium" : "high";

  return {
    overallScore,
    riskLevel,
    strengths,
    concerns,
    recommendations: {
      diet: [
        "Eat balanced meals with fruits and vegetables",
        "Reduce processed foods",
        "Stay hydrated (2.5-3 liters/day)",
      ],
      exercise: [
        "30 minutes of moderate exercise daily",
        "Include strength training 2x/week",
        "Practice yoga or meditation",
      ],
      lifestyle: [
        "Maintain regular sleep schedule (7-8 hours)",
        "Manage stress effectively",
        "Regular health checkups",
      ],
      waterIntake: "2.5-3 liters per day",
    },
    preventiveMeasures: [
      "Annual comprehensive health checkup",
      "Regular blood pressure monitoring",
      "Maintain healthy weight",
    ],
  };
}

function generateRiskRecommendations(riskLevel, riskFactors) {
  const recommendations = ["Maintain healthy lifestyle habits"];

  if (riskLevel === "high") {
    recommendations.push("Consult doctor for comprehensive health assessment");
    recommendations.push("Consider lifestyle modification program");
  }

  if (riskFactors.includes("Overweight") || riskFactors.includes("Obesity")) {
    recommendations.push(
      "Focus on weight management through diet and exercise"
    );
  }

  if (riskFactors.includes("High blood pressure")) {
    recommendations.push("Reduce sodium intake and monitor BP regularly");
  }

  if (riskFactors.includes("Elevated blood sugar")) {
    recommendations.push(
      "Monitor blood sugar levels and consult endocrinologist"
    );
  }

  return recommendations;
}

function generateDietPlan(age, weight, height, conditions, allergies, goal) {
  return {
    breakfast: [
      "Oatmeal with fresh fruits and nuts",
      "Whole grain toast with avocado",
      "Greek yogurt with berries",
    ],
    lunch: [
      "Grilled chicken/fish with vegetables",
      "Brown rice with dal and salad",
      "Quinoa bowl with roasted vegetables",
    ],
    dinner: [
      "Vegetable soup with whole grain bread",
      "Grilled vegetables with paneer/tofu",
      "Lentil curry with roti",
    ],
    snacks: [
      "Fresh seasonal fruits",
      "Nuts (almonds, walnuts)",
      "Vegetable sticks with hummus",
    ],
    nutritionGoals: {
      calories: goal === "lose" ? "1600-1800 kcal/day" : "1800-2200 kcal/day",
      protein: "50-60g/day",
      fiber: "25-30g/day",
      water: "2.5-3 liters/day",
    },
    avoidFoods: [
      "Processed foods",
      "Sugary beverages",
      "Excessive salt",
      ...allergies,
    ],
  };
}

function generateExercisePlan(age, fitness, conditions, goal) {
  return {
    monday: {
      type: "Cardio",
      exercises: ["Brisk walking 30 min", "Light jogging 15 min"],
      duration: "45 minutes",
    },
    tuesday: {
      type: "Strength",
      exercises: ["Push-ups 3x10", "Squats 3x15", "Planks 3x30sec"],
      duration: "40 minutes",
    },
    wednesday: {
      type: "Yoga",
      exercises: ["Sun salutations", "Standing poses", "Meditation"],
      duration: "45 minutes",
    },
    thursday: {
      type: "Cardio",
      exercises: ["Cycling 30 min", "Swimming 20 min"],
      duration: "50 minutes",
    },
    friday: {
      type: "Strength",
      exercises: ["Lunges 3x12", "Core exercises", "Resistance training"],
      duration: "40 minutes",
    },
    saturday: {
      type: "Flexibility",
      exercises: ["Stretching routine", "Yoga", "Light cardio"],
      duration: "35 minutes",
    },
    sunday: {
      type: "Active Rest",
      exercises: ["Light walking", "Leisure activity", "Recovery exercises"],
      duration: "30 minutes",
    },
    tips: [
      "Always warm up before exercise",
      "Stay hydrated during workouts",
      "Listen to your body",
      "Gradually increase intensity",
    ],
  };
}

async function analyzeRecordWithAI(record) {
  // Simplified AI analysis
  const { symptoms = [], diagnosis, vitals = {}, labResults = {} } = record;

  const insights = [];
  let riskScore = 0;

  // Analyze vitals
  if (vitals.bloodPressure) {
    const [systolic] = vitals.bloodPressure.split("/").map(Number);
    if (systolic > 140) {
      insights.push("Blood pressure is elevated - monitor regularly");
      riskScore += 20;
    }
  }

  if (vitals.bloodSugar && vitals.bloodSugar > 126) {
    insights.push("Blood sugar levels need attention");
    riskScore += 20;
  }

  if (vitals.temperature && vitals.temperature > 100) {
    insights.push("Fever present - infection possible");
    riskScore += 10;
  }

  // Default insights if none generated
  if (insights.length === 0) {
    insights.push("Health parameters within normal range");
  }

  return {
    insights,
    riskScore: Math.min(riskScore, 100),
    suggestions: {
      diet: ["Balanced nutrition", "Stay hydrated"],
      exercise: ["Regular physical activity", "30 min daily walk"],
      lifestyle: ["Adequate sleep", "Stress management"],
      waterIntake: "2.5-3 liters/day",
    },
    preventiveMeasures: [
      "Regular health monitoring",
      "Follow prescribed medications",
    ],
  };
}
