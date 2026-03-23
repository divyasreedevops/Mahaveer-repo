import apiClient from './client';
import type {
  ApiResponse,
  PrescriptionApprovalRequest,
  PrescriptionRejectionRequest,
  PrescriptionResponse,
  PrescriptionDetails,
  PrescriptionSaveRequest,
  GenerateInvoiceRequest,
  Invoice,
} from '@/types';

/**
 * Prescription service - Handle prescription upload, save, approvals, and invoices
 */
export const prescriptionService = {
  /**
   * Upload prescription file
   */
  async uploadPrescription(
    file: File,
    patientId: string,
    id: string
  ): Promise<ApiResponse<PrescriptionResponse>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('id', id);

      const response = await apiClient.post<PrescriptionResponse>(
        '/api/Prescription/uploadPrescription',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        success: true,
        data: response.data,
        message: 'Prescription uploaded and analyzed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload prescription',
      };
    }
  },

  /**
   * Save prescription after review
   */
  async savePrescription(data: PrescriptionSaveRequest): Promise<ApiResponse<{ prescriptionId: number }>> {
    try {
      const response = await apiClient.post('/api/Prescription/SavePrescription', data);
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Prescription saved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to save prescription',
      };
    }
  },

  /**
   * Approve prescription
   */
  async approvePrescription(data: PrescriptionApprovalRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/api/Prescription/ApprovePrescription', data);
      return {
        success: true,
        message: response.data.message || 'Prescription approved successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to approve prescription',
      };
    }
  },

  /**
   * Reject prescription
   */
  async rejectPrescription(data: PrescriptionRejectionRequest): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/api/Prescription/RejectPrescription', data);
      return {
        success: true,
        message: response.data.message || 'Prescription rejected successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to reject prescription',
      };
    }
  },

  /**
   * Get prescriptions by status
   */
  async getPrescriptionsByStatus(status: string): Promise<ApiResponse<PrescriptionDetails[]>> {
    try {
      const response = await apiClient.get<PrescriptionDetails[]>(
        '/api/Prescription/GetPrescriptionsByStatus',
        { params: { PrescriptionStatus: status } }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch prescriptions',
      };
    }
  },

  /**
   * Get all prescriptions for a specific patient
   */
  async getPrescriptionsByPatientId(patientId: string): Promise<ApiResponse<PrescriptionDetails[]>> {
    try {
      const response = await apiClient.get<PrescriptionDetails[]>(
        '/api/Prescription/GetPrescriptionsByPatientId',
        { params: { patientId } }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      const status = error.status || error.response?.status;
      if (status === 404) return { success: true, data: [] }; // No prescriptions is not an error
      return {
        success: false,
        error: error.message || 'Failed to fetch patient prescriptions',
      };
    }
  },

  /**
   * Mark a prescription as collected/received
   */
  async markPrescriptionCollected(prescriptionId: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post(
        '/api/Prescription/MarkPrescriptionCollected',
        null,
        { params: { PrescriptionId: prescriptionId } }
      );
      return {
        success: true,
        message: response.data.message || 'Prescription marked as collected',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark prescription as collected',
      };
    }
  },

  /**
   * Generate invoice from prescription
   */
  async generateInvoice(data: GenerateInvoiceRequest): Promise<ApiResponse<Invoice>> {
    try {
      const response = await apiClient.post<Invoice>(
        '/api/Invoice/GenerateInvoice',
        data
      );

      return {
        success: true,
        data: response.data,
        message: 'Invoice generated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate invoice',
      };
    }
  },

  /**
   * Get invoices for a patient
   */
  async getInvoicesByPatient(pId: number): Promise<ApiResponse<Invoice[]>> {
    try {
      const response = await apiClient.get<Invoice[]>(
        '/api/Invoice/GetInvoicesByPatient',
        { params: { patientId: pId } }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch invoices',
      };
    }
  },

  /**
   * Get specific invoice for a patient + prescription
   */
  async getInvoice(pId: number, prescriptionId: number): Promise<ApiResponse<Invoice | null>> {
    try {
      const response = await apiClient.get(
        '/api/Invoice/GetInvoice',
        { params: { patientId: pId, prescriptionId } }
      );
      
      if (response.data?.invoiceExists === false) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: response.data.invoice || response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch invoice',
      };
    }
  },

  /**
   * Update invoice status to PAID
   */
  async updateInvoiceStatus(invoiceNumber: string, prescriptionId: number): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('/api/Invoice/UpdateInvoiceStatus', null, {
        params: {
          InvoiceNumber: invoiceNumber,
          PrescriptionId: prescriptionId
        }
      });
      return {
        success: true,
        message: response.data.message || 'Invoice status updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update invoice status',
      };
    }
  },
};

export default prescriptionService;
