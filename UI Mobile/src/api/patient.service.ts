import apiClient from './client';
import type { ApiResponse, PatientDetails, RegistrationStatus } from '@/types';

export const patientService = {
  getPatientByMobileNumber: async (mobile: string): Promise<ApiResponse<PatientDetails>> => {
    try {
      const response = await apiClient.get(`/Patient/GetPatientByMobileNumber?mobile=${mobile}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      if (error.status === 404) return { success: false, message: error.message || 'Patient not found' };
      return { success: false, message: error.message || 'Failed to fetch patient details' };
    }
  },

  getPatientsByStatus: async (status: RegistrationStatus): Promise<ApiResponse<PatientDetails[]>> => {
    try {
      const response = await apiClient.get(`/Patient/status/${status}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Status filter cannot be empty' };
      return { success: false, message: error.message || 'Failed to fetch patients' };
    }
  },

  registerPatient: async (mobileNumber: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/Patient/Register', { mobileNumber });
      return { success: true, data: response.data };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      return { success: false, message: error.message || 'Registration failed. Please try again.' };
    }
  },

  verifyPatient: async (data: { mobileNumber: string; otp: string; email?: string }): Promise<ApiResponse<{ patientId: string; isValid: boolean }>> => {
    try {
      const response = await apiClient.post('/Patient/verify', data);
      const resData = response.data;
      // Handle invalid OTP (200 response with isValid: false)
      if (resData?.isValid === false) {
        return { success: false, message: resData.message || 'Invalid OTP. Please check and try again.' };
      }
      if (resData?.patientId) {
        return { success: true, data: resData };
      }
      return { success: false, message: resData?.message || 'Verification failed' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number and OTP are required' };
      return { success: false, message: error.message || 'Verification failed. Please try again.' };
    }
  },

  updatePatient: async (data: Partial<PatientDetails>): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/Patient/Update', data);
      return { success: true, data: response.data, message: 'Patient updated successfully' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Name, mobile number, and Aadhar number are required' };
      if (error.status === 404) return { success: false, message: error.message || 'Patient not found' };
      if (error.status === 409) return { success: false, message: error.message || 'Aadhaar number already exists' };
      return { success: false, message: error.message || 'Failed to update patient. Please try again.' };
    }
  },

  updatePatientStatus: async (data: { 
    id: number;
    patientId: string; 
    registrationStatus: string;
    fullName: string;
    mobileNumber: string;
    email: string;
    aadharNumber: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/Patient/UpdateStatus', data);
      return { success: true, data: response.data, message: 'Registration status updated successfully' };
    } catch (error: any) {
      if (error.status === 400) return { success: false, message: error.message || 'Required fields are missing' };
      if (error.status === 404) return { success: false, message: error.message || 'Patient not found' };
      return { success: false, message: error.message || 'Failed to update registration status' };
    }
  },
};
