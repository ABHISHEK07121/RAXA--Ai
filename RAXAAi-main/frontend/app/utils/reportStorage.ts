"use client";

export const REPORT_STORAGE_KEY = "raxa_health_report";
const LEGACY_RESULT_STORAGE_KEY = "raxa_result";
const LEGACY_INPUTS_STORAGE_KEY = "raxa_inputs";

export interface HealthReportCondition {
  name: string;
  confidence: number;
  severity: string;
  evidence: string[];
  recommendedTests: string[];
}

export interface HealthReportData {
  source: string;
  title: string;
  generatedAt: string;
  summary: string;
  possibleConditions: HealthReportCondition[];
  why: string[];
  riskFactors: string[];
  urgency: string;
  nextSteps: string[];
  doctorAdvice: string;
  diseaseDetails: {
    description: string;
    recommendation: string;
    lifestyle: string;
  };
  patientProfile: Record<string, string | number>;
  raw?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function hasAnswer(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && value !== "";
}

function dedupeStrings(values: Array<string | undefined | null>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim()))];
}

function toConfidenceLabel(score: number): string {
  if (score >= 75) {
    return "High confidence";
  }

  if (score >= 45) {
    return "Moderate confidence";
  }

  return "Preliminary confidence";
}

function toUrgencyLabel(score: number): string {
  if (score >= 80) {
    return "Urgent - seek medical review as soon as possible";
  }

  if (score >= 55) {
    return "Moderate - arrange a clinician follow-up soon";
  }

  return "Routine - monitor symptoms and follow up if they persist";
}

function buildCondition(
  name: string,
  confidence: number,
  severity: string,
  evidence: string[] = [],
  recommendedTests: string[] = [],
): HealthReportCondition {
  return {
    name,
    confidence: Math.round(confidence),
    severity,
    evidence: dedupeStrings(evidence),
    recommendedTests: dedupeStrings(recommendedTests),
  };
}

