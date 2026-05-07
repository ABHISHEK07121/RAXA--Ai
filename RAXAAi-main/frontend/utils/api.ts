/**
 * API Client Utility for RAXA Frontend
 * Use this for all API calls to the backend
 */

import { getApiV2BaseUrl } from "./apiBase";

const API_BASE_URL = getApiV2BaseUrl();

interface FetchOptions extends RequestInit {
  data?: unknown;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
) {
  const { data, ...fetchOptions } = options;

  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
}

// ============================================================================
// HEALTH ENDPOINTS
// ============================================================================

export const healthAPI = {
  // Save health data
  save: (data: unknown) =>
    apiCall('/health/save', {
      method: 'POST',
      data,
    }),

  // Get health data
  get: (id: string) =>
    apiCall(`/health/${id}`, {
      method: 'GET',
    }),

  // Update health data
  update: (id: string, data: unknown) =>
    apiCall(`/health/${id}`, {
      method: 'PUT',
      data,
    }),

  // Delete health data
  delete: (id: string) =>
    apiCall(`/health/${id}`, {
      method: 'DELETE',
    }),
};

// ============================================================================
// PREDICTION ENDPOINTS
// ============================================================================

export const predictAPI = {
  // Analyze health data and predict diseases
  analyze: (data: unknown) =>
    apiCall('/predict/analyze', {
      method: 'POST',
      data,
    }),

  // Get prediction results
  getResults: (id: string) =>
    apiCall(`/predict/results/${id}`, {
      method: 'GET',
    }),
};

// ============================================================================
// ADAPTIVE QUESTIONNAIRE ENDPOINTS
// ============================================================================

export const adaptiveAPI = {
  // Get initial questions
  getQuestions: () =>
    apiCall('/adaptive/questions', {
      method: 'GET',
    }),

  // Get questions by category
  getNextQuestions: (category: string) =>
    apiCall('/adaptive/next-questions', {
      method: 'POST',
      data: { category },
    }),

  // Get categories
  getCategories: () =>
    apiCall('/adaptive/categories', {
      method: 'GET',
    }),

  // Submit answers
  submitAnswers: (answers: unknown, category?: string) =>
    apiCall('/adaptive/submit-answers', {
      method: 'POST',
      data: { answers, category },
    }),
};

// ============================================================================
// DISEASE ENDPOINTS
// ============================================================================

export const diseaseAPI = {
  // Get all diseases
  getAll: () =>
    apiCall('/diseases/list', {
      method: 'GET',
    }),

  // Get disease details
  getByName: (name: string) =>
    apiCall(`/diseases/${name}`, {
      method: 'GET',
    }),

  // Get diseases by category
  getByCategory: (category: string) =>
    apiCall(`/diseases/category/${category}`, {
      method: 'GET',
    }),

  // Get all categories
  getCategories: () =>
    apiCall('/diseases/categories', {
      method: 'GET',
    }),

  // Search diseases
  search: (query: string) =>
    apiCall('/diseases/search', {
      method: 'POST',
      data: { query },
    }),
};

// Default export
const api = {
  health: healthAPI,
  predict: predictAPI,
  adaptive: adaptiveAPI,
  disease: diseaseAPI,
};

export default api;
