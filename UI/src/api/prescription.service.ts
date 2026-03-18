import apiClient from './client';
import type {
  ApiResponse,
  PrescriptionApprovalRequest,
  PrescriptionRejectionRequest,
  PrescriptionResponse,
  PrescriptionDetails,
  MedicineInfo,
} from '@/types';

/**
 * Medicine extracted from prescription
 */
export interface MedicineFromPrescription {
  name: string;
  dosage?: string;
  frequency?: string;
}

/**
 * Upload prescription response
 */
export interface UploadPrescriptionResponse {
  medicines: string[] | null;
}

/**
 * Invoice item details
 */
export interface InvoiceItemResponse {
  medicineName: string;
  inventoryId: number | null;
  mrp: number;
  discount: number;
  finalPrice: number;
  isAvailable: boolean;
}

/**
 * Generate invoice response
 */
export interface GenerateInvoiceResponse {
  prescriptionId: string;
  patientId: string;
  items: InvoiceItemResponse[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  generatedDate: string;
  invoiceNumber: string;
}

/**
 * Prescription service - Handle prescription upload, approvals, and invoices
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
      formData.append('File', file);
      formData.append('PatientId', patientId);
      formData.append('Id', id);

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
        message: 'Prescription uploaded successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload prescription',
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
   * Generate invoice from medicines
   */
  async generateInvoice(
    patientId: string,
    prescriptionId: number,
    pId: number,
    medicines: MedicineInfo[]
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.post(
        '/api/Invoice/GenerateInvoice',
        medicines,
        {
          params: {
            patientId,
            prescriptionId,
            pId
          }
        }
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
   * Update invoice status
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