export function buildAdaptiveHealthReport(
  result: Record<string, unknown>,
  answers: Record<string, unknown>,
): HealthReportData {
  const topDiseases = Array.isArray(result.top_diseases) ? result.top_diseases : [];
  const normalizedTopDiseases = topDiseases.filter(isObject);
  const primaryDisease = normalizedTopDiseases[0];
  const primaryScore = typeof primaryDisease?.risk_percentage === "number" ? primaryDisease.risk_percentage : 0;
  const selectedSymptoms = Array.isArray(answers.q1) ? answers.q1.map(String) : [];
  const primaryTests = Array.isArray(primaryDisease?.recommended_tests) ? primaryDisease.recommended_tests.filter(isObject) : [];
  const emergencyWarning = typeof result.emergency_warning === "string" ? result.emergency_warning : "";

  const possibleConditions = normalizedTopDiseases.map((disease) =>
    buildCondition(
      typeof disease.disease === "string" ? disease.disease : "Unknown condition",
      typeof disease.risk_percentage === "number" ? disease.risk_percentage : 0,
      typeof disease.risk_level === "string" ? `${disease.risk_level} risk` : toConfidenceLabel(typeof disease.risk_percentage === "number" ? disease.risk_percentage : 0),
      Array.isArray(disease.explanation) ? [] : (isObject(disease.explanation) && Array.isArray(disease.explanation.supportingEvidence) ? disease.explanation.supportingEvidence.map(String) : []),
      Array.isArray(disease.recommended_tests)
        ? disease.recommended_tests.filter(isObject).map((test) => {
            const testName = typeof test.test === "string" ? test.test : "Clinical test";
            const reason = typeof test.reason === "string" ? test.reason : "Further evaluation";
            return `${testName}: ${reason}`;
          })
        : [],
    ),
  );

  const summary =
    emergencyWarning ||
    (primaryDisease && typeof primaryDisease.disease === "string"
      ? `${primaryDisease.disease} ranked highest after combining symptoms, clinical inputs, and explainability signals from the adaptive screening flow.`
      : "Adaptive screening completed without a strong match.");

  const nextSteps = emergencyWarning
    ? [
        "Seek immediate in-person medical care.",
        "Do not rely on this screening result alone for emergency symptoms.",
      ]
    : dedupeStrings([
        ...primaryTests.map((test) => {
          const testName = typeof test.test === "string" ? test.test : "Clinical test";
          const reason = typeof test.reason === "string" ? test.reason : "Further evaluation";
          return `${testName}: ${reason}`;
        }),
        "Review these findings with a qualified healthcare professional.",
      ]);

  return {
    source: "adaptive-screening",
    title: "Adaptive Screening Report",
    generatedAt: typeof result.timestamp === "string" ? result.timestamp : new Date().toISOString(),
    summary,
    possibleConditions,
    why: dedupeStrings([
      ...selectedSymptoms,
      ...possibleConditions.flatMap((condition) => condition.evidence),
    ]).slice(0, 8),
    riskFactors: dedupeStrings([
      hasAnswer(answers.q2) ? `Age: ${String(answers.q2)}` : undefined,
      hasAnswer(answers.q3) ? `Gender: ${String(answers.q3)}` : undefined,
      hasAnswer(answers.bmi) ? `BMI: ${String(answers.bmi)}` : undefined,
      hasAnswer(answers.weatherExposure) ? `Exposure context: ${String(answers.weatherExposure)}` : undefined,
      selectedSymptoms.length > 0 ? `Primary concerns: ${selectedSymptoms.join(", ")}` : undefined,
    ]),
    urgency: emergencyWarning ? "Emergency - seek care immediately" : toUrgencyLabel(primaryScore),
    nextSteps,
    doctorAdvice:
      typeof result.medical_disclaimer === "string"
        ? result.medical_disclaimer
        : "Use this report to support, not replace, professional medical evaluation.",
    diseaseDetails: {
      description:
        isObject(primaryDisease?.explanation) && typeof primaryDisease.explanation.summary === "string"
          ? primaryDisease.explanation.summary
          : "RAXA used symptom and clinical evidence to rank the most likely conditions from the adaptive flow.",
      recommendation:
        primaryTests.length > 0
          ? `Recommended follow-up tests: ${primaryTests.map((test) => String(test.test || "Clinical test")).join(", ")}.`
          : "A clinician review is recommended to confirm these findings.",
      lifestyle:
        "Monitor symptoms closely, stay hydrated, and follow up promptly if symptoms worsen or new red flags appear.",
    },
    patientProfile: {
      age: hasAnswer(answers.q2) ? String(answers.q2) : "Not provided",
      gender: hasAnswer(answers.q3) ? String(answers.q3) : "Not provided",
      weightKg: hasAnswer(answers.weight_kg) ? String(answers.weight_kg) : "Not provided",
      heightCm: hasAnswer(answers.height_cm) ? String(answers.height_cm) : "Not provided",
      bmi: hasAnswer(answers.bmi) ? String(answers.bmi) : "Not calculated",
      primaryConcern: selectedSymptoms.length > 0 ? selectedSymptoms.join(", ") : "Not provided",
    },
    raw: result,
  };
}

