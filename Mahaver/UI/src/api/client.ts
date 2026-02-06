/// <reference types="vite/client" />
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

/**
 * Get the API base URL from environment variables
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not defined in environment variables');
}

/**
 * Create axios instance with base configuration
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  withCredentials: false, // Set to true if using cookies/sessions
});

/**
 * Request interceptor - add auth token and additional headers for protected APIs
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (supports both auth_token and token keys)
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    // Add Authorization header for protected routes
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development mode
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle errors, token refresh, and API responses
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response in development mode
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log error in development mode
    if (import.meta.env.DEV) {
      console.error('[API Response Error]', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear auth tokens
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('[Auth Error]', refreshError);
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      console.warn('[Access Denied] User does not have permission for this resource');
    }

    // Transform error to ApiError format
    const apiError: ApiError = {
      message: (error.response?.data as any)?.message || error.message || 'An unexpected error occurred',
      code: error.code,
      status: error.response?.status,
      details: error.response?.data,
    };

    return Promise.reject(apiError);
  }
);

export default apiClient;
