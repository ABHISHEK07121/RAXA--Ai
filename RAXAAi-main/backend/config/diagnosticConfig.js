/**
 * Diagnostic Configuration
 * Disease-specific follow-up questions and weights for adaptive questioning
 */

const DISEASE_CONFIG = {
  "Dengue": {
    questions: [
      {
        id: "bleeding",
        text: "Do you have bleeding gums or nosebleeds?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "platelet",
        text: "Do you know your platelet count?",
        type: "number",
        weight: 5,
        hint: "Enter platelet count (x10^9/L) or leave blank"
      },
      {
        id: "rash",
        text: "Do you have a skin rash or red spots on skin?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "eye_pain",
        text: "Do you have pain behind the eyes?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "muscle_pain",
        text: "Do you have severe muscle or joint pain?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Type 2 Diabetes": {
    questions: [
      {
        id: "urination",
        text: "Do you have frequent urination, especially at night?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "thirst",
        text: "Do you feel unusually thirsty all the time?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "sugar",
        text: "What is your fasting blood sugar level?",
        type: "number",
        weight: 5,
        hint: "Enter mg/dL or leave blank if unknown"
      },
      {
        id: "vision",
        text: "Have you noticed blurred vision recently?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "fatigue",
        text: "Do you feel tired even after rest?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Diabetes": {
    questions: [
      {
        id: "urination",
        text: "Do you have frequent urination, especially at night?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "thirst",
        text: "Do you feel unusually thirsty all the time?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "sugar",
        text: "What is your fasting blood sugar level?",
        type: "number",
        weight: 5,
        hint: "Enter mg/dL or leave blank if unknown"
      },
      {
        id: "vision",
        text: "Have you noticed blurred vision recently?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "fatigue",
        text: "Do you feel tired even after rest?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Obesity": {
    questions: [
      {
        id: "weight_history",
        text: "Have you gained weight unexpectedly in the past 6 months?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "appetite",
        text: "Do you have unusual hunger or cravings?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "activity",
        text: "How would you describe your daily physical activity?",
        type: "select",
        weight: 2,
        options: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active"]
      },
      {
        id: "sleep",
        text: "Do you have poor sleep or sleep apnea?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Hypertension": {
    questions: [
      {
        id: "bp_reading",
        text: "What is your most recent blood pressure reading?",
        type: "number",
        weight: 5,
        hint: "Enter systolic (top number) in mmHg"
      },
      {
        id: "headache",
        text: "Do you have frequent headaches, especially in morning?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "dizziness",
        text: "Do you experience dizziness or lightheadedness?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "salt_intake",
        text: "How would you describe your dietary salt intake?",
        type: "select",
        weight: 3,
        options: ["Low", "Moderate", "High", "Very High"]
      }
    ]
  },

  "Heart Disease": {
    questions: [
      {
        id: "chest_discomfort",
        text: "Do you have chest pain, pressure, or tightness?",
        type: "boolean",
        weight: 5,
        options: ["Yes", "No"]
      },
      {
        id: "shortness_breath",
        text: "Do you experience shortness of breath with minimal activity?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "palpitations",
        text: "Do you have heart palpitations or irregular heartbeat?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "family_history",
        text: "Do you have a family history of heart disease?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "COVID-19": {
    questions: [
      {
        id: "cough",
        text: "Do you have a dry cough?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "taste_smell",
        text: "Have you lost taste or smell sensation?",
        type: "boolean",
        weight: 4,
        options: ["Yes", "No"]
      },
      {
        id: "exposure",
        text: "Have you been near anyone with confirmed COVID-19?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "breathing",
        text: "Do you have difficulty breathing?",
        type: "boolean",
        weight: 4,
        options: ["Yes", "No"]
      }
    ]
  },

  "Influenza": {
    questions: [
      {
        id: "sudden_onset",
        text: "Did your symptoms start suddenly and severely?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "body_aches",
        text: "Do you have severe body aches and muscle pain?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "fatigue",
        text: "Do you feel extreme exhaustion?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Pneumonia": {
    questions: [
      {
        id: "chest_pain",
        text: "Do you have chest pain when breathing or coughing?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "phlegm",
        text: "Are you producing phlegm or mucus when coughing?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "breathing",
        text: "Do you have rapid or shallow breathing?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      }
    ]
  },

  "Malaria": {
    questions: [
      {
        id: "travel",
        text: "Have you traveled to a malaria-endemic area recently?",
        type: "boolean",
        weight: 4,
        options: ["Yes", "No"]
      },
      {
        id: "sweating",
        text: "Do you have severe sweating and chills?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "cycles",
        text: "Do symptoms come and go in cycles (every 48-72 hours)?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      }
    ]
  },

  "Tuberculosis": {
    questions: [
      {
        id: "cough_duration",
        text: "How long have you had a persistent cough?",
        type: "select",
        weight: 3,
        options: ["Less than 2 weeks", "2-4 weeks", "More than 4 weeks"]
      },
      {
        id: "weight_loss",
        text: "Have you experienced unexplained weight loss?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "night_sweats",
        text: "Do you have night sweats?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      }
    ]
  },

  "Typhoid": {
    questions: [
      {
        id: "fever_duration",
        text: "How long have you had fever?",
        type: "select",
        weight: 3,
        options: ["Less than 3 days", "3-7 days", "More than 7 days"]
      },
      {
        id: "abdominal",
        text: "Do you have abdominal pain or distension?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "constipation",
        text: "Do you have constipation (unlike typical diarrhea in typhoid)?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Asthma": {
    questions: [
      {
        id: "wheezing",
        text: "Do you have wheezing or whistling sound when breathing?",
        type: "boolean",
        weight: 4,
        options: ["Yes", "No"]
      },
      {
        id: "triggers",
        text: "Do symptoms worsen with specific triggers (allergens, exercise, cold)?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "night_symptoms",
        text: "Do you have symptoms specifically at night or early morning?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      }
    ]
  },

  "COPD": {
    questions: [
      {
        id: "smoking",
        text: "Are you a current or former smoker?",
        type: "boolean",
        weight: 4,
        options: ["Yes", "No"]
      },
      {
        id: "chronic_cough",
        text: "Do you have a chronic cough that produces mucus?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "breathlessness",
        text: "Do you get breathless doing simple daily activities?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      }
    ]
  },

  "Thyroid Disorder": {
    questions: [
      {
        id: "temperature",
        text: "Do you feel unusually cold or hot compared to others?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "energy",
        text: "Do you have unusual fatigue or excess energy?",
        type: "select",
        weight: 2,
        options: ["Fatigue", "Excess Energy", "Neither"]
      },
      {
        id: "weight_change",
        text: "Have you had unexplained weight changes?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      }
    ]
  },

  "PCOS": {
    questions: [
      {
        id: "periods",
        text: "Do you have irregular or absent menstrual periods?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "hair",
        text: "Do you have excessive hair growth on face or body?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      },
      {
        id: "acne",
        text: "Do you have severe acne or oily skin?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Stroke": {
    questions: [
      {
        id: "face_droop",
        text: "Do you have facial drooping or numbness on one side?",
        type: "boolean",
        weight: 5,
        options: ["Yes", "No"]
      },
      {
        id: "arm_weakness",
        text: "Do you have weakness or numbness in one arm or leg?",
        type: "boolean",
        weight: 5,
        options: ["Yes", "No"]
      },
      {
        id: "speech",
        text: "Do you have difficulty speaking or slurred speech?",
        type: "boolean",
        weight: 5,
        options: ["Yes", "No"]
      }
    ]
  },

  "Arthritis": {
    questions: [
      {
        id: "joint_pain",
        text: "Do you have joint pain, swelling, or stiffness?",
        type: "boolean",
        weight: 4,
        options: ["Yes", "No"]
      },
      {
        id: "morning_stiffness",
        text: "Do you have morning stiffness that lasts more than 30 minutes?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      },
      {
        id: "movement",
        text: "Does the pain improve with movement?",
        type: "boolean",
        weight: 2,
        options: ["Yes", "No"]
      }
    ]
  },

  "Epilepsy": {
    questions: [
      {
        id: "seizures",
        text: "Have you ever had a seizure or convulsion?",
        type: "boolean",
        weight: 5,
        options: ["Yes", "No"]
      },
      {
        id: "loss_consciousness",
        text: "Have you had episodes of lost consciousness?",
        type: "boolean",
        weight: 4,
        options: ["Yes", "No"]
      },
      {
        id: "family_history",
        text: "Do you have a family history of epilepsy?",
        type: "boolean",
        weight: 3,
        options: ["Yes", "No"]
      }
    ]
  }
};

/**
 * Get diagnostic questions for a list of diseases
 * @param {string[]} diseases - Array of disease names
 * @param {number} maxQuestions - Maximum number of questions to return (default 8)
 * @returns {object[]} Array of diagnostic questions
 */
function getDiagnosticQuestions(diseases, maxQuestions = 8) {
  if (!diseases || !Array.isArray(diseases)) {
    return [];
  }

  let questions = [];
  
  diseases.forEach(disease => {
    // Try exact match first, then partial match
    const config = DISEASE_CONFIG[disease] || 
                  DISEASE_CONFIG[Object.keys(DISEASE_CONFIG).find(key => 
                    key.toLowerCase() === disease.toLowerCase() ||
                    disease.toLowerCase().includes(key.toLowerCase())
                  )];
    
    if (config && config.questions) {
      questions.push(...config.questions);
    }
  });

  // Sort by weight (highest first)
  questions.sort((a, b) => b.weight - a.weight);

  // Remove duplicates by ID
  const uniqueQuestions = Array.from(new Map(questions.map(q => [q.id, q])).values());

  return uniqueQuestions.slice(0, maxQuestions);
}

/**
 * PROBABILISTIC SCORING ENGINE
 * ======================
 * Features:
 * - Positive evidence (YES = +weight)
 * - Negative evidence (NO = -penalty) 
 * - Normalization (softmax to real probabilities)
 * - Disease competition (all diseases compete)
 */

/**
 * Calculate evidence score with positive and negative support
 * @param {string} disease - Disease name
 * @param {object} answers - User answers
 * @returns {object} { positive, negative, net_score, evidence_details }
 */
function calculateEvidenceScore(disease, answers) {
  if (!disease || !answers || Object.keys(answers).length === 0) {
    return { positive: 0, negative: 0, net_score: 0, evidence_details: [] };
  }

  const config = DISEASE_CONFIG[disease];
  if (!config || !config.questions) {
    return { positive: 0, negative: 0, net_score: 0, evidence_details: [] };
  }

  let positive = 0;
  let negative = 0;
  const evidence_details = [];

  // Penalty weight is typically 30-50% of positive weight
  const PENALTY_RATIO = 0.35;

  config.questions.forEach(q => {
    const answerValue = answers[q.id];
    
    // Skip if no answer provided
    if (answerValue === undefined || answerValue === null || answerValue === '') {
      return;
    }

    const questionWeight = q.weight || 1;
    const penaltyWeight = Math.round(questionWeight * PENALTY_RATIO);

    // Boolean questions
    if (q.type === 'boolean') {
      const isYes = answerValue === true || answerValue === 1 || 
                  answerValue === 'Yes' || answerValue === 'yes';
      
      if (isYes) {
        positive += questionWeight;
        evidence_details.push({ question: q.id, type: 'positive', value: answerValue, weight: questionWeight });
      } else {
        // "No" is negative evidence in most cases
        negative += penaltyWeight;
        evidence_details.push({ question: q.id, type: 'negative', value: answerValue, weight: -penaltyWeight });
      }
    }
    
    // Number questions: evaluate with thresholds
    if (q.type === 'number' && typeof answerValue === 'number') {
      let numberScore = 0;
      let reason = '';

      // Special handling for specific medical values
      if (q.id === 'platelet') {
        if (answerValue < 100000) { numberScore = questionWeight; reason = 'Low platelets'; }
        else if (answerValue < 150000) { numberScore = Math.floor(questionWeight / 2); reason = 'Borderline low'; }
        else { numberScore = -penaltyWeight; reason = 'Normal platelets'; }
      } else if (q.id === 'sugar' || q.id === 'blood_glucose') {
        if (answerValue > 126) { numberScore = questionWeight; reason = 'Diabetic range'; }
        else if (answerValue > 100) { numberScore = Math.floor(questionWeight / 2); reason = 'Prediabetic'; }
        else { numberScore = -penaltyWeight; reason = 'Normal sugar'; }
      } else if (q.id === 'bp_reading' || q.id === 'systolic_bp') {
        if (answerValue > 140) { numberScore = questionWeight; reason = 'Hypertensive'; }
        else if (answerValue > 120) { numberScore = Math.floor(questionWeight / 2); reason = 'Elevated BP'; }
        else { numberScore = -penaltyWeight; reason = 'Normal BP'; }
      } else {
        // For other numbers, higher = more risk
        numberScore = Math.floor(questionWeight / 2);
        reason = 'Recorded';
      }

      if (numberScore > 0) {
        positive += numberScore;
        evidence_details.push({ question: q.id, type: 'positive', value: answerValue, weight: numberScore, reason });
      } else if (numberScore < 0) {
        negative += Math.abs(numberScore);
        evidence_details.push({ question: q.id, type: 'negative', value: answerValue, weight: numberScore, reason });
      }
    }
    
    // Select questions
    if (q.type === 'select' && typeof answerValue === 'string') {
      // Analyze select based on options - first option is highest risk
      const optionIndex = q.options?.indexOf(answerValue) ?? -1;
      if (optionIndex === 0) {
        positive += questionWeight;
        evidence_details.push({ question: q.id, type: 'positive', value: answerValue, weight: questionWeight });
      } else if (optionIndex > 0) {
        positive += Math.floor(questionWeight / 2);
        evidence_details.push({ question: q.id, type: 'partial', value: answerValue, weight: Math.floor(questionWeight / 2) });
      }
    }
  });

  return {
    positive: Math.round(positive * 10) / 10,
    negative: Math.round(negative * 10) / 10,
    net_score: Math.round((positive - negative) * 10) / 10,
    evidence_details
  };
}

/**
 * Convert raw scores to probabilities using softmax normalization
 * @param {object[]} diseaseScores - Array of { disease, raw_score }
 * @returns {object[]} Normalized probabilities summing to 1
 */
function normalizeToProbabilities(diseaseScores) {
  if (!diseaseScores || diseaseScores.length === 0) return [];
  
  // Find max raw score for stability
  const maxScore = Math.max(...diseaseScores.map(d => d.raw_score), 0);
  
  // Apply softmax with temperature (higher temp = more equal distribution)
  const TEMP = 0.5; // Temperature parameter
  const expScores = diseaseScores.map(d => Math.exp((d.raw_score - maxScore) / TEMP));
  const expSum = expScores.reduce((a, b) => a + b, 0);
  
  // Calculate probabilities
  const probabilities = diseaseScores.map((d, i) => ({
    ...d,
    probability: expSum > 0 ? expScores[i] / expSum : 0
  }));

  // Normalize to sum to 1
  const probSum = probabilities.reduce((a, b) => a + b.probability, 0);
  if (probSum > 0) {
    probabilities.forEach(p => {
      p.probability = Math.round(p.probability / probSum * 10000) / 100; // Round to 2 decimal places
    });
  }

  return probabilities;
}

/**
 * Calculate competing disease probabilities
 * @param {object[]} diseases - Array of { disease, base_score }
 * @param {object} answers - Diagnostic answers
 * @returns {object[]} Competing probabilities
 */
function calculateCompetingProbabilities(diseases, answers) {
  if (!diseases || diseases.length === 0 || !answers) return [];
  
  // Get raw scores for each disease
  const rawScores = diseases.map(d => {
    // First use the question weights from config
    const evidence = calculateEvidenceScore(d.disease, answers);
    return {
      disease: d.disease,
      base_score: d.risk_percentage || 0,
      evidence_score: evidence.net_score,
      raw_score: (d.risk_percentage || 0) + evidence.net_score,
      positive: evidence.positive,
      negative: evidence.negative,
      evidence_details: evidence.evidence_details
    };
  });

  // Apply softmax normalization
  const probabilities = normalizeToProbabilities(rawScores);
  
  return probabilities;
}

/**
 * Backward compatibility wrapper
 * @deprecated Use calculateEvidenceScore or calculateCompetingProbabilities instead
 */
function updateScoreWithAnswers(disease, answers) {
  const evidence = calculateEvidenceScore(disease, answers);
  return evidence.net_score;
}

/**
 * Get question priority (sort by weight descending)
 * @param {string} disease - Disease name
 * @returns {object[]} Sorted questions by weight (highest first)
 */
function getPrioritizedQuestions(disease) {
  const config = DISEASE_CONFIG[disease];
  if (!config || !config.questions) {
    return [];
  }

  return [...config.questions].sort((a, b) => b.weight - a.weight);
}

module.exports = {
  DISEASE_CONFIG,
  getDiagnosticQuestions,
  updateScoreWithAnswers,
  getPrioritizedQuestions,
  // New Probabilistic Engine functions
  calculateEvidenceScore,
  calculateCompetingProbabilities,
  normalizeToProbabilities
};
