import useSWR from 'swr';
import { patientService, commonService } from '@/api';
import type { PatientDetails, ApiResponse, ApproveKycRequest, IncomeLevel } from '@/types';

/**
 * Hook to fetch patients by status
 * @param regStatus - Registration status filter (optional)
 * @param kycStatus - KYC status filter (optional)
 */
export function usePatients(regStatus?: string, kycStatus?: string) {
  const cacheKey = regStatus || kycStatus 
    ? `/Patient/GetPatientsByStatus?regstatus=${regStatus || ''}&kycstatus=${kycStatus || ''}`
    : null;
  
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<PatientDetails[]>>(
    cacheKey,
    () => patientService.getPatientsByStatus(regStatus, kycStatus)
  );

  return {
    patients: data?.data || [],
    isLoading,
    error,
    mutate,
    isError: !!error,
  };
}

/**
 * Hook to update patient
 */
export function useUpdatePatient() {
  const updatePatient = async (patient: PatientDetails, kycDocument?: File) => {
    return await patientService.updatePatient(patient, kycDocument);
  };

  return { updatePatient };
}

/**
 * Hook to update patient status
 * Passes full patient object per API spec (only id, patientId, registrationStatus validated)
 */
export function useUpdatePatientStatus() {
  const updateStatus = async (patient: PatientDetails) => {
    return await patientService.updatePatientStatus(patient);
  };

  return { updateStatus };
}

/**
 * Hook to approve KYC - sets income level and discount for a patient
 */
export function useApproveKyc() {
  const approveKyc = async (data: ApproveKycRequest) => {
    return await patientService.approveKyc(data);
  };

  return { approveKyc };
}

/**
 * Hook to fetch income levels from the Common API
 */
export function useIncomeLevels() {
  const { data, error, isLoading } = useSWR<ApiResponse<IncomeLevel[]>>(
    '/Common/GetIncomeLevels',
    () => commonService.getIncomeLevels()
  );

  return {
    incomeLevels: data?.data || [],
    isLoading,
    error,
    isError: !!error,
  };
}

export default usePatients;
