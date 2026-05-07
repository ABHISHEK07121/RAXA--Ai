/**
 * Symptom Analysis Engine Service
 * Core logic for symptom-to-disease matching and probability scoring
 */

const Disease = require('../models/Disease');
const Symptom = require('../models/Symptom');

class SymptomAnalysisService {
  /**
   * Analyze symptoms and calculate disease probabilities
   * @param {Array} reportedSymptoms - User reported symptoms (strings)
   * @param {Object} contextData - Additional health context
   * @returns {Promise<Array>} - Array of possible diseases with probabilities
   */
  async analyzeSymptomsAndCalculateProbability(reportedSymptoms, contextData = {}) {
    try {
      // Get all diseases with their symptom mappings
      const diseases = await Disease.find().populate('symptoms.symptomId');
      
      // Calculate probability for each disease
      const diseaseScores = [];
      
      for (const disease of diseases) {
        let score = 0;
        let matchedSymptomCount = 0;
        let totalPossibleSymptoms = disease.symptoms.length;
        
        // Match reported symptoms
        for (const reportedSymptom of reportedSymptoms) {
          const symptomLower = reportedSymptom.toLowerCase();
          
          for (const mappedSymptom of disease.symptoms) {
            const symptomName = mappedSymptom.symptomId?.name || '';
            
            if (symptomName.toLowerCase().includes(symptomLower) || 
                symptomLower.includes(symptomName.toLowerCase())) {
              // Add score based on symptom weight
              score += mappedSymptom.weight * 0.4;  // 40% weight for symptom match
              matchedSymptomCount++;
            }
          }
        }
        
        // Calculate symptom match percentage
        const symptomMatchPercentage = totalPossibleSymptoms > 0 
          ? (matchedSymptomCount / totalPossibleSymptoms) * 0.3 
          : 0;
        
        // Apply risk factors from context
        let riskFactorScore = this._calculateRiskFactorScore(disease, contextData);
        
        // Combine scores
        let totalScore = score + symptomMatchPercentage + riskFactorScore;
        
        // Normalize to 0-100 probability
        totalScore = Math.min(100, Math.max(0, totalScore * 100));
        
        // Calculate confidence based on symptom match clarity
        const confidence = Math.min(100, matchedSymptomCount * 15 + riskFactorScore * 10);
        
        if (totalScore > 5) {  // Only include diseases with minimum probability
          diseaseScores.push({
            _id: disease._id,
            name: disease.name,
            category: disease.category,
            severity: disease.severity,
            probability: Math.round(totalScore),
            confidence: Math.round(confidence),
            matchedSymptomCount,
            totalSymptoms: totalPossibleSymptoms,
            description: disease.description,
            emergencySignals: disease.emergencySignals,
            recommendations: disease.recommendations
          });
        }
      }
      
      // Sort by probability (descending)
      diseaseScores.sort((a, b) => b.probability - a.probability);
      
      // Return top diseases with normalized probabilities
      return this._normalizeProbabilities(diseaseScores);
      
    } catch (error) {
      console.error('Error in symptom analysis:', error);
      throw new Error('Failed to analyze symptoms');
    }
  }
  
  /**
   * Generate the next best question to narrow down disease
   * @param {Array} reportedSymptoms - Symptoms reported so far
   * @param {Array} possibleDiseases - Current possible diseases
   * @param {Array} askedQuestions - Questions already asked
   * @returns {Promise<Object>} - Next question to ask
   */
  async generateNextQuestion(reportedSymptoms, possibleDiseases, askedQuestions = []) {
    try {
      // Get top 5 diseases to focus on
      const topDiseases = possibleDiseases.slice(0, 5);
      
      if (topDiseases.length === 0) {
        return {
          questionText: 'Could you describe any other symptoms you\'re experiencing?',
          questionId: 'clarification_q1',
          type: 'text',
          reasoning: 'Need more information to narrow down'
        };
      }
      
      // Find distinguishing symptoms between top diseases
      const distinguishingSymptoms = this._findDistinguishingSymptoms(topDiseases);
      
      // Find a question that hasn't been asked yet
      for (const symptom of distinguishingSymptoms) {
        if (!askedQuestions.includes(symptom)) {
          return {
            questionText: `Do you experience ${symptom}?`,
            questionId: `symptom_${symptom.replace(/\s+/g, '_')}`,
            type: 'yes_no',
            reasoning: `This symptom helps distinguish between ${topDiseases.slice(0, 2).map(d => d.name).join(' and ')}`
          };
        }
      }
      
      // If no distinguishing symptoms, ask about severity or duration
      return {
        questionText: 'How long have you been experiencing these symptoms?',
        questionId: 'duration_q1',
        type: 'multiple_choice',
        options: ['Less than 24 hours', '1-7 days', '1-4 weeks', 'More than a month'],
        reasoning: 'Duration helps differentiate disease types'
      };
      
    } catch (error) {
      console.error('Error generating next question:', error);
      throw error;
    }
  }
  
  /**
   * Check if symptoms indicate emergency
   * @param {Array} symptoms - User reported symptoms
   * @returns {Array} - Emergency alerts if any
   */
  async checkEmergencyAlerts(symptoms) {
    const emergencySymptoms = [
      'chest pain',
      'difficulty breathing',
      'severe bleeding',
      'loss of consciousness',
      'severe allergic reaction',
      'poisoning',
      'severe burns',
      'choking',
      'severe head injury',
      'sudden vision loss',
      'stroke symptoms',
      'severe abdominal pain',
      'anaphylaxis'
    ];
    
    const alerts = [];
    
    for (const symptom of symptoms) {
      for (const emergencySymptom of emergencySymptoms) {
        if (symptom.toLowerCase().includes(emergencySymptom)) {
          alerts.push({
            alert: `EMERGENCY ALERT: ${emergencySymptom.toUpperCase()}. Call emergency services immediately.`,
            severity: 'critical',
            timestamp: new Date()
          });
        }
      }
    }
    
    return alerts;
  }
  
