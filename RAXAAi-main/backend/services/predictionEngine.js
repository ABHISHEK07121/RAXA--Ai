/**
 * Rule-based clinical prediction engine.
 *
 * Design goals:
 * - explainable weighted matching
 * - disease-specific differentiators
 * - clinical/lab integration
 * - top-3 differential diagnosis only
 */

const { diseaseDataset } = require('../data/diseaseDataset');
const { SYMPTOM_SYNONYMS, getCanonicalSymptoms } = require('./symptomSynonyms');

const WEIGHTS = {
  core: 3,
  strong: 2,
  support: 1,
  weak: 0.5,
  avoid: -2
};

const WEAK_SYMPTOMS = new Set([
  'fatigue',
  'fever',
  'headache',
  'weakness',
  'body ache'
]);

const MIN_RAW_SCORE = 4;
const MIN_CONFIDENCE = 25;
const HIGH_CONFIDENCE_CAP_FOR_DIFFERENTIALS = 64;
const MAX_DISPLAY_CONFIDENCE = 85;
const EMERGENCY_SYMPTOMS = new Set(['severe breathlessness', 'chest pain', 'unconsciousness']);
const SYNONYM_LOOKUP = new Map();
const CLINICAL_ALIASES = {
  wbc: 'wbc_count',
  white_blood_cell_count: 'wbc_count',
  platelets: 'platelet_count',
  platelet: 'platelet_count',
  oxygen: 'oxygen_saturation',
  spo2: 'oxygen_saturation',
  heart_rate: 'heart_rate',
  heartrate: 'heart_rate',
  pulse: 'heart_rate',
  systolicbp: 'systolic_bp',
  systolic: 'systolic_bp',
  diastolicbp: 'diastolic_bp',
  diastolic: 'diastolic_bp',
  hematocrit: 'hematocrit',
  hct: 'hematocrit',
  night_sweat: 'night_sweats',
  nightsweats: 'night_sweats',
  smoking: 'smoking_status',
  smoker: 'smoking_status',
  q2: 'age',
  q3: 'gender'
};

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

Object.values(SYMPTOM_SYNONYMS).forEach(group => {
  const terms = new Set([
    normalizeText(group.canonical),
    ...group.synonyms.map(normalizeText)
  ]);

  terms.forEach(term => {
    SYNONYM_LOOKUP.set(term, terms);
  });
});

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBoolean(value) {
  const normalized = normalizeText(value);
  if (value === true || value === 1 || normalized === 'yes' || normalized === 'true' || normalized === 'present') return true;
  if (value === false || value === 0 || normalized === 'no' || normalized === 'false' || normalized === 'absent') return false;
  return null;
}

function normalizeSmokingStatus(value) {
  const normalized = normalizeText(value);
  if (!normalized) return undefined;
  if (['smoker', 'current', 'current smoker', 'yes', 'true', '1'].includes(normalized)) return 'smoker';
  if (['former', 'ex smoker', 'ex-smoker', 'former smoker'].includes(normalized)) return 'former';
  if (['non smoker', 'non-smoker', 'never', 'never smoker', 'no', 'false', '0'].includes(normalized)) return 'non-smoker';
  return normalized;
}

const CLINICAL_RANGES = {
  oxygen_saturation: { min: 70, max: 100 },
  heart_rate: { min: 30, max: 220 },
  systolic_bp: { min: 70, max: 250 },
  diastolic_bp: { min: 40, max: 150 },
  wbc_count: { min: 1000, max: 50000 },
  platelet_count: { min: 10000, max: 700000 },
  blood_glucose: { min: 40, max: 600 },
  glucose: { min: 40, max: 600 },
  fasting_glucose: { min: 40, max: 400 },
  hemoglobin_a1c: { min: 3, max: 20 },
  bmi: { min: 10, max: 80 },
  tsh_level: { min: 0, max: 200 },
  total_cholesterol: { min: 50, max: 500 },
  ldl_cholesterol: { min: 20, max: 400 },
  triglycerides: { min: 20, max: 1000 },
  alt_level: { min: 0, max: 2000 },
  ast_level: { min: 0, max: 2000 },
  hematocrit: { min: 10, max: 70 },
  age: { min: 0, max: 120 }
};

const CLINICAL_FIELD_LABELS = {
  blood_glucose: 'blood glucose',
  fasting_glucose: 'fasting glucose',
  hemoglobin_a1c: 'hemoglobin A1c',
  wbc_count: 'WBC count',
  platelet_count: 'platelet count',
  oxygen_saturation: 'oxygen saturation',
  heart_rate: 'heart rate',
  systolic_bp: 'systolic BP',
  diastolic_bp: 'diastolic BP',
  bmi: 'BMI',
  hematocrit: 'hematocrit'
};

function normalizeClinicalData(clinicalData = {}) {
  const normalized = {};
  Object.entries(clinicalData || {}).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;

    const normalizedKey = normalizeText(key).replace(/\s/g, '_');
    const canonicalKey = CLINICAL_ALIASES[normalizedKey] || normalizedKey;
    const numericValue = toNumber(value);

    if (['fever', 'night_sweats', 'chronic_cough', 'body_aches', 'dyspnea'].includes(canonicalKey)) {
      const booleanValue = normalizeBoolean(value);
      if (booleanValue !== null) normalized[canonicalKey] = booleanValue;
      return;
    }

    if (canonicalKey === 'smoking_status') {
      const smokingStatus = normalizeSmokingStatus(value);
      if (smokingStatus) normalized[canonicalKey] = smokingStatus;
      return;
    }

    if (canonicalKey === 'oxygen_saturation' && numericValue !== null && numericValue <= 0) {
      return;
    }

    if (numericValue !== null) {
      normalized[canonicalKey] = numericValue;
      return;
    }

    normalized[canonicalKey] = value;
  });
  return normalized;
}

function validateClinicalData(clinicalData = {}) {
  const errors = [];

  Object.entries(clinicalData || {}).forEach(([field, value]) => {
    if (value === '' || value === null || value === undefined) return;
    if (!CLINICAL_RANGES[field]) return;

    const numericValue = toNumber(value);
    if (numericValue === null) {
      errors.push(`${CLINICAL_FIELD_LABELS[field] || field} must be numeric`);
      return;
    }

  });

  return errors;
}

