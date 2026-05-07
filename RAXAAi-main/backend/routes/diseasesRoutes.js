/**
 * Diseases Routes
 * Endpoints for disease information
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Disease = require('../models/Disease');

const COMMON_DISEASES = [
  'Common Cold', 'Influenza (Flu)', 'COVID-19', 'Pneumonia', 'Bronchitis',
  'Tuberculosis', 'Dengue', 'Malaria', 'Typhoid', 'Hepatitis B',
  'Gastroenteritis', 'Urinary Tract Infection', 'Strep Throat', 'Sinusitis',
  'Hypertension (High Blood Pressure)', 'Heart Disease', 'Coronary Artery Disease',
  'Arrhythmia', 'Stroke', 'High Cholesterol',
  'Type 2 Diabetes', 'Obesity', 'PCOS', 'Thyroid Disorder',
  'Migraine', 'Epilepsy', 'Parkinson\'s Disease', 'Alzheimer\'s Disease',
  'Anxiety Disorder', 'Depression', 'Insomnia', 'Asthma', 'COPD',
  'Arthritis', 'Osteoporosis', 'GERD', 'IBS',
  'Allergic Rhinitis', 'Eczema', 'Urticaria', 'Acne'
];

function buildFieldProfile(diseaseName, category) {
  const commonFields = ['age', 'gender'];

  const fieldProfiles = {
    infectious: {
      required: [
        'age', 'gender', 'fever', 'cough', 'shortness_of_breath', 'fatigue'
      ],
      recommended: ['headache', 'sore_throat', 'runny_nose', 'congestion']
    },
    cardiovascular: {
      required: [
        'age', 'gender', 'height_cm', 'weight_kg', 'bmi', 'systolic_bp',
        'diastolic_bp', 'total_cholesterol', 'smoking_status'
      ],
      recommended: ['heart_rate', 'fasting_glucose', 'family_history_heart_disease', 'exercise_frequency']
    },
    metabolic: {
      required: [
        'age', 'gender', 'height_cm', 'weight_kg', 'bmi', 'total_cholesterol'
      ],
      recommended: ['fasting_glucose', 'hemoglobin_a1c', 'dietary_habits', 'sleep_hours_per_night', 'exercise_frequency']
    },
    neurological: {
      required: [
        'age', 'gender', 'headache', 'dizziness', 'memory_issues',
        'sleep_hours_per_night', 'migraine_history'
      ],
      recommended: ['anxiety_history', 'depression_history', 'insomnia']
    },
    chronic: {
      required: [
        'age', 'gender', 'fever', 'cough', 'shortness_of_breath',
        'fatigue', 'chest_pain'
      ],
      recommended: ['smoking_status', 'exercise_frequency', 'sleep_hours_per_night']
    },
    degenerative: {
      required: [
        'age', 'gender', 'memory_issues', 'tremors', 'dizziness',
        'sleep_hours_per_night'
      ],
      recommended: ['family_history_diabetes', 'family_history_heart_disease']
    },
    other: {
      required: [
        'age', 'gender', 'runny_nose', 'sneezing', 'itching', 'rash'
      ],
      recommended: ['sleep_hours_per_night', 'stress_level']
    }
  };

  const profile = fieldProfiles[category] || fieldProfiles.other;

  if (diseaseName.toLowerCase().includes('diabetes')) {
    profile.recommended = Array.from(new Set([...profile.recommended, 'fasting_glucose', 'hemoglobin_a1c']));
  }

  return profile;
}

/**
 * GET /api/v2/diseases/common
 * Return curated most common disease names
 */
router.get('/common', async (req, res) => {
  res.json({
    success: true,
    count: COMMON_DISEASES.length,
    diseases: COMMON_DISEASES
  });
});

/**
 * GET /api/v2/diseases/list
 * Alias for the full disease list
 */
router.get('/list', async (req, res) => {
  try {
    const diseases = await Disease.find()
      .select('name category severity description prevalence')
      .limit(100);

    res.json({
      success: true,
      count: diseases.length,
      diseases
    });
  } catch (error) {
    console.error('Error fetching disease list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch disease list'
    });
  }
});

/**
 * GET /api/v2/diseases/categories
 * Get all available disease categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Disease.distinct('category');
    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch disease categories'
    });
  }
});

/**
 * GET /api/v2/diseases/category/:category
 * Get diseases by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const diseases = await Disease.find({ category: req.params.category })
      .select('name severity description prevalence');

    res.json({
      success: true,
      category: req.params.category,
      count: diseases.length,
      diseases
    });
  } catch (error) {
    console.error('Error fetching diseases by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch diseases'
    });
  }
});

/**
 * POST /api/v2/diseases/search
 * Search diseases by keyword
 */
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    const diseases = await Disease.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).select('name category severity description prevalence').limit(50);

    res.json({
      success: true,
      count: diseases.length,
      diseases
    });
  } catch (error) {
    console.error('Error searching diseases:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search diseases'
    });
  }
});

/**
 * GET /api/v2/diseases/fields/:name
 * Get required and recommended clinical fields for a disease
 */
router.get('/fields/:name', async (req, res) => {
  try {
    const requestedName = decodeURIComponent(req.params.name);
    const disease = await Disease.findOne({ name: { $regex: `^${requestedName}$`, $options: 'i' } })
      .select('name category');

    const category = disease ? disease.category : 'other';
    const fields = buildFieldProfile(requestedName, category);

    res.json({
      success: true,
      disease: requestedName,
      category,
      requiredFields: fields.required,
      recommendedFields: fields.recommended
    });
  } catch (error) {
    console.error('Error fetching disease fields:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch disease fields'
    });
  }
});

/**
 * GET /api/v2/diseases/:id
 * Get detailed disease information by ID or name
 */
router.get('/:id', async (req, res) => {
  try {
    let disease;

    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      disease = await Disease.findById(req.params.id)
        .populate('symptoms.symptomId', 'name description category');
    }

    if (!disease) {
      disease = await Disease.findOne({ name: { $regex: `^${req.params.id}$`, $options: 'i' } })
        .populate('symptoms.symptomId', 'name description category');
    }

    if (!disease) {
      return res.status(404).json({
        success: false,
        error: 'Disease not found'
      });
    }

    res.json({
      success: true,
      disease
    });
  } catch (error) {
    console.error('Error fetching disease:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch disease'
    });
  }
});

/**
 * POST /api/v2/diseases
 * Add a new disease (admin only in production)
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, category, symptoms, riskFactors } = req.body;

    const disease = new Disease({
      name,
      description,
      category,
      symptoms,
      riskFactors
    });

    await disease.save();

    res.status(201).json({
      success: true,
      disease
    });
  } catch (error) {
    console.error('Error creating disease:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create disease'
    });
  }
});

module.exports = router;
