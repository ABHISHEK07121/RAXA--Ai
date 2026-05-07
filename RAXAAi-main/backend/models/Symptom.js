/**
 * Symptom Schema
 * Stores all symptoms in the system
 */

const mongoose = require('mongoose');

const SymptomSchema = new mongoose.Schema({
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
  
  // Categorization
  category: {
    type: String,
    enum: ['cardiovascular', 'respiratory', 'gastrointestinal', 'neurological', 'dermatological', 'infectious', 'metabolic', 'musculoskeletal', 'other'],
    default: 'other'
  },
  
  // Severity
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'moderate'
  },
  
  // Emergency indicator
  isEmergency: {
    type: Boolean,
    default: false
  },
  
  // Related conditions
  relatedDiseases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disease'
  }],
  
  // Follow-up questions this symptom might trigger
  followUpQuestions: [String],
  
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

module.exports = mongoose.model('Symptom', SymptomSchema);
