/**
 * Disease Schema
 * Stores disease information and symptom mappings
 */

const mongoose = require('mongoose');

const DiseaseSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  description: {
    type: String,
    default: ''
  },
  
  medicalDefinition: {
    type: String,
    default: ''
  },
  
  // Categorization
  category: {
    type: String,
    enum: ['infectious', 'chronic', 'genetic', 'autoimmune', 'degenerative', 'metabolic', 'cardiovascular', 'neurological', 'other'],
    default: 'other'
  },
  
  // Prevalence and severity
  prevalence: {
    type: String,
    enum: ['rare', 'uncommon', 'common', 'very_common'],
    default: 'uncommon'
  },
  
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe', 'critical'],
    default: 'moderate'
  },
  
  // Symptoms associated with this disease
  symptoms: [{
    symptomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Symptom'
    },
    // Weight: importance of this symptom for this disease (0-1)
    weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    // Frequency: how often this symptom appears in patients
    frequency: {
      type: String,
      enum: ['rare', 'occasional', 'common', 'always'],
      default: 'common'
    }
  }],
  
  // Risk factors that increase likelihood
  riskFactors: [{
    factor: String,
    weight: Number  // 0-1
  }],
  
  // Recommendations and treatments
  recommendations: [String],
  
  // When to seek emergency care
  emergencySignals: [String],
  
  // Basic treatment info (not medical advice)
  basicInfo: {
    causes: [String],
    preventionTips: [String],
    commonTreatments: [String]
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Disease', DiseaseSchema);
