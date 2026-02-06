import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { PatientDetailsForm } from './PatientDetailsForm';
import { PrescriptionUploadForm } from './PrescriptionUploadForm';
import { InvoiceDisplay } from './InvoiceDisplay';
import { SlotBooking } from './SlotBooking';
import { LogOut, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { PatientDetails } from '@/types';

export function PatientDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentPatient, logout } = useApp();
  const [patientData, setPatientData] = useState<PatientDetails | null>(null);

  useEffect(() => {
    // Load patient data from localStorage
    const storedData = localStorage.getItem('patient_data');
    if (storedData) {
      try {
        setPatientData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse patient data', e);
      }
    }
  }, []);

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

  if (!patient) {
    return null;
  }

  // Check approval status
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

  // For approved patients, determine which forms to show
  // Use patientData fields if available, otherwise fall back to currentPatient
  const hasBasicDetails = (patientData?.fullName || currentPatient?.name) && 
                          (patientData?.dob || currentPatient?.dateOfBirth) && 
                          (patientData?.aadharNumber || currentPatient?.aadhar);
  
  const showDetails = !hasBasicDetails;
  const showPrescription = hasBasicDetails && !currentPatient?.invoice;
  const showInvoice = !!currentPatient?.invoice;
  const showSlot = currentPatient?.paymentStatus === 'paid';

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
        {showPrescription && <PrescriptionUploadForm />}
        {showInvoice && <InvoiceDisplay />}
        {showSlot && <SlotBooking />}
      </main>
    </div>
  );
}