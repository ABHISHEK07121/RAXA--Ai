"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    ArrowLeft, 
    ShieldCheck, 
    Zap, 
    ChevronRight,
    TrendingUp,
    FileText,
    CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import StepProgress from './StepProgress';
import { DISEASE_CATALOG } from '../data/diseaseCatalog';
import { buildMultiDiseaseHealthReport, hasAnswer, saveHealthReport } from '../utils/reportStorage';
import { clearPersistentValue, usePersistentState } from '../hooks/usePersistentState';
import { getApiV2BaseUrl, getBackendBaseUrl } from '../../utils/apiBase';

const FALLBACK_DISEASES = DISEASE_CATALOG.map((disease) => disease.name);

const FALLBACK_FIELD_CONFIGS: Record<string, { required: string[]; recommended: string[] }> = {
    'Type 2 Diabetes': { required: ['age','gender'], recommended: ['bmi','blood_glucose','fasting_glucose','hemoglobin_a1c','family_history_diabetes','exercise_frequency','smoking_status'] },
    'Hypertension': { required: ['age','gender'], recommended: ['systolic_bp','diastolic_bp','bmi','smoking_status','alcohol_units_per_week','stress_level','family_history_heart_disease'] },
    'Heart Disease': { required: ['age','gender'], recommended: ['systolic_bp','total_cholesterol','hdl_cholesterol','ldl_cholesterol','smoking_status','family_history_heart_disease','exercise_frequency'] },
    'Obesity': { required: ['age','gender'], recommended: ['height_cm','weight_kg','bmi','exercise_frequency','sleep_hours_per_night','stress_level'] },
    'Stroke': { required: ['age','gender'], recommended: ['systolic_bp','total_cholesterol','smoking_status','family_history_heart_disease'] },
    'Asthma': { required: ['age','gender'], recommended: ['dyspnea','chronic_cough','smoking_status','asthma_history','occupational_exposure','oxygen_saturation'] },
    'COPD': { required: ['age','gender'], recommended: ['smoking_status','dyspnea','smoking_years','oxygen_saturation','copd_history','exercise_frequency'] },
    'High Cholesterol': { required: ['age','gender'], recommended: ['total_cholesterol','ldl_cholesterol','hdl_cholesterol','triglycerides','smoking_status'] },
    'Arthritis': { required: ['age','gender'], recommended: ['bmi','exercise_frequency','arthritis_history','smoking_status'] },
    'Osteoporosis': { required: ['age','gender'], recommended: ['bone_density_tscore','exercise_frequency','osteoporosis_history'] },
    'Tuberculosis': { required: ['age','gender'], recommended: ['chronic_cough','weight_kg','fever','night_sweats','smoking_status','oxygen_saturation'] },
    'Dengue': { required: ['age','gender'], recommended: ['fever','systolic_bp','wbc_count','platelet_count','hematocrit'] },
    'Malaria': { required: ['age','gender'], recommended: ['fever','heart_rate','hematocrit','systolic_bp','wbc_count'] },
    'Typhoid': { required: ['age','gender'], recommended: ['fever','alt_level','heart_rate','ast_level','wbc_count'] },
    'Pneumonia': { required: ['age','gender'], recommended: ['fever','oxygen_saturation','chronic_cough','wbc_count','smoking_status'] },
    'Influenza': { required: ['age','gender'], recommended: ['fever','body_aches','chronic_cough','oxygen_saturation'] },
    'Thyroid Disorder': { required: ['age','gender'], recommended: ['tsh_level','weight_kg','heart_rate','bmi','stress_level'] },
    'PCOS': { required: ['age','gender'], recommended: ['bmi','weight_kg','family_history_diabetes','exercise_frequency','stress_level'] },
    'Hepatitis B': { required: ['age','gender'], recommended: ['alt_level','ast_level','alcohol_units_per_week','liver_disease_history','fever'] },
    "Alzheimer's Disease": { required: ['age','gender'], recommended: ['mmse_score','memory_issues','depression_history','family_history_diabetes'] },
    "Parkinson's Disease": { required: ['age','gender'], recommended: ['tremor','bradykinesia','sleep_hours_per_night','stress_level'] },
    'Epilepsy': { required: ['age','gender'], recommended: ['memory_issues','sleep_hours_per_night','stress_level'] },
    'Coronary Artery Disease': { required: ['age','gender'], recommended: ['systolic_bp','total_cholesterol','ldl_cholesterol','hdl_cholesterol','smoking_status','family_history_heart_disease'] },
    'Arrhythmia': { required: ['age','gender'], recommended: ['heart_rate','systolic_bp','alcohol_units_per_week','stress_level','smoking_status'] },
};

