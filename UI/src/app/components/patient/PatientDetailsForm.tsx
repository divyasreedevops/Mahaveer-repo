import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/app/context/AppContext';
import { useToast } from '@/lib';
import { patientService } from '@/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { PatientHeader } from './PatientHeader';
import type { PatientDetails } from '@/types';

export function PatientDetailsForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPatient, updatePatientDetails, checkAadharEligibility } = useApp();
  const toast = useToast();
  
  // Get patient data from route state (for first login) or context
  const statePatient = (location.state as any)?.patient as PatientDetails | undefined;
  const isFirstLogin = (location.state as any)?.isFirstLogin === true;
  const mobile = (location.state as any)?.mobile || statePatient?.mobileNumber;
  const stateEmail = (location.state as any)?.email;
  
  const [name, setName] = useState(statePatient?.fullName || currentPatient?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(statePatient?.dob || currentPatient?.dateOfBirth || '');
  const [aadhar, setAadhar] = useState(statePatient?.aadharNumber || currentPatient?.aadhar || '');
  const [email] = useState(statePatient?.email || stateEmail || '');
  const [error, setError] = useState('');
  const [aadharError, setAadharError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhar(value);
    setAadharError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dateOfBirth || !aadhar) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }

    // Validate Aadhar
    if (checkAadharEligibility) {
      const eligibility = checkAadharEligibility(aadhar);
      if (!eligibility.eligible) {
        setAadharError(eligibility.message);
        toast.error(eligibility.message);
        return;
      }
    }

    setIsLoading(true);
    const toastId = toast.loading('Saving patient details...');
    
    try {
      if (isFirstLogin) {
        // First login - need to update or create patient record
        console.log('First login - updating patient with details');
        
        if (statePatient) {
          // We have existing patient record, update it
          const updatedPatient: PatientDetails = {
            ...statePatient,
            fullName: name,
            dob: dateOfBirth,
            aadharNumber: aadhar,
            email: email || statePatient.email,
          };
          
          const result = await patientService.updatePatient(updatedPatient);
          toast.dismiss(toastId);
          
          if (result.success) {
            localStorage.setItem('patient_data', JSON.stringify(updatedPatient));
            if (mobile) {
              localStorage.setItem('patient_mobile', mobile);
            }
            localStorage.setItem('auth_token', updatedPatient.patientId || 'patient'); // Set auth token
            toast.success('Profile completed successfully! Waiting for admin approval.');
            navigate('/patient/dashboard');
          } else {
            toast.error(result.error || 'Failed to save patient details');
            setError(result.error || 'Failed to save patient details');
          }
        } else {
          // No patient record yet - we need to fetch it first using mobile
          console.log('Fetching patient by mobile:', mobile);
          const patientResult = await patientService.getPatientByMobileNumber(mobile);
          
          if (patientResult.success && patientResult.data) {
            const updatedPatient: PatientDetails = {
              ...patientResult.data,
              fullName: name,
              dob: dateOfBirth,
              aadharNumber: aadhar,
              email: email || patientResult.data.email,
            };
            
            const result = await patientService.updatePatient(updatedPatient);
            toast.dismiss(toastId);
            
            if (result.success) {
              localStorage.setItem('patient_data', JSON.stringify(updatedPatient));
              if (mobile) {
                localStorage.setItem('patient_mobile', mobile);
              }
              localStorage.setItem('auth_token', updatedPatient.patientId || 'patient'); // Set auth token
              toast.success('Profile completed successfully! Waiting for admin approval.');
              navigate('/patient/dashboard');
            } else {
              toast.error(result.error || 'Failed to save patient details');
              setError(result.error || 'Failed to save patient details');
            }
          } else {
            toast.dismiss(toastId);
            toast.error('Could not find patient record. Please try logging in again.');
            setError('Could not find patient record. Please try logging in again.');
          }
        }
      } else {
        // Update existing patient via context
        updatePatientDetails(name, dateOfBirth, aadhar);
        toast.dismiss(toastId);
        toast.success('Patient details saved successfully');
        setError('');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Error saving patient details:', err);
      toast.error('Failed to save patient details');
      setError('Failed to save patient details');
    } finally {
      setIsLoading(false);
    }
  };

  // For non-first-login and already filled details
  if (!isFirstLogin && currentPatient?.name && currentPatient?.dateOfBirth && currentPatient?.aadhar) {
    return null; // Details already filled
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PatientHeader showLogout={true} />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <User className="w-6 h-6" />
            <CardTitle>Complete Your Profile</CardTitle>
          </div>
          <CardDescription>
            {isFirstLogin 
              ? 'Please provide your details to complete registration'
              : 'Please provide your details to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aadhar">Aadhar Number</Label>
              <Input
                id="aadhar"
                type="text"
                placeholder="Enter 12-digit Aadhar number"
                value={aadhar}
                onChange={handleAadharChange}
                maxLength={12}
                disabled={isLoading}
              />
              {aadharError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{aadharError}</AlertDescription>
                </Alert>
              )}
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}