  /**
   * Generate final recommendations and disclaimer
   * @param {Array} topDiseases - Top possible diseases
   * @returns {Object} - Recommendations and disclaimers
   */
  generateFinalRecommendations(topDiseases) {
    const disclaimers = [
      '⚠️ MEDICAL DISCLAIMER: This is NOT a medical diagnosis.',
      '⚠️ This AI tool provides estimated information based on reported symptoms.',
      '⚠️ Always consult with a qualified healthcare professional for proper diagnosis and treatment.',
      '⚠️ In case of emergency symptoms, call 911 or visit an emergency room immediately.',
      '⚠️ Do not delay seeking medical attention based on this assessment.'
    ];
    
    const recommendations = [];
    
    if (topDiseases.length > 0) {
      recommendations.push(`Based on your symptoms, consider consulting healthcare professionals about: ${topDiseases.slice(0, 3).map(d => d.name).join(', ')}`);
    }
    
    recommendations.push('Schedule an appointment with a doctor for proper evaluation');
    recommendations.push('Keep track of symptom progression and duration');
    recommendations.push('Note any patterns or triggers for your symptoms');
    
    // Severity-based recommendations
    if (topDiseases.some(d => d.severity === 'critical' || d.severity === 'severe')) {
      recommendations.push('Seek urgent medical attention given the severity of potential conditions');
    }
    
    return {
      recommendations,
      disclaimers,
      emergencyWarning: 'If you experience chest pain, difficulty breathing, or other severe symptoms, call 911 immediately.'
    };
  }
  
  /**
   * PRIVATE HELPER METHODS
   */
  
  /**
   * Calculate risk factor score based on context
   */
  _calculateRiskFactorScore(disease, contextData) {
    let score = 0;
    
    // Age-based risk factors
    if (contextData.age) {
      const ageRisks = this._getAgeRelatedRisks(disease.category, contextData.age);
      score += ageRisks * 0.2;
    }
    
    // Family history
    if (contextData.familyHistory && Array.isArray(contextData.familyHistory)) {
      if (contextData.familyHistory.includes(disease.name)) {
        score += 0.15;
      }
    }
    
    // Lifestyle factors
    if (contextData.lifestyle) {
      const lifestyleRisks = this._getLifestyleRisks(disease.category, contextData.lifestyle);
      score += lifestyleRisks * 0.15;
    }
    
    return Math.min(0.5, score);  // Cap at 0.5
  }
  
  /**
   * Get age-related risk multiplier
   */
  _getAgeRelatedRisks(category, age) {
    const ageRisks = {
      'cardiovascular': age > 40 ? 0.3 : 0.1,
      'metabolic': age > 50 ? 0.3 : 0.1,
      'infectious': age < 5 || age > 65 ? 0.2 : 0.05,
      'neurological': age > 60 ? 0.25 : 0.1,
      'degenerative': age > 55 ? 0.3 : 0.1
    };
    
    return ageRisks[category] || 0.05;
  }
  
  /**
   * Get lifestyle risk factors
   */
  _getLifestyleRisks(category, lifestyle) {
    let score = 0;
    
    if (lifestyle.smoking && category === 'respiratory') score += 0.15;
    if (lifestyle.sedentary && category === 'cardiovascular') score += 0.15;
    if (lifestyle.poorDiet && category === 'metabolic') score += 0.15;
    if (lifestyle.stress && category === 'neurological') score += 0.1;
    
    return Math.min(0.3, score);
  }
  
  /**
   * Find symptoms that distinguish between top diseases
   */
  _findDistinguishingSymptoms(diseases) {
    if (diseases.length < 2) return [];
    
    const allSymptoms = new Set();
    const commonSymptoms = new Set();
    
    // Get all symptoms from first disease
    if (diseases[0].symptoms && Array.isArray(diseases[0].symptoms)) {
      diseases[0].symptoms.forEach(s => {
        allSymptoms.add(s.symptomId?.name || '');
      });
    }
    
    // Find symptoms common to all diseases
    for (let i = 1; i < diseases.length; i++) {
      const currentSymptoms = new Set();
      if (diseases[i].symptoms && Array.isArray(diseases[i].symptoms)) {
        diseases[i].symptoms.forEach(s => {
          currentSymptoms.add(s.symptomId?.name || '');
        });
      }
      
      // Intersection
      allSymptoms.forEach(symptom => {
        if (currentSymptoms.has(symptom)) {
          commonSymptoms.add(symptom);
        }
      });
    }
    
    // Return non-common symptoms as distinguishing
    const distinguishing = Array.from(allSymptoms).filter(s => !commonSymptoms.has(s));
    return distinguishing.slice(0, 5);  // Top 5
  }
  
  /**
   * Normalize probabilities to sum to 100%
   */
  _normalizeProbabilities(diseases) {
    if (diseases.length === 0) return [];
    
    const total = diseases.reduce((sum, d) => sum + d.probability, 0);
    
    if (total === 0) return diseases;
    
    return diseases.map(disease => ({
      ...disease,
      probability: Math.round((disease.probability / total) * 100)
    }));
  }
}

module.exports = new SymptomAnalysisService();
