/**
 * reasoningEngine.js
 * Core Clinical Reasoning Engine for RAXA.
 * Uses weighted symptom matching so disease-specific signals outrank common symptoms.
 */

const { SYMPTOM_SYNONYMS, getCanonicalSymptoms, normalizeSymptom } = require('./symptomSynonyms');

const WEIGHTS = {
  core: 3,
  strong: 2,
  support: 1,
  avoid: -2
};

const DISEASES_KNOWLEDGE = {
  Dengue: {
    core: ['fever'],
    strong: ['rash', 'joint pain', 'low platelet'],
    support: ['headache', 'body pain', 'body ache', 'nausea'],
    avoid: ['runny nose', 'cough', 'chronic symptoms'],
    clinicalSignals: {
      platelet_count: { threshold: 150000, relation: 'less', weight: 18 },
      wbc_count: { threshold: 4, relation: 'less', weight: 10 }
    }
  },
  Malaria: {
    core: ['fever'],
    strong: ['chills', 'sweating'],
    support: ['headache', 'body pain', 'body ache', 'vomiting'],
    avoid: ['cough', 'rash', 'runny nose', 'chronic symptoms'],
    clinicalSignals: {
      platelet_count: { threshold: 100000, relation: 'less', weight: 12 }
    }
  },
  Pneumonia: {
    core: ['cough', 'breathing difficulty', 'shortness of breath'],
    strong: ['low oxygen', 'chest pain'],
    support: ['fever', 'fatigue'],
    avoid: ['rash', 'runny nose', 'chronic symptoms'],
    clinicalSignals: {
      oxygen_saturation: { threshold: 92, relation: 'less', weight: 20 }
    }
  },
  Influenza: {
    core: ['fever', 'body pain', 'body ache'],
    strong: ['fatigue'],
    support: ['cough', 'headache', 'sore throat'],
    avoid: ['rash']
  },
  Typhoid: {
    core: ['prolonged fever'],
    strong: ['abdominal pain', 'weakness'],
    support: ['loss of appetite', 'headache'],
    avoid: ['runny nose', 'cough'],
    clinicalSignals: {
      alt_level: { threshold: 45, relation: 'greater', weight: 8 }
    }
  },
  Tuberculosis: {
    core: ['chronic cough'],
    strong: ['night sweats', 'weight loss'],
    support: ['fever', 'fatigue'],
    avoid: ['runny nose']
  },
  'Thyroid Disorder': {
    core: ['weight change'],
    strong: ['cold intolerance', 'hair loss'],
    support: ['fatigue', 'mood changes'],
    avoid: ['fever', 'rash', 'cough', 'chills', 'sweating'],
    clinicalSignals: {
      tsh_level: { threshold: 4.5, relation: 'greater', weight: 45 },
      tsh_level_low: { source: 'tsh_level', threshold: 0.4, relation: 'less', weight: 45 }
    }
  },
  'Type 2 Diabetes': {
    core: ['frequent urination', 'increased thirst'],
    strong: ['high blood glucose', 'blurred vision'],
    support: ['fatigue', 'weight loss'],
    avoid: ['fever'],
    clinicalSignals: {
      blood_glucose: { threshold: 126, relation: 'greater', weight: 35 }
    }
  },
  Hypertension: {
    core: ['high blood pressure'],
    strong: ['headache', 'dizziness'],
    support: ['blurred vision', 'chest discomfort'],
    avoid: ['fever'],
    clinicalSignals: {
      systolic_bp: { threshold: 140, relation: 'greater', weight: 35 },
      diastolic_bp: { threshold: 90, relation: 'greater', weight: 25 }
    }
  }
};

function getAnswerSymptoms(data) {
  const values = [];

  if (Array.isArray(data.q1)) values.push(...data.q1);
  if (data.q1_other) values.push(...String(data.q1_other).split(/[,\n.]/));

  Object.entries(data).forEach(([key, value]) => {
    if (value === 1 || value === true || value === 'Yes') {
      values.push(key.replace(/_/g, ' '));
    }
  });

  return [...new Set([...values, ...getCanonicalSymptoms(values)].map(normalizeSymptom).filter(Boolean))];
}

