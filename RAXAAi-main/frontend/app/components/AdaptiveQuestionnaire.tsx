"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    ChevronRight, 
    ArrowLeft, 
    Zap, 
    AlertCircle, 
    CheckCircle2,
    Beaker
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import StepProgress from './StepProgress';
import { buildAdaptiveHealthReport, hasAnswer, saveHealthReport } from '../utils/reportStorage';
import { clearPersistentValue, usePersistentState } from '../hooks/usePersistentState';
import { getApiV2BaseUrl } from '../../utils/apiBase';

const API_V2 = getApiV2BaseUrl();
const ADAPTIVE_FLOW_VERSION = 'clinical-inputs-v4';
const ADAPTIVE_VERSION_KEY = 'raxa_adaptive_version';
const ADAPTIVE_STORAGE_KEYS = [
    'raxa_adaptive_step',
    'raxa_adaptive_questions',
    'raxa_adaptive_answers',
    'raxa_adaptive_preliminary_results',
    'raxa_adaptive_clinical_questions',
    'raxa_adaptive_final_result',
    'raxa_adaptive_has_lab_data',
];

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

const normalizeSymptomOption = (value: string) =>
    value.trim().toLowerCase().replace(/\s+/g, ' ');

const getGroupedSymptomOptions = (options: string[] = []) => {
    const optionSet = new Set(options.map(normalizeSymptomOption));
    const knownSymptoms = new Set(symptomCategories.flatMap(group => group.symptoms));
    const groups = symptomCategories
        .map(group => ({
            ...group,
            symptoms: group.symptoms.filter(symptom => optionSet.has(symptom)),
        }))
        .filter(group => group.symptoms.length > 0);
    const uncategorized = options
        .map(normalizeSymptomOption)
        .filter(option => option && !knownSymptoms.has(option));

    return uncategorized.length > 0
        ? [...groups, { title: 'Other', symptoms: uncategorized }]
        : groups;
};

type Step = 'BASIC' | 'SYMPTOMS' | 'PRELIMINARY' | 'CLINICAL' | 'FINAL';

const OPTIONAL_LAB_FIELDS = new Set([
    'blood_glucose',
    'fasting_glucose',
    'hemoglobin_a1c',
    'wbc_count',
    'platelet_count',
    'hematocrit',
]);
const NUMERIC_FIELD_OVERRIDES: Record<string, Partial<Question>> = {
    blood_glucose: {
        type: 'number',
        min: 40,
        max: 600,
        step: 1,
        unit: 'mg/dL',
        placeholder: '160',
        required: false,
        hint: 'Optional lab value. Random glucose; diabetes range is often >=200 mg/dL with symptoms.'
    },
    fasting_glucose: {
        type: 'number',
        min: 40,
        max: 400,
        step: 1,
        unit: 'mg/dL',
        placeholder: '110',
        required: false,
        hint: 'Optional lab value. Normal: below 100 mg/dL; diabetes range: >=126 mg/dL.'
    },
    hemoglobin_a1c: {
        type: 'number',
        min: 3,
        max: 20,
        step: 0.1,
        unit: '%',
        placeholder: '5.8',
        required: false,
        hint: 'Optional lab value. Normal: below 5.7%; diabetes range: >=6.5%.'
    },
    wbc_count: {
        type: 'number',
        min: 1000,
        max: 50000,
        step: 1,
        unit: 'cells/uL',
        placeholder: '7000',
        required: false,
        hint: 'Optional. Normal: 4000-11000 cells/uL'
    },
    platelet_count: {
        type: 'number',
        min: 10000,
        max: 700000,
        step: 1,
        unit: 'cells/uL',
        placeholder: '250000',
        required: false,
        hint: 'Optional lab value. Normal: 150000-450000 cells/uL'
    },
    hematocrit: {
        type: 'number',
        min: 10,
        max: 70,
        step: 0.1,
        unit: '%',
        placeholder: '42.5',
        required: false,
        hint: 'Optional. Normal: 38-50%'
    },
    oxygen_saturation: {
        type: 'number',
        min: 70,
        max: 100,
        step: 1,
        unit: '%',
        placeholder: '95',
        required: false,
        hint: 'Normal: 95-100%'
    },
    heart_rate: {
        type: 'number',
        min: 30,
        max: 220,
        step: 1,
        unit: 'bpm',
        placeholder: '80',
        required: false,
        hint: 'Typical adult resting range: 60-100 bpm'
    },
    systolic_bp: {
        type: 'number',
        min: 60,
        max: 250,
        step: 1,
        unit: 'mmHg',
        placeholder: '120',
        required: false,
        hint: 'Upper BP number. Elevated when repeatedly >=140 mmHg.'
    },
    diastolic_bp: {
        type: 'number',
        min: 40,
        max: 150,
        step: 1,
        unit: 'mmHg',
        placeholder: '80',
        required: false,
        hint: 'Lower BP number. Elevated when repeatedly >=90 mmHg.'
    },
    bmi: {
        type: 'number',
        min: 10,
        max: 80,
        step: 0.1,
        placeholder: '24.5',
        required: false,
        hint: 'Calculated from height/weight when available.'
    }
};

