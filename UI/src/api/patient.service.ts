import apiClient from './client';
import type {
  PatientDetails,
  Patient,
  ApiResponse,
  AvailableSlot,
  BookAppointmentRequest,
  SlotBookingResponse,
  RescheduleSlotRequest,
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
      const response = await apiClient.get<PatientDetails>(
        '/Patient/GetPatientByMobileNumber',
        { params: { mobile: mobileNumber } }
      );
      
      if (!response.data || typeof response.data !== 'object') {
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
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: 'Patient not found' };
      return {
        success: false,
        error: error.message || 'Failed to fetch patient',
      };
    }
  },

  /**
   * Get patients by status
   * Backend returns: PatientDetails[] directly
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
      
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
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
   */
  async registerPatient(mobileNumber: string): Promise<ApiResponse<{mobileNumber: string}>> {
    try {
      const response = await apiClient.post('/Patient/Register', { mobileNumber });
      return {
        success: true,
        data: {
          mobileNumber: response.data.mobileNumber,
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
   * Login/Verify patient OTP — POST /Patient/Login
   * Existing patient: { isAuthenticated: true, token, patient: { patientId, ... } }
   * New registration:  { message: "Patient registered successfully", patientId }
   * Invalid OTP:       { message: "Invalid OTP", isValid: false }
   */
  async loginPatient(data: Patient): Promise<ApiResponse<{ patientId?: string; message?: string; token?: string; patient?: PatientDetails; isAuthenticated?: boolean }>> {
    try {
      const response = await apiClient.post('/Patient/Login', data);
      const resData = response.data;

      // Invalid OTP returns HTTP 200 with isValid: false
      if (resData.isValid === false) {
        return { success: false, error: resData.message || 'Invalid OTP' };
      }

      // Existing patient login: isAuthenticated + token + nested patient object
      if (resData.isAuthenticated === true) {
        return {
          success: true,
          data: {
            patientId: resData.patient?.patientId,
            token: resData.token,
            patient: resData.patient,
            isAuthenticated: true,
            message: resData.message,
          },
          message: resData.message || 'Login successful',
        };
      }

      // New patient registration: patientId at root level
      return {
        success: true,
        data: { patientId: resData.patientId, message: resData.message },
        message: resData.message || 'OTP verified',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  },

  /**
   * Save/Update patient info
   */
  async savePatientInfo(data: PatientDetails, kycDocument?: File): Promise<ApiResponse<void>> {
    try {
      const formData = new FormData();
      if (data.id) formData.append('id', String(data.id));
      if (data.patientId) formData.append('patientId', data.patientId);
      if (data.fullName) formData.append('fullName', data.fullName);
      if (data.mobileNumber) formData.append('mobileNumber', data.mobileNumber);
      if (data.email) formData.append('email', data.email);
      if (data.aadharNumber) formData.append('aadharNumber', data.aadharNumber);
      if (data.dob) formData.append('dob', data.dob);
      if (data.registrationStatus) formData.append('registrationStatus', data.registrationStatus);
      if (data.kycStatus) formData.append('kycStatus', data.kycStatus);
      if (data.incomeLevel) formData.append('incomeLevel', data.incomeLevel);
      if (data.discountPercentage !== null && data.discountPercentage !== undefined) formData.append('discountPercentage', String(data.discountPercentage));
      
      if (kycDocument) {
        formData.append('kycDocument', kycDocument);
      }
      
      const response = await apiClient.post('/Patient/SavePatientInfo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return {
        success: true,
        message: response.data.message || 'Patient info saved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to save patient info',
      };
    }
  },

  /**
   * Appointment Slots
   */
  async getAvailableSlots(date: string): Promise<ApiResponse<AvailableSlot[]>> {
    try {
      const response = await apiClient.get<AvailableSlot[]>(
        '/api/AppointmentSlot/GetAvailableSlots',
        { params: { date } }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch slots',
      };
    }
  },

  /**
   * Alias for loginPatient — verifies OTP and logs in the patient
   */
  async verifyPatient(data: Patient): Promise<ApiResponse<{ patientId?: string; message?: string; token?: string; patient?: PatientDetails; isAuthenticated?: boolean }>> {
    return patientService.loginPatient(data);
  },

  async bookSlot(data: BookAppointmentRequest): Promise<ApiResponse<SlotBookingResponse>> {
    try {
      const response = await apiClient.post('/api/AppointmentSlot/BookSlot', data);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Slot booked successfully',
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 409) return { success: false, error: error.response?.data?.message || 'Slot is fully booked' };
      return {
        success: false,
        error: error.message || 'Failed to book slot',
      };
    }
  },

  /**
   * Get booked slot for a specific patient and prescription
   */
  async getSlotByPatientAndPrescription(patientId: string, prescriptionId: number): Promise<ApiResponse<SlotBookingResponse & { slotDate: string; slotTime: string }>> {
    try {
      const response = await apiClient.get('/api/AppointmentSlot/GetSlotByPatientAndPrescription', {
        params: { patientId, prescriptionId }
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 404) return { success: false, error: 'No slot found' };
      return {
        success: false,
        error: error.message || 'Failed to fetch slot',
      };
    }
  },

  /**
   * Reschedule an existing booking
   */
  async rescheduleSlot(data: RescheduleSlotRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/api/AppointmentSlot/RescheduleSlot', data);
      return {
        success: true,
        message: response.data?.message || 'Slot rescheduled successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reschedule slot',
      };
    }
  },
};

export default patientService;
