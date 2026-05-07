/**
 * Health Data Schema
 * Stores patient health information
 */

const mongoose = require('mongoose');

const HealthDataSchema = new mongoose.Schema({
  // Basic Information
  patientId: {
    type: String,
    unique: true,
    sparse: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },

  // Physical Measurements
  height: {
    type: Number,
    default: null
  },
  weight: {
    type: Number,
    default: null
  },
  bmi: {
    type: Number,
    default: null
  },

  // Vital Signs
  systolicBp: {
    type: Number,
    default: null
  },
  diastolicBp: {
    type: Number,
    default: null
  },
  bloodGlucose: {
    type: Number,
    default: null
  },
  cholesterol: {
    type: Number,
    default: null
  },

  // Lifestyle
  smokingStatus: {
    type: String,
    enum: ['never', 'former', 'current'],
    default: null
  },
  alcoholConsumption: {
    type: String,
    enum: ['none', 'moderate', 'heavy'],
    default: null
  },

  // Symptoms
  symptoms: {
    fever: Boolean,
    cough: Boolean,
    shortnessOfBreath: Boolean,
    chestPain: Boolean,
    fatigue: Boolean,
    bodyAche: Boolean,
    headache: Boolean,
    nausea: Boolean,
    diarrhea: Boolean
  },

  // Medical History
  medicalHistory: [String],
  medications: [String],
  allergies: [String],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
HealthDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HealthData', HealthDataSchema);
