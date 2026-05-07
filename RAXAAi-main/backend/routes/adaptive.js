/**
 * Adaptive Questioning Routes
 * Endpoints for adaptive questionnaire
 */

const express = require('express');
const router = express.Router();

// Adaptive questions database
const ADAPTIVE_QUESTIONS = {
  initial: [
    {
      id: 'q1',
      type: 'select',
      question: 'Which symptoms are you experiencing today?',
      options: [
        'fever',
        'prolonged fever',
        'headache',
        'body ache',
        'fatigue',
        'weight loss',
        'chills',
        'sweating',
        'rash',
        'joint pain',
        'retro orbital pain',
        'abdominal pain',
        'jaundice',
        'dark urine',
        'cough',
        'dry cough',
        'productive cough',
        'chronic cough',
        'sore throat',
        'shortness of breath',
        'wheezing',
        'chest tightness',
        'frequent urination',
        'increased thirst',
        'blurred vision',
        'slow wound healing',
        'weight change',
        'cold intolerance',
        'heat intolerance',
        'irregular periods',
        'acne',
        'excess facial hair',
        'chest pain',
        'exertional chest pain',
        'palpitations',
        'dizziness',
        'high blood pressure',
        'fatigue on exertion',
        'face drooping',
        'arm weakness',
        'speech difficulty',
        'sudden numbness',
        'vision loss',
        'memory loss',
        'confusion',
        'seizure',
        'loss of consciousness',
        'resting tremor',
        'bradykinesia',
        'joint stiffness',
        'joint swelling',
        'morning stiffness',
        'back pain',
        'height loss',
        'fragility fracture'
      ],
      hint: 'Select all that apply'
    },
    {
      id: 'q2',
      type: 'number',
      question: 'What is your current age?',
      hint: 'Enter your age in years',
      required: true
    },
    {
      id: 'q3',
      type: 'select',
      question: 'What is your gender?',
      options: ['Male', 'Female', 'Other'],
      hint: 'Please select',
      required: true
    }
  ],

  fever: [
    {
      id: 'f1',
      type: 'number',
      question: 'What is your current body temperature (°F)?',
      hint: 'Enter temperature or leave if unknown'
    },
    {
      id: 'f2',
      type: 'binary',
      question: 'Do you have chills or shivering?',
      options: ['Yes', 'No']
    },
    {
      id: 'f3',
      type: 'binary',
      question: 'Do you have body aches?',
      options: ['Yes', 'No']
    }
  ],

  cold: [
    {
      id: 'cold1',
      type: 'binary',
      question: 'Do you have a runny or stuffy nose?',
      options: ['Yes', 'No']
    },
    {
      id: 'cold2',
      type: 'binary',
      question: 'Are you sneezing frequently?',
      options: ['Yes', 'No']
    },
    {
      id: 'cold3',
      type: 'binary',
      question: 'Do you have a sore throat?',
      options: ['Yes', 'No']
    }
  ],

  cough: [
    {
      id: 'cough1',
      type: 'select',
      question: 'What type of cough do you have?',
      options: ['Dry', 'With Phlegm/Mucus', 'Barking/Hacking'],
      hint: 'Describe your cough'
    },
    {
      id: 'cough2',
      type: 'binary',
      question: 'Is the cough worse at night?',
      options: ['Yes', 'No']
    },
    {
      id: 'cough3',
      type: 'binary',
      question: 'Do you feel chest congestion?',
      options: ['Yes', 'No']
    }
  ],

  'loose motion': [
    {
      id: 'lm1',
      type: 'number',
      question: 'How many times have you passed stool today?',
      hint: 'Enter frequency'
    },
    {
      id: 'lm2',
      type: 'binary',
      question: 'Is there any blood in the stool?',
      options: ['Yes', 'No']
    },
    {
      id: 'lm3',
      type: 'binary',
      question: 'Do you feel stomach cramps?',
      options: ['Yes', 'No']
    },
    {
      id: 'lm4',
      type: 'binary',
      question: 'Are you feeling very thirsty or weak?',
      options: ['Yes', 'No']
    }
  ],

  headache: [
    {
      id: 'h1',
      type: 'select',
      question: 'Where is the pain located?',
      options: ['Frontal (Forehead)', 'One side of head', 'Back of head', 'All over'],
    },
    {
      id: 'h2',
      type: 'select',
      question: 'Describe the pain intensity:',
      options: ['Mild', 'Moderate', 'Severe/Unbearable'],
    },
    {
      id: 'h3',
      type: 'binary',
      question: 'Are you sensitive to light or sound?',
      options: ['Yes', 'No']
    }
  ],

  other: [
    {
      id: 'o1',
      type: 'binary',
      question: 'Are your symptoms related to a recent injury or accident?',
      options: ['Yes', 'No']
    },
    {
      id: 'o2',
      type: 'binary',
      question: 'Have you experienced these symptoms before?',
      options: ['Yes', 'No']
    }
  ],

  respiratory: [
    {
      id: 'r1',
      type: 'select',
      question: 'How severe is your shortness of breath?',
      options: ['Mild', 'Moderate', 'Severe'],
      hint: 'Rate your breathing difficulty'
    },
    {
      id: 'r2',
      type: 'binary',
      question: 'Do you have a persistent cough?',
      options: ['Yes', 'No']
    },
    {
      id: 'r3',
      type: 'binary',
      question: 'Are you a smoker or ex-smoker?',
      options: ['Yes', 'No']
    }
  ],

  cardiovascular: [
    {
      id: 'c1',
      type: 'binary',
      question: 'Do you experience chest pain?',
      options: ['Yes', 'No']
    },
    {
      id: 'c2',
      type: 'number',
      question: 'What is your systolic blood pressure?',
      hint: 'Enter the top number (mmHg)'
    },
    {
      id: 'c3',
      type: 'binary',
      question: 'Do you have a family history of heart disease?',
      options: ['Yes', 'No']
    }
  ],

  metabolic: [
    {
      id: 'm1',
      type: 'number',
      question: 'What is your current weight (kg)?',
      hint: 'Enter your weight'
    },
    {
      id: 'm2',
      type: 'number',
      question: 'What is your height (cm)?',
      hint: 'Enter your height'
    },
    {
      id: 'm3',
      type: 'number',
      question: 'What is your fasting blood glucose level?',
      hint: 'Enter mg/dL or leave blank if unsure'
    }
  ]
};

