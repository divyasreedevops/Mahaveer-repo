import { z } from 'zod';

/**
 * User creation schema
 */
export const userSchema = z.object({
  firstname: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters'),
  lastname: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters'),
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  role: z.enum(['admin', 'patient', 'staff'], {
    errorMap: () => ({ message: 'Invalid role' }),
  }),
});

export type UserFormData = z.infer<typeof userSchema>;
