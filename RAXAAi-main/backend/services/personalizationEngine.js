/**
 * personalizationEngine.js
 * Adjusts clinical scores based on age, gender, and context.
 */

function adjustScore(disease, score, data) {
  let adjusted = score;
  const age = parseInt(data.q2) || 0;
  const gender = data.q3 || '';

  // Age-based adjustments
  if (age > 60) {
    if (['Pneumonia', 'Heart Disease', 'Diabetes'].includes(disease)) adjusted += 10;
  }
  if (age < 12) {
    if (['Dengue', 'Viral Infection'].includes(disease)) adjusted += 5;
  }

  // Gender-based adjustments
  if (gender === 'Female') {
    if (disease === 'Thyroid Disorder') adjusted += 15;
    if (disease === 'Anemia') adjusted += 10;
  }

  // Location/Weather (simulated context)
  if (data.weatherExposure?.toLowerCase().includes('monsoon')) {
    if (['Dengue', 'Malaria', 'Typhoid'].includes(disease)) adjusted += 10;
  }

  return Math.min(Math.max(adjusted, 0), 99);
}

module.exports = { adjustScore };