/**
 * Simple keyword-based symptom detection (NLP-like)
 */
function detectSymptomsFromText(text = '') {
  const input = text.toLowerCase();
  const detected = [];
  
  if (input.includes('fever') || input.includes('hot') || input.includes('temp')) detected.push('Fever');
  if (input.includes('cold') || input.includes('nose') || input.includes('sneeze')) detected.push('Cold');
  if (input.includes('cough') || input.includes('throat')) detected.push('Cough');
  if (input.includes('motion') || input.includes('loose') || input.includes('diarrhea') || input.includes('stomach')) detected.push('Loose Motion');
  if (input.includes('head') || input.includes('ache') || input.includes('migraine')) detected.push('Headache');
  if (input.includes('breath') || input.includes('chest') || input.includes('respiratory')) detected.push('Respiratory Issues');
  if (input.includes('heart') || input.includes('palpitation')) detected.push('Cardiovascular');
  if (input.includes('sugar') || input.includes('diabetes')) detected.push('Metabolic');
  
  return detected;
}

/**
 * GET /api/v2/adaptive/questions
 * Get initial adaptive questions
 */
router.get('/questions', (req, res) => {
  res.json({
    success: true,
    type: 'initial',
    message: 'Let\'s start with some basic information to tailor the assessment.',
    questions: ADAPTIVE_QUESTIONS.initial
  });
});

/**
 * POST /api/v2/adaptive/next-questions
 * Get follow-up questions based on previous answers
 */
