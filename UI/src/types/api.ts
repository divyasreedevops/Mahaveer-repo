/**
 * API Types - Generated from OpenAPI spec
 * These types match the backend API schema
 */

export interface InventoryItem {
  id: number;
  name: string | null;
  type: string | null;
  disease: string | null;
  dosageValue: number;
  dosageUnits: string | null;
  quantityValue: number;
  quantityUnits: string | null;
  mrp: number;
  discount: number;
  finalPrice: number;
  status: number;
  createdBy: number | null;
  createdDate: string;
  updatedDate: string;
  updatedBy: number | null;
  // UI-only fields (not in API schema, ignored by backend)
  genericName?: string;
  packingInfo?: string;
  substitutes?: string[];
}

export interface LoginRequest {
  username: string | null;
  password: string | null;
}

export interface OtpRequest {
  mobileNumber: string | null;
}

export interface VerifyOtpRequest {
  mobileNumber: string | null;
  otp: string | null;
}

export interface Patient {
  mobileNumber: string | null;
  email: string | null;
  otp: string | null;
}

export interface PatientDetails {
  id: number;
  patientId: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  email: string | null;
  aadharNumber: string | null;
  dob: string | null;
  registrationDate: string;
  registrationStatus: string | null;
  kycStatus: string | null;
  status: number;
  createdBy: number | null;
  createdDate: string;
  updatedDate: string;
  updatedBy: number | null;
  firstLogin: number;
  kycDocumentUrl: string | null;
  incomeLevel: string | null;
  discountPercentage: number | null;
  slotDate: string | null;
  slotTime: string | null;
}

export interface User {
  id: number;
  firstname: string | null;
  lastname: string | null;
  username: string | null;
  password: string | null;
  email: string | null;
  role: string | null;
  status: number;
}

export interface WeatherForecast {
  date: string;
  temperatureC: number;
  temperatureF: number;
  summary: string | null;
}

/**
 * API Response wrapper types
 */
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

/**
 * Registration status enum - matches backend values from api.json
 */
export enum RegistrationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

/**
 * User roles enum
 */
export enum UserRole {
  ADMIN = 'admin',
  PATIENT = 'patient',
  STAFF = 'staff'
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
 * Update Registration Status request
 */
export interface UpdateRegistrationStatusRequest {
  id: number;
  patientId: string;
  registrationStatus: string;
}

/**
 * Approve KYC request
 */
export interface ApproveKycRequest {
  id: number;
  incomeLevel: string;
  discountPercentage: number;
}

/**
 * Appointment Slot Types
 */
export interface AvailableSlot {
  slotDate: string;
  slotTime: string;
  isAvailable: boolean;
}

export interface BookAppointmentRequest {
  patientId: string | null;
  prescriptionId: number;
  slotDate: string;
  slotTime: string | null;
}

export interface SlotBookingResponse {
  bookingId: number;
  message: string;
  remainingSlots?: number;
}

export interface RescheduleSlotRequest {
  bookingId: number;
  patientId: string;
  prescriptionId: number;
  slotDate: string;
  slotTime: string;
}

/**
 * Prescription Approval/Rejection Types
 */
export interface PrescriptionApprovalRequest {
  prescriptionId: number;
  approvedBy: string | null;
  remarks: string | null;
}

export interface PrescriptionRejectionRequest {
  prescriptionId: number;
  rejectedBy: string | null;
  reason: string | null;
}

/**
 * Medicine Info for Invoices and Prescriptions
 */
export interface MedicineInfo {
  name: string | null;
  dosage: string | null;
  frequency: string | null;
}

/**
 * Upload result (matches PrescriptionInfo in docs)
 */
export interface PrescriptionResponse {
  medicines: MedicineInfo[] | null;
  doctorName: string | null;
  hospitalName: string | null;
  prescriptionKey: string;
  prescriptionId: number | null;
}

/**
 * Request to save prescription after review
 */
export interface PrescriptionSaveRequest {
  prescriptionKey: string;
  patientId: string;
  pId: number;
  doctorName?: string | null;
  hospitalName?: string | null;
  medicines: MedicineInfo[];
}

/**
 * Request to generate an invoice
 */
export interface GenerateInvoiceRequest {
  patientId: string;
  prescriptionKey: number; // This is the prescription ID
  id: number; // This is the patient numeric ID
}

/**
 * Invoice line item
 */
export interface InvoiceItem {
  medicineName: string;
  inventoryId: number | null;
  mrp: number;
  discount: number;
  finalPrice: number;
  isAvailable: boolean;
}

/**
 * Full Invoice Details
 */
export interface Invoice {
  prescriptionId: number;
  patientId: string;
  pId?: string; // Optional field used in summary
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  generatedDate: string;
  invoiceNumber: string;
  status?: string; // e.g., 'PAID', 'PENDING'
}

export interface PrescriptionDetails {
  id: number;
  prescriptionKey: string;
  patientId: string;
  pId: number;
  doctorName: string;
  hospitalName: string;
  prescriptionUrl: string;
  uploadDate: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  medicines?: MedicineInfo[];
  approvedBy?: string | null;
  approvedDate?: string | null;
  approvalRemarks?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
}

