/**
 * explainabilityEngine.js
 * Generates human-readable explanations for clinical reasoning.
 */

function generateExplanation(disease, evidence, confidence) {
  const why = [];
  const whyNot = [];

  // Positive Evidence
  evidence.positive.forEach(item => why.push(`${item.charAt(0).toUpperCase() + item.slice(1)} reported`));
  evidence.clinical.forEach(item => why.push(`Clinical signal: ${item}`));

  // Negative / Missing Evidence
  evidence.negative.forEach(item => whyNot.push(item));
  confidence.missingFields.forEach(field => whyNot.push(`Missing data: ${field}`));

  return {
    supportingEvidence: why,
    conflictingEvidence: whyNot,
    summary: `Identified based on ${why.length} supporting signals and ${whyNot.length} missing/conflicting signals.`
  };
}

module.exports = { generateExplanation };
