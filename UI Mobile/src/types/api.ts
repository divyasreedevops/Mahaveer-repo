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
  status: number;
  createdBy: number | null;
  createdDate: string;
  updatedBy: number | null;
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
  kycStatus: string;
  status: number;
  createdBy: number | null;
  createdDate: string;
  updatedBy: number | null;
  updatedDate: string;
  firstLogin: number;
  kycDocumentUrl: string;
  incomeLevel: string | null;
  discountPercentage: number | null;
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  password: string;
  email: string;
  role: string;
  status: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface OtpRequest {
  mobileNumber: string;
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

/**
 * Payment types
 */
export interface CreateOrderRequest {
  amount: number;
  patientId: string;
}

export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
}

/**
 * Income Level from Common API
 */
export interface IncomeLevel {
  id: number;
  incomeLevelName: string;
  discountPercentage: number;
  description: string;
  status: number;
}

/**
 * Approve KYC request
 */
export interface ApproveKycRequest {
  id: number;
  incomeLevel: string;
  discountPercentage?: number;
  updatedBy?: number;
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
  incomeDocumentUrl?: string;
  incomeLevel?: 'low' | 'medium' | 'high';
  discountPercentage?: number;
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
