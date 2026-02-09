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
}

export interface LoginRequest {
  username: string | null;
  password: string | null;
}

export interface OtpRequest {
  mobileNumber: string | null;
  email?: string;
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
  status: number;
  createdBy: number | null;
  createdDate: string;
  updatedDate: string;
  updatedBy: number | null;
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
