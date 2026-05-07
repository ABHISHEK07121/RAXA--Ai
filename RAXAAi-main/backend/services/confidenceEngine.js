/**
 * confidenceEngine.js
 * Calculates confidence and data completeness for RAXA results.
 */

const REQUIRED_FIELDS = {
  // Tier 1 High Priority
  'Dengue': ['platelet_count', 'fever', 'body_aches', 'rash'],
  'Malaria': ['fever', 'chills', 'sweating'],
  'Typhoid': ['prolonged_fever', 'abdominal_pain'],
  'Tuberculosis': ['chronic_cough', 'weight_loss', 'night_sweats'],
  'Appendicitis': ['abdominal_pain', 'nausea', 'fever'],
  
  // Tier 2
  'Diabetes': ['frequent_urination', 'increased_thirst', 'blood_sugar'],
  'Hypertension': ['bp_reading', 'headache'],
  'Asthma': ['shortness_breath', 'wheezing'],
  'Food Poisoning': ['vomiting', 'diarrhea'],
  'Gastritis': ['stomach_pain'],
  'Thyroid Disorder': ['tsh_level', 'fatigue', 'weight_change'],
  'Jaundice': ['yellow_skin', 'dark_urine'],
  'Chickenpox': ['itchy_rash', 'fever'],
  'Measles': ['high_fever', 'rash', 'cough'],
  'UTI': ['burning_urination'],
  'Kidney Stones': ['flank_pain', 'blood_urine'],
  'Peptic Ulcer': ['burning_stomach_pain'],
  'Gastroenteritis': ['vomiting', 'diarrhea'],
  
  // Tier 3 Low Priority - basic fields
  'Common Cold': ['runny_nose'],
  'Migraine': ['severe_headache'],
  'Allergy': ['sneezing'],
  'Viral Fever': ['fever'],
  'Skin Infection': ['redness'],
  'Fungal Infection': ['itching'],
  'Acne': ['pimples'],
  'Constipation': ['hard_stools'],
  'Dehydration': ['thirst'],
  'Anemia': ['fatigue'],
  'Sinusitis': ['facial_pain'],
  'Conjunctivitis': ['red_eyes'],
  'Chikungunya': ['joint_pain', 'high_fever'],
  'Mumps': ['swollen_jaw']
};

function calculateConfidence(disease, data) {
  const required = REQUIRED_FIELDS[disease] || ['age', 'gender'];
  let filledCount = 0;
  let missing = [];

  required.forEach(field => {
    if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
      filledCount++;
    } else {
      missing.push(field.replace(/_/g, ' '));
    }
  });

  const completeness = (filledCount / required.length) * 100;
  
  let level = 'Low';
  if (completeness >= 80) level = 'High';
  else if (completeness >= 50) level = 'Medium';

  return {
    level,
    score: Math.round(completeness),
    missingFields: missing,
    message: missing.length > 0 ? `Missing key inputs: ${missing.join(', ')}` : 'Data complete for this condition'
  };
}

module.exports = { calculateConfidence };
