// ============ Core Entities ============

export interface InventoryItem {
  id: number;
  name: string;
  type: string;
  disease: string;
  dosageValue: number;
  dosageUnits: string;
  quantityValue: number;
  quantityUnits: string;
  mrp: number;
  discount: number;
  finalPrice: number;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
}

export interface PatientDetails {
  id: number;
  patientId: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  aadharNumber: string;
  dob: string;
  registrationDate: string;
  registrationStatus: string;
  status: string;
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
  firstLogin?: boolean;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  email: string;
  role: string;
  status: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface OtpRequest {
  mobileNumber: string;
  email?: string;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  otp: string;
}

export interface Patient {
  mobileNumber: string;
  email: string;
  otp: string;
}

// ============ API Wrappers ============

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

// ============ Enums ============

export enum RegistrationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum UserRole {
  ADMIN = 'admin',
  PATIENT = 'patient',
  STAFF = 'staff',
}

// ============ App-specific types ============

export interface Medicine {
  id: number;
  name: string;
  type: 'injection' | 'tablet' | 'capsule' | 'syrup';
  dosage: string;
  quantityValue: number;
  disease: string;
  price: number;
  discount?: number;
}

export interface InvoiceItem {
  medicineId: number;
  medicineName: string;
  brand: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Invoice {
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  taxes: number;
  discount: number;
  grandTotal: number;
}

export interface PatientFlowData {
  id: string;
  patientId: string;
  mobile: string;
  email?: string;
  aadhar: string;
  name: string;
  dob: string;
  prescription: string | null;
  prescriptionData?: { doctorName: string; hospitalName: string };
  invoice: Invoice | null;
  paymentStatus: 'pending' | 'paid';
  slotDate: string | null;
  slotTime: string | null;
  itemReceived: boolean;
  registrationDate: string;
  approvalStatus: RegistrationStatus;
  lastMedicineDate: string | null;
}