router.post('/next-questions', (req, res) => {
  try {
    let { category, other_text } = req.body; // Can be string or array

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    let categories = Array.isArray(category) ? [...category] : [category];
    
    // If 'Other' is selected and there's text, try to detect symptoms
    if (categories.includes('Other') && other_text) {
      const detected = detectSymptomsFromText(other_text);
      if (detected.length > 0) {
        // Add detected symptoms to categories for follow-up
        categories = [...new Set([...categories, ...detected])];
      }
    }

    let allQuestions = [];
    let foundCategories = [];

    categories.forEach(cat => {
      let categoryKey = cat.toLowerCase();
      // Map UI labels to DB keys
      if (categoryKey === 'respiratory issues') categoryKey = 'respiratory';
      if (categoryKey === 'loose motion') categoryKey = 'loose motion';

      if (ADAPTIVE_QUESTIONS[categoryKey]) {
        allQuestions = [...allQuestions, ...ADAPTIVE_QUESTIONS[categoryKey]];
        foundCategories.push(cat);
      }
    });

    // Deduplicate questions by ID
    const uniqueQuestions = Array.from(new Map(allQuestions.map(q => [q.id, q])).values());

    if (uniqueQuestions.length === 0 && foundCategories.length === 0) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories: Object.keys(ADAPTIVE_QUESTIONS)
      });
    }

    let message = `I've prepared some specific questions regarding your concerns: ${foundCategories.filter(c => c !== 'Other').join(' and ')}.`;
    if (foundCategories.includes('Other')) {
      message = "I've analyzed your description and prepared some additional follow-up questions to understand your situation better.";
    }

    res.json({
      success: true,
      type: foundCategories.join(', '),
      message: message,
      questions: uniqueQuestions
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get questions',
      message: error.message
    });
  }
});

/**
 * GET /api/v2/adaptive/categories
 * Get available question categories
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: Object.keys(ADAPTIVE_QUESTIONS).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      questionCount: ADAPTIVE_QUESTIONS[key].length
    }))
  });
});

/**
 * POST /api/v2/adaptive/submit-answers
 * Submit adaptive questionnaire answers
 */
