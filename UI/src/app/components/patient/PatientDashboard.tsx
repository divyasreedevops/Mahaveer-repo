import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { PatientDetailsForm } from './PatientDetailsForm';
import { PrescriptionUploadForm } from './PrescriptionUploadForm';
import { InvoiceDisplay } from './InvoiceDisplay';
import { SlotBooking } from './SlotBooking';
import { InvoiceView } from './InvoiceView';
import { LogOut, User, Clock, XCircle } from 'lucide-react';
import type { PatientDetails } from '@/types';
import type { PatientData } from '@/app/components/PatientFlow';

export function PatientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { currentPatient, logout, makePayment } = useApp();
  const [patientData, setPatientData] = useState<PatientDetails | null>(null);
  const [dummyStep, setDummyStep] = useState<'upload' | 'invoice' | 'slot'>('upload');
  const [dummyData, setDummyData] = useState<PatientData>(() => ({
    mobile: patientData?.mobileNumber || currentPatient?.mobile || '',
    name: patientData?.fullName || currentPatient?.name || '',
    dateOfBirth: patientData?.dob || currentPatient?.dateOfBirth || '',
    prescriptionUrl: '',
  }));

  // Load patient data from localStorage (with location dependency to reload on navigation)
  useEffect(() => {
    const storedData = localStorage.getItem('patient_data');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('[PatientDashboard] Loading patient data from localStorage:', parsedData);
        setPatientData(parsedData);
      } catch (e) {
        console.error('Failed to parse patient data', e);
      }
    }
  }, [location.pathname, location.state]);

  const handleLogout = async () => {
    const toastId = toast.loading('Logging out...');
    try {
      await logout();
      localStorage.removeItem('patient_data');
      localStorage.removeItem('patient_mobile');
      localStorage.removeItem('patient_temp');
      toast.dismiss(toastId);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Failed to logout');
    }
  };

  // Use patientData from localStorage over currentPatient from context
  const patient = patientData || currentPatient;

  useEffect(() => {
    setDummyData(prev => ({
      ...prev,
      mobile: patientData?.mobileNumber || currentPatient?.mobile || prev.mobile,
      name: patientData?.fullName || currentPatient?.name || prev.name,
      dateOfBirth: patientData?.dob || currentPatient?.dateOfBirth || prev.dateOfBirth,
    }));
  }, [patientData, currentPatient]);

  if (!patient) {
    return null;
  }

  // Prioritized KYC Workflow (matching Figma):
  // 1. Check KYC completion FIRST — if incomplete, show details form regardless of status
  // 2. Then check approval status (pending / rejected / approved)
  const hasBasicDetails = (patientData?.fullName || currentPatient?.name) && 
                          (patientData?.dob || currentPatient?.dateOfBirth) && 
                          (patientData?.aadharNumber || currentPatient?.aadhar || currentPatient?.aadhaarNumber);
  
  // Also require income document for KYC completion
  const hasKycComplete = hasBasicDetails && (patientData?.kycDocumentUrl || currentPatient?.incomeDocumentUrl);

  // Step 1: KYC incomplete — show PatientDetailsForm (regardless of approval status)
  if (!hasKycComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User className="w-6 h-6" />
              <h1 className="text-2xl">Patient Portal</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-6">
          <PatientDetailsForm />
        </main>
      </div>
    );
  }

  // Step 2: KYC complete — check approval status
  const status = ((patientData?.registrationStatus || currentPatient?.approvalStatus) || '').toLowerCase();
  
  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User className="w-6 h-6" />
              <h1 className="text-2xl">Patient Portal</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-6 h-6 text-yellow-500" />
                <CardTitle>Registration Pending Approval</CardTitle>
              </div>
              <CardDescription>
                Your registration is currently under review by the admin. You will be notified once approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Patient ID:</strong> {patientData?.patientId || currentPatient?.patientId}</p>
                <p><strong>Mobile:</strong> {patientData?.mobileNumber || currentPatient?.mobile}</p>
                {(patientData?.email || currentPatient?.email) && (
                  <p><strong>Email:</strong> {patientData?.email || currentPatient?.email}</p>
                )}
                {(patientData?.fullName || currentPatient?.name) && (
                  <p><strong>Name:</strong> {patientData?.fullName || currentPatient?.name}</p>
                )}
                {(patientData?.aadharNumber || currentPatient?.aadhaarNumber) && (
                  <p><strong>Aadhaar:</strong> {patientData?.aadharNumber || currentPatient?.aadhaarNumber}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User className="w-6 h-6" />
              <h1 className="text-2xl">Patient Portal</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-6 h-6 text-red-500" />
                <CardTitle>Registration Rejected</CardTitle>
              </div>
              <CardDescription>
                Your registration has been rejected. Please contact the admin for more information.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  // Step 3: Approved — show dashboard with prescription/invoice/slot
  const showDetails = false; // KYC already complete at this point
  const showPrescription = !currentPatient?.invoice;
  const showInvoice = !!currentPatient?.invoice;
  const showSlot = currentPatient?.paymentStatus === 'paid' || dummyStep === 'slot';
  const showUploadForm = showPrescription && dummyStep === 'upload';
  const showDummyInvoice = showPrescription && dummyStep === 'invoice';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6" />
            <h1 className="text-2xl">Patient Portal</h1>
          </div>
          <div className="flex items-center gap-4">
            {(patientData?.patientId || currentPatient?.patientId) && (
              <span className="text-sm text-muted-foreground">ID: {patientData?.patientId || currentPatient?.patientId}</span>
            )}
            {(patientData?.fullName || currentPatient?.name) && (
              <span className="text-muted-foreground">Welcome, {patientData?.fullName || currentPatient?.name}</span>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {showDetails && <PatientDetailsForm />}
        {showUploadForm && (
          <PrescriptionUploadForm
            onInvoiceRequested={() => setDummyStep('invoice')}
          />
        )}
        {showDummyInvoice && (
          <InvoiceView
            embedded
            patientData={dummyData}
            updateData={(data) => setDummyData(prev => ({ ...prev, ...data }))}
            onProceed={() => {
              makePayment();
              setDummyStep('slot');
            }}
          />
        )}
        {showInvoice && <InvoiceDisplay />}
        {showSlot && (
          <SlotBooking
            forceShow={dummyStep === 'slot' && currentPatient?.paymentStatus !== 'paid'}
            patientId={patientData?.patientId || currentPatient?.patientId}
          />
        )}
      </main>
    </div>
  );
}