function getClinicalWarnings(clinicalData = {}) {
  const warnings = [];

  Object.entries(clinicalData || {}).forEach(([field, value]) => {
    if (value === '' || value === null || value === undefined) return;
    if (!CLINICAL_RANGES[field]) return;

    const numericValue = toNumber(value);
    if (numericValue === null) return;

    const { min, max } = CLINICAL_RANGES[field];
    if (numericValue < min || numericValue > max) {
      warnings.push(`${CLINICAL_FIELD_LABELS[field] || field} is outside the usual supported range (${min}-${max})`);
    }
  });

  return warnings;
}

function extractClinicalData(inputSymptoms, explicitClinicalData) {
  if (!Array.isArray(inputSymptoms) && typeof inputSymptoms === 'object' && inputSymptoms !== null) {
    return {
      symptoms: Array.isArray(inputSymptoms.symptoms) ? inputSymptoms.symptoms : [],
      clinicalData: normalizeClinicalData({
        ...(inputSymptoms.clinicalData || {}),
        ...(inputSymptoms.clinical || {}),
        ...(inputSymptoms.vitals || {}),
        ...(inputSymptoms.labs || {})
      })
    };
  }

  return {
    symptoms: Array.isArray(inputSymptoms) ? inputSymptoms : [],
    clinicalData: normalizeClinicalData(explicitClinicalData)
  };
}

function getSynonymSet(value) {
  const normalized = normalizeText(value);
  return SYNONYM_LOOKUP.get(normalized) || new Set([normalized]);
}

const SPECIFIC_SYMPTOM_GROUPS = [
  {
    generic: 'cough',
    specific: ['dry cough', 'productive cough', 'chronic cough', 'night cough', 'blood in cough']
  },
  {
    generic: 'fever',
    specific: ['high fever', 'prolonged fever', 'sudden onset fever', 'fever for weeks', 'low grade fever', 'cyclical fever', 'persistent high fever', 'fever only']
  },
  {
    generic: 'chest pain',
    specific: ['exertional chest pain', 'chest pain at rest', 'crushing chest pain']
  },
  {
    generic: 'rash',
    specific: ['localized rash', 'rash dominant', 'rash only', 'itchy rash']
  }
];

