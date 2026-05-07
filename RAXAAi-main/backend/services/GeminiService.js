/**
 * Gemini Service (Enhanced)
 * Handles AI-powered chat interactions using Google's Gemini API
 * With healthcare-specific prompts and streaming support
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Healthcare-focused system prompt with clinical guidelines
const HEALTHCARE_SYSTEM_PROMPT = `You are RAXA, a clinical AI assistant trained on medical knowledge.

YOUR ROLE:
1. SYMPTOM ANALYSIS: Help users identify potential health conditions based on their symptoms
2. MEDICAL INFORMATION: Provide accurate, evidence-based medical information
3. GUIDANCE & EDUCATION: Guide users on when to seek professional medical care

CRITICAL SAFETY GUIDELINES:
- NEVER provide a specific medical diagnosis - always recommend consulting a healthcare professional
- For emergency symptoms (chest pain, severe bleeding, difficulty breathing, signs of stroke), immediately advise seeking emergency care (call emergency services)
- Maintain a compassionate, professional tone
- Use clear, non-technical language when possible
- Ask ONE or TWO follow-up questions at a time to gather symptom details
- Include relevant disclaimers when discussing medical information
- If the user describes serious symptoms, always err on the side of caution and recommend professional care

Always prioritize user safety and recommend professional medical consultation for any health concerns.`;

// Fallback response for when AI services are unavailable
const FALLBACK_RESPONSES = {
  greeting: "Hello! I'm RAXA, your health assistant. How can I help you today?",
  general: "I'm here to help with health-related questions. For specific symptoms, I'd recommend trying our comprehensive screening at /adaptive-screening for a detailed assessment.",
  emergency: "⚠️ If you're experiencing a medical emergency, please call emergency services immediately.",
};

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  /**
   * Initialize the Gemini service with API key
   */
  initialize(apiKey) {
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.0-flash for latest model withconfig
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40,
      }
    });
    
    this.initialized = true;
    console.log('✅ Gemini Service initialized successfully');
  }

  /**
   * Check if service is initialized - getter property for consistent access
   */
  get isInitialized() {
    return this.initialized;
  }

  isDiagnosisPrompt(prompt = '') {
    const lower = String(prompt).toLowerCase();
    return lower.includes('diagnose') || lower.includes('what disease') || lower.includes('which disease');
  }

  /**
   * Build chat history for context
   */
  buildChatHistory(conversationHistory = []) {
    const messages = [{ role: 'user', parts: [{ text: HEALTHCARE_SYSTEM_PROMPT }] }];
    
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });
    
    return messages;
  }

  /**
   * Generate a response using Gemini AI with context
   */
  async generateResponse(prompt, conversationHistory = []) {
    if (this.isDiagnosisPrompt(prompt)) {
      return 'I cannot diagnose. Please consult a doctor.';
    }

    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }
    
    try {
      const chat = this.model.startChat({
        history: this.buildChatHistory(conversationHistory),
      });
      
      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini request failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate streaming response (for real-time UI updates)
   */
  async *generateStreamResponse(prompt, conversationHistory = []) {
    if (this.isDiagnosisPrompt(prompt)) {
      yield 'I cannot diagnose. Please consult a doctor.';
      return;
    }

    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }
    
    try {
      const chat = this.model.startChat({
        history: this.buildChatHistory(conversationHistory),
      });
      
      const result = await chat.sendMessageStream(prompt);
      
      for (const chunk of result.stream) {
        yield chunk.text();
      }
    } catch (error) {
      console.error('Gemini stream error:', error.message);
      throw error;
    }
  }

  /**
   * Quick generate without history context
   */
  async quickGenerate(prompt) {
    if (this.isDiagnosisPrompt(prompt)) {
      return 'I cannot diagnose. Please consult a doctor.';
    }

    if (!this.isInitialized) {
      throw new Error('Gemini service not initialized');
    }
    
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: {
          role: 'user',
          parts: [{ text: HEALTHCARE_SYSTEM_PROMPT }]
        }
      });
      
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini quick generate failed:', error.message);
      throw error;
    }
  }

  /**
   * Get fallback response based on keyword
   */
  getFallbackResponse(query) {
    const lowerQuery = query.toLowerCase();
    
// Emergency check first
    if (this.isEmergency(query)) {
      return FALLBACK_RESPONSES.emergency;
    }
    
    // Keyword matching for common health questions
    if (lowerQuery.includes('diabetes') || lowerQuery.includes('blood sugar')) {
      return "For diabetes concerns, key factors include: blood glucose levels, BMI, family history, and lifestyle. Would you like me to help assess your risk? Try our full screening at /adaptive-screening!";
    } else if (lowerQuery.includes('blood pressure') || lowerQuery.includes('bp') || lowerQuery.includes('hypertension')) {
      return "High blood pressure is often silent. Risk factors include: salt intake, stress, obesity, and genetics. Regular monitoring is important. Try our /adaptive-screening for a risk assessment!";
    } else if (lowerQuery.includes('fever') || lowerQuery.includes('cough') || lowerQuery.includes('cold')) {
      return "Fever and cough could indicate various conditions - from a common cold to flu or other infections. I can help assess if it might need attention. Try our full screening!";
    } else if (lowerQuery.includes('capabilities') || lowerQuery.includes('what can you do')) {
      return "RAXA can help with: symptom analysis, disease risk assessment (25+ diseases), health recommendations, and guiding you on when to see a doctor. Try our smart screening at /adaptive-screening!";
    } else if (lowerQuery.includes('heart') || lowerQuery.includes('chest pain')) {
      return "Chest pain should never be ignored. If it's severe or accompanied by shortness of breath, sweating, or pain radiating to arm/jaw, seek emergency care immediately. For other concerns, try our screening.";
    } else if (lowerQuery.includes('headache') || lowerQuery.includes('migraine')) {
      return "Headaches have many causes: tension, dehydration, sinus issues, or migraines. Note triggers and severity. Sudden severe headache needs immediate attention.";
    }
    
return FALLBACK_RESPONSES.general;
  }

  /**
   * Check if query describes emergency symptoms
   */
  isEmergency(query) {
    const lowerQuery = query.toLowerCase();
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'stroke', 'seizure',
      'severe bleeding', 'cannot breathe', 'difficulty breathing',
      'unconscious', 'overdose', 'poisoning'
    ];
    
    return emergencyKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}

module.exports = new GeminiService();
