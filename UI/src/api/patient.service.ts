import apiClient from './client';
import type {
  PatientDetails,
  Patient,
  ApiResponse,
  ApproveKycRequest,
} from '@/types';

/**
 * Patient service
 */
export const patientService = {
  /**
   * Get patient by mobile number
   * Backend returns: PatientDetails directly (not wrapped)
   */
  async getPatientByMobileNumber(mobileNumber: string): Promise<ApiResponse<PatientDetails>> {
    try {
      console.log('[PatientService] Fetching patient by mobile:', mobileNumber);
      const response = await apiClient.get<PatientDetails>(
        '/Patient/GetPatientByMobileNumber',
        { params: { mobile: mobileNumber } }
      );
      
      console.log('[PatientService] API Response:', response);
      console.log('[PatientService] Response data:', response.data);
      
      // Check if response.data actually contains patient data
      if (!response.data || typeof response.data !== 'object') {
        console.error('[PatientService] Invalid response data:', response.data);
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('[PatientService] Error fetching patient:', error);
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: 'Patient not found' };
      if (status === 400) return { success: false, error: error.message || 'Mobile number is required' };
      return {
        success: false,
        error: error.message || 'Failed to fetch patient',
      };
    }
  },

  /**
   * Get patients by status
   * Backend endpoint: /Patient/GetPatientsByStatus?regstatus=<status>&kycstatus=<status>
   * Backend returns: PatientDetails[] directly (not wrapped)
   */
  async getPatientsByStatus(regStatus?: string, kycStatus?: string): Promise<ApiResponse<PatientDetails[]>> {
    try {
      const params: Record<string, string> = {};
      if (regStatus) params.regstatus = regStatus;
      if (kycStatus) params.kycstatus = kycStatus;
      
      const response = await apiClient.get<PatientDetails[]>(
        '/Patient/GetPatientsByStatus',
        { params }
      );
      
      // Backend returns array directly
      const data = Array.isArray(response.data) ? response.data : [];
      
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      const status_code = error.status || error.response?.status;
      if (status_code === 400) return { success: false, data: [], error: error.message || 'Status cannot be empty' };
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to fetch patients',
      };
    }
  },

  /**
   * Register a new patient / Send OTP
   * Backend returns: {message: "OTP sent successfully", mobileNumber: "...", otp: "..."}
   */
  async registerPatient(mobileNumber: string): Promise<ApiResponse<{mobileNumber: string; otp?: string}>> {
    try {
      const response = await apiClient.post('/Patient/Register', { mobileNumber });
      // Backend returns: {message: "OTP sent successfully", mobileNumber, otp}
      return {
        success: true,
        data: {
          mobileNumber: response.data.mobileNumber,
          otp: response.data.otp, // Only in development
        },
        message: response.data.message || 'OTP sent successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
      };
    }
  },

  /**
   * Verify patient (OTP validation for login/register)
   * Backend returns: {message: "Patient registered successfully", patientId: "PC001234"}
   * OR {message: "Login Successful", patientId: "PC001234"}
   * OR {message: "Invalid OTP", isValid: false}
   */
  async verifyPatient(data: Patient): Promise<ApiResponse<{patientId?: string; isValid?: boolean}>> {
    try {
      const response = await apiClient.post('/Patient/verify', data);
      // Backend returns: {message: "...", patientId: "..."} or {message: "Invalid OTP", isValid: false}
      const isValid = response.data.isValid !== false;
      const hasPatientId = !!response.data.patientId;
      
      if (!hasPatientId && !isValid) {
        // Invalid OTP case: { message: "Invalid OTP", isValid: false }
        return {
          success: false,
          data: { patientId: undefined, isValid: false },
          error: response.data.message || 'Invalid OTP',
        };
      }

      return {
        success: true,
        data: {
          patientId: response.data.patientId,
          isValid: true,
        },
        message: response.data.message || 'Patient verified successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        data: { isValid: false },
        error: error.message || 'Failed to verify patient',
      };
    }
  },

  /**
   * Update patient details (multipart/form-data - supports KYC document upload)
   * Backend returns: {message: "Patient updated successfully"}
   */
  async updatePatient(data: PatientDetails, kycDocument?: File): Promise<ApiResponse<PatientDetails>> {
    try {
      console.log('[PatientService] Updating patient:', data.patientId, data.fullName);
      console.log('[PatientService] KYC Document provided:', !!kycDocument, kycDocument?.name);
      
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
        console.log('[PatientService] Appending kycDocument to FormData:', kycDocument.name, kycDocument.type, kycDocument.size, 'bytes');
        formData.append('kycDocument', kycDocument);
      }
      
      // Log all FormData entries
      console.log('[PatientService] FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      console.log('[PatientService] Sending update request to /Patient/Update');
      const response = await apiClient.post('/Patient/Update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      console.log('[PatientService] Update response:', response);
      console.log('[PatientService] Update succeeded:', response.data);
      
      return {
        success: true,
        data: data,
        message: response.data.message || 'Patient updated successfully',
      };
    } catch (error: any) {
      // Map backend error status codes
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: error.message || 'Patient not found' };
      if (status === 409) return { success: false, error: error.message || 'Aadhaar number already exists' };
      return {
        success: false,
        error: error.message || 'Failed to update patient',
      };
    }
  },

  /**
   * Update patient registration status
   * Backend expects: full PatientDetails object (only id, patientId, registrationStatus validated)
   * Backend returns: { message: "Registration status updated successfully" }
   */
  async updatePatientStatus(data: PatientDetails): Promise<ApiResponse<void>> {
    try {
      // Send full patient object per updated API spec
      const response = await apiClient.post('/Patient/UpdateStatus', data);
      return {
        success: true,
        message: response.data.message || 'Registration status updated successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: error.message || 'Patient not found' };
      return {
        success: false,
        error: error.message || 'Failed to update patient status',
      };
    }
  },

  /**
   * Approve KYC - Sets income level and discount for patient
   * Backend returns: { message: "KYC approved successfully" }
   */
  async approveKyc(data: ApproveKycRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/Patient/ApproveKyc', data);
      return {
        success: true,
        message: response.data.message || 'KYC approved successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: error.message || 'Patient not found' };
      if (status === 400) return { success: false, error: error.message || 'Id and Income level are required' };
      return {
        success: false,
        error: error.message || 'Failed to approve KYC',
      };
    }
  },
};

export default patientService;
