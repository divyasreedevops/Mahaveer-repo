import { z } from 'zod';

/**
 * Inventory item schema
 */
export const inventoryItemSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(1, 'Medicine name is required')
    .max(200, 'Name must not exceed 200 characters'),
  type: z
    .string()
    .min(1, 'Type is required')
    .max(50, 'Type must not exceed 50 characters'),
  disease: z
    .string()
    .min(1, 'Disease is required')
    .max(100, 'Disease must not exceed 100 characters'),
  dosageValue: z
    .number()
    .positive('Dosage must be positive'),
  dosageUnits: z
    .string()
    .min(1, 'Dosage units are required')
    .max(20, 'Units must not exceed 20 characters'),
  quantityValue: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive'),
  quantityUnits: z
    .string()
    .min(1, 'Quantity units are required')
    .max(20, 'Units must not exceed 20 characters'),
  mrp: z
    .number()
    .positive('MRP must be positive'),
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%'),
  finalPrice: z
    .number()
    .nonnegative('Final price cannot be negative'),
  status: z.number().optional(),
});

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

/**
 * Batch inventory save schema
 */
export const inventoryBatchSchema = z.object({
  items: z.array(inventoryItemSchema).min(1, 'At least one item is required'),
});

export type InventoryBatchFormData = z.infer<typeof inventoryBatchSchema>;

/**
 * Bulk upload inventory row schema
 */
export const bulkUploadRowSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  type: z.enum(['injection', 'tablet', 'capsule', 'syrup'], {
    errorMap: () => ({ message: 'Type must be: tablet, capsule, injection, or syrup' }),
  }),
  disease: z.string().min(1, 'Disease is required'),
  dosageValue: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Valid dosage value is required',
  }),
  dosageUnits: z.string().min(1, 'Dosage units are required'),
  quantityValue: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: 'Valid quantity value is required',
  }),
  quantityUnits: z.string().min(1, 'Quantity units are required'),
  mrp: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Valid MRP is required',
  }),
  discount: z.string().optional(),
});

export type BulkUploadRowData = z.infer<typeof bulkUploadRowSchema>;
