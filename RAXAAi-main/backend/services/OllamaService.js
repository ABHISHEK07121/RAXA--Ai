/**
 * Ollama Service
 * Local AI-powered chat using Ollama (no cloud API limits)
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
// Try multiple model names - order matters (first match wins)
const MODEL_PREFERENCES = [
  process.env.OLLAMA_MODEL,           // Custom env setting
  'llama3',                         // Official llama3
  'llama3.1',                       // llama3.1
  'llama3.2',                       // llama3.2
  'dolphin-llama3',                 // Dolphin variant
  'mistral',                        // Mistral
  'phi',                           // Microsoft Phi
  'mixtral',                        // Mixtral
].filter(Boolean);                   // Remove undefined/null values

// System prompt for medical/health assistant context
const MEDICAL_SYSTEM_PROMPT = `You are RAXA, a friendly and professional AI healthcare assistant. Your role is to:

1. SYMPTOM ANALYSIS: Help users identify potential health conditions based on their symptoms. Ask relevant follow-up questions to better understand their condition.

2. MEDICAL INFORMATION: Provide accurate, evidence-based medical information. Explain conditions, symptoms, and general health topics in an understandable way.

3. GUIDANCE & EDUCATION: Guide users on when to seek professional medical care. Provide general wellness tips and preventive measures.

IMPORTANT GUIDELINES:
- NEVER provide a specific medical diagnosis - always recommend consulting a healthcare professional
- For emergency symptoms (chest pain, severe bleeding, difficulty breathing, signs of stroke), immediately advise seeking emergency care
- Maintain a compassionate, professional tone
- Use clear, non-technical language when possible
- Ask ONE or TWO follow-up questions at a time to gather symptom details
- Include relevant disclaimers when discussing medical information

Always prioritize user safety and recommend professional medical consultation for any health concerns.`;

class OllamaService {
  constructor() {
    this.initialized = false;
    this.available = false;
    this.modelName = null;
  }

  /**
   * Initialize the Ollama service
   */
  async initialize() {
    try {
      // Test connection to Ollama
      const response = await fetch(`${OLLAMA_URL}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.warn('⚠ Ollama not responding to /api/tags');
        return false;
      }

      const data = await response.json();
      const models = data.models || [];
      
      if (models.length === 0) {
        console.warn('⚠ No Ollama models available. Run: ollama pull <model>');
        return false;
      }
      
// Try to find configured model using preferences
      let selectedModel = null;
      
      for (const preferredModel of MODEL_PREFERENCES) {
        // Try exact match first
        selectedModel = models.find(m => m.name === preferredModel || m.name.startsWith(preferredModel + ':'));
        
        // If not found, try partial match (e.g., "dolphin-llama3:latest" matches "dolphin-llama3")
        if (!selectedModel) {
          selectedModel = models.find(m => m.name.toLowerCase().includes(preferredModel.toLowerCase()));
        }
        
        if (selectedModel) {
          console.log(`✅ Found model: ${selectedModel.name} (matched: ${preferredModel})`);
          break;
        }
      }
      
      // Use first available model if none found
      if (!selectedModel) {
        selectedModel = models[0];
        console.warn(`⚠ Preferred models not found, using first available: ${selectedModel.name}`);
      }
      
      // Store the model name
      this.modelName = selectedModel.name;
      
// Test if the model actually works with a simple request
      console.log(`Testing model '${this.modelName}'...`);
      const works = await this.testModel();
      
      if (!works) {
        console.warn(`⚠ Model '${this.modelName}' test failed - will still attempt requests`);
        // Don't block - try anyway, might work for actual prompts
      } else {
        console.log(`✅ Model test passed`);
      }
      
      this.initialized = true;
      this.available = true;
      console.log(`✅ Ollama Service initialized (model: ${this.modelName}) - requests will be attempted`);
      return true;
      
    } catch (err) {
      console.warn('⚠ Ollama initialization error:', err.message);
      return false;
    }
  }

  /**
   * Test if model works with simple prompt
   */
  async testModel() {
    try {
      // Try simple completion first (most compatible)
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt: 'Hello',
          stream: false,
          options: { num_predict: 10 }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.length > 0) {
          console.log('✅ Model test passed');
          return true;
        }
      }
      
      // Try chat format as fallback
      const chatResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false
        })
      });
      
      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        if (chatData.message?.content) {
          console.log('✅ Model test passed (chat format)');
          return true;
        }
      }
      
      console.warn('⚠ Model test failed on both formats');
      return false;
      
    } catch (err) {
      console.warn('⚠ Model test error:', err.message);
      return false;
    }
  }

  /**
   * Check if service is available
   */
  get isInitialized() {
    return this.initialized && this.available;
  }

  isDiagnosisPrompt(prompt = '') {
    const lower = String(prompt).toLowerCase();
    return lower.includes('diagnose') || lower.includes('what disease') || lower.includes('which disease');
  }

  /**
   * Generate a response using Ollama
   */
  async generateResponse(prompt) {
    if (this.isDiagnosisPrompt(prompt)) {
      return 'I cannot diagnose. Please consult a doctor.';
    }

    if (!this.isInitialized) {
      throw new Error('Ollama service not initialized');
    }

    try {
      // Try chat format first (better for conversation)
      const chatResponse = await this.tryChatFormat(prompt);
      if (chatResponse) {
        return chatResponse;
      }
      
      // Fallback to completion format
      return await this.tryCompletionFormat(prompt);
      
    } catch (error) {
      console.error('[Ollama] Generation error:', error.message);
      throw error;
    }
  }

  /**
   * Try chat format API
   */
  async tryChatFormat(prompt) {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'system', content: MEDICAL_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 500
          }
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.message?.content || null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Try completion format API
   */
  async tryCompletionFormat(prompt) {
    const fullPrompt = `${MEDICAL_SYSTEM_PROMPT}\n\nUser: ${prompt}\n\nAssistant:`;
    
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  /**
   * Generate a response with conversation history context
   */
  async generateChatResponse(userMessage, conversationHistory = []) {
    if (this.isDiagnosisPrompt(userMessage)) {
      return 'I cannot diagnose. Please consult a doctor.';
    }

    if (!this.isInitialized) {
      throw new Error('Ollama service not initialized');
    }

    const messages = [{ role: 'system', content: MEDICAL_SYSTEM_PROMPT }];
    
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    messages.push({ role: 'user', content: userMessage });

    try {
      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return data.message?.content || data.response;
    } catch (error) {
      console.error('[Ollama] Error:', error);
      throw error;
    }
  }
}

module.exports = new OllamaService();
