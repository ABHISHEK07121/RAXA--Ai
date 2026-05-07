/**
 * Symptoms Routes
 * Endpoints for symptom data
 */

const express = require('express');
const router = express.Router();
const Symptom = require('../models/Symptom');

/**
 * GET /api/v2/symptoms
 * Get all symptoms in the system
 */
router.get('/', async (req, res) => {
  try {
    const symptoms = await Symptom.find()
      .select('name category severity isEmergency')
      .limit(100);
    
    res.json({
      success: true,
      count: symptoms.length,
      symptoms
    });
  } catch (error) {
    console.error('Error fetching symptoms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symptoms'
    });
  }
});

/**
 * GET /api/v2/symptoms/:id
 * Get specific symptom details
 */
router.get('/:id', async (req, res) => {
  try {
    const symptom = await Symptom.findById(req.params.id)
      .populate('relatedDiseases', 'name category');
    
    if (!symptom) {
      return res.status(404).json({
        success: false,
        error: 'Symptom not found'
      });
    }
    
    res.json({
      success: true,
      symptom
    });
  } catch (error) {
    console.error('Error fetching symptom:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symptom'
    });
  }
});

/**
 * GET /api/v2/symptoms/search/:query
 * Search symptoms by keyword
 */
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    
    const symptoms = await Symptom.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json({
      success: true,
      count: symptoms.length,
      symptoms
    });
  } catch (error) {
    console.error('Error searching symptoms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search symptoms'
    });
  }
});

module.exports = router;