interface Question {
    id: string;
    type: 'number' | 'select' | 'binary' | 'boolean' | 'text';
    question: string;
    text?: string;
    label?: string;
    placeholder?: string;
    options?: string[];
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    hint?: string;
}

interface DiseaseResult {
    disease: string;
    risk_score: number;
    risk_percentage: number;
    risk_level: 'Low' | 'Medium' | 'High';
    key_factors: string[];
    confidence: number;
    category?: string;
}

type AnswerValue = string | number | string[] | null;

interface RecommendedTest {
    test: string;
    reason?: string;
}

interface Explanation {
    supportingEvidence?: string[];
}

interface FinalDiseaseResult extends DiseaseResult {
    confidence_level?: string;
    explanation?: Explanation;
    recommended_tests?: RecommendedTest[];
    matched_symptoms?: string[];
    missing_key_indicators?: string[];
    lab_impact?: {
        summary?: string;
        confidenceBoost?: number;
        reasons?: string[];
    };
}

interface AdaptiveAnalyzeResponse {
    questions?: Question[];
    top_diseases?: FinalDiseaseResult[];
    follow_up_required?: boolean;
    follow_up_questions?: Question[];
    diagnostic_questions?: Question[];
    emergency_warning?: string;
    refinement?: {
        current_round?: number;
        max_rounds?: number;
        enabled?: boolean;
        should_stop?: boolean;
    };
}

const AdaptiveQuestionnaire: React.FC = () => {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = usePersistentState<Step>('raxa_adaptive_step', 'BASIC');
    const [questions, setQuestions] = usePersistentState<Question[]>('raxa_adaptive_questions', []);
    const [answers, setAnswers] = usePersistentState<Record<string, AnswerValue>>('raxa_adaptive_answers', {});
    const [preliminaryResults, setPreliminaryResults] = usePersistentState<DiseaseResult[]>('raxa_adaptive_preliminary_results', []);
    const [clinicalQuestions, setClinicalQuestions] = usePersistentState<Question[]>('raxa_adaptive_clinical_questions', []);
    const [finalResult, setFinalResult] = usePersistentState<AdaptiveAnalyzeResponse | null>('raxa_adaptive_final_result', null);
    const [hasLabData, setHasLabData] = usePersistentState('raxa_adaptive_has_lab_data', false);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const steps = ['Basics', 'Symptoms', 'Detection', 'Clinical', 'Report'];
    const currentStepIndex = steps.indexOf(currentStep === 'BASIC' ? 'Basics' : currentStep === 'SYMPTOMS' ? 'Symptoms' : currentStep === 'PRELIMINARY' ? 'Detection' : currentStep === 'CLINICAL' ? 'Clinical' : 'Report');

    const loadingTexts = [
        "Analyzing symptoms...",
        "Cross-referencing clinical patterns...",
        "Checking database for similar cases...",
        "Generating medical-grade report...",
        "Applying explainability engine..."
    ];

// Load Step 1 questions on mount (including BMI fields)
    useEffect(() => {
        if (currentStep === 'BASIC' && questions.length === 0) {
            setQuestions([
                { id: 'q2', type: 'number', question: 'What is your current age?', min: 0, max: 120, required: true, unit: 'years' },
                { id: 'q3', type: 'select', question: 'What is your gender?', options: ['Male', 'Female', 'Other'], required: true },
                { id: 'weight_kg', type: 'number', question: 'What is your weight?', placeholder: 'Weight in kg', min: 20, max: 300, required: true, unit: 'kg' },
                { id: 'height_cm', type: 'number', question: 'What is your height?', placeholder: 'Height in cm', min: 100, max: 250, required: true, unit: 'cm' }
            ]);
        }
    }, [currentStep, questions.length, setQuestions]);

    const resetAdaptiveScreening = useCallback(() => {
        ADAPTIVE_STORAGE_KEYS.forEach(clearPersistentValue);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(ADAPTIVE_VERSION_KEY, ADAPTIVE_FLOW_VERSION);
        }
        setCurrentStep('BASIC');
        setQuestions([]);
        setAnswers({});
        setPreliminaryResults([]);
        setClinicalQuestions([]);
        setFinalResult(null);
        setHasLabData(false);
        setError(null);
    }, [setAnswers, setClinicalQuestions, setCurrentStep, setFinalResult, setHasLabData, setPreliminaryResults, setQuestions]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (window.localStorage.getItem(ADAPTIVE_VERSION_KEY) !== ADAPTIVE_FLOW_VERSION) {
            resetAdaptiveScreening();
        }
    }, [resetAdaptiveScreening]);

