import { createContext } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  kycStatus: 'pending' | 'approved' | 'rejected';
  kycRejectionReason: string | null;
  registrationStatus: string;
  registrationDate: string;
  prescriptions: Prescription[];
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
  submitKYC: (name: string, dob: string, aadhaar: string, file: File) => Promise<void>;
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
