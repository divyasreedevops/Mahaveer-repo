import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PatientRegistration } from './patient/PatientRegistration';
import { PatientDetails } from './patient/PatientDetails';
import { PrescriptionUpload } from './patient/PrescriptionUpload';
import { InvoiceView } from './patient/InvoiceView';
import { PaymentComplete } from './patient/PaymentComplete';
import { SlotBooking } from './patient/SlotBooking';

export interface PatientData {
  mobile: string;
  name: string;
  dateOfBirth: string;
  prescriptionUrl: string;
  invoice?: any;
  paymentComplete?: boolean;
  slot?: { date: string; time: string };
  orderId?: string;
  itemReceived?: boolean;
}

export function PatientFlow() {
  const [patientData, setPatientData] = useState<PatientData>({
    mobile: '',
    name: '',
    dateOfBirth: '',
    prescriptionUrl: '',
  });

  const updatePatientData = (data: Partial<PatientData>) => {
    setPatientData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="register" 
          element={<PatientRegistration patientData={patientData} updateData={updatePatientData} />} 
        />
        <Route 
          path="details" 
          element={<PatientDetails patientData={patientData} updateData={updatePatientData} />} 
        />
        <Route 
          path="upload-prescription" 
          element={<PrescriptionUpload patientData={patientData} updateData={updatePatientData} />} 
        />
        <Route 
          path="invoice" 
          element={<InvoiceView patientData={patientData} updateData={updatePatientData} />} 
        />
        <Route 
          path="slot-booking" 
          element={<SlotBooking patientData={patientData} updateData={updatePatientData} />} 
        />
        <Route 
          path="payment-complete" 
          element={<PaymentComplete patientData={patientData} updateData={updatePatientData} />} 
        />
        <Route path="*" element={<Navigate to="/patient/register" replace />} />
      </Routes>
    </div>
  );
}