function signalMatches(userSymptoms, signal) {
  const normalizedSignal = normalizeSymptom(signal).replace(/_/g, ' ');
  const synonyms = SYMPTOM_SYNONYMS[normalizedSignal]?.synonyms || [];
  const candidates = [normalizedSignal, ...synonyms.map(normalizeSymptom)];

  return userSymptoms.some(symptom =>
    candidates.some(candidate =>
      symptom === candidate ||
      symptom.includes(candidate)
    )
  );
}

function getMatches(userSymptoms, signals = []) {
  return signals.filter(signal => signalMatches(userSymptoms, signal));
}

function calculateClinicalScore(knowledge, data, evidence) {
  let clinicalScore = 0;

  Object.entries(knowledge.clinicalSignals || {}).forEach(([field, config]) => {
    const source = config.source || field;
    const val = parseFloat(data[source]);
    if (Number.isNaN(val)) return;

    let match = false;
    if (config.relation === 'less' && val < config.threshold) match = true;
    if (config.relation === 'greater' && val > config.threshold) match = true;

    if (match) {
      clinicalScore += config.weight;
      evidence.clinical.push(`${source.replace(/_/g, ' ')} is ${config.relation} than ${config.threshold}`);
    }
  });

  return clinicalScore;
}

/**
 * Computes weighted multi-signal risk score.
 * Minimum match rule: no core and no strong symptom means symptom score is zero.
 */
function computeReasoningScore(disease, data) {
  const knowledge = DISEASES_KNOWLEDGE[disease];
  const evidence = { positive: [], negative: [], clinical: [] };

  if (!knowledge) {
    return { score: 0, evidence, matched: { core: 0, strong: 0, support: 0, avoid: 0 } };
  }

  const userSymptoms = getAnswerSymptoms(data);
  const coreMatches = getMatches(userSymptoms, knowledge.core);
  const strongMatches = getMatches(userSymptoms, knowledge.strong);
  const supportMatches = getMatches(userSymptoms, knowledge.support);
  const avoidMatches = getMatches(userSymptoms, knowledge.avoid);

  evidence.positive.push(
    ...coreMatches.map(signal => signal.replace(/_/g, ' ')),
    ...strongMatches.map(signal => signal.replace(/_/g, ' ')),
    ...supportMatches.map(signal => signal.replace(/_/g, ' '))
  );
  evidence.negative.push(...avoidMatches.map(signal => signal.replace(/_/g, ' ')));

  const clinicalScore = calculateClinicalScore(knowledge, data, evidence);

  const hasClinicalEvidence = clinicalScore > 0;
  const hasPrimaryEvidence = coreMatches.length > 0 || strongMatches.length > 0;
  if (!hasPrimaryEvidence && !hasClinicalEvidence) {
    return {
      score: 0,
      evidence,
      matched: { core: 0, strong: 0, support: supportMatches.length, avoid: avoidMatches.length }
    };
  }

  let rawEvidenceScore =
    (coreMatches.length * WEIGHTS.core) +
    (strongMatches.length * WEIGHTS.strong) +
    (supportMatches.length * WEIGHTS.support) +
    (avoidMatches.length * WEIGHTS.avoid);

  if (coreMatches.length === 0) {
    rawEvidenceScore *= 0.5;
  }

  const maxEvidenceScore =
    (knowledge.core.length * WEIGHTS.core) +
    (knowledge.strong.length * WEIGHTS.strong);

  const symptomScore = Math.max(0, rawEvidenceScore) / Math.max(maxEvidenceScore, 1);
  const signatureBoost = coreMatches.length > 0 && strongMatches.length >= 2 ? 10 : 0;
  const score = Math.round(Math.min(98, (symptomScore * 85) + clinicalScore + signatureBoost));

  return {
    score,
    evidence,
    matched: {
      core: coreMatches.length,
      strong: strongMatches.length,
      support: supportMatches.length,
      avoid: avoidMatches.length
    }
  };
}

module.exports = { computeReasoningScore, WEIGHTS };