export function buildMultiDiseaseHealthReport(
  result: Record<string, unknown>,
  formData: Record<string, unknown>,
): HealthReportData {
  const allRisks = Array.isArray(result.allDiseaseRisks) ? result.allDiseaseRisks.filter(isObject) : [];
  const primaryScore = typeof result.primaryRiskScore === "number" ? result.primaryRiskScore * 100 : 0;
  const topRisks = allRisks.slice(0, 5);

  const possibleConditions = topRisks.map((risk) =>
    buildCondition(
      typeof risk.diseaseName === "string" ? risk.diseaseName : "Unknown condition",
      typeof risk.riskScore === "number" ? risk.riskScore * 100 : 0,
      typeof risk.riskLevel === "string" ? risk.riskLevel : toConfidenceLabel(typeof risk.riskScore === "number" ? risk.riskScore * 100 : 0),
      Array.isArray(risk.contributingFactors) ? risk.contributingFactors.map(String) : [],
      [],
    ),
  );

  const primaryFactors = Array.isArray(result.primaryFactors) ? result.primaryFactors.map(String) : [];
  const preventionRecommendations = Array.isArray(result.preventionRecommendations)
    ? result.preventionRecommendations.map(String)
    : [];
  const immediateActions = Array.isArray(result.immediateActions) ? result.immediateActions.map(String) : [];
  const followUps = Array.isArray(result.requiredFollowUps) ? result.requiredFollowUps.map(String) : [];
  const diseaseOfInterest =
    typeof result.diseaseOfInterest === "string"
      ? result.diseaseOfInterest
      : (typeof formData.disease_of_interest === "string" ? formData.disease_of_interest : "Selected condition");

  return {
    source: "multi-disease",
    title: "Detailed Disease Screening Report",
    generatedAt: new Date().toISOString(),
    summary:
      possibleConditions.length > 0
        ? `${possibleConditions[0].name} emerged as the strongest detected risk while screening for ${diseaseOfInterest}.`
        : `A detailed screening was completed for ${diseaseOfInterest}.`,
    possibleConditions,
    why: dedupeStrings([
      ...primaryFactors,
      ...possibleConditions.flatMap((condition) => condition.evidence),
    ]).slice(0, 8),
    riskFactors: dedupeStrings([
      hasAnswer(formData.age) ? `Age: ${String(formData.age)}` : undefined,
      hasAnswer(formData.gender) ? `Gender: ${String(formData.gender)}` : undefined,
      hasAnswer(formData.bmi) ? `BMI: ${String(formData.bmi)}` : undefined,
      hasAnswer(formData.blood_glucose) ? `Blood glucose: ${String(formData.blood_glucose)}` : undefined,
      hasAnswer(formData.systolic_bp) ? `Systolic BP: ${String(formData.systolic_bp)}` : undefined,
      hasAnswer(formData.total_cholesterol) ? `Total cholesterol: ${String(formData.total_cholesterol)}` : undefined,
      hasAnswer(formData.disease_of_interest) ? `Screened for: ${String(formData.disease_of_interest)}` : undefined,
    ]),
    urgency: typeof result.primaryRiskCategory === "string" ? result.primaryRiskCategory : toUrgencyLabel(primaryScore),
    nextSteps: dedupeStrings([
      ...immediateActions,
      ...followUps,
      ...preventionRecommendations,
    ]),
    doctorAdvice:
      primaryScore >= 60
        ? "Arrange a clinician review soon and bring this report with your recorded clinical values."
        : "Use this screening as an early warning tool and confirm any persistent concerns with a clinician.",
    diseaseDetails: {
      description: `This report focuses on ${diseaseOfInterest} and compares its risk profile with the other supported diseases in the screening engine.`,
      recommendation:
        preventionRecommendations.length > 0
          ? `Prevention guidance: ${preventionRecommendations.join(", ")}.`
          : "Maintain follow-up monitoring and discuss the result with a clinician if risk remains elevated.",
      lifestyle:
        "Keep tracking your core clinical indicators, maintain medication and lifestyle routines, and repeat screening when follow-up is due.",
    },
    patientProfile: {
      diseaseOfInterest,
      age: hasAnswer(formData.age) ? String(formData.age) : "Not provided",
      gender: hasAnswer(formData.gender) ? String(formData.gender) : "Not provided",
      bmi: hasAnswer(formData.bmi) ? String(formData.bmi) : "Not provided",
      systolicBp: hasAnswer(formData.systolic_bp) ? String(formData.systolic_bp) : "Not provided",
      bloodGlucose: hasAnswer(formData.blood_glucose) ? String(formData.blood_glucose) : "Not provided",
    },
    raw: result,
  };
}