const DEFAULT_DISEASE_FIELDS = {
    required: ['age', 'gender'],
    recommended: ['bmi', 'smoking_status', 'exercise_frequency'],
};

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

const normalizeSymptom = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const MULTI_DISEASE_STORAGE_KEYS = [
    'raxa_multi_selected_disease',
    'raxa_multi_required_fields',
    'raxa_multi_recommended_fields',
    'raxa_multi_form_data',
    'raxa_multi_results',
    'raxa_multi_current_step',
    'raxa_multi_symptoms',
    'raxa_multi_suggested_diseases',
    'raxa_multi_has_lab_data',
];

type FormDataValue = string | number | null;

const LAB_FIELDS = new Set(['blood_glucose', 'fasting_glucose', 'hemoglobin_a1c', 'wbc_count', 'hematocrit', 'platelet_count']);

type FieldConfig =
    | { type: 'number'; min?: number; max?: number; step?: number; unit?: string; placeholder?: string; hint?: string }
    | { type: 'select'; options: string[]; hint?: string }
    | { type: 'binary'; hint?: string }
    | { type: 'severity' };

interface DiseaseRisk {
    diseaseName: string;
    riskScore: number;
    riskLevel?: string;
    contributingFactors?: string[];
    matchedSymptoms?: string[];
    missingKeyIndicators?: string[];
    labImpact?: {
        summary?: string;
        confidenceBoost?: number;
        reasons?: string[];
    };
}

type MultiDiseaseResult = Record<string, unknown> & {
    diseaseOfInterest: string;
    primaryRiskCategory: string;
    primaryRiskScore: number;
    allDiseaseRisks?: DiseaseRisk[];
    immediateActions?: string[];
    disclaimer?: string;
    emergency?: {
        isEmergency?: boolean;
        message?: string;
    };
};

