import { useState, useCallback } from 'react';
import { patientService } from '@/api';
import type { PatientDetails, RegistrationStatus } from '@/types';

export const usePatients = () => {
  const [patients, setPatients] = useState<PatientDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientsByStatus = useCallback(async (status: RegistrationStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await patientService.getPatientsByStatus(status);
      if (result.success && result.data) {
        setPatients(result.data);
      } else {
        setPatients([]);
        setError(result.message || 'Failed to fetch patients');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePatientStatus = useCallback(async (patient: PatientDetails, newStatus: string) => {
    try {
      const result = await patientService.updatePatientStatus({
        patientId: patient.patientId,
        registrationStatus: newStatus,
        id: patient.id,
        fullName: patient.fullName,
        aadharNumber: patient.aadharNumber,
      });
      if (result.success) {
        setPatients(prev => prev.filter(p => p.id !== patient.id));
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message || 'Failed to update status' };
    } catch (err: any) {
      return { success: false, message: err.message || 'An error occurred' };
    }
  }, []);

  return { patients, isLoading, error, fetchPatientsByStatus, updatePatientStatus };
};