const handleAnswerChange = (id: string, value: AnswerValue) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
        if (error) setError(null);
    };

    const handleLabDataToggle = (enabled: boolean) => {
        setHasLabData(enabled);
        if (!enabled) {
            setAnswers(prev => {
                const next = { ...prev };
                OPTIONAL_LAB_FIELDS.forEach(field => {
                    next[field] = null;
                });
                return next;
            });
        }
    };

    const togglePrimarySymptom = (symptom: string) => {
        const normalizedSymptom = normalizeSymptomOption(symptom);
        const current = Array.isArray(answers.q1) ? answers.q1.map(normalizeSymptomOption) : [];
        const next = current.includes(normalizedSymptom)
            ? current.filter((value: string) => value !== normalizedSymptom)
            : [...current, normalizedSymptom];

        handleAnswerChange('q1', next);
    };

    const validateBasicAnswers = () => {
        const age = Number(answers.q2);
        const weight = Number(answers.weight_kg);
        const height = Number(answers.height_cm);

        if (!Number.isFinite(age) || age < 0 || age > 120) {
            throw new Error('Age must be between 0-120 years.');
        }

        if (!Number.isFinite(weight) || weight < 20 || weight > 300) {
            throw new Error('Weight must be between 20-300 kg.');
        }

        if (!Number.isFinite(height) || height < 100 || height > 250) {
            throw new Error('Height must be between 100-250 cm.');
        }
    };

    const loadErrorMessage = async (response: Response) => {
        try {
            const data = await response.json();
            return data.message || data.error || 'Something went wrong';
        } catch {
            return 'Something went wrong';
        }
    };

    const sanitizeClinicalAnswers = () => {
        const cleaned: Record<string, unknown> = { ...answers };

        clinicalQuestions.forEach((question) => {
            const effectiveQuestion = { ...question, ...(NUMERIC_FIELD_OVERRIDES[question.id] || {}) };
            const value = cleaned[question.id];
            if (OPTIONAL_LAB_FIELDS.has(question.id) && !hasLabData) {
                cleaned[question.id] = null;
                return;
            }

            if (value === '' || value === null || value === undefined) {
                if (OPTIONAL_LAB_FIELDS.has(question.id)) {
                    cleaned[question.id] = null;
                } else {
                    delete cleaned[question.id];
                }
                return;
            }

            if (OPTIONAL_LAB_FIELDS.has(question.id) && ['yes', 'no', 'true', 'false'].includes(String(value).toLowerCase())) {
                cleaned[question.id] = null;
                return;
            }

            if (effectiveQuestion.type === 'number') {
                const numericValue = Number(value);
                if (!Number.isFinite(numericValue)) {
                    throw new Error(`${effectiveQuestion.question} must be a valid number.`);
                }
                cleaned[question.id] = numericValue;
            }
        });

        return cleaned;
    };

    const nextStep = async () => {
        setLoading(true);
        setError(null);
        
        let thinkingInterval: ReturnType<typeof setInterval> | undefined;
        if (currentStep === 'SYMPTOMS' || currentStep === 'CLINICAL') {
            let step = 0;
            thinkingInterval = setInterval(() => {
                step++;
                if (step < loadingTexts.length) setLoadingStep(step);
            }, 1200);
        }

        try {
            if (currentStep === 'BASIC') {
                if (!hasAnswer(answers.q2) || !hasAnswer(answers.q3) || !hasAnswer(answers.weight_kg) || !hasAnswer(answers.height_cm)) {
                    throw new Error('Please complete age, gender, weight, and height before continuing.');
                }
                validateBasicAnswers();

                const response = await fetch(`${API_V2}/adaptive/questions`);
                if (!response.ok) {
                    throw new Error(await loadErrorMessage(response));
                }

                const data = await response.json() as AdaptiveAnalyzeResponse;
                setQuestions((data.questions || []).filter((q) => q.id === 'q1'));
                setCurrentStep('SYMPTOMS');
            } 
            else if (currentStep === 'SYMPTOMS') {
                if (!Array.isArray(answers.q1) || answers.q1.length === 0) throw new Error('Please select at least one concern');
                const response = await fetch(`${API_V2}/adaptive/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(answers)
                });
                if (!response.ok) {
                    throw new Error(await loadErrorMessage(response));
                }

                const data = await response.json() as AdaptiveAnalyzeResponse;
                if (!Array.isArray(data.top_diseases) || data.top_diseases.length === 0) {
                    throw new Error('No preliminary matches were returned. Please add more symptom detail and try again.');
                }

                if (typeof window !== 'undefined') {
                    window.localStorage.setItem(
                        'refinement_state',
                        JSON.stringify({
                            round: data.refinement?.current_round ?? 0,
                            maxRounds: data.refinement?.max_rounds ?? 2,
                            symptoms: Array.isArray(answers.q1) ? answers.q1 : [],
                            answers
                        })
                    );
                }

                setPreliminaryResults(data.top_diseases.slice(0, 3));
                setCurrentStep('PRELIMINARY');
            }
            else if (currentStep === 'PRELIMINARY') {
                await fetchClinicalFields();
                setCurrentStep('CLINICAL');
            }
            else if (currentStep === 'CLINICAL') {
                const cleanedAnswers = sanitizeClinicalAnswers();
                const response = await fetch(`${API_V2}/adaptive/analyze`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cleanedAnswers)
                });
                if (!response.ok) {
                    throw new Error(await loadErrorMessage(response));
                }

                const data = await response.json() as AdaptiveAnalyzeResponse;
                if (
                    data.follow_up_required &&
                    !data.refinement?.should_stop &&
                    (data.refinement?.current_round ?? 0) < (data.refinement?.max_rounds ?? 2)
                ) {
                    setClinicalQuestions((data.follow_up_questions || data.diagnostic_questions || []).slice(0, 6).map(question => ({
                        ...question,
                        type: question.type === 'boolean' ? 'binary' : question.type,
                        question: question.question || question.text || question.id
                    })));
                    setAnswers(prev => ({
                        ...prev,
                        refinement_round: (data.refinement?.current_round ?? 0) + 1,
                        max_rounds: data.refinement?.max_rounds ?? 2
                    }));
                    setError('The top matches are close. Answer these targeted follow-up questions to refine the result.');
                    return;
                }
                saveHealthReport(buildAdaptiveHealthReport(data as Record<string, unknown>, cleanedAnswers));
                setFinalResult(data);
                setCurrentStep('FINAL');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            if (thinkingInterval) clearInterval(thinkingInterval);
            setLoading(false);
        }
    };

    const fetchClinicalFields = async () => {
        const allFields = new Set<string>();
        const fieldConfigs: Question[] = [];

        for (const res of preliminaryResults) {
            try {
                const resp = await fetch(`${API_V2}/diseases/fields/${encodeURIComponent(res.disease)}`);
                const data = await resp.json();
                [...(data.requiredFields || []), ...(data.recommendedFields || [])].forEach((f: string) => {
                    if (!['age', 'gender'].includes(f)) allFields.add(f);
                });
            } catch (e) { console.error(e); }
        }

        allFields.forEach(field => {
            const config = getFieldConfiguration(field);
            fieldConfigs.push({
                id: field,
                question: field.replace(/_/g, ' '),
                ...config
            });
        });

        setClinicalQuestions(fieldConfigs);
    };

    const getFieldConfiguration = (field: string) => {
        const configs: Record<string, Omit<Question, 'id' | 'question'>> = {
            blood_glucose: NUMERIC_FIELD_OVERRIDES.blood_glucose as Omit<Question, 'id' | 'question'>,
            fasting_glucose: NUMERIC_FIELD_OVERRIDES.fasting_glucose as Omit<Question, 'id' | 'question'>,
            hemoglobin_a1c: NUMERIC_FIELD_OVERRIDES.hemoglobin_a1c as Omit<Question, 'id' | 'question'>,
            systolic_bp: NUMERIC_FIELD_OVERRIDES.systolic_bp as Omit<Question, 'id' | 'question'>,
            diastolic_bp: NUMERIC_FIELD_OVERRIDES.diastolic_bp as Omit<Question, 'id' | 'question'>,
            bmi: NUMERIC_FIELD_OVERRIDES.bmi as Omit<Question, 'id' | 'question'>,
            weight_kg: { type: 'number', min: 2, max: 200, unit: 'kg' },
            height_cm: { type: 'number', min: 50, max: 250, unit: 'cm' },
            heart_rate: NUMERIC_FIELD_OVERRIDES.heart_rate as Omit<Question, 'id' | 'question'>,
            total_cholesterol: { type: 'number', min: 100, max: 500, unit: 'mg/dL' },
            tsh_level: { type: 'number', min: 0.1, max: 20, step: 0.1, unit: 'uIU/mL' },
            wbc_count: NUMERIC_FIELD_OVERRIDES.wbc_count as Omit<Question, 'id' | 'question'>,
            hematocrit: NUMERIC_FIELD_OVERRIDES.hematocrit as Omit<Question, 'id' | 'question'>,
            platelet_count: NUMERIC_FIELD_OVERRIDES.platelet_count as Omit<Question, 'id' | 'question'>,
            oxygen_saturation: NUMERIC_FIELD_OVERRIDES.oxygen_saturation as Omit<Question, 'id' | 'question'>,
            fever: { type: 'binary', hint: 'Select yes if you currently have fever or measured high temperature.' },
            chronic_cough: { type: 'binary' },
            night_sweats: {
                type: 'select',
                options: ['no', 'yes'],
                hint: 'Common in infections like TB'
            },
            smoking_status: {
                type: 'select',
                options: ['non-smoker', 'smoker', 'former'],
                hint: 'Risk factor for lung disease'
            },
            body_aches: { type: 'binary' },
        };
        return configs[field] || { type: 'number', min: 0, max: 1000, step: 0.1, required: false };
    };

    const renderInput = (q: Question) => {
        q = { ...q, ...(NUMERIC_FIELD_OVERRIDES[q.id] || {}) };
        const value = answers[q.id];
        const numericValue = value === '' || value === null || value === undefined ? null : Number(value);
        const rangeWarning = q.type === 'number' &&
            numericValue !== null &&
            Number.isFinite(numericValue) &&
            ((q.min !== undefined && numericValue < q.min) || (q.max !== undefined && numericValue > q.max))
                ? `This is outside the usual supported range${q.min !== undefined && q.max !== undefined ? ` (${q.min}-${q.max}${q.unit ? ` ${q.unit}` : ''})` : ''}. You can still submit.`
                : null;

        if (q.type === 'binary') {
            return (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-full">
                    {[0, 1].map((val) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, val === 1 ? 'yes' : 'no')}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
                                value === (val === 1 ? 'yes' : 'no') || value === val
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {val === 0 ? 'No' : 'Yes'}
                        </button>
                    ))}
                </div>
            );
        }

        if (q.type === 'select') {
            return (
                <div className="grid grid-cols-2 gap-2 w-full">
                    {q.options?.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerChange(q.id, opt)}
                            className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all ${
                                value === opt 
                                    ? 'border-primary bg-primary/5 text-primary' 
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            );
        }

        return (
            <div className="relative w-full">
                <input
                    type="number"
                    step={q.step || 1}
                    min={q.min}
                    max={q.max}
                    inputMode="decimal"
                    value={value ?? ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value === '' ? null : Number(e.target.value))}
                    required={q.required}
                    className="w-full p-4 pr-16 bg-white border-2 border-slate-100 rounded-2xl focus:border-primary outline-hidden transition-all font-medium text-slate-900"
                    placeholder={q.placeholder || ""}
                />
                {q.unit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {q.unit}
                    </span>
                )}
                {q.hint && (
                    <p className="mt-2 text-xs font-semibold text-slate-400">{q.hint}</p>
                )}
                {rangeWarning && (
                    <p className="mt-2 text-xs font-semibold text-amber-600">{rangeWarning}</p>
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
                        <Zap className="h-4 w-4" />
                        Adaptive Intelligence
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
                        {t.nav_smart_screening || 'Smart Scan'}
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl mx-auto">
                        An AI-driven diagnostic journey that adapts to your unique symptoms and clinical signals.
                    </p>
                </div>

                {/* Progress */}
                {currentStep !== 'FINAL' && !loading && (
                    <StepProgress steps={steps} currentStep={currentStepIndex} />
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
                                <h2 className="text-2xl font-black text-slate-900 mb-4">Thinking...</h2>
                                <p className="text-slate-500 font-bold animate-pulse">
                                    {loadingTexts[loadingStep]}
                                </p>
                            </motion.div>
                        )}

                        {/* STEP 1: BASIC INFO */}
                        {!loading && currentStep === 'BASIC' && (
                            <motion.div
                                key="step_basic"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Basic Profile</h2>
                                <p className="text-slate-500 mb-10 font-medium">Tell us about yourself to begin the assessment.</p>
                                
                                <div className="space-y-8">
                                    {questions.map(q => (
                                        <div key={q.id} className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                                                {q.question}
                                            </label>
                                            {renderInput(q)}
                                            {q.hint && q.type !== 'number' && (
                                                <p className="text-xs font-semibold text-slate-400 ml-1">{q.hint}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button
                                        onClick={nextStep}
                                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-primary transition-all flex items-center gap-2"
                                    >
                                        Start Assessment <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: SYMPTOMS */}
                        {!loading && currentStep === 'SYMPTOMS' && (
                            <motion.div
                                key="step_symptoms"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-2">What&apos;s bothering you?</h2>
                                <p className="text-slate-500 mb-10 font-medium">Select all symptoms you are currently experiencing.</p>

                                <div className="space-y-8">
                                    {questions.map(q => {
                                        const selectedSymptoms = Array.isArray(answers.q1)
                                            ? answers.q1.map(normalizeSymptomOption)
                                            : [];

                                        return (
                                            <div key={q.id} className="space-y-5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                        Symptom groups
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-400">
                                                        {selectedSymptoms.length} selected
                                                    </span>
                                                </div>
                                                {getGroupedSymptomOptions(q.options).map(group => (
                                                    <div key={group.title} className="border-t border-slate-100 pt-4">
                                                        <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
                                                            {group.title}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {group.symptoms.map(opt => {
                                                                const selected = selectedSymptoms.includes(opt);

                                                                return (
                                                                    <button
                                                                        key={opt}
                                                                        type="button"
                                                                        onClick={() => togglePrimarySymptom(opt)}
                                                                        aria-pressed={selected}
                                                                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                                                            selected
                                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary'
                                                                        }`}
                                                                    >
                                                                        {opt}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Additional Details</label>
                                        <textarea 
                                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary outline-hidden transition-all font-medium text-slate-900 min-h-[100px]"
                                            value={answers.q1_other || ''}
                                            onChange={(e) => handleAnswerChange('q1_other', e.target.value)}
                                            placeholder="Describe your condition in detail (optional)..."
                                        />
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-between items-center">
                                    <button onClick={() => setCurrentStep('BASIC')} className="text-slate-400 font-bold flex items-center gap-2"><ArrowLeft className="h-4 w-4"/> Back</button>
                                    <button
                                        onClick={nextStep}
                                        disabled={!(Array.isArray(answers.q1) && answers.q1.length > 0)}
                                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-primary transition-all disabled:opacity-30"
                                    >
                                        Continue Analysis
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: PRELIMINARY */}
                        {!loading && currentStep === 'PRELIMINARY' && (
                            <motion.div
                                key="step_prelim"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Initial Identification</h2>
                                <p className="text-slate-500 mb-10 font-medium">Potential matches based on your primary symptoms.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                    {preliminaryResults.map(res => (
                                        <div key={res.disease} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                            <Brain className="h-8 w-8 text-primary mx-auto mb-4" />
                                            <h3 className="font-bold text-slate-900 mb-2">{res.disease}</h3>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{res.risk_percentage}% Match</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex gap-4 items-center">
                                    <AlertCircle className="h-6 w-6 text-primary shrink-0" />
                                    <p className="text-sm font-medium text-slate-700">We need more clinical data to confirm these possibilities. Let&apos;s proceed to clinical signals.</p>
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button
                                        onClick={nextStep}
                                        className="px-10 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-primary transition-all"
                                    >
                                        Refine Results
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4: CLINICAL */}
                        {!loading && currentStep === 'CLINICAL' && (
                            <motion.div
                                key="step_clinical"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="premium-card p-8 md:p-12"
                            >
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Clinical Signals</h2>
                                <p className="text-slate-500 mb-10 font-medium">Provide known clinical details. Lab values are optional and improve confidence when available.</p>

                                {clinicalQuestions.some(q => OPTIONAL_LAB_FIELDS.has(q.id)) && (
                                    <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Do you know your lab values?</h3>
                                                <p className="mt-1 text-xs font-semibold text-slate-500">Glucose, HbA1c, WBC, platelets, and hematocrit can be skipped.</p>
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
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {clinicalQuestions.filter(q => hasLabData || !OPTIONAL_LAB_FIELDS.has(q.id)).map(q => (
                                        <div key={q.id} className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                                                {q.question}
                                            </label>
                                            {renderInput(q)}
                                            {q.hint && q.type !== 'number' && (
                                                <p className="text-xs font-semibold text-slate-400 ml-1">{q.hint}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-12 flex justify-end">
                                    <button
                                        onClick={nextStep}
                                        className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        Generate Report <Zap className="h-5 w-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 5: FINAL RESULT */}
                        {!loading && currentStep === 'FINAL' && finalResult && (
                            <motion.div
                                key="final"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8 pb-20"
                            >
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-black text-slate-900 mb-2">Refined Clinical Results</h2>
                                    <p className="text-slate-500 font-medium">Analysis powered by Raxa&apos;s multi-signal reasoning engine.</p>
                                </div>

                                {(finalResult.top_diseases || []).map((res, idx: number) => (
                                    <div key={idx} className="premium-card p-8 md:p-12">
                                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-10">
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 mb-3">{res.disease}</h3>
                                                <div className="flex gap-2">
                                                    <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full border border-primary/10 uppercase tracking-widest">
                                                        Confidence: {res.confidence}%
                                                    </span>
                                                    <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                                        {res.confidence_level} Reliability
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-4xl font-black text-slate-900">{res.risk_percentage}%</span>
                                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Risk Score</span>
                                            </div>
                                        </div>

                                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-12">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${res.risk_percentage}%` }}
                                                className={`h-full ${res.risk_percentage > 70 ? 'bg-rose-500' : res.risk_percentage > 40 ? 'bg-amber-500' : 'bg-primary'}`}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                    <Brain className="h-4 w-4" /> Supporting Signals
                                                </h4>
                                                <ul className="space-y-3">
                                                    {(res.explanation?.supportingEvidence || []).map((e: string) => (
                                                        <li key={e} className="flex gap-2 text-sm font-bold text-slate-700">
                                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {e}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-600">
                                                    <p><span className="font-black text-emerald-700">Matched:</span> {res.matched_symptoms?.slice(0, 5).join(', ') || 'None captured'}</p>
                                                    <p className="mt-2"><span className="font-black text-rose-700">Missing key indicators:</span> {res.missing_key_indicators?.slice(0, 5).join(', ') || 'No major missing signals'}</p>
                                                    <p className="mt-2"><span className="font-black text-primary">Lab impact:</span> {res.lab_impact?.summary || 'No numeric clinical/lab boost was applied'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                                    <Beaker className="h-4 w-4" /> Recommended Tests
                                                </h4>
                                                <div className="space-y-2">
                                                    {(res.recommended_tests || []).map((t) => (
                                                        <div key={t.test} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                            <p className="text-sm font-black text-slate-900">{t.test}</p>
                                                            <p className="text-[10px] font-medium text-slate-400">{t.reason}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {finalResult.emergency_warning && (
                                    <div className="p-8 bg-rose-50 border-2 border-rose-100 rounded-3xl flex gap-5 items-center">
                                        <div className="h-12 w-12 bg-rose-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                                            <AlertCircle className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-rose-900 text-lg">Emergency Alert</h3>
                                            <p className="text-rose-700 font-medium text-sm">{finalResult.emergency_warning}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-center pt-10">
                                    <button 
                                        onClick={() => window.location.href = '/health-report'}
                                        className="px-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all"
                                    >
                                        View Full Digital Report
                                    </button>
                                    <button 
                                        onClick={resetAdaptiveScreening}
                                        className="block mx-auto mt-6 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900"
                                    >
                                        Start New Analysis
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdaptiveQuestionnaire;
