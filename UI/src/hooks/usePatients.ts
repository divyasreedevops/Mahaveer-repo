import useSWR from 'swr';
import { patientService, adminService, commonService } from '@/api';
import type { PatientDetails, ApiResponse, ApproveKycRequest, IncomeLevel, UpdateRegistrationStatusRequest } from '@/types';

/**
 * Hook to fetch patients by status
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
 * Hook to update patient info (saves full patient info including KYC)
 */
export function useUpdatePatient() {
  const updatePatient = async (patient: PatientDetails, kycDocument?: File) => {
    return await patientService.savePatientInfo(patient, kycDocument);
  };

  return { updatePatient };
}

/**
 * Hook to update patient registration status via admin service
 */
export function useUpdatePatientStatus() {
  const updateStatus = async (data: UpdateRegistrationStatusRequest) => {
    return await adminService.updateRegistrationStatus(data);
  };

  return { updateStatus };
}

/**
 * Hook to approve KYC - sets income level and discount for a patient
 */
export function useApproveKyc() {
  const approveKyc = async (data: ApproveKycRequest) => {
    return await adminService.approveKyc(data);
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