router.post('/submit-answers', (req, res) => {
  try {
    const { answers, category } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    const processedAnswers = answers.map(answer => ({
      questionId: answer.questionId || answer.id,
      response: answer.response || answer.answer,
      timestamp: new Date()
    }));

    res.json({
      success: true,
      message: 'Answers submitted successfully',
      answersCount: processedAnswers.length,
      category
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answers', message: error.message });
  }
});

/**
 * POST /api/v2/adaptive/analyze
 * Analyze adaptive questionnaire answers and return disease risk predictions.
 * Response shape is consumed directly by AdaptiveQuestionnaire.tsx.
 */
// Import dataset-backed prediction services
const { predictDiseases, normalizeClinicalData, validateClinicalData } = require('../services/predictionEngine');
const { getDiseaseByName } = require('../data/diseaseDataset');
// Import Diagnostic Config
const { getDiagnosticQuestions, updateScoreWithAnswers, getPrioritizedQuestions, calculateEvidenceScore, calculateCompetingProbabilities } = require('../config/diagnosticConfig');

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleReliability(value) {
  const normalized = String(value || 'LOW').toLowerCase();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toPercentNumber(value) {
  const parsed = parseInt(String(value || '0').replace('%', ''), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

const OPTIONAL_NUMERIC_LABS = new Set([
  'blood_glucose',
  'fasting_glucose',
  'hemoglobin_a1c',
  'wbc_count',
  'platelet_count',
  'hematocrit',
  'platelet',
  'sugar',
  'bp_reading'
]);

function buildAdaptivePredictionInput(answers) {
  const symptoms = [];

  if (Array.isArray(answers.q1)) {
    symptoms.push(...answers.q1);
  } else if (answers.q1) {
    symptoms.push(answers.q1);
  }

  if (answers.q1_other) {
    symptoms.push(
      ...String(answers.q1_other)
        .split(/[,\n.]/)
        .map(part => part.trim())
        .filter(Boolean)
    );
  }

  Object.entries(answers).forEach(([key, value]) => {
    const isAffirmative =
      value === 1 ||
      value === true ||
      normalizeText(value) === 'yes' ||
      normalizeText(value) === 'current';

    if (isAffirmative && !['q1', 'q2', 'q3'].includes(key) && !OPTIONAL_NUMERIC_LABS.has(key)) {
      const discriminatingMatch = key.match(/^disc_\d+_(.+)$/);
      symptoms.push((discriminatingMatch ? discriminatingMatch[1] : key).replace(/_/g, ' '));
    }
  });

  const clinicalData = {
    ...answers,
    age: answers.q2,
    gender: answers.q3,
    platelet_count: answers.platelet ?? answers.platelet_count,
    fasting_glucose: answers.sugar ?? answers.fasting_glucose,
    systolic_bp: answers.bp_reading ?? answers.systolic_bp,
  };

  OPTIONAL_NUMERIC_LABS.forEach((field) => {
    const value = clinicalData[field];
    const normalized = normalizeText(value);
    if (value === '' || value === null || value === undefined || ['yes', 'no', 'true', 'false'].includes(normalized)) {
      clinicalData[field] = null;
      return;
    }

    const numericValue = Number(value);
    clinicalData[field] = Number.isFinite(numericValue) ? numericValue : value;
  });

  return {
    symptoms: Array.from(new Set(symptoms.map(normalizeText).filter(Boolean))),
    clinicalData: normalizeClinicalData(clinicalData),
  };
}

function buildAdaptiveExplanation(prediction, datasetDisease, isPrimary) {
  const reasons = Array.isArray(prediction.reason) ? prediction.reason : [];
  const conflictingEvidence = reasons.filter(reason =>
    /against diagnosis|reduced because|why not top/i.test(reason)
  );
  const supportingEvidence = reasons.filter(reason =>
    !/against diagnosis|reduced because|why not top/i.test(reason)
  );

  return {
    supportingEvidence: supportingEvidence.length > 0
      ? supportingEvidence
      : [`Matched ${datasetDisease?.name || prediction.disease} using dataset evidence tiers.`],
    conflictingEvidence,
    summary: isPrimary
      ? `Highest ranked match after applying dataset core, strong, support, avoid, and differentiator rules.`
      : `Ranked lower because the dataset found fewer disease-specific differentiators than the top match.`
  };
}

function toAdaptiveDiseaseResult(prediction, isPrimary) {
  const confidence = toPercentNumber(prediction.confidence || prediction.probability);
  const datasetDisease = getDiseaseByName(prediction.disease);
  const recommendedTests = datasetDisease?.recommendedTests || [];

  return {
    disease: prediction.disease,
    risk_score: confidence / 100,
    risk_percentage: confidence,
    risk_level: confidence >= 70 ? 'High' : confidence >= 40 ? 'Medium' : 'Low',
    confidence,
    confidence_level: toTitleReliability(prediction.reliability),
    data_completeness: `${confidence}% dataset match confidence`,
    explanation: buildAdaptiveExplanation(prediction, datasetDisease, isPrimary),
    recommended_tests: recommendedTests.map(test => ({
      test,
      reason: `Recommended for confirming or excluding ${prediction.disease}.`
    })),
    key_factors: Array.isArray(prediction.reason) ? prediction.reason : [],
    matched_signals: Array.isArray(prediction.reason) ? prediction.reason : [],
    matched_symptoms: prediction.matched || [],
    missing_key_indicators: prediction.missing || [],
    lab_impact: prediction.labImpact,
    category: datasetDisease?.category || 'general',
    severity: datasetDisease?.severity || prediction.severity || 'medium'
  };
}

function needFollowup(topDiseases = []) {
  if (!Array.isArray(topDiseases) || topDiseases.length < 2) {
    return false;
  }

  const score1 = topDiseases[0]?.risk_percentage || 0;
  const score2 = topDiseases[1]?.risk_percentage || 0;
  const score3 = topDiseases[2]?.risk_percentage || 0;

  if (score1 <= 0) {
    return false;
  }

  return score2 >= 0.7 * score1 || score3 >= 0.5 * score1;
}

function shouldStop(topDiseases = [], round = 0, maxRounds = 2) {
  if (!Array.isArray(topDiseases) || topDiseases.length < 2) {
    return true;
  }
  const score1 = topDiseases[0]?.risk_percentage || 0;
  const score2 = topDiseases[1]?.risk_percentage || 0;
  const clearWinner = score2 > 0 ? score1 >= (1.25 * score2) : score1 > 0;
  return clearWinner || round >= maxRounds;
}

function getConfidence(topDiseases = []) {
  if (!Array.isArray(topDiseases) || topDiseases.length < 2) {
    return 'Low';
  }
  const s1 = topDiseases[0]?.risk_percentage || 0;
  const s2 = topDiseases[1]?.risk_percentage || 0;
  const gap = s1 - s2;
  if (gap >= 4) return 'High';
  if (gap >= 2) return 'Medium';
  return 'Low';
}

function getDiseaseSignalSet(diseaseName) {
  const disease = getDiseaseByName(diseaseName);
  if (!disease) {
    return new Set();
  }

  return new Set(
    [...(disease.core || []), ...(disease.strong || []), ...(disease.support || [])]
      .map(normalizeText)
      .filter(Boolean)
  );
}

function toQuestionText(symptom) {
  return `Do you currently have ${symptom}?`;
}

function signalWeight(symptom, diseaseData) {
  const normalized = normalizeText(symptom);
  if ((diseaseData.core || []).some(item => normalizeText(item) === normalized)) return 4;
  if ((diseaseData.strong || []).some(item => normalizeText(item) === normalized)) return 3;
  if ((diseaseData.support || []).some(item => normalizeText(item) === normalized)) return 2;
  return 1;
}

function generateDiscriminatingQuestions(topDiseases = [], limit = 8) {
  if (!Array.isArray(topDiseases) || topDiseases.length < 2) {
    return [];
  }

  const [first, second] = topDiseases;
  const firstData = getDiseaseByName(first.disease) || {};
  const secondData = getDiseaseByName(second.disease) || {};
  const firstSet = getDiseaseSignalSet(first.disease);
  const secondSet = getDiseaseSignalSet(second.disease);

  const uniqueToFirst = Array.from(firstSet)
    .filter(symptom => !secondSet.has(symptom))
    .sort((a, b) => signalWeight(b, firstData) - signalWeight(a, firstData));
  const uniqueToSecond = Array.from(secondSet)
    .filter(symptom => !firstSet.has(symptom))
    .sort((a, b) => signalWeight(b, secondData) - signalWeight(a, secondData));

  const combined = [...uniqueToFirst.slice(0, 4), ...uniqueToSecond.slice(0, 4)].slice(0, limit);

  return combined.map((symptom, index) => ({
    id: `disc_${index + 1}_${symptom.replace(/\s+/g, '_')}`,
    type: 'binary',
    symptom,
    question: toQuestionText(symptom),
    options: ['Yes', 'No'],
    reason: uniqueToFirst.includes(symptom)
      ? `Helps differentiate ${first.disease} from ${second.disease}`
      : `Helps differentiate ${second.disease} from ${first.disease}`
  }));
}

/**
 * POST /api/v2/adaptive/analyze
 * Professional-grade analysis using multi-signal clinical reasoning.
 */
router.post('/analyze', (req, res) => {
  try {
    let answers = { ...req.body };
    const { q1 } = answers;
    const round = Number.isFinite(Number(answers.refinement_round)) ? Number(answers.refinement_round) : 0;
    const maxRounds = Number.isFinite(Number(answers.max_rounds)) ? Number(answers.max_rounds) : 2;

// Backend validation (security layer - cannot be bypassed)
    const weight = parseFloat(answers.weight_kg);
    const height = parseFloat(answers.height_cm);
    
    if (weight && (weight < 20 || weight > 300)) {
      return res.status(400).json({ 
        error: 'Invalid weight', 
        message: 'Weight must be between 20-300 kg' 
      });
    }
    if (height && (height < 100 || height > 250)) {
      return res.status(400).json({ 
        error: 'Invalid height', 
        message: 'Height must be between 100-250 cm' 
      });
    }

    // Calculate BMI from weight and height
    if (weight && height && height > 0) {
      const bmi = weight / Math.pow(height / 100, 2);
      answers.bmi = Math.round(bmi * 10) / 10; // Round to 1 decimal
    }

    // 1. Safety Layer: Emergency Override
    const emergencyIndicators = [];
    if (answers.systolic_bp > 180) emergencyIndicators.push('Critically high blood pressure');
    if (parseFloat(answers.blood_glucose) > 400) emergencyIndicators.push('Dangerously high blood glucose');
    if (answers.chest_pain === 1 || answers.dyspnea === 1) emergencyIndicators.push('Severe cardiovascular/respiratory distress');
    
    if (false && emergencyIndicators.length > 0) {
      return res.json({
        summary: { emergency_detected: true, indicators: emergencyIndicators },
        emergency_warning: `🚨 EMERGENCY: ${emergencyIndicators.join('; ')}. Seek immediate medical attention!`,
        top_diseases: [],
        recommendations: [{ priority: 'EMERGENCY', action: 'Call Emergency Services', timeframe: 'Immediately' }]
      });
    }

// 2. Dataset-backed reasoning: one source of truth for all diseases.
    const { symptoms, clinicalData } = buildAdaptivePredictionInput(answers);
    const clinicalErrors = validateClinicalData(clinicalData);
    if (clinicalErrors.length > 0) {
      return res.status(400).json({
        error: 'Clinical data validation failed',
        message: clinicalErrors.join('; '),
        details: clinicalErrors
      });
    }
    const predictionResult = predictDiseases(symptoms, clinicalData);
    const diseaseScores = (predictionResult.predictions || [])
      .slice(0, 3)
      .map((prediction, index) => toAdaptiveDiseaseResult(prediction, index === 0));

// 3. Get Diagnostic Follow-up Questions based on top diseases
    const diseaseNames = diseaseScores.map(d => d.disease);
    const weightedDiagnosticQuestions = getDiagnosticQuestions(diseaseNames, 8);
    const discriminatingQuestions = generateDiscriminatingQuestions(diseaseScores, 8);
    const followupQuestions = discriminatingQuestions.length > 0
      ? discriminatingQuestions
      : weightedDiagnosticQuestions;
    const stopRefinement = shouldStop(diseaseScores, round, maxRounds);
    const followUpRequired = !stopRefinement && needFollowup(diseaseScores);

    const emergencyWarning = predictionResult.emergency?.message ||
      (emergencyIndicators.length > 0
        ? `EMERGENCY: ${emergencyIndicators.join('; ')}. Seek immediate medical attention!`
        : undefined);

    // 4. Final Response Construction
    res.json({
      summary: {
        total_questions: Object.keys(answers).length,
        emergency_detected: Boolean(emergencyWarning),
        indicators: emergencyIndicators,
        primary_concerns: q1
      },
      top_diseases: diseaseScores,
      diagnostic_questions: followupQuestions,
      follow_up_required: followUpRequired,
      follow_up_questions: followupQuestions,
      confidence_level: getConfidence(diseaseScores),
      refinement: {
        enabled: followUpRequired,
        current_round: round,
        max_rounds: maxRounds,
        should_stop: stopRefinement
      },
      confidence_score: diseaseScores.length > 0 ? diseaseScores[0].confidence : 0,
      emergency_warning: emergencyWarning,
      interpretation: predictionResult.interpretation,
      urgency: predictionResult.urgency,
      prediction_metadata: predictionResult.metadata,
      timestamp: new Date().toISOString(),
      // Medical safety disclaimer
      medical_disclaimer: "⚠️ This is an AIEstimated risk assessment, NOT a medical diagnosis. Always consult a healthcare professional for accurate diagnosis and treatment."
    });

  } catch (error) {
    console.error('Professional Analyze Error:', error);
    res.status(500).json({ error: 'Failed to analyze health data', message: error.message });
  }
});

/**
 * POST /api/v2/adaptive/recalculate
 * SECOND-STAGE ANALYSIS: Probabilistic scoring with disease competition
 * Features:
 * - Positive evidence (YES = +weight)
 * - Negative evidence (NO = -penalty)
 * - Softmax normalization for real probabilities
 * - All diseases compete against each other
 */
router.post('/recalculate', (req, res) => {
  try {
    const { preliminary_diseases, diagnostic_answers, base_answers } = req.body;

    if (!preliminary_diseases || !Array.isArray(preliminary_diseases)) {
      return res.status(400).json({ 
        error: 'Preliminary diseases array is required' 
      });
    }

    if (!diagnostic_answers || Object.keys(diagnostic_answers).length === 0) {
      return res.status(400).json({ 
        error: 'Diagnostic answers are required' 
      });
    }

    // Use the new probabilistic engine with disease competition
    const competingResults = calculateCompetingProbabilities(preliminary_diseases, diagnostic_answers);
    
    // Build refined diseases with evidence details
    let refinedDiseases = competingResults.map(d => {
      const evidence = calculateEvidenceScore(d.disease, diagnostic_answers);
      const baseScore = d.base_score;
      const newRisk = Math.min(95, Math.max(5, Math.round(d.raw_score)));
      
      // Determine new risk level
      const newRiskLevel = newRisk >= 70 ? 'High' : newRisk >= 40 ? 'Medium' : 'Low';
      
      // Calculate confidence improvement
      const answeredCount = Object.keys(diagnostic_answers).filter(k => 
        diagnostic_answers[k] !== undefined && 
        diagnostic_answers[k] !== null && 
        diagnostic_answers[k] !== ''
      ).length;
      
      const confidenceImprovement = Math.min(25, answeredCount * 3);
      const newConfidence = Math.min(95, (d.confidence || 50) + confidenceImprovement);

      return {
        disease: d.disease,
        risk_percentage: newRisk,
        probability: Math.round((d.probability || 0) * 100), // Convert to percentage
        risk_level: newRiskLevel,
        confidence: newConfidence,
        confidence_level: newConfidence >= 80 ? 'High' : newConfidence >= 50 ? 'Medium' : 'Low',
        evidence: {
          positive: evidence.positive,
          negative: evidence.negative,
          net_score: evidence.net_score,
          details: evidence.evidence_details
        },
        answers_applied: diagnostic_answers
      };
    });

    // Sort by probability (highest first) for competition ranking
    refinedDiseases.sort((a, b) => b.probability - a.probability);

    // Generate competitive analysis
    const competitiveAnalysis = {
      totalDiseases: refinedDiseases.length,
      probabilities: refinedDiseases.map(d => ({
        disease: d.disease,
        probability: d.probability + '%'
      })),
      competitionFactors: refinedDiseases.map(d => ({
        disease: d.disease,
        positive_evidence: d.evidence.positive,
        negative_evidence: d.evidence.negative,
        net_score: d.evidence.net_score
      }))
    };

    res.json({
      success: true,
      message: 'Probabilistic scoring complete - diseases competing for highest probability',
      stage: 'second_stage',
      scoring_type: 'probabilistic_competition',
      refined_diseases: refinedDiseases,
      competitive_analysis: competitiveAnalysis,
      answers_count: Object.keys(diagnostic_answers).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recalculate Error:', error);
    res.status(500).json({ error: 'Failed to recalculate scores', message: error.message });
  }
});

/**
 * GET /api/v2/adaptive/diagnostic-questions/:disease
 * Get prioritized diagnostic questions for a specific disease (sorted by weight)
 */
router.get('/diagnostic-questions/:disease', (req, res) => {
  try {
    const { disease } = req.params;
    
    if (!disease) {
      return res.status(400).json({ error: 'Disease name is required' });
    }

    // Get questions sorted by priority (highest weight first)
    const questions = getPrioritizedQuestions(disease);

    if (questions.length === 0) {
      return res.status(404).json({ 
        error: 'No diagnostic questions found for this disease',
        available_diseases: Object.keys(require('../config/diagnosticConfig').DISEASE_CONFIG)
      });
    }

    res.json({
      success: true,
      disease,
      total_questions: questions.length,
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        weight: q.weight,
        priority: q.weight >= 4 ? 'HIGH' : q.weight >= 2 ? 'MEDIUM' : 'LOW',
        hint: q.hint,
        options: q.options
      }))
    });

  } catch (error) {
    console.error('Diagnostic Questions Error:', error);
    res.status(500).json({ error: 'Failed to get questions', message: error.message });
  }
});

module.exports = router;