function isOverbroadSpecificMatch(input, dataset) {
  return SPECIFIC_SYMPTOM_GROUPS.some(group =>
    input === group.generic && group.specific.includes(dataset)
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsPhrase(value, phrase) {
  return new RegExp(`(^|\\s)${escapeRegExp(phrase)}(\\s|$)`).test(value);
}

function symptomMatches(inputSymptom, datasetSymptom) {
  const input = normalizeText(inputSymptom);
  const dataset = normalizeText(datasetSymptom);
  if (!input || !dataset) return false;

  if (input === dataset) return true;
  if (isOverbroadSpecificMatch(input, dataset)) return false;

  const inputSynonyms = getSynonymSet(input);
  const datasetSynonyms = getSynonymSet(dataset);
  for (const value of inputSynonyms) {
    if (datasetSynonyms.has(value)) return true;
  }

  // Controlled phrase matching avoids broad false positives while still
  // accepting user-entered descriptions such as "severe chest pain".
  if (dataset.length >= 4 && containsPhrase(input, dataset)) return true;
  if (input.length >= 6 && containsPhrase(dataset, input)) return true;

  return false;
}

function buildEvidenceSet(symptoms, clinicalData) {
  const canonicalSymptoms = getCanonicalSymptoms(symptoms);
  const evidence = new Set([...symptoms, ...canonicalSymptoms].map(normalizeText).filter(Boolean));

  const addWhen = (condition, symptom) => {
    if (condition) evidence.add(symptom);
  };

  const systolicBp = toNumber(clinicalData.systolic_bp);
  const diastolicBp = toNumber(clinicalData.diastolic_bp);
  const heartRate = toNumber(clinicalData.heart_rate);
  const oxygen = toNumber(clinicalData.oxygen_saturation);
  const platelets = toNumber(clinicalData.platelet_count);
  const wbc = toNumber(clinicalData.wbc_count);
  const hematocrit = toNumber(clinicalData.hematocrit);
  const glucose = toNumber(clinicalData.blood_glucose);
  const legacyGlucose = toNumber(clinicalData.glucose);
  const fastingGlucose = toNumber(clinicalData.fasting_glucose);
  const hba1c = toNumber(clinicalData.hemoglobin_a1c);
  const bmi = toNumber(clinicalData.bmi);
  const cholesterol = toNumber(clinicalData.total_cholesterol);
  const ldl = toNumber(clinicalData.ldl_cholesterol);
  const alt = toNumber(clinicalData.alt_level);
  const ast = toNumber(clinicalData.ast_level);
  const age = toNumber(clinicalData.age);
  const gender = normalizeText(clinicalData.gender);
  const nightSweats = clinicalData.night_sweats === true;
  const smokingStatus = normalizeSmokingStatus(clinicalData.smoking_status);

  addWhen(clinicalData.fever === true, 'fever');
  addWhen(nightSweats, 'night sweats');
  addWhen(smokingStatus === 'smoker', 'smoking');
  addWhen(smokingStatus === 'former', 'smoking');
  addWhen(clinicalData.chronic_cough === true, 'chronic cough');
  addWhen(clinicalData.body_aches === true, 'body ache');
  addWhen(clinicalData.dyspnea === true, 'shortness of breath');
  addWhen(systolicBp >= 140 || diastolicBp >= 90, 'high blood pressure');
  addWhen(systolicBp >= 180 || diastolicBp >= 120, 'very high blood pressure');
  addWhen(heartRate >= 120, 'very fast heart rate');
  addWhen(heartRate !== null && heartRate <= 50, 'slow heart rate');
  addWhen(oxygen !== null && oxygen < 92, 'low oxygen');
  addWhen(platelets !== null && platelets < 150000, 'low platelets');
  addWhen(wbc !== null && wbc > 11000, 'wbc high');
  addWhen(wbc !== null && wbc < 4000, 'wbc low');
  addWhen(hematocrit !== null && hematocrit >= 45, 'high hematocrit');
  addWhen((glucose !== null && glucose >= 200) || (legacyGlucose !== null && legacyGlucose >= 200), 'high blood glucose');
  addWhen(fastingGlucose !== null && fastingGlucose >= 126, 'high fasting glucose');
  addWhen(hba1c !== null && hba1c >= 6.5, 'high hba1c');
  addWhen(bmi !== null && bmi >= 25, 'high bmi');
  addWhen(bmi !== null && bmi >= 30, 'bmi over 30');
  addWhen(cholesterol !== null && cholesterol >= 240, 'high cholesterol');
  addWhen(ldl !== null && ldl >= 160, 'high ldl cholesterol');
  addWhen(alt !== null && alt >= 80, 'high alt');
  addWhen(ast !== null && ast >= 80, 'high ast');
  addWhen(age !== null && age >= 60, 'older age');
  addWhen(age !== null && age <= 12, 'child age');
  addWhen(gender === 'male', 'male gender');
  addWhen(gender === 'female', 'female gender');

  Object.entries(clinicalData).forEach(([key, value]) => {
    if (value === 1 || value === true || normalizeText(value) === 'yes' || normalizeText(value) === 'current') {
      evidence.add(normalizeText(key));
    }
  });

  return Array.from(evidence);
}

function findMatches(evidence, symptoms) {
  return symptoms.filter(symptom =>
    evidence.some(input => symptomMatches(input, symptom))
  );
}

function splitSupportByStrength(matches) {
  const weak = [];
  const support = [];

  matches.forEach(match => {
    if (WEAK_SYMPTOMS.has(normalizeText(match))) {
      weak.push(match);
    } else {
      support.push(match);
    }
  });

  return { support, weak };
}

function clinicalRuleMatches(ruleClinical = [], clinicalData) {
  return ruleClinical.every(rule => {
    const value = toNumber(clinicalData[rule.field]);
    if (value === null) return false;
    if (rule.min !== undefined && value < rule.min) return false;
    if (rule.max !== undefined && value > rule.max) return false;
    return true;
  });
}

function hasAnySymptom(evidence, symptoms = []) {
  return symptoms.some(symptom =>
    evidence.some(input => symptomMatches(input, symptom))
  );
}

function countClinicalRuleMatches(ruleClinical = [], clinicalData) {
  return ruleClinical.filter(rule => clinicalRuleMatches([rule], clinicalData)).length;
}

function applyDifferentiators(disease, evidence, clinicalData) {
  let boost = 0;
  const reasons = [];
  let signalCount = 0;

  (disease.differentiators || []).forEach(rule => {
    const symptomRuleMatched = !rule.symptoms || rule.symptoms.every(symptom =>
      evidence.some(input => symptomMatches(input, symptom))
    );
    const clinicalRuleMatched = !rule.clinical || clinicalRuleMatches(rule.clinical, clinicalData);

    if (symptomRuleMatched && clinicalRuleMatched) {
      boost += rule.boost || 0;
      signalCount += 1;
      if (rule.reason) reasons.push(rule.reason);
    }
  });

  return { boost, reasons, signalCount };
}

function applyClinicalPenalties(disease, clinicalData) {
  let penalty = 0;
  const reasons = [];
  const oxygen = toNumber(clinicalData.oxygen_saturation);
  const platelets = toNumber(clinicalData.platelet_count);
  const systolicBp = toNumber(clinicalData.systolic_bp);
  const diastolicBp = toNumber(clinicalData.diastolic_bp);
  const wbc = toNumber(clinicalData.wbc_count);
  const glucose = toNumber(clinicalData.blood_glucose) ?? toNumber(clinicalData.glucose);

  if (oxygen !== null && oxygen < 92 && !['respiratory', 'infectious', 'cardiovascular'].includes(disease.category)) {
    penalty += 5;
    reasons.push('low oxygen favors respiratory or cardiopulmonary causes');
  }

  if (platelets !== null && platelets < 150000 && !['Dengue', 'Malaria'].includes(disease.name)) {
    penalty += 5;
    reasons.push('low platelets favor dengue or malaria over this diagnosis');
  }

  if (platelets !== null && platelets < 150000 && disease.name === 'Influenza') {
    penalty += 4;
    reasons.push('low platelets are atypical for uncomplicated influenza');
  }

  if (wbc !== null && wbc > 11000 && ['Dengue', 'Malaria', 'Typhoid'].includes(disease.name)) {
    penalty += 2;
    reasons.push('high WBC favors bacterial or lower respiratory infection over this pattern');
  }

  if (systolicBp !== null && systolicBp >= 160 && !['Hypertension', 'Heart Disease', 'Stroke', 'Coronary Artery Disease'].includes(disease.name)) {
    penalty += 1;
    reasons.push('marked hypertension favors cardiovascular or stroke risk');
  }

  if ((systolicBp !== null && systolicBp < 90) || (diastolicBp !== null && diastolicBp < 60)) {
    if (!['Dengue', 'Malaria', 'Typhoid', 'Pneumonia', 'COVID-19'].includes(disease.name)) {
      penalty += 3;
      reasons.push('low blood pressure with illness favors significant infection or shock physiology');
    }
  }

  if (glucose !== null && glucose >= 200 && disease.name !== 'Type 2 Diabetes') {
    penalty += 3;
    reasons.push('high glucose favors diabetes as a competing explanation');
  }

  return { penalty, reasons };
}

function applyMissingKeyIndicatorPenalties(disease, evidence) {
  let factor = 1;
  const reasons = [];
  const hasFever = hasAnySymptom(evidence, ['fever', 'high fever', 'prolonged fever', 'sudden onset fever']);
  const hasCough = hasAnySymptom(evidence, ['cough', 'dry cough', 'productive cough', 'chronic cough']);

  if (['infectious', 'respiratory'].includes(disease.category) && !hasFever) {
    factor *= 0.82;
    reasons.push('missing fever reduces infection-related likelihood');
  }

  if (disease.name === 'Pneumonia' && !hasCough) {
    factor *= 0.55;
    reasons.push('missing cough reduces pneumonia likelihood');
  }

  if (['Influenza', 'COVID-19'].includes(disease.name) && !hasCough) {
    factor *= 0.75;
    reasons.push('missing cough reduces acute respiratory infection likelihood');
  }

  return { factor, reasons };
}

function applyClinicalModifiers(disease, evidence, clinicalData) {
  let boost = 0;
  const reasons = [];
  let signalCount = 0;

  const heartRate = toNumber(clinicalData.heart_rate);
  const oxygen = toNumber(clinicalData.oxygen_saturation);
  const platelets = toNumber(clinicalData.platelet_count);
  const wbc = toNumber(clinicalData.wbc_count);
  const randomGlucose = toNumber(clinicalData.blood_glucose) ?? toNumber(clinicalData.glucose);
  const fastingGlucose = toNumber(clinicalData.fasting_glucose);
  const hba1c = toNumber(clinicalData.hemoglobin_a1c);
  const systolicBp = toNumber(clinicalData.systolic_bp);
  const diastolicBp = toNumber(clinicalData.diastolic_bp);
  const hasFever = evidence.some(input => symptomMatches(input, 'fever'));
  const hasCough = evidence.some(input => symptomMatches(input, 'cough') || symptomMatches(input, 'chronic cough'));
  const hasCopdPattern = evidence.some(input =>
    ['smoking', 'sputum production', 'wheezing', 'progressive breathlessness', 'shortness of breath'].some(symptom =>
      symptomMatches(input, symptom)
    )
  );

  if (oxygen !== null && oxygen < 92 && disease.category === 'respiratory' && (disease.name !== 'COPD' || hasCopdPattern)) {
    boost += 6;
    signalCount += 1;
    reasons.push('low oxygen strongly favors respiratory disease');
  }

  if (oxygen !== null && oxygen < 92 && ['COVID-19', 'Pneumonia', 'Asthma'].includes(disease.name)) {
    boost += 3;
    signalCount += 1;
    reasons.push('oxygen saturation is clinically important for this condition');
  }

  if (platelets !== null && platelets < 150000 && disease.name === 'Dengue') {
    boost += 5;
    signalCount += 1;
    reasons.push('low platelets are a dengue differentiator');
  }

  if (platelets !== null && platelets < 100000 && disease.name === 'Dengue') {
    boost += 5;
    signalCount += 1;
    reasons.push('platelet count below 100000 strongly increases dengue concern');
  }

  if (disease.name === 'Type 2 Diabetes') {
    if (fastingGlucose !== null && fastingGlucose >= 126) {
      boost += 7;
      signalCount += 1;
      reasons.push('fasting glucose >=126 mg/dL strongly increases diabetes confidence');
    }
    if (hba1c !== null && hba1c >= 6.5) {
      boost += 8;
      signalCount += 1;
      reasons.push('HbA1c >=6.5% strongly increases diabetes confidence');
    }
    if (randomGlucose !== null && randomGlucose >= 200) {
      boost += 6;
      signalCount += 1;
      reasons.push('random blood glucose >=200 mg/dL supports diabetes risk');
    }
  }

  if (heartRate !== null && heartRate >= 110 && hasFever && disease.category === 'infectious') {
    boost += 3;
    signalCount += 1;
    reasons.push('high heart rate with fever supports an acute infection');
  }

  if (wbc !== null && wbc > 11000 && disease.name === 'Pneumonia' && hasCough) {
    boost += 3;
    signalCount += 1;
    reasons.push('high WBC with cough supports bacterial lower respiratory infection');
  }

  if (wbc !== null && wbc > 11000 && ['infectious', 'respiratory'].includes(disease.category)) {
    boost += 2;
    signalCount += 1;
    reasons.push('WBC count above 11000 cells/uL supports infection-related disease');
  }

  if (((systolicBp !== null && systolicBp < 90) || (diastolicBp !== null && diastolicBp < 60)) && hasFever && ['Dengue', 'Malaria', 'Typhoid', 'Pneumonia'].includes(disease.name)) {
    boost += 4;
    signalCount += 1;
    reasons.push('low blood pressure with fever increases concern for clinically significant infection');
  }

  if (evidence.some(input => symptomMatches(input, 'chronic cough')) && disease.name === 'Tuberculosis') {
    boost += 3;
    signalCount += 1;
    reasons.push('chronic cough is a tuberculosis anchor symptom');
  }

  if (clinicalData.night_sweats === true && disease.name === 'Tuberculosis') {
    boost += 6;
    signalCount += 1;
    reasons.push('night sweats are a tuberculosis-specific constitutional signal');
  }

  if (normalizeSmokingStatus(clinicalData.smoking_status) === 'smoker' && disease.name === 'COPD') {
    boost += 7;
    signalCount += 1;
    reasons.push('current smoking strongly supports COPD risk');
  }

  if (normalizeSmokingStatus(clinicalData.smoking_status) === 'former' && disease.name === 'COPD') {
    boost += 4;
    signalCount += 1;
    reasons.push('former smoking supports COPD risk');
  }

  return { boost, reasons, signalCount };
}

function evaluateHardGate(disease, evidence, clinicalData, coreMatches, differentiator) {
  const hasCore = coreMatches.length > 0;
  const hasDifferentiator = differentiator.signalCount > 0;
  const clinicalDifferentiatorCount = (disease.differentiators || [])
    .reduce((count, rule) => count + countClinicalRuleMatches(rule.clinical || [], clinicalData), 0);

  if (!hasCore) {
    return {
      passed: false,
      reason: 'Rejected: missing required core disease anchor.'
    };
  }

  if (disease.name === 'Tuberculosis' && !hasAnySymptom(evidence, ['chronic cough'])) {
    return {
      passed: false,
      reason: 'Rejected: tuberculosis requires chronic cough as the anchor symptom.'
    };
  }

  if (disease.name === 'Influenza' && !hasAnySymptom(evidence, ['sore throat', 'sudden onset fever', 'cough', 'body ache'])) {
    return {
      passed: false,
      reason: 'Rejected: influenza requires an acute respiratory or myalgia pattern, not fever alone.'
    };
  }

  if (disease.name === 'Dengue') {
    const platelets = toNumber(clinicalData.platelet_count);
    const hasDenguePair =
      hasAnySymptom(evidence, ['fever']) &&
      (hasAnySymptom(evidence, ['rash', 'retro orbital pain', 'joint pain']) || (platelets !== null && platelets < 150000));

    if (!hasDenguePair) {
      return {
        passed: false,
        reason: 'Rejected: dengue requires fever plus rash, retro-orbital/joint pain, or platelet drop.'
      };
    }
  }

  if (disease.name === 'Pneumonia') {
    const oxygen = toNumber(clinicalData.oxygen_saturation);
    const wbc = toNumber(clinicalData.wbc_count);
    const broadRespiratoryDifferential =
      hasAnySymptom(evidence, ['fever']) &&
      hasAnySymptom(evidence, ['cough']);
    const lowerRespiratorySignal =
      hasAnySymptom(evidence, ['productive cough', 'breathing difficulty', 'shortness of breath', 'chest pain', 'high fever', 'low oxygen']) ||
      broadRespiratoryDifferential ||
      (oxygen !== null && oxygen < 92) ||
      (wbc !== null && wbc > 11000 && hasAnySymptom(evidence, ['cough']));

    if (!lowerRespiratorySignal) {
      return {
        passed: false,
        reason: 'Rejected: pneumonia requires lower respiratory or clinical severity evidence.'
      };
    }
  }

  if (hasCore && !hasDifferentiator) {
    return {
      passed: false,
      reason: 'Rejected: core symptom present but no disease-specific differentiator.'
    };
  }

  return { passed: true, reason: null };
}

function calculateTaskScore(inputSymptoms, disease, clinicalData = {}) {
  const evidence = buildEvidenceSet(inputSymptoms, clinicalData);
  const coreMatches = findMatches(evidence, disease.core);
  const strongMatches = findMatches(evidence, disease.strong || []);
  const supportBuckets = splitSupportByStrength(findMatches(evidence, disease.support));
  const supportMatches = supportBuckets.support;
  const weakMatches = supportBuckets.weak;
  const avoidMatches = findMatches(evidence, disease.avoid);

  const differentiator = applyDifferentiators(disease, evidence, clinicalData);
  const gate = evaluateHardGate(disease, evidence, clinicalData, coreMatches, differentiator);
  const clinicalModifier = gate.passed
    ? applyClinicalModifiers(disease, evidence, clinicalData)
    : { boost: 0, reasons: [], signalCount: 0 };
  const clinicalPenalty = applyClinicalPenalties(disease, clinicalData);
  const missingKeyPenalty = applyMissingKeyIndicatorPenalties(disease, evidence);

  let rawScore = 0;
  if (gate.passed) {
    rawScore =
      (coreMatches.length * WEIGHTS.core) +
      (strongMatches.length * WEIGHTS.strong) +
      (supportMatches.length * WEIGHTS.support) +
      (weakMatches.length * WEIGHTS.weak) +
      (avoidMatches.length * WEIGHTS.avoid) +
      differentiator.boost -
      clinicalPenalty.penalty +
      clinicalModifier.boost;

    rawScore = rawScore * missingKeyPenalty.factor;

  } else {
    rawScore = 0;
  }

  rawScore = Math.max(0, rawScore);

  const positiveSignals =
    coreMatches.length +
    strongMatches.length +
    supportMatches.length +
    weakMatches.length +
    differentiator.signalCount +
    clinicalModifier.signalCount;

  const strongSignalCount = strongMatches.length + differentiator.signalCount + clinicalModifier.signalCount;
  const result = {
    disease: disease.name,
    diseaseData: disease,
    rawScore: Math.round(rawScore * 10) / 10,
    confidence: 0,
    reliability: 'LOW',
    strongSignalCount,
    positiveSignals,
    matched: {
      core: coreMatches,
      strong: strongMatches,
      support: supportMatches,
      weak: weakMatches,
      avoid: avoidMatches,
      differentiators: [...differentiator.reasons, ...clinicalModifier.reasons],
      penalties: [...clinicalPenalty.reasons, ...missingKeyPenalty.reasons]
    }
  };

  if (!gate.passed) result.rejectedReason = gate.reason;
  if (gate.reason && gate.passed) result.gateNote = gate.reason;

  return result;
}

function applyDifferentialConfidenceRules(scores) {
  if (!scores.length) return scores;
  const primary = scores[0];
  return scores.map((score, index) => {
    if (index === 0) return score;
    const cappedConfidence = Math.min(score.confidence, HIGH_CONFIDENCE_CAP_FOR_DIFFERENTIALS, Math.max(1, primary.confidence - 18 - (index * 5)));
    return {
      ...score,
      confidence: cappedConfidence,
      matched: {
        ...score.matched,
        penalties: score.confidence !== cappedConfidence
          ? [...score.matched.penalties, `reduced because ${primary.disease} is the single strongest primary diagnosis`]
          : score.matched.penalties
      }
    };
  });
}

function applyNamedSuppressionRules(scores, evidence, clinicalData) {
  const platelets = toNumber(clinicalData.platelet_count);
  const oxygen = toNumber(clinicalData.oxygen_saturation);
  const wbc = toNumber(clinicalData.wbc_count);
  const hasChronicCough = hasAnySymptom(evidence, ['chronic cough']);
  const hasWeightLoss = hasAnySymptom(evidence, ['weight loss', 'unexplained weight loss']);
  const hasSoreThroat = hasAnySymptom(evidence, ['sore throat']);
  const hasShortnessOfBreath = hasAnySymptom(evidence, ['shortness of breath', 'breathing difficulty']);
  const hasNormalOxygen = oxygen !== null && oxygen >= 95;

  return scores.map(score => {
    let factor = 1;
    const reasons = [];

    if (score.disease === 'Pneumonia' && hasChronicCough && hasWeightLoss) {
      factor *= 0.45;
      reasons.push('chronic cough with weight loss favors tuberculosis over pneumonia');
    }

    if (score.disease === 'Malaria' && platelets !== null && platelets < 150000 && hasAnySymptom(evidence, ['rash', 'retro orbital pain', 'joint pain'])) {
      factor *= 0.5;
      reasons.push('low platelets with dengue-specific symptoms favors dengue over malaria');
    }

    if (score.disease === 'Influenza' && !hasSoreThroat && !hasAnySymptom(evidence, ['sudden onset fever', 'body ache'])) {
      factor *= 0.55;
      reasons.push('missing sore throat or abrupt myalgia pattern reduces influenza');
    }

    if (score.disease === 'Pneumonia' && !hasShortnessOfBreath && hasNormalOxygen && (wbc === null || wbc <= 11000)) {
      factor *= 0.55;
      reasons.push('normal oxygen and no breathlessness reduce pneumonia likelihood');
    }

    if (factor === 1) return score;

    return {
      ...score,
      rawScore: Math.round(score.rawScore * factor * 10) / 10,
      matched: {
        ...score.matched,
        penalties: [...score.matched.penalties, ...reasons]
      }
    };
  });
}

function applyGenericWeakSignalSuppression(scores, symptoms, clinicalData = {}) {
  const normalizedSymptoms = symptoms.map(normalizeText);
  const weakSignalCount = normalizedSymptoms.filter(symptom => WEAK_SYMPTOMS.has(symptom)).length;
  const hasClinicalData = Object.keys(clinicalData || {}).length > 0;
  const hasOnlySparseWeakEvidence = normalizedSymptoms.length <= 2 && weakSignalCount === normalizedSymptoms.length && !hasClinicalData;

  if (!hasOnlySparseWeakEvidence) return scores;

  return scores.map(score => ({
    ...score,
    rawScore: Math.round(score.rawScore * 0.35 * 10) / 10,
    matched: {
      ...score.matched,
      penalties: [
        ...score.matched.penalties,
        'suppressed because sparse nonspecific symptoms such as fatigue, fever, or headache are not enough for diagnosis'
      ]
    }
  }));
}

function applyCategoryCompetition(scores) {
  if (!scores.length) return scores;
  const sorted = [...scores].sort((a, b) => b.rawScore - a.rawScore);
  const top = sorted[0];
  const topHasSpecificPattern = top.strongSignalCount >= 2 || top.rawScore >= 12;

  return sorted.map(score => {
    if (score === top || !topHasSpecificPattern) return score;

    const unrelatedWinner =
      top.diseaseData.category !== score.diseaseData.category &&
      !(
        ['infectious', 'respiratory'].includes(top.diseaseData.category) &&
        ['infectious', 'respiratory'].includes(score.diseaseData.category)
      );

    if (!unrelatedWinner) return score;

    return {
      ...score,
      rawScore: Math.round(score.rawScore * 0.4 * 10) / 10,
      matched: {
        ...score.matched,
        penalties: [...score.matched.penalties, `suppressed because ${top.disease} has stronger disease-specific evidence`]
      }
    };
  });
}

function calculateAbsoluteConfidence(score, maxRawScore) {
  const matched = score.matched || {};
  const differentiatorCount = matched.differentiators?.length || 0;
  const coreCount = matched.core?.length || 0;
  const strongCount = matched.strong?.length || 0;
  const supportCount = matched.support?.length || 0;
  const weakCount = matched.weak?.length || 0;
  const avoidCount = matched.avoid?.length || 0;
  const rawDominance = maxRawScore > 0 ? score.rawScore / maxRawScore : 0;

  let confidence = 15;
  confidence += Math.round(rawDominance * 30);
  confidence += coreCount * 12;
  confidence += strongCount * 8;
  confidence += supportCount * 2;
  confidence += weakCount * 1;
  confidence += differentiatorCount * 10;
  confidence -= avoidCount * 8;

  if (differentiatorCount > 0 && strongCount > 0) {
    confidence += 12;
  }

  if (strongCount === 0 && differentiatorCount === 0) {
    confidence = Math.min(confidence, 39);
  }

  return Math.max(1, Math.min(95, confidence));
}

function normalizeScores(scores) {
  const totalRaw = scores.reduce((sum, score) => sum + Math.max(0, score.rawScore), 0);
  const maxRaw = Math.max(...scores.map(score => score.rawScore), 0);
  return scores.map(score => ({
    ...score,
    normalizedProbability: totalRaw > 0 ? (score.rawScore / totalRaw) * 100 : 0,
    confidence: calculateAbsoluteConfidence(score, maxRaw)
  }));
}

function getReliability(confidence, score) {
  const matched = score.matched || {};
  const clinicalValidation = (matched.differentiators || []).some(reason =>
    /oxygen|platelet|wbc|blood pressure|glucose|tsh|cholesterol|ldl|alt|ast|bmi|mmse|t-score/i.test(reason)
  );
  if (
    confidence >= 80 &&
    score.strongSignalCount >= 2 &&
    (clinicalValidation || ((matched.strong || []).length >= 1 && (matched.differentiators || []).length >= 1) || (matched.strong || []).length >= 2)
  ) return 'HIGH';
  if (confidence >= 45 && score.strongSignalCount >= 1) return 'MEDIUM';
  return 'LOW';
}

function getConfidenceLabel(scores = []) {
  if (!Array.isArray(scores) || scores.length < 2) return 'Low';
  const s1 = scores[0]?.confidence || 0;
  const s2 = scores[1]?.confidence || 0;
  const gap = s1 - s2;
  if (gap >= 4) return 'High';
  if (gap >= 2) return 'Medium';
  return 'Low';
}

function getClinicalImpact(score) {
  const clinicalReasons = (score?.matched?.differentiators || []).filter(reason =>
    /oxygen|platelet|wbc|blood pressure|glucose|hba1c|a1c|hematocrit|heart rate|bmi|cholesterol|ldl|triglyceride|alt|ast|tsh/i.test(reason)
  );
  const impact = Math.min(25, clinicalReasons.length * 8);

  return {
    confidenceBoost: impact,
    summary: impact > 0
      ? `+${impact}% confidence support from clinical data`
      : 'No numeric clinical/lab boost was applied',
    reasons: clinicalReasons
  };
}

function getUrgency(primary, emergencyCheck) {
  if (emergencyCheck.isEmergency || primary?.diseaseData.severity === 'critical') {
    return 'Emergency - seek urgent medical care now';
  }

  if (!primary) return 'Routine - no strong disease pattern detected';
  if (primary.diseaseData.severity === 'high' && primary.confidence >= 50) {
    return 'Urgent - arrange clinician review soon';
  }
  if (primary.confidence >= 50) return 'Moderate - schedule medical follow-up';
  return 'Routine - monitor symptoms and seek care if persistent or worsening';
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function buildReasons(score, isPrimary, primaryScore) {
  const reasons = [];
  const matched = score.matched;

  if (matched.core.length) reasons.push(`Core symptoms matched: ${matched.core.join(', ')}`);
  if (matched.strong.length) reasons.push(`Strong signals matched: ${matched.strong.join(', ')}`);
  if (matched.support.length) reasons.push(`Supportive findings: ${matched.support.slice(0, 4).join(', ')}`);
  if (matched.weak?.length) reasons.push(`Weak nonspecific findings: ${matched.weak.slice(0, 4).join(', ')}`);
  matched.differentiators.forEach(reason => reasons.push(`Differentiator: ${reason}`));
  if (matched.avoid.length) reasons.push(`Against diagnosis: ${matched.avoid.join(', ')}`);
  matched.penalties.slice(0, 2).forEach(reason => reasons.push(`Reduced because ${reason}.`));

  if (!isPrimary && primaryScore) {
    const gap = Math.max(0, Math.round(primaryScore.confidence - score.confidence));
    reasons.push(`Why not top: ${gap}% lower confidence than ${primaryScore.disease} due to fewer disease-specific signals.`);
  }

  return reasons.length ? reasons : ['Limited matching evidence after applying clinical filters.'];
}

function buildRejected(scored, selected) {
  const selectedDiseases = new Set(selected.map(score => score.disease));
  return scored
    .filter(score => !selectedDiseases.has(score.disease))
    .slice(0, 8)
    .map(score => ({
      disease: score.disease,
      reason: score.rejectedReason || score.matched.penalties[0] || 'Lower score after disease-specific filtering.',
      rawScore: score.rawScore
    }));
}

function buildInterpretation(primary) {
  if (!primary) {
    return 'No supported disease pattern crossed the minimum evidence threshold.';
  }

  const topReasons = [
    ...primary.matched.differentiators,
    ...primary.matched.core,
    ...primary.matched.strong
  ].slice(0, 2);

  const reasonText = topReasons.length
    ? ` due to ${topReasons.join(' with ')}`
    : ' based on the strongest available clinical pattern';

  return `Findings most strongly suggest ${primary.disease}${reasonText}.`;
}

function getDiseaseSignalSet(diseaseData) {
  return Array.from(new Set([
    ...(diseaseData.core || []),
    ...(diseaseData.strong || []),
    ...(diseaseData.support || [])
  ].map(normalizeText).filter(Boolean)));
}

function getMatchedSignals(score) {
  const matched = score.matched || {};
  return Array.from(new Set([
    ...(matched.core || []),
    ...(matched.strong || []),
    ...(matched.support || []),
    ...(matched.weak || [])
  ].map(normalizeText).filter(Boolean)));
}

function checkEmergency(inputSymptoms = [], clinicalData = {}) {
  const normalizedInput = (inputSymptoms || []).map(normalizeText);
  const hasCriticalSymptom = normalizedInput.some(symptom => EMERGENCY_SYMPTOMS.has(symptom));
  if (hasCriticalSymptom) {
    return {
      isEmergency: true,
      symptom: normalizedInput.find(symptom => EMERGENCY_SYMPTOMS.has(symptom)),
      triggerDisease: 'Critical symptom override',
      severity: 'critical'
    };
  }

  const oxygen = toNumber(clinicalData.oxygen_saturation);
  if (oxygen !== null && oxygen < 88) {
    return {
      isEmergency: true,
      symptom: `very low oxygen saturation (${oxygen}%)`,
      triggerDisease: 'Critical oxygen override',
      severity: 'critical'
    };
  }

  const platelets = toNumber(clinicalData.platelet_count);
  if (platelets !== null && platelets < 50000) {
    return {
      isEmergency: true,
      symptom: `very low platelet count (${platelets})`,
      triggerDisease: 'Critical platelet override',
      severity: 'critical'
    };
  }

  const tempC = toNumber(clinicalData.temperature_c) ?? toNumber(clinicalData.temp_c);
  const feverDays = toNumber(clinicalData.fever_days) ?? toNumber(clinicalData.fever_duration_days);
  if (tempC !== null && feverDays !== null && tempC >= 39 && feverDays >= 3) {
    return {
      isEmergency: true,
      symptom: 'very high fever for multiple days',
      triggerDisease: 'Dengue Fever / Typhoid Fever risk pattern',
      severity: 'critical'
    };
  }

  const evidence = buildEvidenceSet(inputSymptoms, clinicalData);

  for (const disease of diseaseDataset) {
    const matchedRedFlag = disease.redFlags.find(redFlag =>
      evidence.some(input => symptomMatches(input, redFlag))
    );

    if (matchedRedFlag) {
      return {
        isEmergency: true,
        symptom: matchedRedFlag,
        triggerDisease: disease.name,
        severity: disease.severity
      };
    }
  }

  return { isEmergency: false };
}

function predictDiseases(inputSymptoms, explicitClinicalData = {}) {
  const { symptoms, clinicalData } = extractClinicalData(inputSymptoms, explicitClinicalData);
  const clinicalErrors = validateClinicalData(clinicalData);
  if (clinicalErrors.length > 0) {
    throw new Error(`Invalid clinical data: ${clinicalErrors.join('; ')}`);
  }
  const evidence = buildEvidenceSet(symptoms, clinicalData);

  if (!symptoms.length && Object.keys(clinicalData).length === 0) {
    return {
      error: 'No symptoms or clinical data provided',
      primaryDiagnosis: null,
      differentials: [],
      recommendedTests: [],
      urgency: 'Routine - provide symptoms or clinical data for screening',
      interpretation: 'No supported disease pattern crossed the minimum evidence threshold.',
      predictions: []
    };
  }

  const emergencyCheck = checkEmergency(symptoms, clinicalData);
  const allScores = diseaseDataset
    .map(disease => calculateTaskScore(symptoms, disease, clinicalData))
    .sort((a, b) => b.rawScore - a.rawScore);

  const gatedScores = allScores.filter(score =>
    score.rawScore >= MIN_RAW_SCORE &&
    score.positiveSignals > 0 &&
    !score.rejectedReason
  );

  const scored = normalizeScores(
    applyCategoryCompetition(
      applyGenericWeakSignalSuppression(
        applyNamedSuppressionRules(gatedScores, evidence, clinicalData),
        symptoms,
        clinicalData
      )
        .filter(score => score.rawScore >= MIN_RAW_SCORE)
    )
  ).filter(score => score.confidence >= MIN_CONFIDENCE)
    .sort((a, b) => b.confidence - a.confidence || b.rawScore - a.rawScore);

  const normalized = applyDifferentialConfidenceRules(scored.slice(0, 3)).map(score => ({
    ...score,
    confidence: Math.max(0, Math.min(MAX_DISPLAY_CONFIDENCE, score.confidence))
  }));

  normalized.forEach(score => {
    score.reliability = getReliability(score.confidence, score);
  });

  const primary = normalized[0] || null;
  const differentials = normalized.slice(1);
  const urgency = getUrgency(primary, emergencyCheck);
  const recommendedTests = primary
    ? Array.from(new Set([
        ...primary.diseaseData.recommendedTests,
        ...differentials.flatMap(score => score.diseaseData.recommendedTests.slice(0, 2))
      ])).slice(0, 8)
    : [];

  const response = {
    primaryDiagnosis: primary
      ? {
          disease: primary.disease,
          confidence: formatPercent(primary.confidence),
          reliability: primary.reliability,
          confidenceLevel: primary.reliability.toLowerCase(),
          matchedSymptoms: getMatchedSignals(primary),
          missingKeyIndicators: getDiseaseSignalSet(primary.diseaseData)
            .filter(signal => !getMatchedSignals(primary).some(matched => symptomMatches(matched, signal)))
            .slice(0, 6),
          labImpact: getClinicalImpact(primary),
          explanation: buildReasons(primary, true, primary),
          reason: buildReasons(primary, true, primary)
        }
      : null,
    differentials: differentials.map(score => ({
      disease: score.disease,
      confidence: formatPercent(score.confidence),
      reliability: score.reliability,
      explanation: buildReasons(score, false, primary),
      reason: buildReasons(score, false, primary)
    })),
    recommendedTests,
    urgency,
    interpretation: buildInterpretation(primary),
    rejected: buildRejected(allScores, normalized),
    metadata: {
      engine: 'rule-based-clinical-v3-gated',
      diseasesEvaluated: diseaseDataset.length,
      symptomsAnalyzed: symptoms.length,
      clinicalFieldsAnalyzed: Object.keys(clinicalData).length
      ,
      clinicalWarnings: getClinicalWarnings(clinicalData)
    },
    predictions: normalized.map(score => {
      const matchedSymptoms = getMatchedSignals(score);
      const diseaseSignals = getDiseaseSignalSet(score.diseaseData);
      const missingSignals = diseaseSignals
        .filter(signal => !matchedSymptoms.some(matched => symptomMatches(matched, signal)))
        .slice(0, 6);

      return {
        disease: score.disease,
        probability: formatPercent(score.confidence),
        confidence: formatPercent(score.confidence),
        reliability: score.reliability,
        confidenceLevel: score.reliability.toLowerCase(),
        severity: score.diseaseData.severity,
        matched: matchedSymptoms.slice(0, 8),
        missing: missingSignals,
        labImpact: getClinicalImpact(score),
        advice: score.diseaseData.recommendedTests.length
          ? `Confirm with: ${score.diseaseData.recommendedTests.slice(0, 2).join(', ')}.`
          : 'Consult a qualified clinician for confirmation.',
        reason: buildReasons(score, score === primary, primary)
      };
    }),
    confidence: getConfidenceLabel(normalized),
    next_steps: recommendedTests.length > 0
      ? recommendedTests.slice(0, 4)
      : ['Provide more disease-specific symptoms', 'Consult a qualified clinician'],
    warning: emergencyCheck.isEmergency
      ? [emergencyCheck.symptom || 'Emergency red-flag symptom detected']
      : [urgency],
    disclaimer: 'This is not a diagnosis. Always consult a healthcare professional.'
  };

  if (emergencyCheck.isEmergency) {
    response.emergency = {
      isEmergency: true,
      message: `Emergency signal detected: ${emergencyCheck.symptom}. Seek immediate medical attention.`,
      likelyCause: emergencyCheck.triggerDisease,
      severity: emergencyCheck.severity
    };
  }

  return response;
}

function getAvailableSymptoms() {
  const allSymptoms = new Set();
  diseaseDataset.forEach(disease => {
    [
      ...disease.core,
      ...disease.strong,
      ...disease.support,
      ...disease.avoid,
      ...disease.redFlags
    ].forEach(symptom => allSymptoms.add(normalizeText(symptom)));
  });
  return Array.from(allSymptoms).sort();
}

module.exports = {
  predictDiseases,
  getAvailableSymptoms,
  checkEmergency,
  diseaseDataset,
  calculateTaskScore,
  symptomMatches
  ,validateClinicalData
  ,normalizeClinicalData
};
