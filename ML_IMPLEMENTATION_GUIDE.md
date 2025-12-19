# 🤖 AayuCare ML/AI Implementation Guide

## 📊 Current Status: Rule-Based System (No ML Models Yet)

**Reality Check:** The project currently uses **0% Machine Learning**. All "AI" features are implemented using:
- If-else conditional logic
- Mathematical formulas
- Pattern matching algorithms
- Template-based responses

---

## 🎯 ML Models Recommended for AayuCare

### 1. **Disease Prediction Model (Classification)**
**Type:** Multi-class Classification  
**Algorithm:** Random Forest / XGBoost / Neural Network  
**Purpose:** Predict diseases based on symptoms

#### Implementation Details:
```python
# Model Architecture
Input Features (20+):
- Patient Demographics: age, gender, BMI
- Symptoms: fever, cough, fatigue (one-hot encoded)
- Vital Signs: BP (systolic, diastolic), heart rate, temperature
- Medical History: diabetes, hypertension, allergies (binary)
- Lifestyle Factors: smoking, alcohol, exercise frequency

Output:
- Disease Category (10-15 classes)
- Confidence Score (0-1)

Model Options:
1. Random Forest Classifier (Recommended for start)
   - Easy to train
   - Handles missing data well
   - Interpretable feature importance
   
2. XGBoost
   - Higher accuracy
   - Better for imbalanced datasets
   
3. Deep Neural Network
   - Best for large datasets (10k+ samples)
   - Requires more data and tuning
```

#### Training Requirements:
- **Dataset Size:** Minimum 5,000 patient records
- **Features:** 20-30 features per record
- **Labels:** Diagnosed diseases (ground truth from doctors)
- **Training Time:** 2-4 hours on CPU, 30 mins on GPU
- **Accuracy Target:** 80-85% on test set

#### Current Code Location:
**File:** `backend/src/controllers/aiController.js` → `analyzeSymptomsPattern()` (line 313)
```javascript
// CURRENT: Rule-based pattern matching
function analyzeSymptomsPattern(symptoms, severity) {
    const conditions = [];
    if (hasCold) conditions.push({ name: 'Common Cold', probability: 85 });
    // ... more if-else logic
}

// FUTURE: ML Model Integration
async function analyzeSymptomsPattern(symptoms, severity) {
    const modelInput = preprocessSymptoms(symptoms, severity);
    const prediction = await mlModel.predict(modelInput);
    return prediction;  // { disease, confidence, recommendations }
}
```

---

### 2. **Health Risk Score Predictor (Regression)**
**Type:** Regression Model  
**Algorithm:** Linear Regression / Gradient Boosting Regressor  
**Purpose:** Calculate personalized health risk score (0-100)

#### Implementation Details:
```python
# Model Architecture
Input Features (15):
- age, weight, height, BMI
- Blood Pressure (systolic, diastolic)
- Blood Sugar (fasting, postprandial)
- Cholesterol (LDL, HDL, total)
- Medical History Count
- Family History Flags
- Lifestyle Score (calculated)

Output:
- Risk Score: 0-100 (continuous)
- Risk Level: low/medium/high (derived from score)

Algorithm Choice:
1. Gradient Boosting (XGBoost/LightGBM) - RECOMMENDED
   - Best performance for healthcare data
   - Handles non-linear relationships
   - Feature importance analysis
   
2. Neural Network (MLPRegressor)
   - For complex patterns
   - Requires more data
```

#### Training Requirements:
- **Dataset Size:** Minimum 3,000 patients with historical health outcomes
- **Features:** 15-20 numerical features
- **Target Variable:** Risk scores or health outcomes (hospitalization, complications)
- **Training Time:** 1-2 hours
- **R² Score Target:** 0.75-0.85

#### Current Code Location:
**File:** `backend/src/controllers/aiController.js` → `calculateRiskScore()` (line 106)
```javascript
// CURRENT: Mathematical formula
let riskScore = 0;
if (bmi > 25) riskScore += 15;
if (age > 40) riskScore += 10;
// ... hardcoded weights

// FUTURE: ML Model
const features = [age, bmi, systolic, diastolic, sugar, ...medicalHistory];
const riskScore = await riskModel.predict(features);
const riskFactors = await riskModel.getFeatureImportance();
```

---

### 3. **NLP-Based Symptom Extractor (NLP)**
**Type:** Named Entity Recognition (NER)  
**Algorithm:** BERT / BiLSTM-CRF  
**Purpose:** Extract symptoms from patient descriptions in natural language

