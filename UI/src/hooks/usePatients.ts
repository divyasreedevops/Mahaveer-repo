import useSWR from 'swr';
import { patientService } from '@/api';
import type { PatientDetails, ApiResponse } from '@/types';

/**
 * Hook to fetch patients by status
 */
export function usePatients(status: string) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<PatientDetails[]>>(
    status ? `/Patient/status/${status}` : null,
    () => patientService.getPatientsByStatus(status)
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
  const updatePatient = async (patient: PatientDetails) => {
    return await patientService.updatePatient(patient);
  };

  return { updatePatient };
}

/**
 * Hook to update patient status
 */
export function useUpdatePatientStatus() {
  const updateStatus = async (patient: PatientDetails) => {
    return await patientService.updatePatientStatus(patient);
  };

  return { updateStatus };
}

export default usePatients;
