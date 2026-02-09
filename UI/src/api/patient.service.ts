import apiClient from './client';
import type {
  PatientDetails,
  Patient,
  ApiResponse,
} from '@/types';

/**
 * Patient service
 */
export const patientService = {
  /**
   * Get patient by mobile number
   */
  async getPatientByMobileNumber(mobileNumber: string): Promise<ApiResponse<PatientDetails>> {
    try {
      const response = await apiClient.get<PatientDetails | ApiResponse<PatientDetails>>(
        '/Patient/GetPatientByMobileNumber',
        { params: { mobile: mobileNumber } }
      );
      
      // Handle both wrapped and unwrapped responses
      const data = (response.data as any).data || response.data;
      
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      // Handle 404 or other errors
      console.log('Patient not found or error fetching patient:', error.message);
      return {
        success: false,
        error: error.response?.status === 404 ? 'Patient not found' : (error.message || 'Failed to fetch patient'),
      };
    }
  },

  /**
   * Get patients by status
   */
  async getPatientsByStatus(status: string): Promise<ApiResponse<PatientDetails[]>> {
    try {
      const response = await apiClient.get<PatientDetails[] | ApiResponse<PatientDetails[]>>(
        `/Patient/status/${status}`
      );
      
      // Handle both wrapped and unwrapped responses
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data as any).data || [];
      
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
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
      const isValid = response.data.isValid !== false; // Success if patientId exists or isValid is not explicitly false
      const hasPatientId = !!response.data.patientId;
      
      return {
        success: hasPatientId || isValid,
        data: {
          patientId: response.data.patientId,
          isValid: hasPatientId ? true : response.data.isValid,
        },
        message: response.data.message || (hasPatientId ? 'Patient verified successfully' : 'Invalid OTP'),
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
   * Update patient details
   */
  async updatePatient(data: PatientDetails): Promise<ApiResponse<PatientDetails>> {
    try {
      const response = await apiClient.post('/Patient/Update', data);
      // Backend returns: {message: "Patient updated successfully"}
      
      return {
        success: true,
        data: data, // Return the input data as backend only confirms with message
        message: response.data.message || 'Patient updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update patient',
      };
    }
  },

  /**
   * Update patient registration status
   * Backend returns: {message: "Registration status updated successfully"}
   */
  async updatePatientStatus(data: PatientDetails): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/Patient/UpdateStatus', data);
      // Backend returns: {message: "Registration status updated successfully"}
      return {
        success: true,
        message: response.data.message || 'Registration status updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update patient status',
      };
    }
  },
};

export default patientService;
