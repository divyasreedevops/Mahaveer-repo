import { http, HttpResponse } from 'msw';
import type { PatientDetails, InventoryItem, LoginRequest } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://16.112.72.213:5000';

/**
 * Mock data
 */
const mockPatients: PatientDetails[] = [
  {
    id: 1,
    patientId: 'PAT001',
    fullName: 'John Doe',
    mobileNumber: '9876543210',
    email: 'john.doe@example.com',
    aadharNumber: '123456789012',
    dob: '1990-01-15',
    registrationDate: '2024-01-01T00:00:00Z',
    registrationStatus: 'Approved',
    kycStatus: 'Verified',
    status: 1,
    createdBy: 1,
    createdDate: '2024-01-01T00:00:00Z',
    updatedDate: '2024-01-01T00:00:00Z',
    updatedBy: 1,
    firstLogin: 0,
    kycDocumentUrl: null,
  },
  {
    id: 2,
    patientId: 'PAT002',
    fullName: 'Jane Smith',
    mobileNumber: '9876543211',
    email: 'jane.smith@example.com',
    aadharNumber: '123456789013',
    dob: '1985-05-20',
    registrationDate: '2024-01-02T00:00:00Z',
    registrationStatus: 'Pending',
    kycStatus: 'Pending Approval',
    status: 1,
    createdBy: 1,
    createdDate: '2024-01-02T00:00:00Z',
    updatedDate: '2024-01-02T00:00:00Z',
    updatedBy: 1,
    firstLogin: 1,
    kycDocumentUrl: null,
  },
];

const mockInventory: InventoryItem[] = [
  {
    id: 1,
    name: 'Paracetamol',
    type: 'Tablet',
    disease: 'Fever',
    dosageValue: 500,
    dosageUnits: 'mg',
    quantityValue: 10,
    quantityUnits: 'Tablets',
    mrp: 50,
    discount: 5,
    finalPrice: 45,
    status: 1,
    createdBy: 1,
    createdDate: '2024-01-01T00:00:00Z',
    updatedDate: '2024-01-01T00:00:00Z',
    updatedBy: 1,
  },
  {
    id: 2,
    name: 'Amoxicillin',
    type: 'Capsule',
    disease: 'Infection',
    dosageValue: 250,
    dosageUnits: 'mg',
    quantityValue: 15,
    quantityUnits: 'Capsules',
    mrp: 150,
    discount: 15,
    finalPrice: 135,
    status: 1,
    createdBy: 1,
    createdDate: '2024-01-01T00:00:00Z',
    updatedDate: '2024-01-01T00:00:00Z',
    updatedBy: 1,
  },
];

/**
 * MSW Request handlers
 * Response format matches the real backend API exactly
 */
