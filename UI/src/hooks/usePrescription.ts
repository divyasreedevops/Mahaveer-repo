import { useState, useCallback } from 'react';
import { prescriptionService } from '@/api';
import type { ApiResponse, MedicineInfo, PrescriptionResponse, Invoice } from '@/types';

interface UsePrescriptionReturn {
  uploadPrescription: (
    file: File,
    patientId: string,
    id: number
  ) => Promise<ApiResponse<PrescriptionResponse>>;
  generateInvoice: (
    patientId: string,
    prescriptionId: number,
    pId: number,
    medicines: MedicineInfo[]
  ) => Promise<ApiResponse<Invoice>>;
  uploadAndGenerateInvoice: (
    file: File,
    patientId: string,
    id: number
  ) => Promise<
    ApiResponse<{
      prescription: PrescriptionResponse;
      invoice: Invoice | null;
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
    ): Promise<ApiResponse<PrescriptionResponse>> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await prescriptionService.uploadPrescription(file, patientId, id.toString());
        if (!result.success) {
          setError(result.error || 'Failed to upload prescription');
        }
        return result as ApiResponse<PrescriptionResponse>;
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
    ): Promise<ApiResponse<Invoice>> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await prescriptionService.generateInvoice({
          patientId,
          prescriptionKey: prescriptionId,
          id: pId
        });
        if (!result.success) {
          setError(result.error || 'Failed to generate invoice');
        }
        return result as ApiResponse<Invoice>;
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
    ): Promise<ApiResponse<{ prescription: PrescriptionResponse; invoice: Invoice | null }>> => {
      setIsLoading(true);
      setError(null);
      try {
        // Step 1: Upload prescription
        const uploadResult = await prescriptionService.uploadPrescription(file, patientId, id.toString());
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to upload prescription');
          return { success: false, error: uploadResult.error };
        }
        
        // Wait for prescriptionId
        const pIdFromServer = uploadResult.data?.prescriptionId;
        if (!pIdFromServer) {
          throw new Error('Prescription ID is missing from upload response');
        }
        
        // Step 2: Generate invoice with extracted medicines (if any)
        const medicines: MedicineInfo[] = (uploadResult.data?.medicines ?? []).map((m: any) => ({
          name: m.name,
          dosage: m.dosage || null,
          frequency: m.frequency || null,
        }));
        
        const invoiceResult = await prescriptionService.generateInvoice({
          patientId,
          prescriptionKey: pIdFromServer,
          id
        });
        
        return {
          success: true,
          data: {
            prescription: uploadResult.data as PrescriptionResponse,
            invoice: invoiceResult.success ? invoiceResult.data as Invoice : null,
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