#### Implementation Details:
```python
# Model Architecture
Input: Patient's symptom description (text)
Example: "I have been having fever since 3 days, body pain, and headache"

Processing Pipeline:
1. Text Preprocessing (tokenization, lowercasing)
2. BERT Embeddings (contextual word representations)
3. NER Layer (identifies symptom entities)
4. Entity Extraction (structured symptom list)

Output:
{
    "symptoms": ["fever", "body pain", "headache"],
    "duration": "3 days",
    "severity": "moderate"
}

Model Options:
1. Pre-trained BioBERT (RECOMMENDED)
   - Trained on biomedical literature
   - Best for medical text
   - Fine-tune on your symptom data
   
2. Custom LSTM-CRF
   - Requires more training data
   - Good for custom symptom taxonomy
```

#### Training Requirements:
- **Dataset Size:** 2,000+ annotated symptom descriptions
- **Annotations:** Manual labeling of symptoms, duration, severity
- **Training Approach:** Fine-tuning pre-trained BioBERT
- **Training Time:** 3-5 hours on GPU
- **F1 Score Target:** 85%+

#### Current Code Location:
**File:** `frontend/src/screens/patient/AISymptomChecker.js`
```javascript
// CURRENT: User manually selects from dropdown
<SearchableDropdown items={commonSymptoms} />

// FUTURE: NLP-based extraction
<TextInput 
    placeholder="Describe your symptoms in your own words..."
    onChangeText={async (text) => {
        const extracted = await nlpModel.extractSymptoms(text);
        setSymptoms(extracted);
    }}
/>
```

---

### 4. **Personalized Recommendation System (Collaborative Filtering)**
**Type:** Recommendation Engine  
**Algorithm:** Matrix Factorization / Neural Collaborative Filtering  
**Purpose:** Recommend personalized diet, exercise, and health plans

#### Implementation Details:
```python
# Model Architecture
Approach: Hybrid Recommendation System

1. Collaborative Filtering
   - User-Item Matrix: Patients × Health Plans
   - Factorization: SVD or ALS
   - Learns patterns from similar patients
   
2. Content-Based Filtering
   - Patient Features: age, conditions, BMI, lifestyle
   - Plan Features: diet type, exercise intensity, duration
   - Similarity: Cosine similarity
   
3. Hybrid: Combine both approaches

Input:
- Patient Profile (age, weight, conditions, allergies, goals)
- Historical Plan Adherence Data

Output:
- Top 5 Recommended Diet Plans (with confidence scores)
- Top 5 Recommended Exercise Plans
- Explanation: "Recommended because similar patients improved..."
```

#### Training Requirements:
- **Dataset Size:** 1,000+ patients with plan adherence data
- **User-Item Interactions:** 5,000+ (patient-plan ratings)
- **Training Time:** 1-2 hours
- **Evaluation Metric:** Precision@5, Recall@5, NDCG

#### Current Code Location:
**File:** `backend/src/controllers/aiController.js` → `generateDietPlan()` (line 465), `generateExercisePlan()` (line 492)
```javascript
// CURRENT: Static templates
function generateDietPlan() {
    return {
        breakfast: ['Oatmeal', 'Toast', 'Yogurt'],  // Same for everyone
        lunch: ['Grilled chicken', 'Brown rice'],
        // ...
    };
}

// FUTURE: Personalized recommendations
async function generateDietPlan(patientProfile) {
    const recommendations = await recommenderModel.recommend(patientProfile);
    return {
        plans: recommendations.topK(5),
        reasoning: recommendations.getExplanations(),
        similarPatients: recommendations.getSimilarUsers()
    };
}
```

---

### 5. **Time-Series Health Trend Predictor (Forecasting)**
**Type:** Time Series Forecasting  
**Algorithm:** LSTM / Prophet / ARIMA  
**Purpose:** Predict future health metrics (BP, sugar, weight)

#### Implementation Details:
```python
# Model Architecture
Input: Historical time-series data
- Blood Pressure readings over 6 months
- Blood Sugar readings over 6 months
- Weight measurements over 6 months

Model: LSTM (Long Short-Term Memory)
- Input: 30-day window of past readings
- Hidden Layers: 2 LSTM layers (64, 32 units)
- Output: Predicted readings for next 7-30 days

Alternative: Facebook Prophet
- Better for seasonal patterns
- Easier to train
- Good for smaller datasets

Output:
- Predicted BP for next 30 days
- Confidence intervals (upper/lower bounds)
- Trend analysis (improving, worsening, stable)
```

