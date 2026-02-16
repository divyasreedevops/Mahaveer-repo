import { useState, useCallback } from 'react';
import { prescriptionService } from '@/api';
import type {
  UploadPrescriptionResponse,
  GenerateInvoiceResponse,
  MedicineFromPrescription,
} from '@/api/prescription.service';
import type { ApiResponse } from '@/types';

interface UsePrescriptionReturn {
  uploadPrescription: (
    file: File,
    patientId: string,
    id: number
  ) => Promise<ApiResponse<UploadPrescriptionResponse>>;
  generateInvoice: (
    medicines: MedicineFromPrescription[],
    patientId: string,
    prescriptionKey: string,
    id: number
  ) => Promise<ApiResponse<GenerateInvoiceResponse>>;
  uploadAndGenerateInvoice: (
    file: File,
    patientId: string,
    id: number
  ) => Promise<
    ApiResponse<{
      prescription: UploadPrescriptionResponse;
      invoice: GenerateInvoiceResponse;
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
        const result = await prescriptionService.uploadPrescription(
          file,
          patientId,
          id
        );
        if (!result.success) {
          setError(result.error || 'Failed to upload prescription');
        }
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to upload prescription';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const generateInvoice = useCallback(
    async (
      medicines: MedicineFromPrescription[],
      patientId: string,
      prescriptionKey: string,
      id: number
    ): Promise<ApiResponse<GenerateInvoiceResponse>> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await prescriptionService.generateInvoice(
          medicines,
          patientId,
          prescriptionKey,
          id
        );
        if (!result.success) {
          setError(result.error || 'Failed to generate invoice');
        }
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to generate invoice';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
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
    ): Promise<
      ApiResponse<{
        prescription: UploadPrescriptionResponse;
        invoice: GenerateInvoiceResponse;
      }>
    > => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await prescriptionService.uploadAndGenerateInvoice(
          file,
          patientId,
          id
        );
        if (!result.success) {
          setError(
            result.error || 'Failed to upload prescription and generate invoice'
          );
        }
        return result;
      } catch (err: any) {
        const errorMessage =
          err.message || 'Failed to upload prescription and generate invoice';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
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
