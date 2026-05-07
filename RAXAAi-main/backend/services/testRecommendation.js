/**
 * testRecommendation.js
 * Suggests clinical tests based on identified conditions.
 */

const TEST_MAPPING = {
  'Dengue': [
    { test: 'CBC (Complete Blood Count)', reason: 'To check platelet and WBC counts' },
    { test: 'NS1 Antigen Test', reason: 'For early dengue detection' },
    { test: 'Dengue IgM/IgG', reason: 'To detect antibodies' }
  ],
  'Tuberculosis': [
    { test: 'Chest X-Ray', reason: 'To look for lung abnormalities' },
    { test: 'Sputum Culture', reason: 'To detect TB bacteria' },
    { test: 'Mantoux Test', reason: 'Skin test for TB exposure' }
  ],
  'Malaria': [
    { test: 'Peripheral Smear', reason: 'To visualize parasites in blood' },
    { test: 'Rapid Diagnostic Test (RDT)', reason: 'Quick detection of malaria antigens' }
  ],
  'Thyroid Disorder': [
    { test: 'Thyroid Profile (T3, T4, TSH)', reason: 'To evaluate thyroid function' },
    { test: 'Anti-TPO Antibodies', reason: 'To check for autoimmune causes' }
  ]
};

function getRecommendations(disease) {
  return TEST_MAPPING[disease] || [
    { test: 'General Health Check-up', reason: 'Consult a clinician for detailed evaluation' }
  ];
}

module.exports = { getRecommendations };