const MultiDiseaseDetector: React.FC = () => {
    const { t } = useLanguage();
    const [, setDiseases] = useState<string[]>([]);
    const [selectedDisease, setSelectedDisease] = usePersistentState('raxa_multi_selected_disease', '');
    const [requiredFields, setRequiredFields] = usePersistentState<string[]>('raxa_multi_required_fields', []);
    const [recommendedFields, setRecommendedFields] = usePersistentState<string[]>('raxa_multi_recommended_fields', []);
    const [formData, setFormData] = usePersistentState<Record<string, FormDataValue>>('raxa_multi_form_data', {});
    const [results, setResults] = usePersistentState<MultiDiseaseResult | null>('raxa_multi_results', null);
    const [selectedSymptoms, setSelectedSymptoms] = usePersistentState<string[]>('raxa_multi_symptoms', []);
    const [suggestedDiseases, setSuggestedDiseases] = usePersistentState<string[]>('raxa_multi_suggested_diseases', []);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [currentStep, setCurrentStep] = usePersistentState('raxa_multi_current_step', 0);
    const [hasLabData, setHasLabData] = usePersistentState('raxa_multi_has_lab_data', false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_URL = getBackendBaseUrl();
    const API_V2 = getApiV2BaseUrl();

    const steps = ['Basic Info', 'Symptoms', 'AI Detection', 'Clinical Data', 'Report'];
    const loadingTexts = [
        "Analyzing symptoms...",
        "Cross-referencing clinical patterns...",
        "Checking database for similar cases...",
        "Generating medical-grade report...",
        "Applying explainability engine..."
    ];

    const fetchDiseases = useCallback(async () => {
        try {
            const response = await fetch(`${API_V2}/diseases/supported-diseases`);
            if (!response.ok) {
                throw new Error(`Disease list request failed: ${response.status}`);
            }
            const data = await response.json() as { diseases?: unknown };
            if (data && Array.isArray(data.diseases)) {
                const supportedDiseases = data.diseases.filter((disease): disease is string => typeof disease === 'string');
                if (supportedDiseases.length > 0) {
                    setDiseases(supportedDiseases);
                    return;
                }
            }
        } catch (error) {
            console.warn('Using fallback disease list because the API is unavailable.', error);
        }
        setDiseases(FALLBACK_DISEASES);
    }, [API_V2]);

    // Fetch available diseases
    useEffect(() => {
        fetchDiseases();
    }, [fetchDiseases]);

    const fetchDiseaseFields = useCallback(async (disease: string) => {
        setFieldsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_V2}/diseases/fields/${encodeURIComponent(disease)}`);
            if (!response.ok) {
                throw new Error(`Disease fields request failed: ${response.status}`);
            }
            const data = await response.json() as { requiredFields?: unknown; recommendedFields?: unknown };
            const nextRequiredFields = Array.isArray(data.requiredFields)
                ? data.requiredFields.filter((field): field is string => typeof field === 'string')
                : [];
            const nextRecommendedFields = Array.isArray(data.recommendedFields)
                ? data.recommendedFields.filter((field): field is string => typeof field === 'string')
                : [];
            setRequiredFields(nextRequiredFields);
            setRecommendedFields(nextRecommendedFields);
            setFormData({ disease_of_interest: disease });
        } catch (error) {
            console.warn('Using fallback clinical fields because the API is unavailable.', error);
            const fields = FALLBACK_FIELD_CONFIGS[disease] || DEFAULT_DISEASE_FIELDS;
            setRequiredFields(fields.required);
            setRecommendedFields(fields.recommended);
            setFormData({ disease_of_interest: disease });
            setError('Backend is not reachable, so local screening fields are being used. Start the backend before submitting the final analysis.');
        } finally {
            setFieldsLoading(false);
        }
    }, [API_V2, setFormData, setRecommendedFields, setRequiredFields]);

    // Fetch fields for selected disease
    useEffect(() => {
        if (selectedDisease && requiredFields.length === 0 && recommendedFields.length === 0) {
            fetchDiseaseFields(selectedDisease);
        }
    }, [selectedDisease, requiredFields.length, recommendedFields.length, fetchDiseaseFields]);

    const resetMultiDiseaseScreening = () => {
        MULTI_DISEASE_STORAGE_KEYS.forEach(clearPersistentValue);
        setSelectedDisease('');
        setRequiredFields([]);
        setRecommendedFields([]);
        setFormData({});
        setResults(null);
        setSelectedSymptoms([]);
        setSuggestedDiseases([]);
        setCurrentStep(0);
        setHasLabData(false);
        setError(null);
    };

    const handleLabDataToggle = (enabled: boolean) => {
        setHasLabData(enabled);
        if (!enabled) {
            setFormData(prev => {
                const next = { ...prev };
                LAB_FIELDS.forEach(field => {
                    next[field] = null;
                });
                return next;
            });
        }
    };

    const handleInputChange = (field: string, value: FormDataValue) => {
        if (error) {
            setError(null);
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleSymptom = (symptom: string) => {
        const normalized = normalizeSymptom(symptom);
        setSelectedSymptoms(prev =>
            prev.includes(normalized)
                ? prev.filter(item => item !== normalized)
                : [...prev, normalized]
        );
    };

    const fetchFieldsForDiseases = useCallback(async (diseaseNames: string[]) => {
        const required = new Set<string>();
        const recommended = new Set<string>();

        for (const disease of diseaseNames) {
            try {
                const response = await fetch(`${API_V2}/diseases/fields/${encodeURIComponent(disease)}`);
                if (!response.ok) throw new Error(`Fields request failed: ${response.status}`);
                const data = await response.json() as { requiredFields?: unknown; recommendedFields?: unknown };
                (Array.isArray(data.requiredFields) ? data.requiredFields : []).forEach((field) => {
                    if (typeof field === 'string' && !['age', 'gender'].includes(field)) required.add(field);
                });
                (Array.isArray(data.recommendedFields) ? data.recommendedFields : []).forEach((field) => {
                    if (typeof field === 'string' && !['age', 'gender'].includes(field)) recommended.add(field);
                });
            } catch (error) {
                console.warn(`Using fallback fields for ${disease}.`, error);
                const fields = FALLBACK_FIELD_CONFIGS[disease] || DEFAULT_DISEASE_FIELDS;
                fields.required.forEach((field) => {
                    if (!['age', 'gender'].includes(field)) required.add(field);
                });
                fields.recommended.forEach((field) => {
                    if (!['age', 'gender'].includes(field)) recommended.add(field);
                });
            }
        }

        setRequiredFields(Array.from(required).slice(0, 8));
        setRecommendedFields(Array.from(recommended).filter(field => !required.has(field)).slice(0, 8));
    }, [API_V2, setRecommendedFields, setRequiredFields]);

    const analyzeSymptoms = async () => {
        setError(null);

        if (!hasAnswer(formData.age) || !hasAnswer(formData.gender)) {
            setError('Please complete age and gender first.');
            setCurrentStep(0);
            return;
        }

        if (selectedSymptoms.length === 0) {
            setError('Select at least one symptom before AI detection.');
            return;
        }

        setFieldsLoading(true);
        try {
            const response = await fetch(`${API_URL}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symptoms: selectedSymptoms,
                    clinicalData: {
                        age: formData.age,
                        gender: formData.gender
                    }
                })
            });

            if (!response.ok) throw new Error('Prediction request failed');
            const data = await response.json() as { predictions?: Array<{ disease: string }> };
            const nextSuggestions = (data.predictions || [])
                .map(item => item.disease)
                .filter(Boolean)
                .slice(0, 5);

            if (nextSuggestions.length === 0) {
                setSuggestedDiseases([]);
                setRequiredFields([]);
                setRecommendedFields([]);
                setError('Need more symptoms. Add disease-specific symptoms such as chills, rash, chronic cough, sore throat, or weight loss.');
                setCurrentStep(2);
                return;
            }

            setSuggestedDiseases(nextSuggestions);
            setSelectedDisease(nextSuggestions[0] || '');
            setFormData(prev => ({
                ...prev,
                disease_of_interest: nextSuggestions[0] || '',
                symptoms: selectedSymptoms.join(',')
            }));
            await fetchFieldsForDiseases(nextSuggestions.slice(0, 3));
            setCurrentStep(2);
        } catch (error) {
            console.warn('Symptom analysis request failed.', error);
            setError('Unable to analyze symptoms right now. Please try again.');
        } finally {
            setFieldsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const missingRequiredFields = requiredFields.filter((field) => !LAB_FIELDS.has(field) && !hasAnswer(formData[field]));
        if (missingRequiredFields.length > 0) {
            setError('Please complete every required clinical field before running the analysis.');
            return;
        }

        setLoading(true);
        
        // AI Thinking Effect
        let step = 0;
        const interval = setInterval(() => {
            step++;
            if (step < loadingTexts.length) {
                setLoadingStep(step);
            }
        }, 1500);

        try {
            const submissionData = { ...formData };
            if (!hasLabData) {
                LAB_FIELDS.forEach(field => {
                    submissionData[field] = null;
                });
            }

            const response = await fetch(`${API_V2}/diseases/detect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...submissionData,
                    symptoms: selectedSymptoms,
                    disease_of_interest: suggestedDiseases[0] || selectedDisease || undefined
                })
            });

            if (!response.ok) throw new Error('API error');
            const data = await response.json() as MultiDiseaseResult;
            const reportInputs = {
                ...submissionData,
                symptoms: selectedSymptoms.join(', '),
                suggested_diseases: suggestedDiseases.join(', ')
            };
            saveHealthReport(buildMultiDiseaseHealthReport(data, reportInputs));
            
            // Wait a bit more for dramatic effect
            setTimeout(() => {
                clearInterval(interval);
                setResults(data);
                setLoading(false);
                setCurrentStep(4);
            }, 2000);
        } catch (error) {
            clearInterval(interval);
            console.warn('Disease analysis request failed.', error);
            setError('Unable to analyze the health data right now. Please try again in a moment.');
            setLoading(false);
        }
    };

    const getFieldConfiguration = (field: string): FieldConfig => {
        const configs: Record<string, FieldConfig> = {
            age: { type: 'number', min: 1, max: 120, step: 1, unit: 'years' },
            gender: { type: 'select', options: ['Male', 'Female', 'Other'] },
            height_cm: { type: 'number', min: 40, max: 250, step: 0.1, unit: 'cm' },
            weight_kg: { type: 'number', min: 2, max: 250, step: 0.1, unit: 'kg' },
            systolic_bp: { type: 'number', min: 60, max: 250, step: 1, unit: 'mmHg' },
            diastolic_bp: { type: 'number', min: 40, max: 150, step: 1, unit: 'mmHg' },
            heart_rate: { type: 'number', min: 30, max: 220, step: 1, unit: 'bpm' },
            blood_glucose: { type: 'number', min: 40, max: 600, step: 1, unit: 'mg/dL', placeholder: '160', hint: 'Optional random glucose. Diabetes range is often >=200 mg/dL with symptoms.' },
            fasting_glucose: { type: 'number', min: 40, max: 400, step: 1, unit: 'mg/dL', placeholder: '110', hint: 'Optional. Normal: below 100 mg/dL; diabetes range: >=126 mg/dL.' },
            hemoglobin_a1c: { type: 'number', min: 3, max: 20, step: 0.1, unit: '%', placeholder: '5.8', hint: 'Optional. Normal: below 5.7%; diabetes range: >=6.5%.' },
            oxygen_saturation: { type: 'number', min: 70, max: 100, step: 1, unit: '%', placeholder: '95', hint: 'Normal: 95-100%' },
            wbc_count: { type: 'number', min: 1000, max: 50000, step: 1, unit: 'cells/uL', placeholder: '7000', hint: 'Normal: 4000-11000 cells/uL' },
            hematocrit: { type: 'number', min: 10, max: 70, step: 0.1, unit: '%', placeholder: '42.5', hint: 'Normal: 38-50%' },
            platelet_count: { type: 'number', min: 10000, max: 700000, step: 1, unit: 'cells/uL', placeholder: '250000', hint: 'Normal: 150000-450000 cells/uL' },
            total_cholesterol: { type: 'number', min: 100, max: 500, step: 1, unit: 'mg/dL' },
            stress_level: { type: 'severity' },
            sleep_hours_per_night: { type: 'number', min: 0, max: 24, step: 0.5, unit: 'hours' },
            fever: { type: 'binary' },
            cough: { type: 'binary' },
            fatigue: { type: 'binary' },
            shortness_of_breath: { type: 'binary' },
            dyspnea: { type: 'binary' },
            chronic_cough: { type: 'binary' },
            night_sweats: { type: 'binary', hint: 'Common in infections like TB' },
            body_aches: { type: 'binary' },
            memory_issues: { type: 'binary' },
            tremor: { type: 'binary' },
            bradykinesia: { type: 'binary' },
            smoking_status: { type: 'select', options: ['non-smoker', 'smoker', 'former'], hint: 'Risk factor for lung disease' },
            family_history: { type: 'binary' },
            family_history_diabetes: { type: 'binary' },
            family_history_heart_disease: { type: 'binary' },
        };

        // Check if it's a binary field based on common naming or explicit list
        if (field.includes('_history') || field.includes('_present') || field.includes('memory_issues')) {
            return { type: 'binary' };
        }

        return configs[field] || { type: 'number', min: 0, max: 1000, step: 0.1 };
    };

    const renderInput = (field: string, config: FieldConfig) => {
        const value = formData[field];

        if (config.type === 'binary') {
            return (
                <div>
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-full">
                        {['no', 'yes'].map((val) => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => handleInputChange(field, val)}
                                className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
                                    value === val || (value === 0 && val === 'no') || (value === 1 && val === 'yes')
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {val === 'no' ? 'No' : 'Yes'}
                            </button>
                        ))}
                    </div>
                    {config.hint && (
                        <p className="mt-2 text-xs font-semibold text-slate-400">{config.hint}</p>
                    )}
                </div>
            );
        }

        if (config.type === 'severity') {
            return (
                <div className="flex justify-between gap-2 w-full">
                    {['Low', 'Moderate', 'High'].map((lvl, idx) => (
                        <button
                            key={lvl}
                            type="button"
                            onClick={() => handleInputChange(field, lvl)}
                            className={`flex-1 py-2.5 px-2 rounded-xl font-bold text-[10px] uppercase tracking-wider border-2 transition-all ${
                                value === lvl 
                                    ? 'border-primary bg-primary/5 text-primary' 
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                            }`}
                        >
                            {idx === 0 ? '😐' : idx === 1 ? '😟' : '😫'} {lvl}
                        </button>
                    ))}
                </div>
            );
        }

        if (config.type === 'select') {
            return (
                <div>
                    <select
                        value={value || ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl focus:border-primary outline-hidden transition-all font-medium text-slate-900"
                    >
                        <option value="">Select...</option>
                        {config.options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {config.hint && (
                        <p className="mt-2 text-xs font-semibold text-slate-400">{config.hint}</p>
                    )}
                </div>
            );
        }

        const warning =
            field === 'wbc_count' && value !== '' && value !== null && value !== undefined && (Number(value) < 1000 || Number(value) > 50000)
                ? 'Check value: WBC is outside the usual clinical range.'
                : field === 'hematocrit' && value !== '' && value !== null && value !== undefined && (Number(value) < 15 || Number(value) > 65)
                    ? 'Check value: hematocrit is unusually low or high.'
                    : null;

        return (
            <div className="relative w-full">
                <input
                    type="number"
                    step={config.step || 1}
                    min={config.min}
                    max={config.max}
                    value={value ?? ''}
                    onChange={(e) => handleInputChange(field, e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full p-3 pr-16 bg-white border-2 border-slate-100 rounded-xl focus:border-primary outline-hidden transition-all font-medium text-slate-900"
                    placeholder={config.placeholder || ''}
                />
                {config.unit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {config.unit}
                    </span>
                )}
                {config.hint && (
                    <p className="mt-2 text-xs font-semibold text-slate-400">{config.hint}</p>
                )}
                {warning && (
                    <p className="mt-2 text-xs font-semibold text-amber-600">{warning}</p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 md:py-20">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-4"
                    >
                        <ShieldCheck className="h-4 w-4" />
                        Clinical Grade Analysis
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
                        {t.nav_detailed_screening || 'Detailed Screening'}
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto">
                        Provide accurate clinical data for a comprehensive health assessment powered by Raxa AI.
                    </p>
                </div>

                {/* Progress */}
                {!results && !loading && (
                    <StepProgress steps={steps} currentStep={currentStep} />
                )}

                {error && !loading && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
                        {error}
                    </div>
                )}

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {/* LOADING STATE */}
                        {loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="premium-card p-12 text-center bg-white min-h-[400px] flex flex-col items-center justify-center"
                            >
                                <div className="relative mb-12">
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="relative w-24 h-24 border-4 border-slate-100 border-t-primary rounded-full"
                                    />
                                    <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-4">AI Processing...</h2>
                                <p className="text-slate-500 font-bold tracking-wide animate-pulse">
                                    {loadingTexts[loadingStep]}
                                </p>
                            </motion.div>
                        )}

                        {/* STEP 1: BASIC INFO */}
                        {!loading && currentStep === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Step 1: Basic Info</h2>
                                <p className="text-slate-500 mb-10 font-medium">Start with patient basics. Disease selection is not required.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {['age', 'gender'].map(field => (
                                        <div key={field} className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                                                {field.replace(/_/g, ' ')}
                                            </label>
                                            {renderInput(field, getFieldConfiguration(field))}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button
                                        onClick={() => {
                                            if (!hasAnswer(formData.age) || !hasAnswer(formData.gender)) {
                                                setError('Please complete age and gender before continuing.');
                                                return;
                                            }
                                            setError(null);
                                            setCurrentStep(1);
                                        }}
                                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-primary transition-all flex items-center gap-2"
                                    >
                                        Next Step <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: SYMPTOMS */}
                        {!loading && currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-1">Step 2: Symptoms</h2>
                                        <p className="text-slate-500 font-medium">Tell the engine what the patient is feeling first.</p>
                                    </div>
                                    <button 
                                        onClick={() => setCurrentStep(0)}
                                        className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </button>
                                </div>

                                <div className="space-y-7">
                                    {symptomCategories.map(group => (
                                        <div key={group.title} className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
                                            <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                                                {group.title}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {group.symptoms.map(symptom => {
                                                    const normalized = normalizeSymptom(symptom);
                                                    const selected = selectedSymptoms.includes(normalized);
                                                    return (
                                                        <button
                                                            key={symptom}
                                                            type="button"
                                                            onClick={() => toggleSymptom(symptom)}
                                                            aria-pressed={selected}
                                                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                                                selected
                                                                    ? 'border-primary bg-primary/10 text-primary'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'
                                                            }`}
                                                        >
                                                            {symptom}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-400">{selectedSymptoms.length} selected</span>
                                    <button
                                        onClick={analyzeSymptoms}
                                        disabled={fieldsLoading || selectedSymptoms.length === 0}
                                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Detect Diseases <Brain className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: AI DETECTION */}
                        {!loading && currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Step 3: AI Detection</h2>
                                <p className="text-slate-500 mb-10 font-medium">Suggested diseases are generated from symptoms, not manual selection.</p>

                                {suggestedDiseases.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {suggestedDiseases.slice(0, 5).map((disease, index) => (
                                            <div key={disease} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">#{index + 1} Suggested</span>
                                                <h3 className="mt-2 font-black text-slate-900">{disease}</h3>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-amber-800 font-semibold">
                                        Need more symptoms. Add disease-specific clues before continuing.
                                    </div>
                                )}

                                <div className="mt-12 flex justify-between items-center">
                                    <button 
                                        onClick={() => setCurrentStep(1)}
                                        className="text-slate-400 hover:text-slate-900 font-bold text-sm flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Back to Symptoms
                                    </button>
                                    <button
                                        onClick={() => setCurrentStep(3)}
                                        disabled={suggestedDiseases.length === 0}
                                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        Add Clinical Data <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: CLINICAL DATA */}
                        {!loading && currentStep === 3 && !results && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Step 4: Clinical Data</h2>
                                <p className="text-slate-500 mb-10 font-medium">Add clinical data to refine the suggested diseases.</p>

                                <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Do you have lab results?</h3>
                                            <p className="mt-1 text-xs font-semibold text-slate-500">Glucose, HbA1c, WBC, hematocrit, and platelets are optional and only refine scoring.</p>
                                        </div>
                                        <div className="flex gap-2 rounded-xl bg-white p-1 shadow-sm">
                                            {[
                                                { label: 'No', value: false },
                                                { label: 'Yes', value: true },
                                            ].map(option => (
                                                <button
                                                    key={option.label}
                                                    type="button"
                                                    onClick={() => handleLabDataToggle(option.value)}
                                                    className={`min-w-20 rounded-lg px-4 py-2 text-sm font-black transition-all ${
                                                        hasLabData === option.value
                                                            ? 'bg-slate-900 text-white'
                                                            : 'text-slate-400 hover:text-slate-700'
                                                    }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[...requiredFields, ...recommendedFields].filter(field => hasLabData || !LAB_FIELDS.has(field)).map(field => (
                                        <div key={field} className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                                                {field.replace(/_/g, ' ')}
                                            </label>
                                            {renderInput(field, getFieldConfiguration(field))}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 flex justify-between items-center">
                                    <button 
                                        onClick={() => setCurrentStep(2)}
                                        className="text-slate-400 hover:text-slate-900 font-bold text-sm flex items-center gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Back to Suggestions
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        Submit Analysis <Zap className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: RESULTS REPORT */}
                        {!loading && results && currentStep === 4 && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8 pb-20"
                            >
                                {results.emergency?.message && (
                                    <div className="premium-card border-2 border-rose-100 bg-rose-50 p-6">
                                        <h3 className="text-lg font-black text-rose-900">Emergency Alert</h3>
                                        <p className="mt-2 text-sm font-bold text-rose-700">{results.emergency.message}</p>
                                    </div>
                                )}

                                {/* Primary Risk Card */}
                                <div className="premium-card p-8 md:p-12 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl" />
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">Primary Assessment</span>
                                            <h2 className="text-3xl font-black text-slate-900">{results.diseaseOfInterest}</h2>
                                        </div>
                                        <div className={`px-6 py-3 rounded-2xl font-black text-sm border-2 flex items-center gap-2 ${
                                            results.primaryRiskCategory === 'High Risk' ? 'border-rose-100 bg-rose-50 text-rose-600' :
                                            results.primaryRiskCategory === 'Moderate Risk' ? 'border-amber-100 bg-amber-50 text-amber-600' :
                                            'border-emerald-100 bg-emerald-50 text-emerald-600'
                                        }`}>
                                            <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                                                results.primaryRiskCategory === 'High Risk' ? 'bg-rose-500' :
                                                results.primaryRiskCategory === 'Moderate Risk' ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                            }`} />
                                            {results.primaryRiskCategory}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="font-black text-slate-900 text-lg">AI Confidence Score</span>
                                            <span className="font-black text-primary text-3xl">{(results.primaryRiskScore * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${results.primaryRiskScore * 100}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className={`h-full ${
                                                    results.primaryRiskCategory === 'High Risk' ? 'bg-rose-500' :
                                                    results.primaryRiskCategory === 'Moderate Risk' ? 'bg-amber-500' :
                                                    'bg-primary'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-Disease Insights */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="premium-card p-8">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-primary" /> Top Detected Risks
                                        </h3>
                                        <div className="space-y-6">
                                            {(results.allDiseaseRisks || []).slice(0, 5).map((d, i) => (
                                                <div key={i} className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                    <div className="flex justify-between text-xs font-bold">
                                                        <span className="text-slate-900">{d.diseaseName}</span>
                                                        <span className="text-slate-400">{(d.riskScore * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${d.riskScore * 100}%` }}
                                                            className="h-full bg-slate-900"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2 pt-2 text-[11px] font-semibold text-slate-500">
                                                        <p><span className="font-black text-emerald-700">Matched:</span> {d.matchedSymptoms?.slice(0, 4).join(', ') || 'None captured'}</p>
                                                        <p><span className="font-black text-rose-700">Missing:</span> {d.missingKeyIndicators?.slice(0, 4).join(', ') || 'No major missing signals'}</p>
                                                        <p><span className="font-black text-primary">Lab impact:</span> {d.labImpact?.summary || 'No numeric clinical/lab boost was applied'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="premium-card p-8">
                                        <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-primary" /> Immediate Actions
                                        </h3>
                                        <div className="space-y-4">
                                            {(results.immediateActions || []).map((action: string, i: number) => (
                                                <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                                                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{action}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Full Report Button */}
                                <div className="text-center py-10">
                                    <p className="mx-auto mb-6 max-w-2xl rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-xs font-bold text-amber-800">
                                        {results.disclaimer || 'This is not a diagnosis. Always consult a healthcare professional.'}
                                    </p>
                                    <button 
                                        onClick={() => window.location.href = '/health-report'}
                                        className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        <FileText className="h-6 w-6" /> View Comprehensive Report
                                    </button>
                                    <p className="text-slate-400 mt-6 text-xs font-bold uppercase tracking-widest cursor-pointer hover:text-slate-900" onClick={resetMultiDiseaseScreening}>
                                        Start New Analysis
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MultiDiseaseDetector;
