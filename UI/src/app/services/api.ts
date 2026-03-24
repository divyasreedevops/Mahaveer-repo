const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || errorData.error || response.statusText || 'API request failed';
    const errorDetails = errorData.details ? `: ${errorData.details}` : '';
    throw new Error(`${errorMessage}${errorDetails}`);
  }

  return response.json();
}

export const api = {
  login: {
    admin: (data: any) => apiFetch<any>('/Login/admin', { method: 'POST', body: JSON.stringify(data) }),
    logout: () => apiFetch<any>('/Login/logout', { method: 'POST' }),
  },
  patient: {
    register: (mobileNumber: string, email?: string) => apiFetch<any>('/Patient/Register', { method: 'POST', body: JSON.stringify({ mobileNumber, email: email || '' }) }),
    login: (data: any) => apiFetch<any>('/Patient/Login', { method: 'POST', body: JSON.stringify(data) }),
    getByMobile: (mobile: string) => apiFetch<any>(`/Patient/GetPatientByMobileNumber?mobile=${mobile}`),
    getByStatus: (regstatus?: string, kycstatus?: string) => {
      const params = new URLSearchParams();
      if (regstatus) params.append('regstatus', regstatus);
      if (kycstatus) params.append('kycstatus', kycstatus);
      return apiFetch<any[]>(`/Patient/GetPatientsByStatus?${params.toString()}`);
    },
    saveInfo: (formData: FormData) => apiFetch<any>('/Patient/SavePatientInfo', { method: 'POST', body: formData }),
    updatePatients: (formData: FormData) => apiFetch<any>('/Patient/Update-patients', { method: 'POST', body: formData }),
  },
  admin: {
    approveKyc: (data: any) => apiFetch<any>('/Admin/ApproveKyc', { method: 'POST', body: JSON.stringify(data) }),
    updateRegStatus: (data: any) => apiFetch<any>('/Admin/UpdateRegistrationStatus', { method: 'POST', body: JSON.stringify(data) }),
  },
  prescription: {
    upload: (formData: FormData) => apiFetch<any>('/api/Prescription/uploadPrescription', { method: 'POST', body: formData }),
    save: (data: any) => apiFetch<any>('/api/Prescription/SavePrescription', { method: 'POST', body: JSON.stringify(data) }),
    approve: (data: any) => apiFetch<any>('/api/Prescription/ApprovePrescription', { method: 'POST', body: JSON.stringify(data) }),
    reject: (data: any) => apiFetch<any>('/api/Prescription/RejectPrescription', { method: 'POST', body: JSON.stringify(data) }),
    getByStatus: (status?: string) => apiFetch<any[]>(`/api/Prescription/GetPrescriptionsByStatus${status ? `?PrescriptionStatus=${status}` : ''}`),
    getByPatientId: (patientId: string) => apiFetch<any[]>(`/api/Prescription/GetPrescriptionsByPatientId?patientId=${encodeURIComponent(patientId)}`),
    markCollected: (prescriptionId: number) => apiFetch<any>(`/api/Prescription/MarkPrescriptionCollected?PrescriptionId=${prescriptionId}`, { method: 'POST' }),
  },
  appointment: {
    getAvailableSlots: (date: string) => apiFetch<any[]>(`/api/AppointmentSlot/GetAvailableSlots?date=${date}`),
    bookSlot: (data: any) => apiFetch<any>('/api/AppointmentSlot/BookSlot', { method: 'POST', body: JSON.stringify(data) }),
    getSlot: (patientId: string, prescriptionId: number) => apiFetch<any>(`/api/AppointmentSlot/GetSlotByPatientAndPrescription?patientId=${patientId}&prescriptionId=${prescriptionId}`),
    reschedule: (data: any) => apiFetch<any>('/api/AppointmentSlot/RescheduleSlot', { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    getList: () => apiFetch<any[]>('/Inventory/GetInventoryList'),
    save: (items: any[]) => apiFetch<any>('/Inventory/save', { method: 'POST', body: JSON.stringify(items) }),
    delete: (inventoryId: number, userId: number) => apiFetch<any>(`/Inventory?inventoryId=${inventoryId}&userId=${userId}`, { method: 'DELETE' }),
  },
  invoice: {
    generate: (patientId: string, prescriptionKey: number, id: number) => 
      apiFetch<any>('/api/Invoice/GenerateInvoice', { method: 'POST', body: JSON.stringify({ patientId, prescriptionKey, id }) }),
    getByPatient: (patientId: number) => 
      apiFetch<any[]>(`/api/Invoice/GetInvoicesByPatient?patientId=${patientId}`),
    getInvoice: (patientId: number, prescriptionId: number) => 
      apiFetch<any>(`/api/Invoice/GetInvoice?patientId=${patientId}&prescriptionId=${prescriptionId}`),
    updateStatus: (invoiceNumber: string, prescriptionId: number) => 
      apiFetch<any>(`/api/Invoice/UpdateInvoiceStatus?InvoiceNumber=${invoiceNumber}&PrescriptionId=${prescriptionId}`, { method: 'POST' }),
  },
  payment: {
    getKey: () => apiFetch<any>('/Payment/key'),
    createOrder: (data: any) => apiFetch<any>('/Payment/create-order', { method: 'POST', body: JSON.stringify(data) }),
    verify: (data: any) => apiFetch<any>('/Payment/verify', { method: 'POST', body: JSON.stringify(data) }),
  },
  common: {
    getIncomeLevels: () => apiFetch<any[]>('/Common/GetIncomeLevels'),
  }
};
