/**
 * Prediction Result Schema
 * Stores disease prediction results
 */

const mongoose = require('mongoose');

const PredictionResultSchema = new mongoose.Schema({
  healthDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HealthData',
    required: true
  },
  
  predictions: [{
    disease: {
      type: String,
      required: true
    },
    riskPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    riskFactors: [String],
    recommendation: {
      type: String,
      required: true
    }
  }],

  topDiseases: [{
    disease: String,
    riskPercentage: Number,
    confidence: Number
  }],

  emergencyAlert: {
    type: String,
    default: null
  },

  analysisDate: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PredictionResult', PredictionResultSchema);