#### Training Requirements:
- **Dataset Size:** 500+ patients with 6+ months of daily readings
- **Sequence Length:** 30-90 days historical window
- **Prediction Horizon:** 7-30 days future
- **Training Time:** 2-3 hours on GPU
- **Evaluation:** RMSE, MAE

#### Current Code Location:
**File:** New feature - not yet implemented
```javascript
// FUTURE: Trend prediction endpoint
router.post('/api/ai/predict-trends', async (req, res) => {
    const { patientId, metric, days } = req.body;
    const historicalData = await getPatientMetrics(patientId, metric);
    const prediction = await timeSeriesModel.predict(historicalData, days);
    res.json({ prediction, trend: 'improving', confidence: 0.85 });
});
```

---

## 🏗️ ML Infrastructure Setup

### Architecture: Microservices Approach

```
┌─────────────────────────────────────────────────────────────┐
│                   AayuCare ML Architecture                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │  (React Native - No Changes)
│ Mobile App   │
└──────┬───────┘
       │ HTTP Requests
       ↓
┌──────────────────────────────────────────────────────────────┐
│              Backend API Gateway (Node.js/Express)           │
│  - Routes requests to appropriate service                    │
│  - Authentication & Authorization                            │
│  - Request validation                                        │
└──────┬───────────────────────────────────────────────────────┘
       │
       ├─────────────┐
       ↓             ↓
┌──────────────┐  ┌─────────────────────────────────────────┐
│  Rule-Based  │  │        ML Service (Python)              │
│   AI Logic   │  │                                         │
│  (Fallback)  │  │  Flask/FastAPI Server                   │
└──────────────┘  │                                         │
                  │  Endpoints:                              │
                  │  - POST /predict/disease                 │
                  │  - POST /predict/risk-score              │
                  │  - POST /extract/symptoms                │
                  │  - POST /recommend/plans                 │
                  │  - POST /forecast/trends                 │
                  │                                         │
                  │  Models Loaded:                          │
                  │  - disease_model.pkl                     │
                  │  - risk_model.pkl                        │
                  │  - nlp_model (BioBERT)                   │
                  │  - recommender_model.pkl                 │
                  │  - lstm_model.h5                         │
                  └─────────────────────────────────────────┘
```

### File Structure

```
AayuCare/
├── backend/                      # Existing Node.js backend
│   └── src/
│       └── controllers/
│           └── aiController.js   # Modified to call ML service
│
├── ml-service/                   # NEW: Python ML microservice
│   ├── app.py                    # FastAPI/Flask server
│   ├── models/                   # Trained ML models
│   │   ├── disease_classifier.pkl
│   │   ├── risk_predictor.pkl
│   │   ├── biobert_ner/
│   │   ├── recommender.pkl
│   │   └── lstm_forecast.h5
│   ├── training/                 # Model training scripts
│   │   ├── train_disease_model.py
│   │   ├── train_risk_model.py
│   │   ├── train_nlp_model.py
│   │   ├── train_recommender.py
│   │   └── train_lstm.py
│   ├── preprocessing/            # Data preprocessing utilities
│   │   ├── feature_engineering.py
│   │   └── data_cleaning.py
│   ├── inference/                # Prediction logic
│   │   ├── disease_predictor.py
│   │   ├── risk_calculator.py
│   │   ├── symptom_extractor.py
│   │   ├── recommender.py
│   │   └── trend_forecaster.py
│   ├── requirements.txt          # Python dependencies
│   └── config.py                 # Model configurations
│
└── data/                         # Training datasets
    ├── symptom_disease_data.csv
    ├── patient_risk_data.csv
    ├── symptom_annotations.json
    ├── plan_adherence_data.csv
    └── timeseries_vitals.csv
```

---

## 🔧 Implementation Steps

### Phase 1: Infrastructure Setup (Week 1-2)

#### Step 1.1: Create ML Service Directory
```bash
cd AayuCare
mkdir ml-service
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### Step 1.2: Install Dependencies
```bash
# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.104.1
uvicorn==0.24.0
scikit-learn==1.3.2
xgboost==2.0.2
pandas==2.1.3
numpy==1.26.2
transformers==4.35.2
torch==2.1.1
joblib==1.3.2
pydantic==2.5.0
python-multipart==0.0.6
EOF

pip install -r requirements.txt
```

#### Step 1.3: Create FastAPI Server
```python
# ml-service/app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="AayuCare ML Service")

