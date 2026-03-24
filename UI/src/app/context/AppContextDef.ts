import { createContext } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnnualIncome = 'below_50000' | '50000_100000' | '100000_200000' | 'above_200000' | null;

// ─── Constants ───────────────────────────────────────────────────────────────

export const INCOME_LABELS: Record<string, string> = {
  below_50000: 'Below ₹50,000',
  '50000_100000': '₹50,000 – ₹1,00,000',
  '100000_200000': '₹1,00,000 – ₹2,00,000',
  above_200000: 'Above ₹2,00,000',
};

export const INCOME_DISCOUNT: Record<string, number> = {
  below_50000: 80,
  '50000_100000': 60,
  '100000_200000': 40,
  above_200000: 20,
};

export const INCOME_LEVEL_MAP: Record<string, 'low' | 'medium' | 'high'> = {
  below_50000: 'low',
  '50000_100000': 'low',
  '100000_200000': 'medium',
  above_200000: 'high',
};

export const HOSPITAL_PARTNERS = [
  'MNJ Institute of Oncology & Regional Cancer Centre',
  'Apollo Cancer Centre',
  'Omega Hospitals',
  'Care Hospitals',
  'AIIMS Hyderabad',
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  type: 'injection' | 'tablet' | 'capsule' | 'syrup';
  dosage: string;
  quantityValue: string;
  packingInfo: string;
  disease: string;
  price: number;
  discount?: number;
  substitutes?: string[];
  stockQuantity: number;
}

export interface InvoiceItem {
  medicineName: string;
  inventoryId: number | null;
  mrp: number;
  discount: number;
  finalPrice: number;
  isAvailable: boolean;
}

export interface Invoice {
  invoiceNumber: string;
  prescriptionId?: number;
  patientId?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  generatedDate?: string;
}

export type PickupStatus =
  | 'invoice_ready'
  | 'payment_pending'
  | 'slot_available'
  | 'slot_booked'
  | 'collection_confirmed'
  | 'collected'
  | 'missing_medicine'
  | 'expired';

export interface Pickup {
  id: string;
  status: PickupStatus;
  slotDate: string | null;
  slotTime: string | null;
  bookedAt: string | null;
  invoice: Invoice | null;
  itemReceived: boolean;
  paymentMethod: string | null;
}

export type PrescriptionApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Prescription {
  id: string;
  uploadDate: string;
  prescriptionUrl: string;
  doctorName: string;
  hospitalName: string;
  approvalStatus: PrescriptionApprovalStatus;
  rejectionReason: string | null;
  approvedDate: string | null;
  expiryDate: string | null;
  pickups: Pickup[];
  missingMedicines: string[];
  processingStatus?: string;
}

export interface Patient {
  id: string;
  patientId: string;
  mobile: string;
  email: string | null;
  name: string;
  dateOfBirth: string;
  aadhaarNumber: string | null;
  incomeDocumentUrl: string | null;
  incomeLevel: 'low' | 'medium' | 'high' | null;
  discountPercentage: number;
  kycStatus: 'pending' | 'approved' | 'rejected' | 'submitted';
  kycRejectionReason: string | null;
  registrationStatus: string;
  registrationDate: string;
  prescriptions: Prescription[];
  gender?: 'Male' | 'Female' | null;
  govtIdType?: string | null;
  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianMobile?: string | null;
  annualFamilyIncome?: AnnualIncome;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  country?: string | null;
  hospitalPartner?: string | null;
  criticalIllness?: string | null;
  illnessDetails?: string | null;
}

export interface KYCFormData {
  name: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  govtIdType: string;
  aadhaarNumber: string;
  incomeDocument: File;
  annualFamilyIncome: AnnualIncome;
  guardianName: string;
  guardianRelation: 'Father' | 'Mother' | 'Guardian';
  guardianMobile: string;
  streetAddress: string;
  city: string;
  pinCode: string;
  state: string;
  country: string;
  hospitalPartner: string;
  criticalIllness: string;
  illnessDetails: string;
}

export interface AppContextType {
  userType: 'patient' | 'admin' | null;
  currentPatient: Patient | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  navigateToLanding: () => void;
  navigationTrigger: number;
  registerPatient: (mobile: string, email?: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<boolean>;
  logout: () => void;
  submitKYC: (data: KYCFormData) => Promise<void>;
  uploadPrescription: (file: File, doctorName: string, hospitalName: string) => Promise<void>;
  bookPickupSlot: (patientId: string, prescriptionId: string, pickupId: string, date: string, time: string) => Promise<void>;
  reschedulePickup: (patientId: string, prescriptionId: string, pickupId: string, newDate: string, newTime: string) => Promise<void>;
  getBookedSlots: () => string[];
  checkPickupExpiry: (patientId: string) => void;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  approvePatientKYC: (patientId: string, incomeLevel: string, discountPercentage: number) => Promise<void>;
  rejectPatientKYC: (patientId: string, reason: string) => Promise<void>;
  approvePrescription: (patientId: string, prescriptionId: string) => Promise<void>;
  rejectPrescription: (patientId: string, prescriptionId: string, reason: string) => Promise<void>;
  notifyMissingMedicine: (patientId: string, prescriptionId: string, missingMedicineNames: string[]) => void;
  initiatePayment: (patientId: string, prescriptionId: string, pickupId: string, paymentMethod: string) => void;
  confirmPayment: (patientId: string, prescriptionId: string, pickupId: string) => void;
  patientConfirmCollection: (patientId: string, prescriptionId: string, pickupId: string) => void;
  markPickupCollected: (patientId: string, prescriptionId: string, pickupId: string) => void;
  addMedicine: (medicine: Omit<Medicine, 'id'>) => Promise<void>;
  removeMedicine: (id: string) => Promise<void>;
  updateMedicine: (id: string, updates: Partial<Medicine>) => Promise<void>;
  allPatients: Patient[];
  medicines: Medicine[];
  refreshPatientData: () => Promise<void>;
}

// ─── Stable context instance (separate file = survives HMR re-evaluation) ────
export const AppContext = createContext<AppContextType | undefined>(undefined);
