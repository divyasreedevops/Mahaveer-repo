import apiClient from './client';
import type { ApiResponse, PatientDetails, RegistrationStatus, ApproveKycRequest } from '@/types';

export const patientService = {
  getPatientByMobileNumber: async (mobile: string): Promise<ApiResponse<PatientDetails>> => {
    if (__DEV__) console.log('[PatientService] getPatientByMobileNumber - Fetching patient for mobile:', mobile);
    try {
      const response = await apiClient.get(`/Patient/GetPatientByMobileNumber?mobile=${mobile}`);
      if (__DEV__) console.log('[PatientService] getPatientByMobileNumber - Patient found:', response.data?.fullName);
      return { success: true, data: response.data };
    } catch (error: any) {
      if (__DEV__) console.error('[PatientService] getPatientByMobileNumber - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      if (error.status === 404) return { success: false, message: error.message || 'Patient not found' };
      return { success: false, message: error.message || 'Failed to fetch patient details' };
    }
  },

  getPatientsByStatus: async (status: RegistrationStatus): Promise<ApiResponse<PatientDetails[]>> => {
    if (__DEV__) console.log('[PatientService] getPatientsByStatus - Fetching patients with status:', status);
    try {
      const response = await apiClient.get(`/Patient/status/${status}`);
      if (__DEV__) console.log('[PatientService] getPatientsByStatus - Fetched', response.data?.length || 0, 'patients');
      return { success: true, data: response.data };
    } catch (error: any) {
      if (__DEV__) console.error('[PatientService] getPatientsByStatus - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Status filter cannot be empty' };
      return { success: false, message: error.message || 'Failed to fetch patients' };
    }
  },

  registerPatient: async (mobileNumber: string): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[PatientService] registerPatient - Registering patient with mobile:', mobileNumber);
    try {
      const response = await apiClient.post('/Patient/Register', { mobileNumber });
      if (__DEV__) console.log('[PatientService] registerPatient - Registration successful');
      return { success: true, data: response.data };
    } catch (error: any) {
      if (__DEV__) console.error('[PatientService] registerPatient - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number is required' };
      return { success: false, message: error.message || 'Registration failed. Please try again.' };
    }
  },

  verifyPatient: async (data: { mobileNumber: string; otp: string; email?: string }): Promise<ApiResponse<{ patientId: string; isValid: boolean }>> => {
    if (__DEV__) console.log('[PatientService] verifyPatient - Verifying patient for mobile:', data.mobileNumber);
    try {
      const response = await apiClient.post('/Patient/verify', data);
      const resData = response.data;
      // Handle invalid OTP (200 response with isValid: false)
      if (resData?.isValid === false) {
        if (__DEV__) console.log('[PatientService] verifyPatient - Invalid OTP');
        return { success: false, message: resData.message || 'Invalid OTP. Please check and try again.' };
      }
      if (resData?.patientId) {
        if (__DEV__) console.log('[PatientService] verifyPatient - Verification successful, patientId:', resData.patientId);
        return { success: true, data: resData };
      }
      if (__DEV__) console.log('[PatientService] verifyPatient - Verification failed');
      return { success: false, message: resData?.message || 'Verification failed' };
    } catch (error: any) {
      if (__DEV__) console.error('[PatientService] verifyPatient - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Mobile number and OTP are required' };
      return { success: false, message: error.message || 'Verification failed. Please try again.' };
    }
  },

  updatePatient: async (data: Partial<PatientDetails>, kycDocument?: any): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[PatientService] updatePatient - Updating patient:', data.fullName, data.mobileNumber);
    try {
      const formData = new FormData();
      if (data.id !== undefined) formData.append('Id', String(data.id));
      if (data.patientId) formData.append('PatientId', data.patientId);
      if (data.fullName) formData.append('FullName', data.fullName);
      if (data.mobileNumber) formData.append('MobileNumber', data.mobileNumber);
      if (data.email) formData.append('Email', data.email);
      if (data.aadharNumber) formData.append('AadharNumber', data.aadharNumber);
      if (data.dob) formData.append('Dob', data.dob);
      if (data.registrationStatus) formData.append('RegistrationStatus', data.registrationStatus);
      if (data.kycStatus) formData.append('KYCStatus', data.kycStatus);
      formData.append('Status', String(data.status ?? 1));
      if (data.updatedBy != null) formData.append('UpdatedBy', String(data.updatedBy));
      if (kycDocument) {
        // kycDocument should be { uri, type, name } for React Native FormData
        formData.append('kycDocument', kycDocument as any);
      }

      const response = await apiClient.post('/Patient/Update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (__DEV__) console.log('[PatientService] updatePatient - Patient updated successfully');
      return { success: true, data: response.data, message: response.data?.message || 'Patient updated successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[PatientService] updatePatient - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Name, mobile number, and Aadhar number are required' };
      if (error.status === 404) return { success: false, message: error.message || 'Patient not found' };
      if (error.status === 409) return { success: false, message: error.message || 'Aadhaar number already exists' };
      return { success: false, message: error.message || 'Failed to update patient. Please try again.' };
    }
  },

  updatePatientStatus: async (data: PatientDetails): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[PatientService] updatePatientStatus - Updating status to:', data.registrationStatus, 'for patient:', data.patientId);
    try {
      // Send full patient object per updated API spec (only id, patientId, registrationStatus validated)
      const response = await apiClient.post('/Patient/UpdateStatus', data);
      if (__DEV__) console.log('[PatientService] updatePatientStatus - Status updated successfully');
      return { success: true, data: response.data, message: 'Registration status updated successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[PatientService] updatePatientStatus - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Required fields are missing' };
      if (error.status === 404) return { success: false, message: error.message || 'Patient not found' };
      return { success: false, message: error.message || 'Failed to update registration status' };
    }
  },

  approveKyc: async (data: ApproveKycRequest): Promise<ApiResponse<any>> => {
    if (__DEV__) console.log('[PatientService] approveKyc - Approving KYC for patient ID:', data.id, 'income:', data.incomeLevel);
    try {
      const response = await apiClient.post('/Patient/ApproveKyc', data);
      if (__DEV__) console.log('[PatientService] approveKyc - KYC approved successfully');
      return { success: true, data: response.data, message: response.data?.message || 'KYC approved successfully' };
    } catch (error: any) {
      if (__DEV__) console.error('[PatientService] approveKyc - Error:', error.message);
      if (error.status === 400) return { success: false, message: error.message || 'Id and Income level are required' };
      if (error.status === 404) return { success: false, message: error.message || 'Patient not found' };
      return { success: false, message: error.message || 'Failed to approve KYC' };
    }
  },
};
