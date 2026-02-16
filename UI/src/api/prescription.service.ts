import apiClient from './client';
import { ApiResponse } from '@/types';

/**
 * Medicine extracted from prescription
 */
export interface MedicineFromPrescription {
  name: string;
  dosage?: string;
  frequency?: string;
}

/**
 * Upload prescription response from AWS Textract/ComprehendMedical
 */
export interface UploadPrescriptionResponse {
  medicines: MedicineFromPrescription[];
  doctorName: string;
  hospitalName: string;
  prescriptionKey: string;
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
 * Prescription service - Handle prescription upload and invoice generation
 */
export const prescriptionService = {
  /**
   * Upload prescription file and extract medicine details
   * Uses AWS Textract and ComprehendMedical to extract data
   */
  async uploadPrescription(
    file: File,
    patientId: string,
    id: number
  ): Promise<ApiResponse<UploadPrescriptionResponse>> {
    try {
      const formData = new FormData();
      formData.append('File', file);
      formData.append('PatientId', patientId);
      formData.append('Id', id.toString());

      const response = await apiClient.post<UploadPrescriptionResponse>(
        '/api/prescription/uploadPrescription',
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
      console.error('Prescription upload error:', error);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message ||
        error.message || 
        'Failed to upload prescription. Please check your connection and try again.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Generate invoice from extracted medicines
   * Matches medicines with inventory and calculates pricing
   */
  async generateInvoice(
    medicines: MedicineFromPrescription[],
    patientId: string,
    prescriptionKey: string,
    id: number
  ): Promise<ApiResponse<GenerateInvoiceResponse>> {
    try {
      const response = await apiClient.post<GenerateInvoiceResponse>(
        '/api/Prescription/GenerateInvoice',
        medicines,
        {
          params: {
            patientId,
            prescriptionkey: prescriptionKey,
            Id: id
          }
        }
      );

      return {
        success: true,
        data: response.data,
        message: 'Invoice generated successfully',
      };
    } catch (error: any) {
      console.error('Invoice generation error:', error);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message ||
        error.message || 
        'Failed to generate invoice. Please try again.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Combined upload and generate invoice
   * First uploads prescription, then generates invoice with extracted medicines
   */
  async uploadAndGenerateInvoice(
    file: File,
    patientId: string,
    id: number
  ): Promise<ApiResponse<{
    prescription: UploadPrescriptionResponse;
    invoice: GenerateInvoiceResponse;
  }>> {
    try {
      // Step 1: Upload prescription and extract medicines
      const uploadResult = await this.uploadPrescription(file, patientId, id);
      
      if (!uploadResult.success || !uploadResult.data) {
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload prescription',
        };
      }

      // Step 2: Generate invoice with extracted medicines
      const invoiceResult = await this.generateInvoice(
        uploadResult.data.medicines,
        patientId,
        uploadResult.data.prescriptionKey,
        id
      );

      if (!invoiceResult.success || !invoiceResult.data) {
        return {
          success: false,
          error: invoiceResult.error || 'Failed to generate invoice',
        };
      }

      return {
        success: true,
        data: {
          prescription: uploadResult.data,
          invoice: invoiceResult.data,
        },
        message: 'Prescription uploaded and invoice generated successfully',
      };
    } catch (error: any) {
      console.error('Upload and generate invoice error:', error);
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message ||
        error.message || 
        'Failed to process prescription. Please try again.';
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

export default prescriptionService;
