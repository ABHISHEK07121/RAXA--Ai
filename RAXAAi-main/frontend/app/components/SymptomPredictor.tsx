"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, ShieldAlert, X } from 'lucide-react';
import DiseaseProbabilityCard from './DiseaseProbabilityCard';
import FinalRecommendationPanel from './FinalRecommendationPanel';
import { getBackendBaseUrl } from '../../utils/apiBase';

import { usePersistentState } from '../hooks/usePersistentState';

interface PredictionResult {
  primaryDiagnosis?: {
    disease: string;
    confidence: string;
    reliability: string;
    explanation?: string[];
    reason: string[];
  } | null;
  differentials?: Array<{
    disease: string;
    confidence: string;
    reliability?: string;
    explanation?: string[];
    reason: string[];
  }>;
  recommendedTests?: string[];
  urgency?: string;
  interpretation?: string;
  predictions: Array<{
    disease: string;
    probability: string;
    confidence?: string;
    reliability?: string;
    severity: string;
    advice: string;
    matched?: string[];
    missing?: string[];
    reason?: string[];
  }>;
  emergency?: {
    isEmergency: boolean;
    message: string;
    symptom?: string;
  };
  rejected?: Array<{
    disease: string;
    reason: string;
    rawScore?: number;
  }>;
}

interface ClinicalField {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  hint?: string;
  lab?: boolean;
}

const symptomCategories = [
  {
    title: 'General',
    symptoms: ['fever', 'prolonged fever', 'headache', 'body ache', 'fatigue', 'weight loss'],
  },
  {
    title: 'Infection-specific',
    symptoms: ['chills', 'sweating', 'rash', 'joint pain', 'retro orbital pain', 'abdominal pain', 'jaundice', 'dark urine'],
  },
  {
    title: 'Respiratory',
    symptoms: ['cough', 'dry cough', 'productive cough', 'chronic cough', 'sore throat', 'shortness of breath', 'wheezing', 'chest tightness'],
  },
  {
    title: 'Metabolic and hormonal',
    symptoms: ['frequent urination', 'increased thirst', 'blurred vision', 'slow wound healing', 'weight change', 'cold intolerance', 'heat intolerance', 'irregular periods', 'acne', 'excess facial hair'],
  },
  {
    title: 'Cardiovascular',
    symptoms: ['chest pain', 'exertional chest pain', 'palpitations', 'dizziness', 'high blood pressure', 'fatigue on exertion'],
  },
  {
    title: 'Neurological',
    symptoms: ['face drooping', 'arm weakness', 'speech difficulty', 'sudden numbness', 'vision loss', 'memory loss', 'confusion', 'seizure', 'loss of consciousness', 'resting tremor', 'bradykinesia'],
  },
  {
    title: 'Bone and joints',
    symptoms: ['joint stiffness', 'joint swelling', 'morning stiffness', 'back pain', 'height loss', 'fragility fracture'],
  },
];