function buildLegacyHealthReport(
  result: Record<string, unknown>,
  inputs: Record<string, unknown>,
): HealthReportData | null {
  if (Array.isArray(result.predictions)) {
    const predictions = result.predictions.filter(isObject);

    return {
      source: "legacy-symptom-check",
      title: "Symptom Prediction Report",
      generatedAt: new Date().toISOString(),
      summary: "This report was restored from the earlier symptom prediction flow.",
      possibleConditions: predictions.map((prediction) =>
        buildCondition(
          typeof prediction.disease === "string" ? prediction.disease : "Unknown condition",
          typeof prediction.probability === "string" ? parseInt(prediction.probability, 10) || 0 : 0,
          typeof prediction.severity === "string" ? prediction.severity : "Preliminary",
          [],
          typeof prediction.advice === "string" ? [prediction.advice] : [],
        ),
      ),
      why: [],
      riskFactors: [],
      urgency: isObject(result.emergency) ? "Emergency - seek care immediately" : "Review the predicted symptoms with a clinician if they persist",
      nextSteps: predictions
        .map((prediction) => (typeof prediction.advice === "string" ? prediction.advice : "Review the predicted symptoms with a clinician."))
        .filter((value, index, array) => array.indexOf(value) === index),
      doctorAdvice: "This legacy symptom check is a lightweight screening aid and should be confirmed clinically.",
      diseaseDetails: {
        description: "A symptom-matching flow was used to rank the most likely conditions.",
        recommendation: "Seek clinical confirmation for persistent or worsening symptoms.",
        lifestyle: "Rest, hydration, and close symptom monitoring are recommended.",
      },
      patientProfile: {},
      raw: result,
    };
  }

  if (typeof result.diabetes_risk === "number" || typeof result.hypertension_risk === "number") {
    const conditions = [
      buildCondition(
        "Diabetes",
        typeof result.diabetes_risk === "number" ? result.diabetes_risk * 100 : 0,
        "Legacy assessment",
      ),
      buildCondition(
        "Hypertension",
        typeof result.hypertension_risk === "number" ? result.hypertension_risk * 100 : 0,
        "Legacy assessment",
      ),
    ];

    return {
      source: "legacy-assessment",
      title: "Legacy Assessment Report",
      generatedAt: new Date().toISOString(),
      summary: "This report was restored from the older clinical assessment flow.",
      possibleConditions: conditions,
      why: [],
      riskFactors: dedupeStrings([
        hasAnswer(inputs.age) ? `Age: ${String(inputs.age)}` : undefined,
        hasAnswer(inputs.bmi) ? `BMI: ${String(inputs.bmi)}` : undefined,
        hasAnswer(inputs.glucose) ? `Glucose: ${String(inputs.glucose)}` : undefined,
        hasAnswer(inputs.systolic_bp) ? `Systolic BP: ${String(inputs.systolic_bp)}` : undefined,
      ]),
      urgency: typeof result.overall_risk === "string" ? result.overall_risk : "Legacy assessment",
      nextSteps: Array.isArray(result.prevention_advice) ? result.prevention_advice.map(String) : [],
      doctorAdvice: "Use these restored results as a reference and confirm them with a clinician if needed.",
      diseaseDetails: {
        description: "The earlier RAXA assessment flow emphasized diabetes and hypertension risk.",
        recommendation: "Review any elevated risk markers with a clinician.",
        lifestyle: "Continue preventive lifestyle changes and follow-up monitoring.",
      },
      patientProfile: {
        age: hasAnswer(inputs.age) ? String(inputs.age) : "Not provided",
        bmi: hasAnswer(inputs.bmi) ? String(inputs.bmi) : "Not provided",
      },
      raw: result,
    };
  }

  return null;
}

export function saveHealthReport(report: HealthReportData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch (error) {
    console.error("Failed to persist health report", error);
  }
}

export function loadHealthReport(): HealthReportData | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedReport = window.localStorage.getItem(REPORT_STORAGE_KEY);
    if (storedReport) {
      const parsed = JSON.parse(storedReport) as HealthReportData;
      if (parsed && Array.isArray(parsed.possibleConditions)) {
        return parsed;
      }
    }

    const legacyResult = window.localStorage.getItem(LEGACY_RESULT_STORAGE_KEY);
    const legacyInputs = window.localStorage.getItem(LEGACY_INPUTS_STORAGE_KEY);
    if (legacyResult) {
      const parsedResult = JSON.parse(legacyResult) as Record<string, unknown>;
      const parsedInputs = legacyInputs ? (JSON.parse(legacyInputs) as Record<string, unknown>) : {};
      return buildLegacyHealthReport(parsedResult, parsedInputs);
    }
  } catch (error) {
    console.error("Failed to load health report", error);
  }

  return null;
}
