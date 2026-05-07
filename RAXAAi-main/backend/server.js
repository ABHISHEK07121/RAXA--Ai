/**
 * RAXA AI Backend - Express.js Server
 * Smart Multi-Disease Prediction with ML Models
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes - RAXA AI Chat-based Health Assistant
const symptomsRoutes = require('./routes/symptomsRoutes');
const predictRoutes = require('./routes/predict');
const healthRoutes = require('./routes/health');
const adaptiveRoutes = require('./routes/adaptive');
const diseasesInfoRoutes = require('./routes/diseases');

// Import simple predict route for symptom-based prediction
const simplePredictRoutes = require('./routes/predictSymptoms');

// Import services
const supabaseService = require('./services/SupabaseService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS Configuration
const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'https://raxa-ai.vercel.app'
];
const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultCorsOrigins;

app.use(cors({
  origin: configuredOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
app.use(morgan('combined'));

// ============================================================================
// RATE LIMITING (Security)
// ============================================================================

// General API rate limit: 100 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again in 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Chat endpoint rate limit: 30 requests per minute (to protect AI services)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'Chat rate limit exceeded',
    message: 'Too many chat requests. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);
app.use('/chat', chatLimiter);

// ============================================================================
// DATABASE CONNECTION (Optional - Graceful Degradation)
// ============================================================================

// Try to connect to MongoDB, but continue even if it fails
// The server will work for read-only operations without database
const mongoUri = process.env.MONGODB_URI;

if (mongoUri) {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✓ MongoDB connected successfully'))
  .catch(err => {
    console.warn('⚠ MongoDB connection failed - running in limited mode');
    console.warn('  Some features requiring database will not work');
  });
} else {
  console.warn('⚠ MongoDB not configured - running in limited mode');
  console.warn('  Add MONGODB_URI to .env for full functionality');
}

// ============================================================================
// SUPABASE POSTGRESQL CONNECTION (Primary Database)
// ============================================================================

// Initialize Supabase PostgreSQL connection if credentials provided
const supabaseDbUrl = process.env.SUPABASE_DB_URL;
const supabaseUrl = process.env.SUPABASE_URL || 'https://gufcokhxdpgiddbogknu.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SB_PUBLISHABLE_KEY;

if (supabaseDbUrl) {
  console.log('🔄 Connecting to Supabase PostgreSQL...');
  try {
    supabaseService.initialize(supabaseDbUrl, supabaseUrl, supabaseKey);
    
    // Test the connection asynchronously
    supabaseService.testConnection()
      .then(connected => {
        if (connected) {
          console.log('✅ Supabase PostgreSQL connected successfully');
        } else {
          console.warn('⚠ Supabase connection test failed - but service initialized');
        }
      })
      .catch(err => {
        console.warn('⚠ Supabase connection error:', err.message);
      });
  } catch (err) {
    console.warn('⚠ Failed to initialize Supabase service:', err.message);
  }
} else {
  console.log('ℹ️ SUPABASE_DB_URL not set - Supabase not connected');
  console.log('   Add SUPABASE_DB_URL to .env to enable PostgreSQL');
}

// ============================================================================
// API ROUTES - RAXA AI CHAT SYSTEM
// ============================================================================

// API v2 routes
app.use('/api/v2/symptoms', symptomsRoutes);
app.use('/api/v2/predict', predictRoutes);
app.use('/api/v2/health', healthRoutes);
app.use('/api/v2/adaptive', adaptiveRoutes);

// Use diseases.js for disease info (has more endpoints like /detect, /supported-diseases)
app.use('/api/v2/diseases', diseasesInfoRoutes);

// Simple symptom-based prediction endpoint (Requirement)
app.use('/predict', simplePredictRoutes);

// Also mount diseasesRoutes for MongoDB-based disease data (different sub-routes)
// Note: diseases.js must be registered first for specific routes like /detect
// diseasesRoutes.js can be available for MongoDB operations if needed later

// Simple chat endpoint for ChatWidget (accepts { query: "..." })
const geminiService = require('./services/GeminiService');
const ollamaService = require('./services/OllamaService');

// Track AI service initialization status
let aiServicesReady = false;
let aiInitError = null;

// Initialize AI services properly - wait for completion before server starts
async function initializeAIServices() {
  console.log('🔄 Initializing AI services...');
  
  // Initialize Ollama (local AI - no limits)
  try {
    const ollamaResult = await ollamaService.initialize();
    if (ollamaResult) {
      console.log('✅ Ollama initialized successfully');
    } else {
      console.warn('⚠ Ollama failed to initialize - will use fallback');
    }
  } catch (err) {
    console.warn('⚠ Ollama initialization error:', err.message);
    aiInitError = err.message;
  }

  // Initialize Gemini if API key is available (backup to Ollama)
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY.trim();
    if (apiKey && apiKey.length > 10) {
      try {
        geminiService.initialize(apiKey);
        console.log('✅ Gemini initialized successfully');
      } catch (err) {
        console.warn('⚠ Gemini initialization failed:', err.message);
      }
    } else {
      console.warn('⚠ GOOGLE_GEMINI_API_KEY appears invalid (too short or empty)');
    }
  } else {
    console.log('ℹ️ GOOGLE_GEMINI_API_KEY not found - using Ollama only');
  }

  aiServicesReady = true;
  console.log('✅ AI services ready for chat requests');
}

// Initialize AI services before starting server
initializeAIServices().then(() => {
  console.log('🎯 Chat endpoint ready at POST /chat');
});

app.post('/chat', async (req, res) => {
  const { query } = req.body;
  
  // Debug log for troubleshooting
  console.log(`[CHAT] Query: "${query}" | Ollama: ${ollamaService.isInitialized} | Gemini: ${geminiService.isInitialized}`);
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }
  
  // Try Ollama first (local AI - unlimited)
  if (ollamaService.isInitialized) {
    try {
      console.log('[CHAT] Trying Ollama...');
      const aiResponse = await ollamaService.generateResponse(query);
      console.log('[CHAT] Ollama response received');
      return res.json({ answer: aiResponse, aiSource: 'ollama' });
    } catch (err) {
      console.warn('⚠ Ollama request failed:', err.message);
      // Fall through to try Gemini or fallback
    }
  } else {
    console.warn('⚠ Ollama not initialized - skipping');
  }
  
  // Try Gemini as backup (if quota allows)
  if (geminiService.isInitialized) {
    try {
      console.log('[CHAT] Trying Gemini...');
      const aiResponse = await geminiService.generateResponse(query);
      console.log('[CHAT] Gemini response received');
      return res.json({ answer: aiResponse, aiSource: 'gemini' });
    } catch (err) {
      // Check for quota errors - handle various error formats
      const errMessage = err.message || '';
      const errStatus = err.status || err.statusCode || 0;
      const isQuotaError = errStatus === 429 || errMessage.includes('quota') || errMessage.includes('Too Many Requests') || errMessage.includes('429');
      
      if (isQuotaError) {
        console.warn('⚠ Gemini quota exceeded');
      } else {
        console.warn('⚠ Gemini request failed:', err.message);
      }
    }
  } else {
    console.warn('⚠ Gemini not initialized - skipping');
  }
  
  // Only use keyword fallback if BOTH AI services are unavailable
  const ollamaAvailable = ollamaService.isInitialized;
  const geminiAvailable = geminiService.isInitialized;
  
  if (!ollamaAvailable && !geminiAvailable) {
    console.warn('⚠ No AI services available - using keyword fallback');
  }
  
  // Final fallback keyword-based responses (only when AI truly unavailable)
  const lowerQuery = query.toLowerCase();
  
  // Keyword matching - more comprehensive
  let answer = null;
  
  if (lowerQuery.includes('diabetes') || lowerQuery.includes('blood sugar') || lowerQuery.includes('glucose')) {
    answer = "For diabetes awareness: key factors are blood glucose levels, BMI, family history, and lifestyle. Try our smart screening at /adaptive-screening for a personalized risk assessment!";
  } else if (lowerQuery.includes('blood pressure') || lowerQuery.includes('bp') || lowerQuery.includes('hypertension')) {
    answer = "High blood pressure is often silent. Risk factors include: salt intake, stress, obesity, and genetics. Regular monitoring is important. Start /adaptive-screening for a quick check!";
  } else if (lowerQuery.includes('fever') || lowerQuery.includes('cough') || lowerQuery.includes('flu') || lowerQuery.includes('cold')) {
    answer = "Fever and cough could be from a common cold, flu, or other infection. I can help assess your symptoms - try our /adaptive-screening for a quick risk check!";
  } else if (lowerQuery.includes('capabilities') || lowerQuery.includes('what can you do') || lowerQuery.includes('help')) {
    answer = "RAXA helps with: symptom analysis, 25+ disease risk assessment, health recommendations, and guidance on when to see a doctor. Start your free screening at /adaptive-screening!";
  } else if (lowerQuery.includes('heart') || lowerQuery.includes('chest pain') || lowerQuery.includes('cardiac')) {
    answer = "⚠️ Chest pain should never be ignored. If severe or with shortness of breath, sweating, or arm/jaw pain - seek emergency care immediately! For other concerns, try our screening.";
  } else if (lowerQuery.includes('headache') || lowerQuery.includes('migraine') || lowerQuery.includes('head pain')) {
    answer = "Headaches have many causes: tension, dehydration, sinus issues, or migraines. Note triggers and severity. Sudden severe headache needs immediate attention.";
  } else if (lowerQuery.includes('weight') || lowerQuery.includes('bmi') || lowerQuery.includes('obese') || lowerQuery.includes('overweight')) {
    answer = "Weight and BMI affect many health conditions. Enter your weight/height in our /adaptive-screening to calculate your BMI and get personalized health insights!";
  } else if (lowerQuery.includes('symptom') || lowerQuery.includes('feel') || lowerQuery.includes('sick')) {
    answer = "I can help assess your health concerns! Tell me your symptoms or try our smart screening at /adaptive-screening for a complete disease risk analysis.";
  }
  
  // If no keyword match, provide a helpful response
  if (!answer) {
    answer = "I'm here to help with your health questions! Try our free smart screening at /adaptive-screening for personalized disease risk analysis, or describe your symptoms and I'll do my best to assist.";
  }
  
  res.json({ answer, aiSource: 'fallback' });
});

// AI Services Health Check
app.get('/api/health/ai', (req, res) => {
  res.json({
    ollama: ollamaService.isInitialized ? 'running' : 'unavailable',
    gemini: geminiService.isInitialized ? 'available' : 'unavailable',
    fallback: 'ready'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const supabaseStatus = supabaseService.getStatus();
  res.json({
    status: 'ok',
    message: 'RAXA AI Backend is running',
    version: process.env.API_VERSION || '2.0.0',
    timestamp: new Date().toISOString(),
    databases: {
      supabase: supabaseStatus.connected ? 'connected' : (supabaseStatus.initialized ? 'initialized' : 'not configured'),
      mongodb: process.env.MONGODB_URI ? 'configured' : 'not configured'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'RAXA AI Health Assistant',
    description: 'AI-powered symptom analysis with dynamic questioning',
    version: process.env.API_VERSION || '2.0.0',
    features: [
      'Chat-based symptom analysis',
      'Dynamic follow-up questioning',
      'Multiple disease probability scoring',
      'Emergency alert detection',
      'Conversation history storage',
      'Health recommendations'
    ],
    endpoints: {
      chat: '/chat',
      symptoms: '/api/v2/symptoms',
      diseases: '/api/v2/diseases',
      adaptive: '/api/v2/adaptive',
      predict: '/api/v2/predict',
      health: '/api/health',
      aiHealth: '/api/health/ai',
      docs: '/api/docs'
    }
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'RAXA AI Health Assistant API',
    version: '2.0.0',
    endpoints: [
      {
        method: 'POST',
        path: '/chat',
        description: 'Send a health question to the AI assistant',
        body: { query: 'string' }
      },
      {
        method: 'POST',
        path: '/api/v2/adaptive/analyze',
        description: 'Run adaptive screening analysis using demographic, symptom, and clinical inputs',
        body: { q2: 'number', q3: 'string', q1: 'string[]', weight_kg: 'number', height_cm: 'number' }
      },
      {
        method: 'GET',
        path: '/api/v2/adaptive/questions',
        description: 'Get the initial adaptive screening questions'
      },
      {
        method: 'POST',
        path: '/api/v2/diseases/detect',
        description: 'Run a disease-specific clinical assessment',
        body: { disease_of_interest: 'string', age: 'number', gender: 'string' }
      },
      {
        method: 'GET',
        path: '/api/v2/diseases/supported-diseases',
        description: 'List all supported diseases for the detailed assessment flow'
      },
      {
        method: 'GET',
        path: '/api/health',
        description: 'Health check endpoint'
      },
      {
        method: 'GET',
        path: '/api/health/ai',
        description: 'AI service status for Ollama, Gemini, and fallback chat'
      }
    ]
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  const mongoStatus = process.env.MONGODB_URI ? 'Configured' : 'Not configured (limited mode)';
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  RAXA AI Backend Server                                   ║
║  Environment: ${process.env.NODE_ENV?.padEnd(43)}║
║  Server: http://localhost:${PORT}                         ║
║  MongoDB: ${mongoStatus.padEnd(43)}║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
