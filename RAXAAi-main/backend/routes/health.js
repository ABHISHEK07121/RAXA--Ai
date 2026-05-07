/**
 * Health Routes
 * Endpoints for managing patient health data
 */

const express = require('express');
const router = express.Router();
const HealthData = require('../models/HealthData');

/**
 * POST /api/v2/health/save
 * Save or update patient health data
 */
router.post('/save', async (req, res) => {
  try {
    const { age, gender, height, weight, systolicBp, diastolicBp, bloodGlucose, cholesterol, smokingStatus, symptoms } = req.body;

    // Validate required fields
    if (!age || !gender) {
      return res.status(400).json({
        error: 'Missing required fields: age, gender'
      });
    }

    // Calculate BMI if height and weight provided
    let bmi = null;
    if (height && weight) {
      bmi = weight / ((height / 100) ** 2);
    }

    const healthData = new HealthData({
      age,
      gender,
      height,
      weight,
      bmi,
      systolicBp,
      diastolicBp,
      bloodGlucose,
      cholesterol,
      smokingStatus,
      symptoms
    });

    await healthData.save();

    res.status(201).json({
      success: true,
      message: 'Health data saved successfully',
      data: healthData
    });
  } catch (error) {
    console.error('Error saving health data:', error);
    res.status(500).json({
      error: 'Failed to save health data',
      message: error.message
    });
  }
});

/**
 * GET /api/v2/health/:id
 * Get patient health data by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const healthData = await HealthData.findById(req.params.id);

    if (!healthData) {
      return res.status(404).json({
        error: 'Health data not found'
      });
    }

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve health data',
      message: error.message
    });
  }
});

/**
 * PUT /api/v2/health/:id
 * Update patient health data
 */
router.put('/:id', async (req, res) => {
  try {
    const healthData = await HealthData.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!healthData) {
      return res.status(404).json({
        error: 'Health data not found'
      });
    }

    res.json({
      success: true,
      message: 'Health data updated successfully',
      data: healthData
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to update health data',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v2/health/:id
 * Delete patient health data
 */
router.delete('/:id', async (req, res) => {
  try {
    const healthData = await HealthData.findByIdAndDelete(req.params.id);

    if (!healthData) {
      return res.status(404).json({
        error: 'Health data not found'
      });
    }

    res.json({
      success: true,
      message: 'Health data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to delete health data',
      message: error.message
    });
  }
});

module.exports = router;