export const handlers = [
  // ── Auth endpoints ──
  // POST /Login/admin → { message, isAuthenticated }
  http.post(`${API_BASE}/Login/admin`, async ({ request }) => {
    const body = await request.json() as LoginRequest;
    
    if (!body.username || !body.password) {
      return HttpResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json({
        message: 'Login successful',
        isAuthenticated: true,
      });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials', isAuthenticated: false },
      { status: 401 }
    );
  }),

  // POST /Login/logout → { message }
  http.post(`${API_BASE}/Login/logout`, () => {
    return HttpResponse.json({ message: 'Logout successful' });
  }),

  // ── Patient endpoints ──
  // GET /Patient/status/:status → PatientDetails[]
  http.get(`${API_BASE}/Patient/status/:status`, ({ params }) => {
    const { status } = params;
    const filtered = mockPatients.filter(
      (p) => p.registrationStatus?.toLowerCase() === (status as string).toLowerCase()
    );
    return HttpResponse.json(filtered);
  }),

  // POST /Patient/Register → { message, mobileNumber, otp }
  http.post(`${API_BASE}/Patient/Register`, async ({ request }) => {
    const body = await request.json() as { mobileNumber: string };
    if (!body.mobileNumber) {
      return HttpResponse.json(
        { message: 'Mobile number is required' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      message: 'OTP sent successfully',
      mobileNumber: body.mobileNumber,
      otp: '123456',
    });
  }),

  // POST /Patient/verify → { message, patientId } or { message, isValid: false }
  http.post(`${API_BASE}/Patient/verify`, async ({ request }) => {
    const body = await request.json() as { mobileNumber: string; otp: string; email?: string };
    if (!body.mobileNumber || !body.otp) {
      return HttpResponse.json(
        { message: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }
    if (body.otp === '123456') {
      return HttpResponse.json({
        message: 'Patient registered successfully',
        patientId: 'PAT00001',
      });
    }
    return HttpResponse.json({
      message: 'Invalid OTP',
      isValid: false,
    });
  }),

  // POST /Patient/Update (multipart/form-data) → { message }
  http.post(`${API_BASE}/Patient/Update`, async () => {
    return HttpResponse.json({
      message: 'Patient updated successfully',
    });
  }),

  // POST /Patient/UpdateStatus → { message }
  http.post(`${API_BASE}/Patient/UpdateStatus`, async ({ request }) => {
    const body = await request.json() as { id: number; patientId: string; registrationStatus: string };
    if (!body.id || !body.patientId || !body.registrationStatus) {
      return HttpResponse.json(
        { message: 'Id, Registration status, and PatientId are required' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      message: 'Registration status updated successfully',
    });
  }),

  // POST /Patient/ApproveKyc → { message }
  http.post(`${API_BASE}/Patient/ApproveKyc`, async ({ request }) => {
    const body = await request.json() as { id: number; incomeLevel: string; discountPercentage?: number };
    if (!body.id || !body.incomeLevel) {
      return HttpResponse.json(
        { message: 'Id and Income level are required' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      message: 'KYC approved successfully',
    });
  }),

  // GET /Patient/GetPatientByMobileNumber?mobile=xxx → PatientDetails
  http.get(`${API_BASE}/Patient/GetPatientByMobileNumber`, ({ request }) => {
    const url = new URL(request.url);
    const mobile = url.searchParams.get('mobile');
    if (!mobile) {
      return HttpResponse.json(
        { message: 'Mobile number is required' },
        { status: 400 }
      );
    }
    const patient = mockPatients.find((p) => p.mobileNumber === mobile);
    if (!patient) {
      return HttpResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json(patient);
  }),

  // ── OTP endpoints ──
  // POST /Otp/send → { message, mobileNumber }
  http.post(`${API_BASE}/Otp/send`, async ({ request }) => {
    const body = await request.json() as { mobileNumber: string };
    if (!body.mobileNumber) {
      return HttpResponse.json(
        { message: 'Mobile number is required' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      message: 'OTP sent successfully',
      mobileNumber: body.mobileNumber,
    });
  }),

  // POST /Otp/verify → { message, isValid }
  http.post(`${API_BASE}/Otp/verify`, async ({ request }) => {
    const body = await request.json() as { mobileNumber: string; otp: string };
    if (!body.mobileNumber || !body.otp) {
      return HttpResponse.json(
        { message: 'Mobile number and OTP are required' },
        { status: 400 }
      );
    }
    if (body.otp === '123456') {
      return HttpResponse.json({
        message: 'OTP verified successfully',
        isValid: true,
      });
    }
    return HttpResponse.json({
      message: 'Invalid OTP',
      isValid: false,
    });
  }),

  // ── Inventory endpoints ──
  // GET /Inventory/GetInventoryList → InventoryItem[]
  http.get(`${API_BASE}/Inventory/GetInventoryList`, () => {
    return HttpResponse.json(mockInventory);
  }),

  // POST /Inventory/save → { message, count }
  http.post(`${API_BASE}/Inventory/save`, async ({ request }) => {
    const body = await request.json() as any[];
    if (!body || body.length === 0) {
      return HttpResponse.json(
        { message: 'At least one item is required' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      message: 'Items saved successfully',
      count: body.length,
    });
  }),

  // DELETE /Inventory?inventoryId=x&userId=y → { message }
  http.delete(`${API_BASE}/Inventory`, ({ request }) => {
    const url = new URL(request.url);
    const inventoryId = url.searchParams.get('inventoryId');
    if (!inventoryId) {
      return HttpResponse.json(
        { message: 'Inventory item not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      message: 'Inventory item deleted successfully',
    });
  }),

  // ── User endpoints ──
  // POST /User/CreateUser → { message }
  http.post(`${API_BASE}/User/CreateUser`, async ({ request }) => {
    const body = await request.json() as { username?: string; password?: string };
    if (!body.username || !body.password) {
      return HttpResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }
    return HttpResponse.json({
      message: 'User created successfully',
    });
  }),

  // ── Common endpoints ──
  // GET /Common/GetIncomeLevels → IncomeLevel[]
  http.get(`${API_BASE}/Common/GetIncomeLevels`, () => {
    return HttpResponse.json([
      { id: 1, incomeLevelName: 'Low', discountPercentage: 80, description: 'Low income group', status: 1 },
      { id: 2, incomeLevelName: 'Medium', discountPercentage: 50, description: 'Medium income group', status: 1 },
      { id: 3, incomeLevelName: 'High', discountPercentage: 20, description: 'High income group', status: 1 },
    ]);
  }),
];
