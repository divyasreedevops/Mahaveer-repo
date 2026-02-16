import { createContext, useContext, useState, ReactNode } from 'react';
import { prescriptionService } from '@/api';
import type { MedicineFromPrescription } from '@/api/prescription.service';

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  type: 'injection' | 'tablet' | 'capsule' | 'syrup';
  dosage: string;
  quantityValue: string;
  packingInfo?: string;
  disease: string;
  price: number;
  discount?: number; // per tablet/unit discount percentage
  substitutes?: string[];
}

export interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  brand: string;
  quantity: number;
  price: number;
  discount: number; // discount per item
  total: number;
}

export interface Invoice {
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  discount: number; // changed from subsidy
  grandTotal: number;
}

export interface Patient {
  id: string;
  patientId: string; // unique patient ID
  mobile: string;
  email?: string; // optional email
  aadhar: string; // aadhar number
  name: string;
  dateOfBirth: string;
  aadhaarNumber?: string; // formatted Aadhaar for KYC
  incomeDocumentUrl?: string; // KYC bank statement URL
  incomeLevel?: 'low' | 'medium' | 'high'; // admin-assigned income tier
  discountPercentage?: number; // admin-assigned discount based on income
  prescription: string | null;
  prescriptionData?: { // prescription details
    doctorName: string;
    hospitalName: string;
    medicines?: MedicineFromPrescription[]; // Medicines extracted from prescription
    prescriptionKey?: string; // S3 key for uploaded prescription
  };
  invoice: Invoice | null;
  paymentStatus: 'pending' | 'paid';
  slotDate: string | null;
  slotTime: string | null;
  itemReceived: boolean;
  registrationDate: string;
  approvalStatus: 'pending' | 'approved' | 'rejected'; // approval workflow
  lastMedicineDate: string | null; // track 30 days medicine limit
}

interface AppContextType {
  // User state
  userType: 'patient' | 'admin' | null;
  currentPatient: Patient | null;
  isAuthenticated: boolean;
  
  // Patient actions
  registerPatient: (mobile: string, email?: string) => void;
  verifyOTP: (otp: string) => boolean;
  updatePatientDetails: (name: string, dateOfBirth: string, aadhar: string) => void;
  uploadPrescription: (file: File, doctorName: string, hospitalName: string) => void;
  generateInvoice: () => void;
  uploadAndGenerateInvoice: (file: File, doctorName: string, hospitalName: string) => Promise<void>;
  makePayment: () => void;
  bookSlot: (date: string, time: string) => void;
  markItemReceived: () => void;
  checkAadharEligibility: (aadhar: string) => { eligible: boolean; message: string };
  
  // KYC actions
  updatePatientKYC: (name: string, dateOfBirth: string, aadhaarNumber: string, file?: File) => void;
  
  // Admin actions
  adminLogin: (username: string, password: string) => boolean;
  logout: () => void;
  approvePatient: (patientId: string, incomeLevel?: 'low' | 'medium' | 'high', discountPercentage?: number) => void;
  rejectPatient: (patientId: string) => void;
  updatePatientFromAdmin: (patientId: string, updates: Partial<Patient>) => void;
  