const normalizeSymptomLabel = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const SymptomPredictor: React.FC = () => {
  const [symptomsInput, setSymptomsInput] = usePersistentState('raxa_symptom_input', '');
  const [symptoms, setSymptoms] = usePersistentState<string[]>('raxa_symptom_list', []);
  const [clinicalData, setClinicalData] = usePersistentState<Record<string, string>>('raxa_symptom_clinical_data', {});
  const [hasLabData, setHasLabData] = usePersistentState('raxa_symptom_has_lab_data', false);
  const [prediction, setPrediction] = usePersistentState<PredictionResult | null>('raxa_symptom_prediction', null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = getBackendBaseUrl();

  const clinicalFields: ClinicalField[] = [
    { key: 'blood_glucose', label: 'Blood glucose', unit: 'mg/dL', min: 40, max: 600, hint: 'Random glucose. Diabetes range is often >=200 with symptoms.', lab: true },
    { key: 'fasting_glucose', label: 'Fasting glucose', unit: 'mg/dL', min: 40, max: 400, hint: 'Normal below 100; diabetes range >=126.', lab: true },
    { key: 'hemoglobin_a1c', label: 'HbA1c', unit: '%', min: 3, max: 20, step: 0.1, hint: 'Normal below 5.7%; diabetes range >=6.5%.', lab: true },
    { key: 'heart_rate', label: 'Heart rate', unit: 'bpm', min: 30, max: 220 },
    { key: 'systolic_bp', label: 'Systolic BP', unit: 'mmHg', min: 70, max: 250 },
    { key: 'diastolic_bp', label: 'Diastolic BP', unit: 'mmHg', min: 40, max: 150 },
    { key: 'bmi', label: 'BMI', unit: '', min: 10, max: 80, step: 0.1 },
    { key: 'wbc_count', label: 'WBC', unit: 'cells/uL', min: 1000, max: 50000, hint: 'Normal: 4000-11000 cells/uL.', lab: true },
    { key: 'platelet_count', label: 'Platelets', unit: 'cells/uL', min: 10000, max: 700000, hint: 'Normal: 150000-450000 cells/uL.', lab: true },
    { key: 'oxygen_saturation', label: 'Oxygen', unit: '%', min: 50, max: 100 },
    { key: 'hematocrit', label: 'Hematocrit', unit: '%', min: 10, max: 70, hint: 'Normal: roughly 38-50%.', lab: true },
  ];

  const isSymptomSelected = (symptom: string) => {
    const normalized = normalizeSymptomLabel(symptom);
    return symptoms.some((selected) => normalizeSymptomLabel(selected) === normalized);
  };

  const addSymptomValue = (value: string) => {
    const symptom = normalizeSymptomLabel(value);
    if (symptom && !isSymptomSelected(symptom)) {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const addSymptom = () => {
    if (symptomsInput.trim()) {
      addSymptomValue(symptomsInput);
      setSymptomsInput('');
    }
  };

  const removeSymptom = (indexToRemove: number) => {
    setSymptoms(symptoms.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.length === 0) return;

    setLoading(true);
    setError('');
    setPrediction(null);

    try {
      const cleanedClinicalData = Object.fromEntries(
        Object.entries(clinicalData).filter(([key, value]) => {
          const field = clinicalFields.find((item) => item.key === key);
          return value !== '' && (hasLabData || !field?.lab);
        })
      );
      const symptomPayload = symptoms
        .map(normalizeSymptomLabel)
        .filter(Boolean);

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: symptomPayload, clinicalData: cleanedClinicalData })
      });

      if (!response.ok) {
        throw new Error('Prediction failed');
      }

      const data = await response.json();
      setPrediction(data);
    } catch {
      setError('Prediction service unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const topPredictions = prediction?.predictions.slice(0, 3) || [];
  const maxProb = topPredictions.length > 0 ? 
    parseInt(topPredictions[0].probability) : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-black mb-6 mx-auto w-fit">
          <Zap className="h-4 w-4" />
          Symptom-Based Detection
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
          Analyze Your Symptoms
        </h1>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
          Enter your symptoms to get AI-powered disease predictions with probabilities and emergency alerts.
        </p>
      </motion.div>

      {/* Symptom Input */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 mb-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={symptomsInput}
              onChange={(e) => setSymptomsInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSymptom();
                }
              }}
              placeholder="Enter symptom (e.g. 'high fever', 'chest pain')"
              className="w-full pl-12 pr-24 py-4 border-2 border-slate-200 rounded-2xl focus:border-primary focus:outline-none text-lg font-medium transition-all"
              disabled={loading}
            />
            <motion.button
              type="button"
              onClick={addSymptom}
              disabled={!symptomsInput.trim() || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white px-6 py-2.5 rounded-xl font-black uppercase text-sm tracking-wider shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Add
            </motion.button>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">Select symptoms</p>
              <span className="text-xs font-semibold text-slate-400">{symptoms.length} selected</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {symptomCategories.map((category) => (
                <div key={category.title} className="border-t border-slate-100 pt-3">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                    {category.title}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.symptoms.map((symptom) => {
                      const selected = isSymptomSelected(symptom);
                      return (
                        <button
                          key={symptom}
                          type="button"
                          onClick={() => addSymptomValue(symptom)}
                          disabled={selected || loading}
                          aria-pressed={selected}
                          className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-primary hover:text-primary'
                          } disabled:cursor-default`}
                        >
                          {symptom}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">Optional clinical data</p>
                <p className="text-xs font-semibold text-slate-400">Vitals can be entered anytime. Lab values are optional and hidden unless known.</p>
              </div>
              <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
                {[{ label: 'No', value: false }, { label: 'Yes', value: true }].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setHasLabData(option.value)}
                    className={`min-w-16 rounded-lg px-4 py-2 text-sm font-black ${
                      hasLabData === option.value ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clinicalFields.filter((field) => hasLabData || !field.lab).map((field) => (
                <label key={field.key} className="block">
                  <span className="text-xs font-bold text-slate-500">{field.label}</span>
                  <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                    <input
                      type="number"
                      step={field.step || 1}
                      min={field.min}
                      max={field.max}
                      value={clinicalData[field.key] || ''}
                      onChange={(e) => setClinicalData({ ...clinicalData, [field.key]: e.target.value })}
                      className="w-full bg-transparent px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                      disabled={loading}
                    />
                    <span className="pr-3 text-xs font-bold text-slate-400">{field.unit}</span>
                  </div>
                  {field.hint && <span className="mt-1 block text-[11px] font-semibold text-slate-400">{field.hint}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Symptoms List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
              Selected Symptoms ({symptoms.length})
              {symptoms.length > 0 && (
                <button 
                  type="submit" 
                  disabled={loading}
                  className="ml-auto px-6 py-2 bg-slate-900 text-white font-black rounded-xl text-sm hover:bg-primary transition-all disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Get Prediction'}
                </button>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full text-sm font-medium cursor-pointer group"
                  onClick={() => removeSymptom(index)}
                >
                  {symptom}
                  <div className="w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center group-hover:bg-rose-500 transition-all">
                    <X className="w-3 h-3 text-slate-600 group-hover:text-white" strokeWidth={3} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </form>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center"
          >
            <ShieldAlert className="h-16 w-16 text-rose-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-rose-900 mb-2">Service Unavailable</h3>
            <p className="text-rose-700 mb-6">{error}</p>
            <button 
              onClick={() => setError('')}
              className="px-8 py-3 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-12 text-center"
          >
            <div className="inline-block w-20 h-20 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-8" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Analyzing Symptoms</h3>
            <p className="text-slate-500">AI matching your symptoms against 25+ diseases...</p>
          </motion.div>
        )}

        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Emergency Alert */}
            {prediction.emergency && (
              <motion.div 
                initial={{ scale: 0.95, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8 flex items-start gap-4"
              >
                <ShieldAlert className="h-12 w-12 text-rose-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-xl font-black text-rose-900 mb-2">
                    🚨 EMERGENCY ALERT
                  </h4>
                  <p className="text-rose-800 mb-4">{prediction.emergency.message}</p>
                  <p className="text-sm font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full inline-block">
                    Seek immediate medical attention
                  </p>
                </div>
              </motion.div>
            )}

            {/* Top 3 Predictions */}
            {prediction.primaryDiagnosis && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Primary Diagnosis</p>
                    <h3 className="text-2xl font-black text-slate-900">{prediction.primaryDiagnosis.disease}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase">
                      {prediction.primaryDiagnosis.reliability}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black uppercase">
                      {prediction.primaryDiagnosis.confidence}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm font-black text-slate-700 mb-3">Why this disease?</p>
                    <ul className="space-y-2">
                      {(prediction.primaryDiagnosis.explanation || prediction.primaryDiagnosis.reason).slice(0, 5).map((reason, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-700 mb-3">Why others rejected?</p>
                    <ul className="space-y-2">
                      {(prediction.rejected || []).slice(0, 4).map((item) => (
                        <li key={item.disease} className="text-sm text-slate-600">
                          <span className="font-bold text-slate-900">{item.disease}:</span> {item.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {prediction.differentials && prediction.differentials.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-sm font-black text-slate-700 mb-3">Differential Diagnoses</p>
                    <div className="grid gap-3">
                      {prediction.differentials.slice(0, 3).map((item) => (
                        <div key={item.disease} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <p className="font-black text-slate-900">{item.disease}</p>
                            <span className="text-xs font-black text-slate-500">{item.confidence} / {item.reliability || 'LOW'}</span>
                          </div>
                          <p className="text-sm text-slate-600">{(item.explanation || item.reason)[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {topPredictions.map((pred, index) => (
                <div key={pred.disease} className="space-y-3">
                  <DiseaseProbabilityCard
                    disease={pred.disease}
                    probability={parseInt(pred.probability)}
                    confidence={parseInt(pred.confidence || pred.probability)}
                    confidence_level={pred.reliability || 'LOW'}
                    risk_level={pred.severity}
                    maxProbability={maxProb}
                    isTop={index === 0}
                  />
                  <div className="rounded-2xl border border-slate-100 bg-white p-3 text-xs">
                    <p className="font-black text-emerald-700">Matched symptoms</p>
                    <p className="mt-1 text-slate-600">
                      {pred.matched && pred.matched.length > 0 ? pred.matched.slice(0, 4).join(', ') : 'None captured'}
                    </p>
                    <p className="mt-3 font-black text-rose-700">Missing key symptoms</p>
                    <p className="mt-1 text-slate-600">
                      {pred.missing && pred.missing.length > 0 ? pred.missing.slice(0, 4).join(', ') : 'No major missing signals'}
                    </p>
                  </div>
                </div>
              ))}

            </div>

            {/* Final Recommendation */}
            {topPredictions[0] && (
              <FinalRecommendationPanel
                topDisease={topPredictions[0].disease}
                probability={parseInt(topPredictions[0].probability)}
                confidence={parseInt(topPredictions[0].confidence || topPredictions[0].probability)}
                recommendedTests={(prediction.recommendedTests && prediction.recommendedTests.length > 0
                  ? prediction.recommendedTests
                  : ['Complete Blood Count (CBC)', `Confirmatory test for ${topPredictions[0].disease}`]
                ).map((test) => ({ test, priority: 'High' }))}
                immediateActions={[
                  { action: prediction.interpretation || topPredictions[0].advice, priority: 'High' },
                  { action: prediction.urgency || 'Review with a qualified clinician.', priority: 'High' }
                ]}
                emergencyWarning={prediction.emergency?.message}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SymptomPredictor;
