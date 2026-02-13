import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { ApiError } from '@/types';

const LOCAL_IP = '192.168.1.100';

const getBaseUrl = (): string => {
  // if (__DEV__) {
  //   if (Platform.OS === 'android') {
  //     return 'http://16.112.72.213:5000';
  //   }
  //   if (Platform.OS === 'ios') {
  //     return 'http://16.112.72.213:5000';
  //   }
  //   return `http://16.112.72.213:5000`;
  // }
  return 'http://16.112.72.213:5000';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timestamp for response time calculation
    (config as any).metadata = { startTime: Date.now() };
    
    if (__DEV__) {
      console.log('─────────────────────────────────────────');
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`[API Request] Platform: ${Platform.OS}`);
      console.log(`[API Request] Base URL: ${config.baseURL}`);
      console.log(`[API Request] Full URL: ${config.baseURL}${config.url}`);
      
      if (config.params) {
        console.log('[API Request] Query Params:', JSON.stringify(config.params, null, 2));
      }
      
      if (config.data) {
        // Mask sensitive data in logs
        const logData = { ...config.data };
        if (logData.password) logData.password = '***';
        if (logData.otp) logData.otp = '***';
        console.log('[API Request] Body:', JSON.stringify(logData, null, 2));
      }
      
      if (config.headers.Authorization) {
        console.log('[API Request] Authorization: Bearer ***');
      }
    }
    
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('[API Request Error]', error);
    }
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const duration = (response.config as any).metadata?.startTime 
        ? Date.now() - (response.config as any).metadata.startTime 
        : 0;
      
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log(`[API Response] Status: ${response.status} ${response.statusText}`);
      console.log(`[API Response] Duration: ${duration}ms`);
      
      // Log response data (truncate if too large)
      const responseData = JSON.stringify(response.data);
      if (responseData.length > 500) {
        console.log(`[API Response] Data (truncated): ${responseData.substring(0, 500)}...`);
        console.log(`[API Response] Full data length: ${responseData.length} characters`);
      } else {
        console.log('[API Response] Data:', response.data);
      }
      console.log('─────────────────────────────────────────');
    }
    return response;
  },
  async (error) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

    if (__DEV__) {
      const duration = (error.config as any)?.metadata?.startTime 
        ? Date.now() - (error.config as any).metadata.startTime 
        : 0;
      
      console.error('─────────────────────────────────────────');
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error(`[API Error] Platform: ${Platform.OS}`);
      console.error(`[API Error] Duration: ${duration}ms`);
      console.error(`[API Error] Error Code: ${error.code}`);
      
      if (error.response) {
        console.error(`[API Error] Status: ${error.response.status} ${error.response.statusText}`);
        console.error('[API Error] Response Data:', error.response.data);
      } else if (error.code === 'ECONNABORTED') {
        console.error('[API Error] Request timed out');
        console.error('[API Error] Check your network connection and backend availability');
      } else if (error.request) {
        console.error('[API Error] No response received from server');
        console.error('[API Error] Network error - ensure backend is running at', getBaseUrl());
        if (Platform.OS === 'ios') {
          console.error('[API Error] iOS Note: If using HTTP, ensure App Transport Security is configured');
          console.error('[API Error] iOS Note: Check that your device can reach the backend server');
        }
      } else {
        console.error('[API Error] Error:', error.message);
      }
      console.error('─────────────────────────────────────────');
    }

    if (error.response) {
      const serverMessage = error.response.data?.message;
      switch (error.response.status) {
        case 400:
          apiError.message = serverMessage || 'Invalid request. Please check your input.';
          break;
        case 401:
          await AsyncStorage.multiRemove(['auth_token', 'username', 'user_role']);
          apiError.message = serverMessage || 'Session expired. Please login again.';
          break;
        case 403:
          apiError.message = serverMessage || 'You do not have permission.';
          break;
        case 404:
          apiError.message = serverMessage || 'Resource not found.';
          break;
        case 409:
          apiError.message = serverMessage || 'A conflict occurred. The resource may already exist.';
          break;
        case 500:
          apiError.message = serverMessage || 'Server error. Please try again later.';
          break;
        default:
          apiError.message = serverMessage || 'Request failed.';
      }
    } else if (error.code === 'ECONNABORTED') {
      apiError.message = 'Request timed out.';
    } else if (!error.response) {
      apiError.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