# Load models on startup
disease_model = joblib.load('models/disease_classifier.pkl')
risk_model = joblib.load('models/risk_predictor.pkl')

class SymptomInput(BaseModel):
    symptoms: list[str]
    age: int
    gender: str
    vital_signs: dict

@app.post("/predict/disease")
async def predict_disease(input_data: SymptomInput):
    try:
        # Preprocess input
        features = preprocess_symptoms(input_data)
        
        # Make prediction
        prediction = disease_model.predict_proba([features])[0]
        disease_idx = prediction.argmax()
        confidence = prediction[disease_idx]
        
        return {
            "disease": disease_classes[disease_idx],
            "confidence": float(confidence),
            "alternative_diagnoses": get_top_k(prediction, k=3)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/risk-score")
async def predict_risk(patient_data: dict):
    features = extract_risk_features(patient_data)
    risk_score = risk_model.predict([features])[0]
    return {
        "risk_score": float(risk_score),
        "risk_level": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

#### Step 1.4: Update Node.js Backend
```javascript
// backend/src/controllers/aiController.js
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

exports.analyzeSymptoms = async (req, res) => {
    try {
        const { symptoms, age, gender } = req.body;
        
        // Call ML service
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/predict/disease`, {
            symptoms,
            age,
            gender,
            vital_signs: req.body.vitals || {}
        });
        
        res.json({
            success: true,
            analysis: mlResponse.data,
            tagline: 'Your health, enhanced by intelligence.'
        });
    } catch (error) {
        // Fallback to rule-based if ML service is down
        logger.warn('ML service unavailable, using fallback');
        const fallbackResult = analyzeSymptomsPattern(req.body.symptoms);
        res.json({ success: true, analysis: fallbackResult });
    }
};
```

---

### Phase 2: Model Training (Week 3-6)

#### Step 2.1: Collect Training Data
```python
# ml-service/training/collect_data.py
import pandas as pd
from database import connect_mongodb

# Connect to existing MongoDB
db = connect_mongodb()

# Extract patient data
patients = db.users.find({"role": "patient"})
medical_records = db.medicalRecords.find()
appointments = db.appointments.find()

# Create training datasets
df_symptoms = create_symptom_dataset(medical_records)
df_risk = create_risk_dataset(patients, medical_records)

df_symptoms.to_csv('../data/symptom_disease_data.csv', index=False)
df_risk.to_csv('../data/patient_risk_data.csv', index=False)
```

#### Step 2.2: Train Disease Classifier
```python
# ml-service/training/train_disease_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Load data
df = pd.read_csv('../data/symptom_disease_data.csv')

# Preprocess
X = df.drop('disease', axis=1)
y = df['disease']

# Encode labels
le = LabelEncoder()
y_encoded = le.fit_transform(y)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2)

# Train model
model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
model.fit(X_train, y_train)

# Evaluate
accuracy = model.score(X_test, y_test)
print(f"Model Accuracy: {accuracy:.2%}")

# Save model
joblib.dump(model, '../models/disease_classifier.pkl')
joblib.dump(le, '../models/disease_label_encoder.pkl')
```

#### Step 2.3: Train Risk Predictor
```python
# ml-service/training/train_risk_model.py
from xgboost import XGBRegressor
import pandas as pd

# Load data
df = pd.read_csv('../data/patient_risk_data.csv')

# Features and target
features = ['age', 'bmi', 'systolic_bp', 'diastolic_bp', 'blood_sugar', 
            'cholesterol', 'smoking', 'exercise_freq', 'medical_history_count']
X = df[features]
y = df['risk_score']  # Ground truth from doctor assessments

# Train
model = XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5)
model.fit(X, y)

# Save
joblib.dump(model, '../models/risk_predictor.pkl')
```

---

### Phase 3: Integration & Testing (Week 7-8)

#### Step 3.1: Deploy ML Service
```bash
# ml-service/
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

#### Step 3.2: Update Backend Environment
```bash
# backend/.env
ML_SERVICE_URL=http://localhost:8001
```

#### Step 3.3: Test Integration
```javascript
// Test endpoint
const testMLIntegration = async () => {
    const response = await axios.post('http://localhost:3001/api/ai/analyze-symptoms', {
        symptoms: ['fever', 'cough', 'headache'],
        age: 35,
        gender: 'male'
    });
    console.log(response.data);
};
```

---

## 📈 Model Performance Metrics

