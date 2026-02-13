import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { authService, patientService } from '@/api';
import type { LoginRequest } from '@/types';

export interface AuthUser {
  username: string;
  role: 'admin' | 'patient';
  patientId?: string;
  mobileNumber?: string;
  isProfileComplete?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; message?: string }>;
  loginPatient: (mobileNumber: string) => Promise<{ success: boolean; message?: string }>;
  verifyOtp: (mobileNumber: string, otp: string) => Promise<{ success: boolean; patientId?: string; isFirstLogin?: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  isBiometricEnabled: () => Promise<boolean>;
  biometricAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USERNAME: 'username',
  ROLE: 'user_role',
  PATIENT_ID: 'patient_id',
  MOBILE: 'patient_mobile',
  LAST_USER: 'last_user_data',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Restore last user session on app launch
  useEffect(() => {
    checkBiometricAvailability();
    restoreSession();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(compatible && enrolled);
    } catch {
      setBiometricAvailable(false);
    }
  };

  const restoreSession = async () => {
    try {
      const lastUserJson = await AsyncStorage.getItem(STORAGE_KEYS.LAST_USER);
      if (lastUserJson) {
        const lastUser: AuthUser = JSON.parse(lastUserJson);
        const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        
        if (token) {
          // Check if biometric is enabled for patient users
          if (lastUser.role === 'patient') {
            const biometricEnabledStr = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
            if (biometricEnabledStr === 'true') {
              // Prompt for biometric authentication
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Login with biometrics',
                cancelLabel: 'Use OTP instead',
                disableDeviceFallback: false,
              });
              
              if (result.success) {
                setUser(lastUser);
              } else {
                // User cancelled or failed biometric - they'll need to login via OTP
                await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
              }
            } else {
              // No biometric enabled, restore normally
              setUser(lastUser);
            }
          } else {
            // Admin user, no biometric
            setUser(lastUser);
          }
        }
      }
    } catch {
      // No stored session
    } finally {
      setIsLoading(false);
    }
  };

  const persistUser = async (u: AuthUser) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_USER, JSON.stringify(u));
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, 'authenticated');
      await AsyncStorage.setItem(STORAGE_KEYS.USERNAME, u.username);
      await AsyncStorage.setItem(STORAGE_KEYS.ROLE, u.role);
      if (u.patientId) await AsyncStorage.setItem(STORAGE_KEYS.PATIENT_ID, u.patientId);
      if (u.mobileNumber) await AsyncStorage.setItem(STORAGE_KEYS.MOBILE, u.mobileNumber);
    } catch {
      // Storage error - non-critical
    }
  };

  const login = useCallback(async (credentials: LoginRequest): Promise<{ success: boolean; message?: string }> => {
    setError(null);
    try {
      const result = await authService.loginAdmin(credentials);
      if (result.success) {
        const newUser: AuthUser = { username: credentials.username, role: 'admin' };
        setUser(newUser);
        await persistUser(newUser);
        return { success: true };
      }
      return { success: false, message: result.message || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Login failed' };
    }
  }, []);

  const loginPatient = useCallback(async (mobileNumber: string) => {
    setError(null);
    try {
      if (__DEV__) console.log('[AuthContext] loginPatient - Calling authService with mobile:', mobileNumber);
      const result = await authService.loginPatient(mobileNumber);
      if (__DEV__) console.log('[AuthContext] loginPatient - authService result:', JSON.stringify(result));
      
      if (result.success) {
        const message = result.data?.otp ? `OTP: ${result.data.otp}` : undefined;
        if (__DEV__) console.log('[AuthContext] loginPatient - Success, generated message:', message);
        if (__DEV__) console.log('[AuthContext] loginPatient - result.data:', JSON.stringify(result.data));
        return { success: true, message };
      }
      if (__DEV__) console.log('[AuthContext] loginPatient - Failed with message:', result.message);
      return { success: false, message: result.message };
    } catch (err: any) {
      if (__DEV__) console.error('[AuthContext] loginPatient - Exception:', err);
      return { success: false, message: err.message };
    }
  }, []);

  const verifyOtp = useCallback(async (mobileNumber: string, otp: string) => {
    setError(null);
    try {
      const result = await authService.verifyOtp(mobileNumber, otp);
      if (result.success && result.data) {
        const patientResult = await patientService.getPatientByMobileNumber(mobileNumber);
        const isFirstLogin = !patientResult.data?.aadharNumber || patientResult.data.aadharNumber.trim() === '';

        const newUser: AuthUser = {
          username: patientResult.data?.fullName || mobileNumber,
          role: 'patient',
          patientId: result.data.patientId,
          mobileNumber,
          isProfileComplete: !isFirstLogin,
        };
        setUser(newUser);
        await persistUser(newUser);
        return { success: true, patientId: result.data.patientId, isFirstLogin };
      }
      return { success: false, message: result.message || 'Invalid OTP' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Verification failed' };
    }
  }, []);

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      persistUser(updated);
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const disableBiometrics = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
  }, []);

  const isBiometricEnabled = useCallback(async (): Promise<boolean> => {
    const enabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return enabled === 'true';
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        loginPatient,
        verifyOtp,
        logout,
        clearError,
        updateUser,
        enableBiometrics,
        disableBiometrics,
        isBiometricEnabled,
        biometricAvailable,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