  // Admin data
  allPatients: Patient[];
  pendingApprovals: Patient[];
  inventory: Medicine[];
  addMedicine: (medicine: Omit<Medicine, 'id'>) => void;
  removeMedicine: (id: string) => void;
  updateMedicine: (medicine: Medicine) => void;
  updateMedicineDiscount: (id: string, discount: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock medicine inventory
const initialInventory: Medicine[] = [
  { id: 'm1', name: 'Paracetamol', genericName: 'PARACETAMOL + CAFFEINE', type: 'tablet', dosage: '500mg', quantityValue: '10 qty/strip', packingInfo: 'Blister pack of 10 tablets', disease: 'Fever', price: 50, discount: 50 * (0.5 + Math.random() * 0.25), substitutes: ['Crocin', 'Dolo 650', 'P-500'] },
  { id: 'm2', name: 'Crocin', genericName: 'PARACETAMOL', type: 'tablet', dosage: '650mg', quantityValue: '15 qty/strip', packingInfo: 'Blister pack of 15 tablets', disease: 'Fever', price: 45, discount: 45 * (0.5 + Math.random() * 0.25), substitutes: ['Paracetamol', 'Dolo 650', 'P-500'] },
  { id: 'm3', name: 'Ibuprofen', genericName: 'IBUPROFEN', type: 'tablet', dosage: '400mg', quantityValue: '10 qty/strip', packingInfo: 'Blister pack of 10 tablets', disease: 'Pain', price: 80, discount: 80 * (0.5 + Math.random() * 0.25), substitutes: ['Brufen', 'Combiflam', 'Advil'] },
  { id: 'm4', name: 'Brufen', genericName: 'IBUPROFEN', type: 'capsule', dosage: '200mg', quantityValue: '20 qty/strip', packingInfo: 'Blister pack of 20 capsules', disease: 'Pain', price: 85, discount: 85 * (0.5 + Math.random() * 0.25), substitutes: ['Ibuprofen', 'Combiflam', 'Advil'] },
  { id: 'm5', name: 'Amoxicillin', genericName: 'AMOXICILLIN', type: 'capsule', dosage: '250mg', quantityValue: '15 qty/strip', packingInfo: 'Blister pack of 15 capsules', disease: 'Infection', price: 120, discount: 120 * (0.5 + Math.random() * 0.25), substitutes: ['Amoxil', 'Mox', 'Novamox'] },
  { id: 'm6', name: 'Amoxil', genericName: 'AMOXICILLIN', type: 'tablet', dosage: '500mg', quantityValue: '10 qty/strip', packingInfo: 'Blister pack of 10 tablets', disease: 'Infection', price: 115, discount: 115 * (0.5 + Math.random() * 0.25), substitutes: ['Amoxicillin', 'Mox', 'Novamox'] },
  { id: 'm7', name: 'Benadryl', genericName: 'DIPHENHYDRAMINE + AMMONIUM CHLORIDE', type: 'syrup', dosage: '100ml', quantityValue: '100 ml', packingInfo: 'Bottle of 100 ml', disease: 'Cough', price: 150, discount: 150 * (0.5 + Math.random() * 0.25), substitutes: ['Corex', 'Ascoril', 'Chericof'] },
  { id: 'm8', name: 'Lantus', genericName: 'INSULIN GLARGINE', type: 'injection', dosage: '10ml', quantityValue: '10 ml', packingInfo: 'Vial of 10 ml', disease: 'Diabetes', price: 800, discount: 800 * (0.5 + Math.random() * 0.25), substitutes: ['Basalog', 'Glaritus', 'Toujeo'] },
  { id: 'm9', name: 'Humalog', genericName: 'INSULIN LISPRO', type: 'injection', dosage: '10ml', quantityValue: '10 ml', packingInfo: 'Vial of 10 ml', disease: 'Diabetes', price: 750, discount: 750 * (0.5 + Math.random() * 0.25), substitutes: ['Apidra', 'NovoRapid', 'Admelog'] },
  { id: 'm10', name: 'Zyrtec', genericName: 'CETIRIZINE HYDROCHLORIDE', type: 'tablet', dosage: '10mg', quantityValue: '10 qty/strip', packingInfo: 'Blister pack of 10 tablets', disease: 'Allergy', price: 60, discount: 60 * (0.5 + Math.random() * 0.25), substitutes: ['Cetirizine', 'Alerid', 'Cetzine'] },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<'patient' | 'admin' | null>(null);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [allPatients, setAllPatients] = useState<Patient[]>([
    {
      id: 'p1',
      patientId: 'PID001',
      mobile: '9999999999',
      email: 'existing@example.com',
      aadhar: '111111111111',
      name: 'Existing Patient',
      dateOfBirth: '1990-01-01',
      prescription: null,
      prescriptionData: undefined,
      invoice: null,
      paymentStatus: 'pending',
      slotDate: null,
      slotTime: null,
      itemReceived: false,
      registrationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      approvalStatus: 'approved',
      lastMedicineDate: null,
    }
  ]);
  const [inventory, setInventory] = useState<Medicine[]>(initialInventory);
  const [tempMobile, setTempMobile] = useState<string>('');
  const [tempEmail, setTempEmail] = useState<string | undefined>(undefined);

  const registerPatient = (mobile: string, email?: string) => {
    setTempMobile(mobile);
    setTempEmail(email);
  };

  const verifyOTP = (otp: string): boolean => {
    // Mock OTP verification - accept any 6 digit OTP
    if (otp.length === 6) {
      const existingPatient = allPatients.find((p: Patient) => p.mobile === tempMobile);
      
      if (existingPatient) {
        setCurrentPatient(existingPatient);
      } else {
        const newPatient: Patient = {
          id: `p${Date.now()}`,
          patientId: `PID${Date.now()}`,
          mobile: tempMobile,
          email: tempEmail,
          aadhar: '',
          name: '',
          dateOfBirth: '',
          prescription: null,
          prescriptionData: undefined,
          invoice: null,
          paymentStatus: 'pending',
          slotDate: null,
          slotTime: null,
          itemReceived: false,
          registrationDate: new Date().toISOString(),
          approvalStatus: 'pending',
          lastMedicineDate: null,
        };
        setCurrentPatient(newPatient);
        setAllPatients(prev => [...prev, newPatient]);
      }
      
      setUserType('patient');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const updatePatientDetails = (name: string, dateOfBirth: string, aadhar: string) => {
    if (currentPatient) {
      const updated = { ...currentPatient, name, dateOfBirth, aadhar };
      setCurrentPatient(updated);
      setAllPatients(prev => 
        prev.map(p => p.id === currentPatient.id ? updated : p)
      );
    }
  };

  const updatePatientKYC = (name: string, dateOfBirth: string, aadhaarNumber: string, file?: File) => {
    if (currentPatient) {
      const updated = {
        ...currentPatient,
        name,
        dateOfBirth,
        aadhar: aadhaarNumber.replace(/\s/g, ''),
        aadhaarNumber,
        incomeDocumentUrl: file ? URL.createObjectURL(file) : currentPatient.incomeDocumentUrl,
      };
      setCurrentPatient(updated);
      setAllPatients(prev =>
        prev.map(p => p.id === currentPatient.id ? updated : p)
      );
    }
  };

  const uploadPrescription = (file: File, doctorName: string, hospitalName: string) => {
    if (currentPatient) {
      const prescriptionUrl = URL.createObjectURL(file);
      const updated = { ...currentPatient, prescription: prescriptionUrl, prescriptionData: { doctorName, hospitalName } };
      setCurrentPatient(updated);
      setAllPatients(prev => 
        prev.map(p => p.id === currentPatient.id ? updated : p)
      );
      console.log('AppContext - Prescription uploaded:', updated);
    }
  };

  const generateInvoice = () => {
    console.log('AppContext - generateInvoice called. Current patient:', currentPatient);
    
    if (currentPatient) {
      console.log('AppContext - Has currentPatient, generating invoice...');
      
      // Mock invoice generation - randomly select 3-5 medicines
      const numItems = Math.floor(Math.random() * 3) + 3;
      const selectedMedicines = [...inventory]
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems);
      
      // Use patient-specific discount rate set by admin during approval
      const patientDiscountRate = (currentPatient.discountPercentage || 0) / 100;
      
      const items: InvoiceItem[] = selectedMedicines.map(med => {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const itemTotal = med.price * quantity;
        const itemDiscount = itemTotal * patientDiscountRate;
        return {
          medicineId: med.id,
          medicineName: med.name,
          brand: med.type,
          quantity,
          price: med.price,
          discount: itemDiscount,
          total: itemTotal - itemDiscount,
        };
      });
      
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discount = subtotal * patientDiscountRate;
      const taxes = (subtotal - discount) * 0.05; // 5% tax applied after discount
      const grandTotal = subtotal - discount + taxes;
      
      const invoice: Invoice = {
        invoiceNumber: `INV${Date.now()}`,
        items,
        subtotal,
        taxes,
        discount,
        grandTotal,
      };
      
      const updated = { ...currentPatient, invoice };
      console.log('AppContext - Invoice generated:', invoice);
      console.log('AppContext - Updated patient:', updated);
      
      setCurrentPatient(updated);
      setAllPatients(prev => 
        prev.map(p => p.id === currentPatient.id ? updated : p)
      );
    } else {
      console.log('AppContext - No currentPatient or prescription, cannot generate invoice');
    }
  };

  const uploadAndGenerateInvoice = async (file: File, doctorName: string, hospitalName: string) => {
    if (!currentPatient) {
      console.error('AppContext - No current patient');
      throw new Error('No patient logged in. Please log in first.');
    }

    console.log('AppContext - uploadAndGenerateInvoice called');
    
    try {
      // Call the prescription API to upload and process the prescription
      const result = await prescriptionService.uploadAndGenerateInvoice(
        file,
        currentPatient.patientId,
        parseInt(currentPatient.id.replace('p', ''))
      );

      if (!result.success || !result.data) {
        console.error('AppContext - API call failed:', result.error);
        throw new Error(result.error || 'Failed to upload prescription. Please try again.');
      }

      const { prescription: prescriptionData, invoice: invoiceData } = result.data;

      console.log('AppContext - API response:', {
        medicines: prescriptionData.medicines,
        doctorName: prescriptionData.doctorName,
        hospitalName: prescriptionData.hospitalName,
        prescriptionKey: prescriptionData.prescriptionKey,
      });

      // Create a local URL for the uploaded file (for display purposes)
      const prescriptionUrl = URL.createObjectURL(file);

      // Map API invoice response to local Invoice interface
      const invoice: Invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        items: invoiceData.items.map(item => ({
          medicineId: item.inventoryId?.toString() || '',
          medicineName: item.medicineName,
          brand: '', // Not provided in API response
          quantity: 1, // Not specified in API response, default to 1
          price: item.mrp,
          discount: item.discount,
          total: item.finalPrice,
        })),
        subtotal: invoiceData.subtotal,
        taxes: 0, // Not provided in API response
        discount: invoiceData.totalDiscount,
        grandTotal: invoiceData.totalAmount,
      };

      // Update patient with prescription data, extracted info, and invoice
      const updated: Patient = {
        ...currentPatient,
        prescription: prescriptionUrl,
        prescriptionData: {
          doctorName: prescriptionData.doctorName || doctorName,
          hospitalName: prescriptionData.hospitalName || hospitalName,
          medicines: prescriptionData.medicines,
          prescriptionKey: prescriptionData.prescriptionKey,
        },
        invoice,
      };

      console.log('AppContext - Updated patient with API data:', updated);

      setCurrentPatient(updated);
      setAllPatients(prev =>
        prev.map(p => (p.id === currentPatient.id ? updated : p))
      );
    } catch (error: any) {
      console.error('AppContext - uploadAndGenerateInvoice error:', error);
      // Re-throw error to let component handle it with proper error message
      throw error;
    }
  };

  const makePayment = () => {
    console.log('AppContext - makePayment called');
    console.log('AppContext - currentPatient:', currentPatient);
    
    // Automatically assign next day at 10:00 AM as pickup slot
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const slotDate = tomorrow.toISOString().split('T')[0];
    const slotTime = '10:00';
    
    if (currentPatient) {
      const updated = { 
        ...currentPatient, 
        paymentStatus: 'paid' as const,
        slotDate,
        slotTime,
        lastMedicineDate: new Date().toISOString() // Update when medicine is issued
      };
      console.log('AppContext - Updated patient:', updated);
      setCurrentPatient(updated);
      setAllPatients(prev => 
        prev.map(p => p.id === currentPatient.id ? updated : p)
      );
      console.log('AppContext - State updated successfully');
    } else {
      // Handle payment when working with localStorage only
      console.log('AppContext - No current patient in context, updating localStorage');
      try {
        const storedData = localStorage.getItem('patient_data');
        if (storedData) {
          const patientData = JSON.parse(storedData);
          const updatedData = {
            ...patientData,
            paymentStatus: 'paid',
            slotDate,
            slotTime,
            lastMedicineDate: new Date().toISOString()
          };
          localStorage.setItem('patient_data', JSON.stringify(updatedData));
          console.log('AppContext - Payment updated in localStorage:', updatedData);
        } else {
          console.log('AppContext - No patient data in localStorage');
        }
      } catch (error) {
        console.error('AppContext - Error updating localStorage:', error);
      }
    }
  };

  const bookSlot = (date: string, time: string) => {
    if (currentPatient) {
      const updated = { ...currentPatient, slotDate: date, slotTime: time };
      setCurrentPatient(updated);
      setAllPatients(prev => 
        prev.map(p => p.id === currentPatient.id ? updated : p)
      );
    }
  };

  const markItemReceived = () => {
    console.log('AppContext - markItemReceived called');
    if (currentPatient) {
      const updated = { ...currentPatient, itemReceived: true };
      setCurrentPatient(updated);
      setAllPatients(prev => 
        prev.map(p => p.id === currentPatient.id ? updated : p)
      );
      console.log('AppContext - Item marked as received in context');
    } else {
      // Handle when working with localStorage only
      console.log('AppContext - No current patient, updating localStorage');
      try {
        const storedData = localStorage.getItem('patient_data');
        if (storedData) {
          const patientData = JSON.parse(storedData);
          const updatedData = {
            ...patientData,
            itemReceived: true
          };
          localStorage.setItem('patient_data', JSON.stringify(updatedData));
          console.log('AppContext - Item marked as received in localStorage');
        }
      } catch (error) {
        console.error('AppContext - Error updating localStorage:', error);
      }
    }
  };

  const adminLogin = (username: string, password: string): boolean => {
    // Mock admin login - accept admin/admin
    if (username === 'admin' && password === 'admin') {
      setUserType('admin');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUserType(null);
    setCurrentPatient(null);
    setIsAuthenticated(false);
  };

  const addMedicine = (medicine: Omit<Medicine, 'id'>) => {
    const newMedicine: Medicine = {
      ...medicine,
      id: `m${Date.now()}`,
    };
    setInventory(prev => [...prev, newMedicine]);
  };

  const removeMedicine = (id: string) => {
    setInventory(prev => prev.filter(m => m.id !== id));
  };

  const updateMedicine = (medicine: Medicine) => {
    setInventory(prev => 
      prev.map(m => m.id === medicine.id ? medicine : m)
    );
  };

  const updateMedicineDiscount = (id: string, discount: number) => {
    setInventory(prev => 
      prev.map(m => m.id === id ? { ...m, discount } : m)
    );
  };

  const approvePatient = (patientId: string, incomeLevel?: 'low' | 'medium' | 'high', discountPercentage?: number) => {
    setAllPatients(prev =>
      prev.map(p => p.patientId === patientId
        ? { ...p, approvalStatus: 'approved', incomeLevel, discountPercentage }
        : p
      )
    );
  };

  const rejectPatient = (patientId: string) => {
    setAllPatients(prev => 
      prev.map(p => p.patientId === patientId ? { ...p, approvalStatus: 'rejected' } : p)
    );
  };

  const updatePatientFromAdmin = (patientId: string, updates: Partial<Patient>) => {
    setAllPatients(prev =>
      prev.map(p => p.patientId === patientId ? { ...p, ...updates } : p)
    );
  };

  const checkAadharEligibility = (aadhar: string): { eligible: boolean; message: string } => {
    // Check Aadhar format (12 digits)
    if (aadhar.length !== 12 || isNaN(Number(aadhar))) {
      return { eligible: false, message: 'Invalid Aadhar number. Must be 12 digits.' };
    }

    // Check if Aadhar already exists
    const existingPatient = allPatients.find(p => p.aadhar === aadhar && p.id !== currentPatient?.id);
    if (existingPatient) {
      // Check 30-day medicine limit
      if (existingPatient.lastMedicineDate) {
        const lastDate = new Date(existingPatient.lastMedicineDate);
        const today = new Date();
        const daysDifference = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDifference < 30) {
          return { 
            eligible: false, 
            message: `This Aadhar is already registered. Next medicine can be issued after ${30 - daysDifference} days.` 
          };
        }
      }
      return { eligible: false, message: 'This Aadhar is already in use. Please try another Aadhar number.' };
    }

    return { eligible: true, message: 'Aadhar is valid and eligible.' };
  };

  return (
    <AppContext.Provider
      value={{
        userType,
        currentPatient,
        isAuthenticated,
        registerPatient,
        verifyOTP,
        updatePatientDetails,
        updatePatientKYC,
        uploadPrescription,
        generateInvoice,
        uploadAndGenerateInvoice,
        makePayment,
        bookSlot,
        markItemReceived,
        checkAadharEligibility,
        adminLogin,
        logout,
        approvePatient,
        rejectPatient,
        updatePatientFromAdmin,
        allPatients,
        pendingApprovals: allPatients.filter(p => p.approvalStatus === 'pending'),
        inventory,
        addMedicine,
        removeMedicine,
        updateMedicine,
        updateMedicineDiscount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}