### Expected Accuracy Targets

| Model | Metric | Target | Industry Standard |
|-------|--------|--------|-------------------|
| Disease Classifier | Accuracy | 80-85% | 75-90% |
| Risk Predictor | R² Score | 0.75-0.85 | 0.70-0.85 |
| NLP Symptom Extractor | F1 Score | 85%+ | 80-90% |
| Recommender | Precision@5 | 70%+ | 65-75% |
| Time Series Forecaster | RMSE | <5% error | <10% error |

---

## 🔐 Data Privacy & Security

### Compliance Requirements
- **HIPAA Compliance:** Encrypt all patient data at rest and in transit
- **GDPR:** Implement data anonymization for model training
- **Data Retention:** Store only aggregated data, delete PII after training

### Implementation
```python
# ml-service/preprocessing/anonymization.py
import hashlib

def anonymize_patient_data(patient_id):
    """Hash patient ID for model training"""
    return hashlib.sha256(patient_id.encode()).hexdigest()

def prepare_training_data(raw_data):
    """Remove PII before training"""
    anonymized = raw_data.drop(['name', 'email', 'phone', 'address'], axis=1)
    anonymized['patient_id'] = anonymized['patient_id'].apply(anonymize_patient_data)
    return anonymized
```

---

## 🚀 Production Deployment

### Option 1: Docker Containerization
```dockerfile
# ml-service/Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Option 2: Cloud Deployment
- **AWS:** Deploy on EC2 or Lambda (serverless)
- **Google Cloud:** Use Vertex AI or Cloud Run
- **Azure:** Azure ML Service

---

## 💰 Cost Estimation

### Development Phase
- **Data Collection & Labeling:** $2,000-$5,000
- **ML Engineer (3 months):** $15,000-$30,000
- **GPU Cloud Computing (Training):** $500-$1,500
- **Total:** $17,500-$36,500

### Production Phase (Monthly)
- **ML Service Hosting:** $50-$200/month
- **Model Inference API Calls:** $100-$500/month (depending on traffic)
- **Model Retraining:** $200/quarter

---

## 📚 Learning Resources

### For Team Training
1. **ML Basics:** Coursera - Machine Learning by Andrew Ng
2. **Healthcare ML:** Fast.ai - Practical Deep Learning for Coders
3. **NLP:** Hugging Face Transformers Course
4. **Production ML:** MLOps Zoomcamp

### Datasets for Training
- **Symptom-Disease:** Kaggle Disease Symptom Dataset
- **Medical Records:** MIMIC-III Clinical Database
- **NLP:** i2b2/UTHealth Corpus

---

## ✅ Success Criteria

### MVP (Minimum Viable Product)
- ✅ Disease classifier with 75%+ accuracy
- ✅ Risk predictor with 0.70+ R² score
- ✅ ML service deployed and stable
- ✅ Fallback to rule-based system working

### Full Production
- ✅ All 5 models deployed and tested
- ✅ 90%+ uptime for ML service
- ✅ <500ms response time for predictions
- ✅ Model monitoring and alerting setup
- ✅ A/B testing framework implemented

---

## 🎯 Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1:** Infrastructure | 2 weeks | ML service setup, basic API |
| **Phase 2:** Model Training | 4 weeks | 5 trained models, evaluation reports |
| **Phase 3:** Integration | 2 weeks | Backend integration, testing |
| **Phase 4:** Testing & QA | 2 weeks | Performance testing, bug fixes |
| **Phase 5:** Deployment | 1 week | Production deployment |
| **Total** | **11 weeks** | Fully functional ML system |

---

## 📞 Next Steps

1. **Immediate:** Set up ML service infrastructure
2. **Week 1-2:** Install dependencies, create FastAPI server
3. **Week 3-4:** Collect and prepare training data
4. **Week 5-6:** Train initial models
5. **Week 7-8:** Integrate with backend
6. **Week 9-10:** Testing and optimization
7. **Week 11:** Production deployment

---

## 🔗 Related Files

- **Backend AI Controller:** `backend/src/controllers/aiController.js`
- **Frontend AI Service:** `frontend/src/services/ai.service.js`
- **AI Screens:** 
  - `frontend/src/screens/patient/AISymptomChecker.js`
  - `frontend/src/screens/patient/AIHealthAssistantScreen.js`
  - `frontend/src/screens/patient/AIHealthInsights.js`

---

**Document Version:** 1.0  
**Last Updated:** December 19, 2025  
**Status:** Implementation Pending
