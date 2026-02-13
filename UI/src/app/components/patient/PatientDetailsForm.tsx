import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/app/context/AppContext';
import { useToast } from '@/lib';
import { patientService } from '@/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { User, AlertCircle, CreditCard, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import type { PatientDetails } from '@/types';

export function PatientDetailsForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentPatient, updatePatientKYC, checkAadharEligibility } = useApp();
  const toast = useToast();

  // Get patient data from route state (for first login) or context
  // On page refresh, location.state is lost — restore from localStorage
  const routePatient = (location.state as any)?.patient as PatientDetails | undefined;
  const routeIsFirstLogin = (location.state as any)?.isFirstLogin === true;
  const routeMobile = (location.state as any)?.mobile;
  const routeEmail = (location.state as any)?.email;

  // Restore from localStorage when route state is empty (page refresh)
  const storedPatientRaw = localStorage.getItem('patient_data');
  const storedPatient: PatientDetails | null = storedPatientRaw ? (() => { try { return JSON.parse(storedPatientRaw); } catch { return null; } })() : null;
  const storedTempRaw = localStorage.getItem('patient_temp');
  const storedTemp: { mobile?: string; email?: string; patientId?: string } | null = storedTempRaw ? (() => { try { return JSON.parse(storedTempRaw); } catch { return null; } })() : null;

  const statePatient = routePatient || storedPatient || null;
  const isFirstLogin = routeIsFirstLogin || localStorage.getItem('patient_is_first_login') === 'true';
  const mobile = routeMobile || statePatient?.mobileNumber || storedTemp?.mobile || localStorage.getItem('patient_mobile') || '';
  const stateEmail = routeEmail || statePatient?.email || storedTemp?.email || '';

  const [name, setName] = useState(statePatient?.fullName || currentPatient?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(statePatient?.dob || currentPatient?.dateOfBirth || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(
    statePatient?.aadharNumber || currentPatient?.aadhaarNumber || currentPatient?.aadhar || ''
  );
  const [email] = useState(statePatient?.email || stateEmail || '');
  const [incomeDocument, setIncomeDocument] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [aadharError, setAadharError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format Aadhaar with spaces (XXXX XXXX XXXX)
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setAadhaarNumber(formatted);
    setAadharError('');
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIncomeDocument(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawAadhar = aadhaarNumber.replace(/\s/g, '');

    // --- Validation ---
    if (!name || !dateOfBirth) {
      setError('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      return;
    }

    if (!rawAadhar || rawAadhar.length !== 12) {
      setAadharError('Please enter a valid 12-digit Aadhaar number');
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    // Validate Aadhar eligibility (duplicate / 30-day check)
    if (checkAadharEligibility) {
      const eligibility = checkAadharEligibility(rawAadhar);
      if (!eligibility.eligible) {
        setAadharError(eligibility.message);
        toast.error(eligibility.message);
        return;
      }
    }

    // Income document required if not already uploaded
    if (!currentPatient?.incomeDocumentUrl && !statePatient?.kycDocumentUrl && !incomeDocument) {
      setError('Please upload your income document (bank statement) for KYC verification');
      toast.error('Please upload your income document for KYC verification');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Saving patient details...');

    try {
      // --- Resolve the patient record to update ---
      let basePatient: PatientDetails | null = statePatient || null;
      console.log('[PatientDetailsForm] Initial basePatient from state:', basePatient);
      console.log('[PatientDetailsForm] Mobile number:', mobile);

      if (!basePatient && mobile) {
        // Fetch existing patient from API by mobile number
        console.log('[PatientDetailsForm] Fetching patient from API...');
        const fetchResult = await patientService.getPatientByMobileNumber(mobile);
        console.log('[PatientDetailsForm] Fetch result:', fetchResult);
        
        if (fetchResult.success && fetchResult.data) {
          basePatient = fetchResult.data;
          console.log('[PatientDetailsForm] Patient found via API:', basePatient);
        } else {
          console.warn('[PatientDetailsForm] Failed to fetch patient:', fetchResult.error);
        }
      }

      if (!basePatient) {
        // Fall back to locally-stored patient data from localStorage
        console.log('[PatientDetailsForm] Trying localStorage fallback...');
        const storedData = localStorage.getItem('patient_data');
        if (storedData) {
          try {
            basePatient = JSON.parse(storedData) as PatientDetails;
            console.log('[PatientDetailsForm] Patient loaded from localStorage:', basePatient);
          } catch (parseError) {
            console.error('[PatientDetailsForm] Failed to parse stored patient data:', parseError);
          }
        }
      }

      // Last resort: build a minimal patient from patient_temp
      if (!basePatient && storedTemp?.patientId) {
        console.log('[PatientDetailsForm] Building minimal patient from patient_temp:', storedTemp);
        basePatient = {
          id: 0,
          patientId: storedTemp.patientId,
          fullName: name,
          mobileNumber: storedTemp.mobile || mobile || '',
          email: storedTemp.email || email || '',
          aadharNumber: rawAadhar,
          dob: dateOfBirth,
          registrationDate: new Date().toISOString(),
          registrationStatus: 'Pending',
          kycStatus: 'Pending Approval',
          status: 1,
          createdBy: 0,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          updatedBy: null,
          firstLogin: 1,
          kycDocumentUrl: null,
        } as PatientDetails;
      }

      if (!basePatient) {
        console.error('[PatientDetailsForm] No patient record found - showing error to user');
        toast.dismiss(toastId);
        toast.error('Could not find patient record. Please try logging in again.');
        setError('Could not find patient record. Please try logging in again.');
        return;
      }

      // --- Build the updated patient payload ---
      const updatedPatient: PatientDetails = {
        ...basePatient,
        fullName: name,
        dob: dateOfBirth,
        aadharNumber: rawAadhar,
        email: email || basePatient.email,
        kycStatus: 'Pending Approval',
        registrationStatus: 'Pending',
        firstLogin: 0,
        status: basePatient.status ?? 1,
        // Set kycDocumentUrl to indicate document was uploaded (actual S3 URL handled by backend)
        kycDocumentUrl: incomeDocument ? 'uploaded' : basePatient.kycDocumentUrl,
      };
      
      console.log('[PatientDetailsForm] Updated patient payload:', updatedPatient);
      console.log('[PatientDetailsForm] Income document to upload:', incomeDocument);

      // --- Call API with KYC document ---
      const result = await patientService.updatePatient(updatedPatient, incomeDocument || undefined);
      console.log('[PatientDetailsForm] Update result:', result);
      toast.dismiss(toastId);

      if (result.success) {
        // Persist to localStorage
        localStorage.setItem('patient_data', JSON.stringify(updatedPatient));
        if (mobile || updatedPatient.mobileNumber) {
          localStorage.setItem('patient_mobile', mobile || updatedPatient.mobileNumber || '');
        }
        localStorage.setItem('auth_token', updatedPatient.patientId || 'patient');
        localStorage.removeItem('patient_is_first_login'); // Profile submitted
        localStorage.removeItem('patient_temp'); // No longer needed

        // Update local context state as well (for in-memory dashboard rendering)
        updatePatientKYC(name, dateOfBirth, aadhaarNumber, incomeDocument || undefined);

        toast.success('Details saved successfully! Waiting for admin approval.');
        setError('');
        // Navigate to dashboard which will show pending approval screen
        navigate('/patient/dashboard', { replace: true, state: { forceRefresh: true } });
      } else {
        toast.error(result.error || 'Failed to save patient details');
        setError(result.error || 'Failed to save patient details');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Error saving patient details:', err);
      const msg = err?.message || 'Failed to save patient details';
      toast.error(msg);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Hide form if all KYC fields are already filled (non-first-login)
  if (
    !isFirstLogin &&
    currentPatient?.name &&
    currentPatient?.dateOfBirth &&
    (currentPatient?.aadhaarNumber || currentPatient?.aadhar) &&
    (currentPatient?.incomeDocumentUrl || statePatient?.kycDocumentUrl)
  ) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <User className="w-6 h-6" />
          <CardTitle>Personal Details & KYC</CardTitle>
        </div>
        <CardDescription>
          Please provide your details and upload income document for verification
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
              max={new Date().toISOString().split('T')[0]}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaar" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Aadhaar Number
            </Label>
            <Input
              id="aadhaar"
              type="text"
              placeholder="XXXX XXXX XXXX"
              value={aadhaarNumber}
              onChange={handleAadhaarChange}
              maxLength={14}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter your 12-digit Aadhaar number for identity verification
            </p>
            {aadharError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{aadharError}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="kyc">Income Document (Bank Statement)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="kyc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentChange}
                className="flex-1"
                disabled={isLoading}
              />
              {incomeDocument && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <FileText className="w-4 h-4" />
                  <span>{incomeDocument.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your bank statement for income verification. This will be reviewed by admin to determine your discount eligibility.
            </p>
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
  );
}