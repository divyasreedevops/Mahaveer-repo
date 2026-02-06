import { http, HttpResponse } from 'msw';
import type { PatientDetails, InventoryItem, LoginRequest } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

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
    registrationStatus: 'APPROVED',
    status: 1,
    createdBy: 1,
    createdDate: '2024-01-01T00:00:00Z',
    updatedDate: '2024-01-01T00:00:00Z',
    updatedBy: 1,
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
    registrationStatus: 'PENDING',
    status: 1,
    createdBy: 1,
    createdDate: '2024-01-02T00:00:00Z',
    updatedDate: '2024-01-02T00:00:00Z',
    updatedBy: 1,
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
    quantityUnits: 'tablets',
    mrp: 50,
    discount: 10,
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
    quantityUnits: 'capsules',
    mrp: 150,
    discount: 15,
    finalPrice: 127.5,
    status: 1,
    createdBy: 1,
    createdDate: '2024-01-01T00:00:00Z',
    updatedDate: '2024-01-01T00:00:00Z',
    updatedBy: 1,
  },
];

/**
 * MSW Request handlers
 */
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/Login/admin`, async ({ request }) => {
    const body = await request.json() as LoginRequest;
    
    if (body.username === 'admin' && body.password === 'admin123') {
      return HttpResponse.json({
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      });
    }
    
    return HttpResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/Login/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Patient endpoints
  http.get(`${API_BASE}/Patient/status/:status`, ({ params }) => {
    const { status } = params;
    const filtered = mockPatients.filter(
      (p) => p.registrationStatus?.toUpperCase() === (status as string).toUpperCase()
    );
    
    return HttpResponse.json({
      success: true,
      data: filtered,
    });
  }),

  http.post(`${API_BASE}/Patient/Register`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_BASE}/Patient/verify`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: mockPatients[0],
    });
  }),

  http.post(`${API_BASE}/Patient/Update`, async ({ request }) => {
    const body = await request.json() as PatientDetails;
    return HttpResponse.json({
      success: true,
      data: body,
    });
  }),

  http.post(`${API_BASE}/Patient/UpdateStatus`, async ({ request }) => {
    const body = await request.json() as PatientDetails;
    return HttpResponse.json({
      success: true,
      data: body,
    });
  }),

  // OTP endpoints
  http.post(`${API_BASE}/Otp/send`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.post(`${API_BASE}/Otp/verify`, () => {
    return HttpResponse.json({
      success: true,
      data: { verified: true },
    });
  }),

  // Inventory endpoints
  http.get(`${API_BASE}/Inventory/GetInventoryList`, () => {
    return HttpResponse.json({
      success: true,
      data: mockInventory,
    });
  }),

  http.post(`${API_BASE}/Inventory/save`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true });
  }),

  // User endpoints
  http.post(`${API_BASE}/User/CreateUser`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: body,
    });
  }),
];
