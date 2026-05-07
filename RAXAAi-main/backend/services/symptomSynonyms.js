/**
 * Symptom Synonyms for Enhanced Fuzzy Matching
 * Maps common symptom variations to canonical forms
 */

const SYMPTOM_SYNONYMS = {
  fever: {
    canonical: 'fever',
    synonyms: ['fever', 'temperature', 'pyrexia', 'hot', 'burning up', 'feeling hot']
  },
  'high fever': {
    canonical: 'high fever',
    synonyms: ['high fever', 'very high fever']
  },
  'sudden onset fever': {
    canonical: 'sudden onset fever',
    synonyms: ['sudden onset fever', 'abrupt fever']
  },
  'prolonged fever': {
    canonical: 'prolonged fever',
    synonyms: ['prolonged fever', 'fever for weeks', 'fever more than a week', 'long fever']
  },
  cough: {
    canonical: 'cough',
    synonyms: ['cough', 'coughing', 'hacking cough']
  },
  'dry cough': {
    canonical: 'dry cough',
    synonyms: ['dry cough']
  },
  'productive cough': {
    canonical: 'productive cough',
    synonyms: ['productive cough', 'cough with phlegm', 'cough with mucus', 'phlegm cough']
  },
  'chronic cough': {
    canonical: 'chronic cough',
    synonyms: ['chronic cough', 'persistent cough', 'cough for weeks', 'long cough']
  },
  'headache': {
    canonical: 'headache',
    synonyms: ['headache', 'head pain', 'head hurts', 'migraine']
  },
  'fatigue': {
    canonical: 'fatigue',
    synonyms: ['fatigue', 'tired', 'exhausted', 'weakness', 'lethargy']
  },
  pain: {
    canonical: 'pain',
    synonyms: ['pain', 'hurts', 'ache', 'sore', 'hurting']
  },
  'joint pain': {
    canonical: 'joint pain',
    synonyms: ['joint pain', 'arthralgia', 'joints hurt', 'joint ache']
  },
  'abdominal pain': {
    canonical: 'abdominal pain',
    synonyms: ['abdominal pain', 'stomach pain', 'belly ache', 'tummy pain']
  },
  nausea: {
    canonical: 'nausea',
    synonyms: ['nausea', 'queasy', 'sick feeling', 'want to vomit']
  },
  vomiting: {
    canonical: 'vomiting',
    synonyms: ['vomiting', 'throwing up', 'puking', 'vomit']
  },
  diarrhea: {
    canonical: 'diarrhea',
    synonyms: ['diarrhea', 'loose stools', 'runny stools', 'watery stools']
  },
  'shortness of breath': {
    canonical: 'shortness of breath',
    synonyms: ['shortness of breath', 'difficulty breathing', 'breathless', 'out of breath']
  },
  rash: {
    canonical: 'rash',
    synonyms: ['rash', 'skin rash', 'red spots', 'hives', 'blotches']
  },
  'runny nose': {
    canonical: 'runny nose',
    synonyms: ['runny nose', 'rhinorrhea', 'drippy nose', 'nasal discharge']
  },
  sneezing: {
    canonical: 'sneezing',
    synonyms: ['sneezing', 'sneeze', 'achoo']
  },
  'sore throat': {
    canonical: 'sore throat',
    synonyms: ['sore throat', 'scratchy throat', 'throat pain']
  },
  chills: {
    canonical: 'chills',
    synonyms: ['chills', 'shivering', 'shivers', 'feeling cold']
  },
  sweating: {
    canonical: 'sweating',
    synonyms: ['sweating', 'sweaty', 'night sweats', 'profuse sweating']
  },
  'weight loss': {
    canonical: 'weight loss',
    synonyms: ['weight loss', 'losing weight', 'unexplained weight loss']
  },
  'weight change': {
    canonical: 'weight change',
    synonyms: ['weight change', 'change in weight']
  },
  'low platelets': {
    canonical: 'low platelets',
    synonyms: ['low platelets', 'low platelet count', 'thrombocytopenia']
  },
  'body ache': {
    canonical: 'body ache',
    synonyms: ['body ache', 'body aches', 'body pain', 'muscle pain', 'myalgia', 'aches']
  },
  'chest pain': {
    canonical: 'chest pain',
    synonyms: ['chest pain', 'chest tightness', 'angina']
  },
  dizziness: {
    canonical: 'dizziness',
    synonyms: ['dizziness', 'lightheaded', 'vertigo', 'woozy']
  },
'blurred_vision': {
    canonical: 'blurred vision',
    synonyms: ['blurred vision', 'fuzzy vision', 'cant_see_clearly']
  },
  'frequent_urination': {
    canonical: 'frequent urination',
    synonyms: ['frequent urination', 'urinating often', 'peeing a lot']
  },
  'increased_thirst': {
    canonical: 'increased thirst',
    synonyms: ['increased thirst', 'very thirsty', 'polydipsia']
  },
  itching: {
    canonical: 'itching',
    synonyms: ['itching', 'itchy', 'pruritus']
  },
  wheezing: {
    canonical: 'wheezing',
    synonyms: ['wheezing', 'whistling breathing']
  },
  dehydration: {
    canonical: 'dehydration',
    synonyms: ['dehydration', 'dry mouth', 'thirst', 'dark urine']
  }
};

function getCanonicalSymptoms(symptomList) {
  const normalized = symptomList.map(s => normalizeSymptom(s));
  const canonicalList = [];
  
  normalized.forEach(symptom => {
    let matched = false;
    for (const [canonical, data] of Object.entries(SYMPTOM_SYNONYMS)) {
      if (data.synonyms.some(syn => symptom === normalizeSymptom(syn))) {
        canonicalList.push(canonical);
        matched = true;
        break;
      }
    }
    if (!matched) {
      canonicalList.push(symptom);
    }
  });
  
  return canonicalList;
}

function normalizeSymptom(symptom) {
  return symptom.toString().toLowerCase().trim();
}

module.exports = {
  SYMPTOM_SYNONYMS,
  getCanonicalSymptoms,
  normalizeSymptom
};

