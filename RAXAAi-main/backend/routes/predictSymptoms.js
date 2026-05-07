/**
 * Predict Symptoms Route - Symptom-Based Disease Prediction
 * POST /predict
 * 
 * This is the simple prediction endpoint based on symptom matching.
 * Different from the clinical prediction in predictClinical.js
 * 
 * Input JSON:
 * {
 *   "symptoms": ["fever", "headache", "body pain"]
 * }
 * 
 * Output JSON:
 * {
 *   "predictions": [
 *     {
 *       "disease": "",
 *       "probability": "",
 *       "severity": "",
 *       "advice": ""
 *     }
 *   ]
 * }
 */

const express = require('express');
const router = express.Router();
const { predictDiseases, getAvailableSymptoms, checkEmergency, normalizeClinicalData, validateClinicalData } = require('../services/predictionEngine');

/**
 * POST /predict
 * Predict diseases based on symptoms
 */
router.post('/', (req, res) => {
  try {
    const { symptoms, clinicalData, clinical, vitals, labs } = req.body;
    
    // Validate input
    const hasClinicalData = [clinicalData, clinical, vitals, labs].some(value => value && typeof value === 'object');

    if (!symptoms && !hasClinicalData) {
      return res.status(400).json({
        error: 'Symptoms array or clinical data is required',
        example: {
          symptoms: ["fever", "headache", "body pain"],
          clinicalData: { platelet_count: 120000, oxygen_saturation: 91 }
        }
      });
    }
    
    if (symptoms && !Array.isArray(symptoms)) {
      return res.status(400).json({
        error: 'Symptoms must be an array',
        example: {
          symptoms: ["fever", "headache", "body pain"]
        }
      });
    }
    
    if ((!symptoms || symptoms.length === 0) && !hasClinicalData) {
      return res.status(400).json({
        error: 'At least one symptom or clinical field is required',
        example: {
          symptoms: ["fever", "headache"],
          clinicalData: { systolic_bp: 150, diastolic_bp: 95 }
        }
      });
    }
    
    const mergedClinicalData = normalizeClinicalData({
      ...(clinicalData || {}),
      ...(clinical || {}),
      ...(vitals || {}),
      ...(labs || {})
    });

    const clinicalErrors = validateClinicalData(mergedClinicalData);
    if (clinicalErrors.length > 0) {
      return res.status(400).json({
        error: 'Clinical data validation failed',
        details: clinicalErrors
      });
    }

    // Get prediction results
    const result = predictDiseases(symptoms || [], mergedClinicalData);
    
    // Return formatted response
    res.json(result);
    
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      error: 'Prediction failed',
      message: error.message
    });
  }
});

/**
 * GET /predict/symptoms
 * Get list of all available symptoms for prediction
 */
router.get('/symptoms', (req, res) => {
  try {
    const symptoms = getAvailableSymptoms();
    
    res.json({
      success: true,
      total: symptoms.length,
      symptoms: symptoms
    });
    
  } catch (error) {
    console.error('Error getting symptoms:', error);
    res.status(500).json({
      error: 'Failed to get symptoms',
      message: error.message
    });
  }
});

/**
 * POST /predict/check-emergency
 * Check if symptoms contain emergency indicators
 */
router.post('/check-emergency', (req, res) => {
  try {
    const { symptoms, clinicalData, clinical, vitals, labs } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({
        error: 'Symptoms array is required'
      });
    }
    
    const emergencyCheck = checkEmergency(symptoms, {
      ...(clinicalData || {}),
      ...(clinical || {}),
      ...(vitals || {}),
      ...(labs || {})
    });
    
    res.json({
      isEmergency: emergencyCheck.isEmergency,
      message: emergencyCheck.isEmergency 
        ? `⚠️ Emergency symptom detected: ${emergencyCheck.symptom}`
        : 'No emergency symptoms detected',
      symptom: emergencyCheck.symptom || null
    });
    
  } catch (error) {
    console.error('Emergency check error:', error);
    res.status(500).json({
      error: 'Failed to check emergency',
      message: error.message
    });
  }
});

module.exports = router;
