import { useState, useCallback } from 'react';
import { prescriptionService } from '@/api';
import type {
  UploadPrescriptionResponse,
  GenerateInvoiceResponse,
} from '@/api/prescription.service';
import type { ApiResponse, MedicineInfo } from '@/types';

interface UsePrescriptionReturn {
  uploadPrescription: (
    file: File,
    patientId: string,
    id: number
  ) => Promise<ApiResponse<UploadPrescriptionResponse>>;
  generateInvoice: (
    patientId: string,
    prescriptionId: number,
    pId: number,
    medicines: MedicineInfo[]
  ) => Promise<ApiResponse<GenerateInvoiceResponse>>;
  uploadAndGenerateInvoice: (
    file: File,
    patientId: string,
    id: number
  ) => Promise<
    ApiResponse<{
      prescription: UploadPrescriptionResponse;
      invoice: GenerateInvoiceResponse | null;
    }>
  >;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for prescription upload and invoice generation
 */
export function usePrescription(): UsePrescriptionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPrescription = useCallback(
    async (
      file: File,
      patientId: string,
      id: number
    ): Promise<ApiResponse<UploadPrescriptionResponse>> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await prescriptionService.uploadPrescription(file, patientId, id.toString());
        if (!result.success) {
          setError(result.error || 'Failed to upload prescription');
        }
        return result as ApiResponse<UploadPrescriptionResponse>;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to upload prescription';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const generateInvoice = useCallback(
    async (
      patientId: string,
      prescriptionId: number,
      pId: number,
      medicines: MedicineInfo[]
    ): Promise<ApiResponse<GenerateInvoiceResponse>> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await prescriptionService.generateInvoice(patientId, prescriptionId, pId, medicines);
        if (!result.success) {
          setError(result.error || 'Failed to generate invoice');
        }
        return result as ApiResponse<GenerateInvoiceResponse>;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to generate invoice';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const uploadAndGenerateInvoice = useCallback(
    async (
      file: File,
      patientId: string,
      id: number
    ): Promise<ApiResponse<{ prescription: UploadPrescriptionResponse; invoice: GenerateInvoiceResponse | null }>> => {
      setIsLoading(true);
      setError(null);
      try {
        // Step 1: Upload prescription
        const uploadResult = await prescriptionService.uploadPrescription(file, patientId, id.toString());
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to upload prescription');
          return { success: false, error: uploadResult.error };
        }
        // Step 2: Generate invoice with extracted medicines (if any)
        const medicines: MedicineInfo[] = (uploadResult.data?.medicines ?? []).map((name: string) => ({
          name,
          dosage: null,
          frequency: null,
        }));
        const invoiceResult = await prescriptionService.generateInvoice(patientId, id, id, medicines);
        return {
          success: true,
          data: {
            prescription: uploadResult.data as UploadPrescriptionResponse,
            invoice: invoiceResult.success ? invoiceResult.data as GenerateInvoiceResponse : null,
          },
        };
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to upload prescription and generate invoice';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    uploadPrescription,
    generateInvoice,
    uploadAndGenerateInvoice,
    isLoading,
    error,
    clearError,
  };
}

