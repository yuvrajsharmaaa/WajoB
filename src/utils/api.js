/**
 * API Client for Backend Communication
 * Axios-based HTTP client with error handling and interceptors
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Request interceptor - add auth token if available
apiClient.interceptors.request.use(
  (config) => {
    // Add Telegram user data to headers if available
    const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (telegramUser) {
      config.headers['X-Telegram-User-ID'] = telegramUser.id;
      config.headers['X-Telegram-Username'] = telegramUser.username || '';
    }
    
    // Add timestamp for request tracking
    config.metadata = { startTime: new Date() };
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`[API] ${response.config.method.toUpperCase()} ${response.config.url} - ${duration}ms`);
    
    return response.data;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      console.error(`[API Error] ${status}:`, data.message || data);
      
      // Transform error for better UI handling
      const apiError = {
        status,
        message: data.message || 'An error occurred',
        code: data.code || 'UNKNOWN_ERROR',
        details: data.details || null,
      };
      
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response received
      console.error('[API Error] No response:', error.request);
      
      return Promise.reject({
        status: 0,
        message: 'Network error - unable to reach server',
        code: 'NETWORK_ERROR',
      });
    } else {
      // Something else happened
      console.error('[API Error] Request setup:', error.message);
      
      return Promise.reject({
        status: 0,
        message: error.message || 'Failed to make request',
        code: 'REQUEST_ERROR',
      });
    }
  }
);

export default apiClient;

// Helper function to handle API errors in components
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

// Helper to check if error is network related
export const isNetworkError = (error) => {
  return error?.code === 'NETWORK_ERROR' || error?.status === 0;
};

// Helper to check if error is auth related
export const isAuthError = (error) => {
  return error?.status === 401 || error?.status === 403;
};
