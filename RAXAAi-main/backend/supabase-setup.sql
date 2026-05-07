-- Supabase PostgreSQL Database Schema for RAXA Health Assistant
-- Run this script in Supabase SQL Editor to set up the database

-- ============================================================================
-- DISEASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  symptoms TEXT,
  risk_factors TEXT,
  prevention TEXT,
  prevalence TEXT DEFAULT 'uncommon',
  severity TEXT DEFAULT 'moderate',
  emergency_signals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SYMPTOMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  severity TEXT DEFAULT 'moderate',
  is_emergency BOOLEAN DEFAULT FALSE,
  follow_up_questions TEXT,
  related_diseases TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- HEALTH DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  age INTEGER,
  gender TEXT,
  bmi FLOAT,
  blood_glucose FLOAT,
  systolic_bp INTEGER,
  diastolic_bp INTEGER,
  total_cholesterol FLOAT,
  hdl_cholesterol FLOAT,
  ldl_cholesterol FLOAT,
  heart_rate INTEGER,
  temperature FLOAT,
  oxygen_saturation FLOAT,
  weight_kg FLOAT,
  height_cm FLOAT,
  fasting_glucose FLOAT,
  hemoglobin_a1c FLOAT,
  smoking_status TEXT,
  exercise_frequency INTEGER,
  family_history_diabetes BOOLEAN,
  family_history_heart_disease BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PREDICTION RESULTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  disease_name TEXT NOT NULL,
  risk_score FLOAT,
  risk_level TEXT,
  risk_factors TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- USER SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- INSERT DEFAULT DISEASES DATA
-- ============================================================================

INSERT INTO diseases (name, description, category, symptoms, risk_factors, prevention, prevalence, severity)
VALUES 
  ('Type 2 Diabetes', 'A chronic condition that affects the way the body processes blood sugar', 'Metabolic', 'Increased thirst, Frequent urination, Fatigue, Blurred vision', 'Obesity, Age > 45, Family history, Sedentary lifestyle', 'Maintain healthy weight, Regular exercise, Healthy diet', 'very_common', 'moderate'),
  ('Hypertension', 'High blood pressure condition', 'Cardiovascular', 'Often asymptomatic, Headaches, Shortness of breath, Chest pain', 'Age > 60, Obesity, High salt diet, Stress', 'Reduce salt intake, Regular exercise, Weight management', 'very_common', 'severe'),
  ('Heart Disease', 'Various conditions affecting the heart', 'Cardiovascular', 'Chest pain, Shortness of breath, Fatigue, Palpitations', 'High cholesterol, Hypertension, Family history, Smoking', 'Healthy diet, Regular exercise, Quit smoking', 'common', 'severe'),
  ('Obesity', 'Excess body fat accumulation', 'Metabolic', 'Excess weight, Fatigue, Joint pain, Shortness of breath', 'Sedentary lifestyle, Poor diet, Genetics', 'Healthy diet, Regular exercise, Behavioral therapy', 'very_common', 'moderate'),
  ('Stroke', 'Interruption of blood supply to brain', 'Neurological', 'Sudden numbness, Weakness, Speech difficulty, Vision problems', 'High blood pressure, High cholesterol, Age > 55, Smoking', 'Monitor blood pressure, Healthy diet, Regular exercise', 'uncommon', 'critical'),
  ('Asthma', 'Chronic respiratory condition', 'Respiratory', 'Wheezing, Difficulty breathing, Chest tightness, Persistent cough', 'Family history, Allergies, Smoking exposure', 'Avoid triggers, Regular medication, Monitor symptoms', 'common', 'moderate'),
  ('Pneumonia', 'Lung infection', 'Respiratory', 'Cough with phlegm, Fever, Chills, Shortness of breath', 'Smoking, Chronic lung disease, Weak immunity', 'Vaccination, Avoid smoking, Good hygiene', 'common', 'severe'),
  ('High Cholesterol', 'Elevated cholesterol levels', 'Cardiovascular', 'Often asymptomatic, Fatigue, Chest pain', 'Poor diet, Obesity, Lack of exercise, Family history', 'Healthy diet, Regular exercise, Medication', 'very_common', 'moderate')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_created_at ON health_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_results_user_id ON prediction_results(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_disease ON prediction_results(disease_name);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (Optional - for production)
-- ============================================================================

-- ALTER TABLE health_data ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for user-specific data access (uncomment for production)
-- CREATE POLICY "Users can view own health data" ON health_data FOR SELECT USING (user_id = auth.uid());
-- CREATE POLICY "Users can insert own health data" ON health_data FOR INSERT WITH CHECK (user_id = auth.uid());
