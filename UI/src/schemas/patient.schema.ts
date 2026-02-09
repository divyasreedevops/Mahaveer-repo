import { z } from 'zod';

/**
 * Mobile number validation
 */
const mobileNumberRegex = /^[6-9]\d{9}$/;

/**
 * Aadhar number validation (12 digits)
 */
const aadharRegex = /^\d{12}$/;

/**
 * Patient registration schema
 */
export const patientRegistrationSchema = z.object({
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(mobileNumberRegex, 'Invalid mobile number (must be 10 digits starting with 6-9)'),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal('')),
});

export type PatientRegistrationFormData = z.infer<typeof patientRegistrationSchema>;

/**
 * Patient login schema (with email field)
 */
export const patientLoginSchema = z.object({
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(mobileNumberRegex, 'Invalid mobile number'),
  email: z
    .string()
    .default('')
    .optional()
    .transform(val => val || ''),
});

export type PatientLoginFormData = z.infer<typeof patientLoginSchema>;

/**
 * OTP verification schema
 */
export const otpVerificationSchema = z.object({
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(mobileNumberRegex, 'Invalid mobile number'),
  otp: z
    .string()
    .min(1, 'OTP is required')
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;

/**
 * Patient details form schema
 */
export const patientDetailsSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(mobileNumberRegex, 'Invalid mobile number'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  aadharNumber: z
    .string()
    .min(1, 'Aadhar number is required')
    .regex(aadharRegex, 'Aadhar number must be 12 digits'),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const dobDate = new Date(date);
      const today = new Date();
      return dobDate < today;
    }, 'Date of birth must be in the past'),
});

export type PatientDetailsFormData = z.infer<typeof patientDetailsSchema>;

/**
 * Patient status update schema
 */
export const patientStatusSchema = z.object({
  id: z.number(),
  registrationStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED']),
});

export type PatientStatusFormData = z.infer<typeof patientStatusSchema>;
/**
 * Bulk patient upload schema
 */
export const bulkPatientSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  mobileNumber: z
    .string()
    .min(1, 'Mobile number is required')
    .regex(mobileNumberRegex, 'Invalid mobile number'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  aadharNumber: z
    .string()
    .min(1, 'Aadhar number is required')
    .regex(aadharRegex, 'Aadhar number must be 12 digits'),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((date) => {
      const dobDate = new Date(date);
      const today = new Date();
      return dobDate < today;
    }, 'Date of birth must be in the past'),
  registrationStatus: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'])
    .default('PENDING'),
});

export type BulkPatientFormData = z.infer<typeof bulkPatientSchema>;