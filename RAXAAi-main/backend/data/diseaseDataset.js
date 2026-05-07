/**
 * Explainable disease dataset used by the rule-based prediction engine.
 *
 * Evidence tiers:
 * core = required disease anchor, strong = differentiators, support = weaker context,
 * avoid = mismatches that reduce confidence.
 */

const normalClinicalIndicators = {
  wbc: 'usually normal unless complicated',
  platelets: 'usually normal',
  oxygen: 'usually normal',
  bp: 'usually normal'
};

const diseaseDataset = [
  {
    name: 'Dengue',
    category: 'infectious',
    priority: 1,
    core: ['fever'],
    strong: ['low platelets', 'rash', 'retro orbital pain', 'joint pain'],
    support: ['headache', 'body ache', 'nausea', 'vomiting', 'bleeding gums', 'fatigue'],
    avoid: ['productive cough', 'sore throat dominant', 'runny nose', 'frequent urination', 'weight change'],
    clinicalIndicators: { wbc: 'low or normal', platelets: 'low, often below 150000', oxygen: 'usually normal', bp: 'may fall in severe dengue' },
    severity: 'high',
    recommendedTests: ['CBC with platelet count', 'Dengue NS1 antigen', 'Dengue IgM/IgG', 'Hematocrit monitoring'],
    redFlags: ['bleeding', 'severe abdominal pain', 'fainting', 'very low blood pressure'],
    differentiators: [
      { symptoms: ['fever', 'rash'], boost: 5, reason: 'fever with rash is dengue-specific in this screening set' },
      { symptoms: ['fever', 'joint pain'], clinical: [{ field: 'platelet_count', max: 150000 }], boost: 8, reason: 'fever, arthralgia, and low platelets strongly support dengue' },
      { clinical: [{ field: 'platelet_count', max: 100000 }], boost: 7, reason: 'marked thrombocytopenia strongly favors dengue' },
      { clinical: [{ field: 'hematocrit', min: 45 }], boost: 2, reason: 'raised hematocrit can indicate dengue plasma leakage' }
    ]
  },
  {
    name: 'Malaria',
    category: 'infectious',
    priority: 1,
    core: ['fever'],
    strong: ['chills', 'sweating', 'cyclical fever', 'travel to malaria area'],
    support: ['headache', 'vomiting', 'body ache', 'fatigue', 'jaundice'],
    avoid: ['runny nose', 'sore throat dominant', 'rash dominant', 'frequent urination', 'weight change'],
    clinicalIndicators: { wbc: 'normal or low', platelets: 'may be low', oxygen: 'usually normal unless severe', bp: 'may fall in severe disease' },
    severity: 'high',
    recommendedTests: ['Peripheral blood smear', 'Rapid malaria antigen test', 'CBC', 'Liver and kidney function if severe'],
    redFlags: ['confusion', 'seizure', 'jaundice', 'very low blood pressure'],
    differentiators: [
      { symptoms: ['fever', 'chills', 'sweating'], boost: 10, reason: 'fever with chills and sweating is a classic malaria pattern' },
      { symptoms: ['fever', 'cyclical fever'], boost: 7, reason: 'cyclical fever strongly supports malaria' },
      { symptoms: ['fever'], clinical: [{ field: 'platelet_count', max: 150000 }], boost: 2, reason: 'low platelets can support malaria when fever is present' }
    ]
  },
  {
    name: 'Typhoid',
    category: 'infectious',
    priority: 1,
    core: ['prolonged fever', 'fever for weeks'],
    strong: ['abdominal pain', 'step ladder fever', 'loss of appetite', 'relative bradycardia'],
    support: ['headache', 'weakness', 'constipation', 'diarrhea', 'coated tongue'],
    avoid: ['runny nose', 'wheezing', 'rash dominant', 'frequent urination'],
    clinicalIndicators: { wbc: 'normal or low', platelets: 'usually normal or mildly low', oxygen: 'normal', bp: 'usually normal' },
    severity: 'high',
    recommendedTests: ['Blood culture', 'CBC', 'Widal test after first week if used locally', 'Liver function tests'],
    redFlags: ['intestinal bleeding', 'severe abdominal distension', 'confusion'],
    differentiators: [
      { symptoms: ['prolonged fever', 'abdominal pain'], boost: 8, reason: 'prolonged fever with abdominal symptoms supports typhoid' },
      { symptoms: ['step ladder fever', 'loss of appetite'], boost: 5, reason: 'step-ladder fever pattern supports typhoid' },
      { clinical: [{ field: 'wbc_count', max: 4000 }], boost: 2, reason: 'low WBC can support typhoid' }
    ]
  },
  {
    name: 'Influenza',
    category: 'respiratory',
    priority: 1,
    core: ['fever', 'sudden onset fever'],
    strong: ['cough', 'sore throat', 'body ache', 'fatigue'],
    support: ['headache', 'chills', 'runny nose', 'congestion'],
    avoid: ['rash', 'low platelets', 'night sweats for weeks', 'frequent urination'],
    clinicalIndicators: { ...normalClinicalIndicators, oxygen: 'normal unless severe lower respiratory involvement' },
    severity: 'medium',
    recommendedTests: ['Influenza rapid antigen or PCR', 'Pulse oximetry if breathless', 'CBC if severe'],
    redFlags: ['breathing difficulty', 'low oxygen', 'persistent high fever'],
    differentiators: [
      { symptoms: ['fever', 'cough', 'sore throat'], boost: 8, reason: 'fever with cough and sore throat favors influenza/viral respiratory illness' },
      { symptoms: ['sudden onset fever', 'body ache'], boost: 7, reason: 'abrupt fever with myalgia supports influenza' }
    ]
  },
  {
    name: 'Tuberculosis',
    category: 'infectious',
    priority: 1,
    core: ['chronic cough'],
    strong: ['weight loss', 'night sweats', 'blood in cough', 'fever for weeks'],
    support: ['fatigue', 'loss of appetite', 'chest pain', 'low grade fever'],
    avoid: ['sudden runny nose', 'acute diarrhea', 'itching only', 'high platelets'],
    clinicalIndicators: { wbc: 'normal or mildly high', platelets: 'usually normal', oxygen: 'may be low in advanced lung disease', bp: 'usually normal' },
    severity: 'high',
    recommendedTests: ['Sputum AFB smear and culture', 'GeneXpert/CBNAAT', 'Chest X-ray', 'ESR or CRP', 'HIV test when appropriate'],
    redFlags: ['blood in cough', 'severe weight loss', 'breathing difficulty'],
    differentiators: [
      { symptoms: ['chronic cough', 'weight loss'], boost: 10, reason: 'chronic cough with weight loss is a classic TB pattern' },
      { symptoms: ['fever', 'night sweats'], boost: 7, reason: 'fever with night sweats is a tuberculosis constitutional pattern' },
      { symptoms: ['night sweats', 'fever for weeks'], boost: 6, reason: 'prolonged fever with night sweats supports TB' },
      { symptoms: ['chronic cough', 'weight loss'], clinical: [{ field: 'oxygen_saturation', max: 91.9 }], boost: 3, reason: 'low oxygen with chronic cough and weight loss supports pulmonary TB severity' }
    ]
  },
  {
    name: 'COVID-19',
    category: 'infectious',
    priority: 1,
    core: ['fever', 'dry cough'],
    strong: ['loss of taste', 'loss of smell', 'shortness of breath', 'known covid exposure'],
    support: ['fatigue', 'sore throat', 'headache', 'body ache', 'diarrhea'],
    avoid: ['itching only', 'localized rash', 'frequent urination', 'chronic joint swelling'],
    clinicalIndicators: { wbc: 'normal or low', platelets: 'usually normal', oxygen: 'may be low', bp: 'usually normal' },
    severity: 'medium',
    recommendedTests: ['COVID antigen test', 'RT-PCR if needed', 'Pulse oximetry', 'Chest imaging if oxygen is low'],
    redFlags: ['breathing difficulty', 'low oxygen', 'confusion'],
    differentiators: [
      { symptoms: ['fever', 'dry cough', 'loss of taste'], boost: 8, reason: 'fever, dry cough, and taste loss pattern supports COVID-19' },
      { clinical: [{ field: 'oxygen_saturation', max: 91.9 }], boost: 4, reason: 'oxygen saturation is low' }
    ]
  },
  {
    name: 'Hepatitis B',
    category: 'infectious',
    priority: 1,
    core: ['jaundice', 'dark urine'],
    strong: ['right upper abdominal pain', 'high alt', 'high ast', 'loss of appetite'],
    support: ['fatigue', 'nausea', 'vomiting', 'fever', 'liver disease history'],
    avoid: ['cough', 'wheezing', 'rash only', 'frequent urination'],
    clinicalIndicators: { wbc: 'usually normal', platelets: 'usually normal unless advanced liver disease', oxygen: 'normal', bp: 'usually normal' },
    severity: 'high',
    recommendedTests: ['HBsAg', 'Anti-HBc IgM', 'ALT/AST', 'Bilirubin', 'PT/INR if severe'],
    redFlags: ['confusion', 'bleeding', 'severe jaundice'],
    differentiators: [
      { symptoms: ['jaundice', 'dark urine'], boost: 9, reason: 'jaundice with dark urine suggests hepatitis' },
      { clinical: [{ field: 'alt_level', min: 80 }], boost: 4, reason: 'ALT is elevated' },
      { clinical: [{ field: 'ast_level', min: 80 }], boost: 3, reason: 'AST is elevated' }
    ]
  },
  {
    name: 'Type 2 Diabetes',
    category: 'chronic',
    priority: 2,
    core: ['frequent urination', 'increased thirst', 'high blood glucose', 'high fasting glucose', 'high hba1c'],
    strong: ['unexplained weight loss', 'slow wound healing', 'blurred vision'],
    support: ['fatigue', 'recurrent infections', 'family history diabetes', 'obesity'],
    avoid: ['fever', 'chills', 'rash', 'acute cough'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'may be elevated with metabolic risk' },
    severity: 'high',
    recommendedTests: ['Fasting plasma glucose', 'HbA1c', 'Random blood glucose', 'Urine ketones if very symptomatic'],
    redFlags: ['confusion', 'unconsciousness', 'very high blood glucose'],
    differentiators: [
      { symptoms: ['frequent urination', 'increased thirst'], boost: 8, reason: 'classic polyuria and polydipsia pattern' },
      { clinical: [{ field: 'blood_glucose', min: 200 }], boost: 6, reason: 'random blood glucose is in diabetic range' },
      { clinical: [{ field: 'fasting_glucose', min: 126 }], boost: 6, reason: 'fasting glucose is in diabetic range' },
      { clinical: [{ field: 'hemoglobin_a1c', min: 6.5 }], boost: 7, reason: 'HbA1c is in diabetic range' }
    ]
  },
  {
    name: 'Hypertension',
    category: 'chronic',
    priority: 2,
    core: ['high blood pressure', 'very high blood pressure'],
    strong: ['headache', 'dizziness', 'blurred vision'],
    support: ['chest discomfort', 'shortness of breath', 'nosebleed', 'family history heart disease', 'obesity'],
    avoid: ['fever', 'rash', 'diarrhea', 'sore throat'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'systolic >=140 or diastolic >=90' },
    severity: 'high',
    recommendedTests: ['Repeated blood pressure measurements', 'ECG', 'Kidney function tests', 'Urine albumin', 'Lipid profile'],
    redFlags: ['chest pain', 'severe headache', 'weakness one side', 'very high blood pressure'],
    differentiators: [
      { clinical: [{ field: 'systolic_bp', min: 140 }], boost: 7, reason: 'systolic blood pressure is high' },
      { clinical: [{ field: 'diastolic_bp', min: 90 }], boost: 7, reason: 'diastolic blood pressure is high' },
      { clinical: [{ field: 'systolic_bp', min: 180 }], boost: 5, reason: 'blood pressure is in severe range' }
    ]
  },
  {
    name: 'Thyroid Disorder',
    category: 'hormonal',
    priority: 2,
    core: ['weight change', 'cold intolerance', 'heat intolerance', 'neck swelling'],
    strong: ['hair loss', 'palpitations', 'tremor', 'dry skin', 'constipation'],
    support: ['fatigue', 'mood changes', 'irregular periods'],
    avoid: ['fever', 'high fever', 'productive cough', 'rash', 'diarrhea with fever', 'low platelets'],
    clinicalIndicators: normalClinicalIndicators,
    severity: 'medium',
    recommendedTests: ['TSH', 'Free T4', 'Free T3 when hyperthyroid symptoms exist', 'Anti-TPO antibody if autoimmune thyroid disease suspected'],
    redFlags: ['very fast heart rate', 'confusion', 'severe neck swelling'],
    differentiators: [
      { clinical: [{ field: 'tsh_level', min: 4.5 }], boost: 8, reason: 'TSH is above reference range' },
      { clinical: [{ field: 'tsh_level', max: 0.4 }], boost: 8, reason: 'TSH is below reference range' },
      { symptoms: ['weight change', 'cold intolerance'], boost: 5, reason: 'weight change with temperature intolerance supports thyroid disease' },
      { symptoms: ['weight change', 'heat intolerance'], boost: 5, reason: 'weight change with heat intolerance supports thyroid disease' }
    ]
  },
  {
    name: 'Asthma',
    category: 'respiratory',
    priority: 2,
    core: ['wheezing', 'shortness of breath'],
    strong: ['chest tightness', 'night cough', 'triggered by allergens', 'recurrent episodes'],
    support: ['cough', 'allergy', 'family history asthma', 'exercise induced breathlessness'],
    avoid: ['high fever', 'low platelets', 'weight loss', 'jaundice'],
    clinicalIndicators: { wbc: 'usually normal', platelets: 'normal', oxygen: 'may be low in acute attack', bp: 'usually normal' },
    severity: 'high',
    recommendedTests: ['Peak expiratory flow', 'Spirometry', 'Pulse oximetry', 'Allergy assessment if recurrent'],
    redFlags: ['severe breathing difficulty', 'silent chest', 'low oxygen'],
    differentiators: [
      { symptoms: ['wheezing', 'shortness of breath'], boost: 8, reason: 'wheeze with episodic breathlessness supports asthma' },
      { symptoms: ['chest tightness', 'triggered by allergens'], boost: 5, reason: 'allergen-triggered chest tightness is typical for asthma' }
    ]
  },
  {
    name: 'Obesity',
    category: 'lifestyle',
    priority: 2,
    core: ['high bmi', 'bmi over 30', 'excess weight'],
    strong: ['waist gain', 'shortness of breath on exertion', 'snoring'],
    support: ['fatigue', 'joint pain', 'sedentary lifestyle', 'increased appetite'],
    avoid: ['fever', 'acute weight loss', 'chills', 'rash'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'may be elevated' },
    severity: 'medium',
    recommendedTests: ['BMI and waist circumference', 'Fasting glucose or HbA1c', 'Lipid profile', 'Blood pressure measurement'],
    redFlags: ['severe shortness of breath', 'chest pain'],
    differentiators: [
      { clinical: [{ field: 'bmi', min: 30 }], boost: 9, reason: 'BMI is in the obesity range' },
      { clinical: [{ field: 'bmi', min: 25 }], boost: 3, reason: 'BMI is above healthy range' }
    ]
  },
  {
    name: 'PCOS',
    category: 'hormonal',
    priority: 2,
    core: ['irregular periods', 'missed periods'],
    strong: ['excess facial hair', 'acne', 'weight gain', 'polycystic ovaries'],
    support: ['infertility', 'oily skin', 'hair thinning', 'insulin resistance', 'family history diabetes'],
    avoid: ['fever', 'productive cough', 'jaundice', 'male gender'],
    clinicalIndicators: normalClinicalIndicators,
    severity: 'medium',
    recommendedTests: ['Pelvic ultrasound', 'Total/free testosterone', 'LH/FSH ratio', 'Fasting glucose or HbA1c', 'TSH and prolactin'],
    redFlags: ['severe pelvic pain', 'heavy vaginal bleeding'],
    differentiators: [
      { symptoms: ['irregular periods', 'excess facial hair'], boost: 8, reason: 'menstrual irregularity with hyperandrogenism strongly suggests PCOS' },
      { symptoms: ['irregular periods', 'acne'], boost: 5, reason: 'cycle irregularity with androgenic skin signs supports PCOS' }
    ]
  },
  {
    name: 'High Cholesterol',
    category: 'metabolic',
    priority: 2,
    core: ['high cholesterol', 'high ldl cholesterol'],
    strong: ['xanthelasma', 'family history heart disease', 'high triglycerides'],
    support: ['obesity', 'diabetes', 'high blood pressure', 'sedentary lifestyle'],
    avoid: ['fever', 'cough', 'rash', 'acute abdominal pain'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'may be elevated with metabolic risk' },
    severity: 'medium',
    recommendedTests: ['Fasting lipid profile', 'LDL cholesterol', 'HDL cholesterol', 'Triglycerides', 'Cardiovascular risk assessment'],
    redFlags: ['chest pain', 'stroke symptoms'],
    differentiators: [
      { clinical: [{ field: 'total_cholesterol', min: 240 }], boost: 8, reason: 'total cholesterol is high' },
      { clinical: [{ field: 'ldl_cholesterol', min: 160 }], boost: 7, reason: 'LDL cholesterol is high' },
      { clinical: [{ field: 'triglycerides', min: 200 }], boost: 3, reason: 'triglycerides are elevated' }
    ]
  },
  {
    name: 'Heart Disease',
    category: 'cardiovascular',
    priority: 2,
    core: ['chest pain', 'exertional chest pain'],
    strong: ['shortness of breath', 'palpitations', 'fatigue on exertion', 'sweating'],
    support: ['nausea', 'high blood pressure', 'smoking', 'family history heart disease'],
    avoid: ['rash', 'itching', 'sneezing', 'diarrhea'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'often elevated or risk factor' },
    severity: 'high',
    recommendedTests: ['ECG', 'Troponin if acute chest pain', 'Echocardiogram', 'Lipid profile', 'Cardiology review'],
    redFlags: ['crushing chest pain', 'fainting', 'severe shortness of breath'],
    differentiators: [
      { symptoms: ['chest pain', 'shortness of breath'], boost: 8, reason: 'chest pain with breathlessness favors cardiac disease' },
      { symptoms: ['chest pain', 'sweating'], boost: 6, reason: 'chest pain with sweating is a concerning cardiac pattern' },
      { clinical: [{ field: 'total_cholesterol', min: 240 }], boost: 2, reason: 'cholesterol is high and increases cardiac risk' }
    ]
  },
  {
    name: 'Coronary Artery Disease',
    category: 'cardiovascular',
    priority: 2,
    core: ['exertional chest pain', 'chest tightness'],
    strong: ['shortness of breath on exertion', 'high cholesterol', 'smoking'],
    support: ['fatigue on exertion', 'high blood pressure', 'diabetes', 'family history heart disease'],
    avoid: ['fever', 'rash', 'wheezing only', 'diarrhea'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'often elevated or risk factor' },
    severity: 'high',
    recommendedTests: ['ECG', 'Lipid profile', 'Stress test', 'Echocardiogram', 'Cardiology evaluation'],
    redFlags: ['chest pain at rest', 'crushing chest pain', 'fainting'],
    differentiators: [
      { symptoms: ['exertional chest pain', 'shortness of breath on exertion'], boost: 8, reason: 'exertional angina pattern' },
      { clinical: [{ field: 'ldl_cholesterol', min: 160 }], boost: 3, reason: 'LDL cholesterol is high' }
    ]
  },
  {
    name: 'Pneumonia',
    category: 'respiratory',
    priority: 2,
    core: ['cough', 'productive cough'],
    strong: ['breathing difficulty', 'chest pain', 'low oxygen', 'high fever'],
    support: ['fatigue', 'chills', 'fast breathing', 'wbc high'],
    avoid: ['itching', 'sneezing only', 'frequent urination', 'irregular periods'],
    clinicalIndicators: { wbc: 'often high', platelets: 'usually normal', oxygen: 'may be low', bp: 'may fall if severe' },
    severity: 'high',
    recommendedTests: ['Chest X-ray', 'CBC with WBC count', 'Pulse oximetry', 'Sputum test if productive cough'],
    redFlags: ['low oxygen', 'severe breathing difficulty', 'confusion'],
    differentiators: [
      { symptoms: ['fever', 'cough'], boost: 3, reason: 'fever with cough keeps pneumonia as a respiratory differential' },
      { symptoms: ['cough', 'breathing difficulty', 'chest pain'], boost: 9, reason: 'lower respiratory infection pattern' },
      { clinical: [{ field: 'oxygen_saturation', max: 91.9 }], boost: 8, reason: 'oxygen saturation below 92 suggests significant respiratory disease' },
      { clinical: [{ field: 'wbc_count', min: 11000 }], boost: 3, reason: 'WBC count is elevated' }
    ]
  },
  {
    name: 'COPD',
    category: 'respiratory',
    priority: 2,
    core: ['chronic cough', 'progressive breathlessness'],
    strong: ['smoking', 'sputum production', 'wheezing', 'shortness of breath'],
    support: ['fatigue', 'recurrent chest infections', 'low oxygen', 'older age'],
    avoid: ['rash', 'sudden fever only', 'irregular periods', 'joint swelling', 'weight loss', 'night sweats', 'fever for weeks'],
    clinicalIndicators: { wbc: 'usually normal unless infection', platelets: 'normal', oxygen: 'may be chronically low', bp: 'usually normal' },
    severity: 'high',
    recommendedTests: ['Spirometry', 'Pulse oximetry', 'Chest X-ray', 'CBC', 'Smoking exposure assessment'],
    redFlags: ['severe breathing difficulty', 'low oxygen', 'blue lips'],
    differentiators: [
      { symptoms: ['chronic cough', 'smoking'], boost: 8, reason: 'chronic cough with smoking exposure supports COPD' },
      { clinical: [{ field: 'oxygen_saturation', max: 91.9 }], boost: 5, reason: 'oxygen saturation is low' }
    ]
  },
  {
    name: 'Stroke',
    category: 'cardiovascular',
    priority: 3,
    core: ['face drooping', 'arm weakness', 'speech difficulty'],
    strong: ['sudden numbness', 'vision loss', 'sudden severe headache', 'confusion'],
    support: ['dizziness', 'loss of balance', 'high blood pressure', 'atrial fibrillation'],
    avoid: ['fever with cough', 'runny nose', 'itching', 'chronic joint pain'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'often high' },
    severity: 'critical',
    recommendedTests: ['Emergency CT/MRI brain', 'Blood glucose', 'ECG', 'Coagulation profile', 'Neurology evaluation'],
    redFlags: ['face drooping', 'arm weakness', 'speech difficulty', 'sudden vision loss'],
    differentiators: [
      { symptoms: ['face drooping', 'arm weakness', 'speech difficulty'], boost: 12, reason: 'FAST stroke pattern is present' },
      { symptoms: ['sudden numbness', 'speech difficulty'], boost: 7, reason: 'sudden focal neurological deficit' }
    ]
  },
  {
    name: 'Arrhythmia',
    category: 'cardiovascular',
    priority: 3,
    core: ['palpitations', 'irregular heartbeat'],
    strong: ['fainting', 'dizziness', 'chest discomfort', 'very fast heart rate', 'slow heart rate'],
    support: ['shortness of breath', 'fatigue', 'anxiety', 'thyroid disorder'],
    avoid: ['fever', 'rash', 'productive cough', 'diarrhea'],
    clinicalIndicators: { ...normalClinicalIndicators, bp: 'may be high or low during episodes' },
    severity: 'high',
    recommendedTests: ['ECG', 'Holter monitor', 'Electrolytes', 'TSH', 'Cardiology review'],
    redFlags: ['fainting', 'chest pain', 'very fast heart rate'],
    differentiators: [
      { symptoms: ['palpitations', 'dizziness'], boost: 7, reason: 'palpitations with presyncope supports arrhythmia' },
      { clinical: [{ field: 'heart_rate', min: 120 }], boost: 5, reason: 'heart rate is markedly elevated' },
      { clinical: [{ field: 'heart_rate', max: 50 }], boost: 5, reason: 'heart rate is abnormally low' }
    ]
  },
  {
    name: "Alzheimer's Disease",
    category: 'neurological',
    priority: 3,
    core: ['memory loss', 'memory issues'],
    strong: ['progressive confusion', 'difficulty with daily tasks', 'disorientation'],
    support: ['word finding difficulty', 'mood changes', 'getting lost', 'older age'],
    avoid: ['fever', 'rash', 'acute cough', 'sudden one sided weakness'],
    clinicalIndicators: normalClinicalIndicators,
    severity: 'high',
    recommendedTests: ['Cognitive assessment such as MMSE/MoCA', 'B12 and TSH', 'MRI/CT brain when indicated', 'Neurology review'],
    redFlags: ['sudden confusion', 'unsafe behavior', 'rapid decline'],
    differentiators: [
      { symptoms: ['memory loss', 'difficulty with daily tasks'], boost: 9, reason: 'progressive memory and function decline supports Alzheimer disease' },
      { clinical: [{ field: 'mmse_score', max: 23 }], boost: 6, reason: 'MMSE score is below usual screening threshold' }
    ]
  },
  {
    name: "Parkinson's Disease",
    category: 'neurological',
    priority: 3,
    core: ['tremor', 'bradykinesia'],
    strong: ['rigidity', 'shuffling gait', 'resting tremor'],
    support: ['small handwriting', 'reduced facial expression', 'balance problems', 'constipation'],
    avoid: ['fever', 'rash', 'acute cough', 'diarrhea'],
    clinicalIndicators: normalClinicalIndicators,
    severity: 'medium',
    recommendedTests: ['Neurological examination', 'Medication response assessment', 'MRI brain if atypical', 'Movement disorder specialist review'],
    redFlags: ['frequent falls', 'sudden weakness', 'confusion'],
    differentiators: [
      { symptoms: ['resting tremor', 'bradykinesia'], boost: 9, reason: 'resting tremor with bradykinesia supports Parkinson disease' },
      { symptoms: ['shuffling gait', 'rigidity'], boost: 6, reason: 'parkinsonian motor pattern is present' }
    ]
  },
  {
    name: 'Osteoporosis',
    category: 'bone',
    priority: 3,
    core: ['fragility fracture', 'low bone density'],
    strong: ['back pain', 'height loss', 'postmenopausal status'],
    support: ['older age', 'low body weight', 'vitamin d deficiency', 'long term steroid use'],
    avoid: ['fever', 'rash', 'cough', 'diarrhea'],
    clinicalIndicators: normalClinicalIndicators,
    severity: 'medium',
    recommendedTests: ['DEXA scan', 'Serum calcium', 'Vitamin D', 'Renal function', 'Spine X-ray if back pain or height loss'],
    redFlags: ['sudden severe back pain', 'new fracture after minor fall'],
    differentiators: [
      { symptoms: ['fragility fracture', 'low bone density'], boost: 10, reason: 'fragility fracture with low bone density strongly supports osteoporosis' },
      { clinical: [{ field: 'bone_density_tscore', max: -2.5 }], boost: 8, reason: 'T-score is in osteoporosis range' }
    ]
  },
  {
    name: 'Epilepsy',
    category: 'neurological',
    priority: 3,
    core: ['seizure', 'recurrent seizures'],
    strong: ['loss of consciousness', 'tongue bite', 'post seizure confusion'],
    support: ['jerking movements', 'aura', 'incontinence during episode', 'sleep deprivation trigger'],
    avoid: ['fever only', 'rash', 'chronic cough', 'joint swelling'],
    clinicalIndicators: normalClinicalIndicators,
    severity: 'high',
    recommendedTests: ['EEG', 'MRI brain if new onset', 'Electrolytes and glucose', 'Neurology evaluation'],
    redFlags: ['seizure lasting more than 5 minutes', 'repeated seizures', 'first seizure'],
    differentiators: [
      { symptoms: ['seizure', 'post seizure confusion'], boost: 10, reason: 'seizure with post-ictal confusion supports epilepsy' },
      { symptoms: ['loss of consciousness', 'tongue bite'], boost: 6, reason: 'loss of consciousness with tongue bite is seizure-specific' }
    ]
  },
  {
    name: 'Arthritis',
    category: 'musculoskeletal',
    priority: 3,
    core: ['joint pain', 'joint stiffness'],
    strong: ['joint swelling', 'morning stiffness', 'reduced range of motion'],
    support: ['warm joint', 'fatigue', 'older age', 'symmetrical joint pain'],
    avoid: ['cough', 'runny nose', 'jaundice', 'frequent urination'],
    clinicalIndicators: normalClinicalIndicators,
    severity: 'medium',
    recommendedTests: ['ESR/CRP', 'Rheumatoid factor or anti-CCP when inflammatory arthritis suspected', 'Joint X-ray', 'Uric acid if gout pattern'],
    redFlags: ['hot swollen joint with fever', 'unable to bear weight'],
    differentiators: [
      { symptoms: ['joint pain', 'morning stiffness'], boost: 7, reason: 'joint pain with morning stiffness supports arthritis' },
      { symptoms: ['joint swelling', 'reduced range of motion'], boost: 5, reason: 'objective joint inflammation pattern' }
    ]
  }
];

function getAllDiseases() {
  return diseaseDataset;
}

function getDiseaseByName(name) {
  return diseaseDataset.find(disease => disease.name.toLowerCase() === String(name).toLowerCase());
}

function searchBySymptom(symptom) {
  const lowerSymptom = String(symptom).toLowerCase();
  return diseaseDataset.filter(disease =>
    [
      ...disease.core,
      ...disease.strong,
      ...disease.support,
      ...disease.avoid,
      ...disease.redFlags
    ].some(item => item.toLowerCase().includes(lowerSymptom))
  );
}

function getAllSymptoms() {
  const allSymptoms = new Set();
  diseaseDataset.forEach(disease => {
    [
      ...disease.core,
      ...disease.strong,
      ...disease.support,
      ...disease.avoid,
      ...disease.redFlags
    ].forEach(symptom => allSymptoms.add(symptom.toLowerCase()));
  });
  return Array.from(allSymptoms).sort();
}

module.exports = {
  diseaseDataset,
  getAllDiseases,
  getDiseaseByName,
  searchBySymptom,
  getAllSymptoms
};
