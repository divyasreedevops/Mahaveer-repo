import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { ApiError } from '@/types';

const LOCAL_IP = '192.168.1.100';

const getBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5053';
    }
    if (Platform.OS === 'ios') {
      return 'http://localhost:5053';
    }
    return `http://${LOCAL_IP}:5053`;
  }
  return 'https://api.pharmacare.com';
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
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

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
      if (__DEV__) {
        console.warn('[API] Network error - ensure backend is running at', getBaseUrl());
      }
    }

    return Promise.reject(apiError);
  },
);

export default apiClient;
