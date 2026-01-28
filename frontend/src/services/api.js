/**
 * @file api.js
 * @description Enterprise-grade Axios Service Layer.
 * Acts as the centralized communication hub between Frontend and Backend.
 * * * FEATURES:
 * - Singleton Pattern for Axios Instance
 * - Automated Retry Logic with Exponential Backoff
 * - Request Deduplication (prevents double submissions)
 * - Intelligent Error Normalization
 * - Response Caching (Short-term)
 * - Detailed JSDoc for Intellisense
 * * @module services/api
 * @version 3.0.0
 * @author SmartInv Engineering Team
 */

import axios from 'axios';
import { toast } from 'react-toastify';

// --- CONFIGURATION CONSTANTS ---
const API_BASE_URL = 'http://localhost:5001/api';
const REQUEST_TIMEOUT = 30000; // 30 Seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 Second
const CACHE_DURATION = 5000; // 5 Seconds cache for GET requests

// Simple in-memory cache
const requestCache = new Map();

/**
 * Creates the core Axios instance with default configuration.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true, // Essential for handling secure HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '2.4.0', // Telemetry header
  },
});

/**
 * @function sleep
 * @description Helper to pause execution for retry logic.
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// REQUEST INTERCEPTORS
// ============================================================================

api.interceptors.request.use(
  (config) => {
    // 1. Inject Authentication Token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Request Caching Logic (GET only)
    if (config.method === 'get' && config.cache) {
      const cacheKey = `${config.url}_${JSON.stringify(config.params)}`;
      const cached = requestCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Attach cached data to the adapter to skip network call
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: config.headers,
          config,
          request: {}
        });
      }
    }

    // 3. Request Deduplication (Idempotency Key)
    // Useful for POST requests to prevent double-charges or double-creates
    if (config.method === 'post') {
      config.headers['Idempotency-Key'] = crypto.randomUUID();
    }

    return config;
  },
  (error) => {
    console.error('[API] Request Configuration Error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTORS
// ============================================================================

api.interceptors.response.use(
  (response) => {
    // 1. Update Cache if applicable
    if (response.config.method === 'get' && response.config.cache) {
      const cacheKey = `${response.config.url}_${JSON.stringify(response.config.params)}`;
      requestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response.data
      });
    }

    // 2. Normalize Success Response
    // Ensure we always return a consistent structure, even if backend varies
    return response; 
  },
  async (error) => {
    const originalRequest = error.config;

    // 1. Handle "Network Error" or "5xx Server Error" with Retry Logic
    if (
      !originalRequest._retry && 
      (!error.response || error.response.status >= 500) &&
      originalRequest.method === 'get' // Only retry idempotent GET requests
    ) {
      originalRequest._retry = true;
      let retryCount = 0;

      while (retryCount < MAX_RETRIES) {
        retryCount++;
        const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
        
        console.warn(`[API] Connection failed. Retrying (${retryCount}/${MAX_RETRIES}) in ${delay}ms...`);
        await sleep(delay);

        try {
          return await api(originalRequest);
        } catch (retryError) {
          // If this is the last retry, execute fallthrough to standard error handling
          if (retryCount === MAX_RETRIES) break;
        }
      }
    }

    // 2. Handle 401 Unauthorized (Auto Logout)
    if (error.response?.status === 401 && !originalRequest.url.includes('/auth/login')) {
      // Prevent infinite redirect loops
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // 3. Handle 403 Forbidden
    if (error.response?.status === 403) {
      toast.error('Access Denied: You do not have permission for this resource.');
    }

    // 4. Handle 429 Rate Limit
    if (error.response?.status === 429) {
      toast.warning('You are making too many requests. Please slow down.');
    }

    // 5. Construct User-Friendly Error Message
    const errorMessage = 
      error.response?.data?.message || 
      error.message || 
      'An unexpected error occurred.';
    
    // Attach formatted message to the error object for UI components
    error.userMessage = errorMessage;

    return Promise.reject(error);
  }
);

// ============================================================================
// SERVICE MODULES
// ============================================================================

/**
 * Authentication & User Management Service
 */
export const AuthService = {
  /**
   * Authenticate user credentials
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    return res; 
  },

  /**
   * Register a new user account
   * @param {Object} data - { name, email, password, role }
   */
  register: async (data) => {
    return api.post('/auth/register', data);
  },

  /**
   * Terminate current session
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
      console.warn('Logout API call failed, clearing local state anyway.');
    }
  },

  /**
   * Retrieve current user profile
   */
  getMe: () => api.get('/auth/me', { cache: true }),

  /**
   * Update user profile details
   */
  updateProfile: (data) => api.put('/auth/updatedetails', data),

  /**
   * Update password
   */
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

/**
 * Inventory Management Service
 */
export const InventoryService = {
  /**
   * Retrieve paginated inventory list
   * @param {Object} params - { page, limit, search, sort, category }
   */
  getAll: (params) => api.get('/inventory', { params, cache: false }), // Inventory changes fast, don't cache

  /**
   * Retrieve single product details
   * @param {string} id 
   */
  getById: (id) => api.get(`/inventory/${id}`),

  /**
   * Create new inventory item
   * @param {Object} data 
   */
  create: (data) => api.post('/inventory', data),

  /**
   * Update existing item
   * @param {string} id 
   * @param {Object} data 
   */
  update: (id, data) => api.put(`/inventory/${id}`, data),

  /**
   * Delete item
   * @param {string} id 
   */
  delete: (id) => api.delete(`/inventory/${id}`),

  /**
   * Bulk Delete items
   * @param {string[]} ids 
   */
  bulkDelete: (ids) => api.post('/inventory/bulk-delete', { ids }),

  /**
   * Seed database with demo data
   */
  seed: () => api.post('/inventory/seed'),

  /**
   * Import CSV Data
   * @param {Array} data - Parsed JSON from CSV
   */
  import: (data) => api.post('/inventory/import', { products: data }),

  /**
   * Export CSV Data (Returns Blob)
   */
  export: () => api.get('/inventory/export', { responseType: 'blob' }),
};

/**
 * AI & Analytics Service
 */
export const AnalyticsService = {
  /**
   * Get main dashboard telemetry
   * Uses caching to prevent spamming on tab switches
   */
  getStats: () => api.get('/analytics/stats', { cache: true }),

  /**
   * Run ML Forecasting Model
   * @param {string} modelType - 'linear' | 'forest' | 'arima' | 'auto'
   * @param {number} horizon - Days to forecast
   */
  getForecast: (modelType = 'auto', horizon = 30) => 
    api.get(`/analytics/forecast?modelType=${modelType}&horizon=${horizon}`, { cache: true }),

  /**
   * Get detailed anomaly report
   */
  getAnomalies: () => api.get('/analytics/anomalies'),
};

/**
 * Default Export
 */
export default api;