import React, { useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { toast } from 'sonner';
import {
  AppContext,
  AppContextType,
  Medicine,
  InvoiceItem,
  Invoice,
  PickupStatus,
  Pickup,
  PrescriptionApprovalStatus,
  Prescription,
  Patient,
} from './AppContextDef';

// Re-export types so existing imports from 'AppContext' keep working
export type {
  AppContextType,
  Medicine,
  InvoiceItem,
  Invoice,
  PickupStatus,
  Pickup,
  PrescriptionApprovalStatus,
  Prescription,
  Patient,
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// ─── Mapping helpers ─────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function mapKycStatus(s: string): 'pending' | 'approved' | 'rejected' {
  const lower = (s || '').toLowerCase();
  if (lower === 'approved' || lower === 'completed') return 'approved';
  if (lower === 'rejected') return 'rejected';
  // Handle 'submitted', 'pending', or any other status as 'pending'
  return 'pending';
}

function mapApiPatientToFrontend(p: any): Patient {
  return {
    id: String(p.id || 0),
    patientId: p.patientId || `TEMP-${p.mobileNumber || p.mobile}`,
    mobile: p.mobileNumber || p.mobile || '',
    email: p.email || null,
    name: p.fullName || p.name || '',
    dateOfBirth: p.dob || p.dateOfBirth || '',
    aadhaarNumber: p.aadharNumber || p.aadhaarNumber || null,
    incomeDocumentUrl: p.kycDocumentUrl || p.incomeDocumentUrl || null,
    incomeLevel: null,
    discountPercentage: p.discountPercentage || 0,
    kycStatus: mapKycStatus(p.kycStatus),
    kycRejectionReason: p.kycRejectionReason || null,
    registrationStatus: p.registrationStatus || '',
    registrationDate: p.registrationDate || new Date().toISOString(),
    prescriptions: [],
  };
}

function mapApiPrescriptionToFrontend(apiPresc: any, slot?: any): Prescription {
  const statusRaw = (apiPresc.status || apiPresc.prescriptionStatus || 'PENDING').toUpperCase();
  const approvalStatus: PrescriptionApprovalStatus =
    statusRaw === 'APPROVED' || statusRaw === 'PROCESSED' || statusRaw === 'RECEIVED' ? 'approved' :
    statusRaw === 'REJECTED' ? 'rejected' : 'pending';

  const pickups: Pickup[] = [];
  if (approvalStatus === 'approved') {
    if (statusRaw === 'RECEIVED') {
      // Prescription fully collected — final state
      pickups.push({
        id: slot ? String(slot.id || slot.bookingId || `pickup-${apiPresc.id || apiPresc.prescriptionId}`) : `pickup-${apiPresc.id || apiPresc.prescriptionId}`,
        status: 'collected',
        slotDate: slot?.slotDate ? slot.slotDate.split('T')[0] : null,
        slotTime: slot?.slotTime || null,
        bookedAt: slot?.createdAt || null,
        invoice: null,
        itemReceived: true,
        paymentMethod: null,
      });
    } else if (slot) {
      pickups.push({
        id: String(slot.id || slot.bookingId || `pickup-${apiPresc.id || apiPresc.prescriptionId}`),
        status: 'slot_booked',
        slotDate: slot.slotDate ? slot.slotDate.split('T')[0] : null,
        slotTime: slot.slotTime || null,
        bookedAt: slot.createdAt || new Date().toISOString(),
        invoice: null,
        itemReceived: false,
        paymentMethod: null,
      });
    } else {
      pickups.push({
        id: `pickup-${apiPresc.id || apiPresc.prescriptionId}`,
        status: 'slot_available',
        slotDate: null,
        slotTime: null,
        bookedAt: null,
        invoice: null,
        itemReceived: false,
        paymentMethod: null,
      });
    }
  }

  let expiryDate: string | null = null;
  if (apiPresc.approvedDate) {
    expiryDate = addMonths(new Date(apiPresc.approvedDate), 6).toISOString();
  }

  return {
    id: String(apiPresc.id || apiPresc.prescriptionId),
    uploadDate: apiPresc.uploadDate || new Date().toISOString(),
    prescriptionUrl: apiPresc.prescriptionKey
      ? `${BASE_URL}/${apiPresc.prescriptionKey}`
      : (apiPresc.prescriptionUrl || ''),
    doctorName: apiPresc.doctorName || '',
    hospitalName: apiPresc.hospitalName || '',
    approvalStatus,
    rejectionReason: apiPresc.rejectionReason || null,
    approvedDate: apiPresc.approvedDate || null,
    expiryDate,
    pickups,
    missingMedicines: [],
    processingStatus: apiPresc.processingStatus || apiPresc.processing_status || 'NOT_PROCESSED',
  };
}

function mapApiMedicineToFrontend(m: any): Medicine {
  return {
    id: String(m.id),
    name: m.name || '',
    genericName: m.genericName || m.name || '',
    type: m.type || 'tablet',
    dosage: m.dosage || '',
    quantityValue: typeof m.quantityValue === 'string' ? m.quantityValue : String(m.quantityValue || ''),
    packingInfo: m.packingInfo || '',
    disease: m.disease || '',
    price: m.price || 0,
    discount: m.discount || undefined,
    substitutes: m.substitutes || undefined,
    stockQuantity: typeof m.stockQuantity === 'number' ? m.stockQuantity : Number(m.quantityValue) || 0,
  };
}

function mapMedicineToApi(m: any, id: number = 0): any {
  return {
    id,
    name: m.name,
    genericName: m.genericName,
    type: m.type,
    dosage: m.dosage,
    quantityValue: m.quantityValue,
    packingInfo: m.packingInfo,
    disease: m.disease,
    price: m.price,
    discount: m.discount || 0,
    stockQuantity: m.stockQuantity,
    substitutes: m.substitutes || [],
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<'patient' | 'admin' | null>(() =>
    (localStorage.getItem('userType') as 'patient' | 'admin' | null) || null
  );
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(() => {
    try {
      const saved = localStorage.getItem('currentPatient');
      if (!saved) return null;
      const p: Patient = JSON.parse(saved);
      return p;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(false);
  const [navigationTrigger, setNavigationTrigger] = useState(0);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const pendingMobileRef = useRef<string | null>(null);
  const pendingEmailRef = useRef<string | null>(null);

  // Load medicines from API on mount — admin portal only
  useEffect(() => {
    if (userType === 'admin') {
      api.inventory.getList()
        .then(items => setMedicines((items || []).map(mapApiMedicineToFrontend)))
        .catch(() => {});
    }
  }, [userType]);

  // On mount, refresh patient core status fields from API to fix any stale localStorage data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (userType === 'patient' && currentPatient?.mobile && token) {
      api.patient.getByMobile(currentPatient.mobile)
        .then(fresh => {
          if (!fresh) return;
          const updated: Patient = {
            ...currentPatient,
            name: fresh.fullName || fresh.name || currentPatient.name,
            kycStatus: mapKycStatus(fresh.kycStatus),
            registrationStatus: fresh.registrationStatus || currentPatient.registrationStatus,
            discountPercentage: fresh.discountPercentage ?? currentPatient.discountPercentage,
            aadhaarNumber: fresh.aadharNumber || fresh.aadhaarNumber || currentPatient.aadhaarNumber,
            incomeDocumentUrl: fresh.kycDocumentUrl || fresh.incomeDocumentUrl || currentPatient.incomeDocumentUrl,
          };
          setCurrentPatient(updated);
          localStorage.setItem('currentPatient', JSON.stringify(updated));
        })
        .catch(() => {}); // silently use cached data if API fails
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshPatientData = async (): Promise<void> => {
    const patient = currentPatient;
    if (!patient?.patientId || !localStorage.getItem('token')) return;
    try {
      const prescriptions = await api.prescription.getByPatientId(patient.patientId);

      // Load all invoices for this patient
      let invoiceList: any[] = [];
      try {
        invoiceList = await api.invoice.getByPatient(parseInt(patient.id)) || [];
      } catch { /* no invoices yet */ }

      // Build a map of prescriptionId → invoice summary (status)
      const invoiceMap = new Map<number, any>();
      for (const inv of invoiceList) {
        invoiceMap.set(inv.prescriptionId, inv);
      }

      const mapped = await Promise.all(
        (prescriptions || []).map(async (p: any) => {
          let slot = null;
          const prescId = p.id || p.prescriptionId;
          const statusRaw = (p.status || p.prescriptionStatus || '').toUpperCase();
          const isApproved = statusRaw === 'APPROVED' || statusRaw === 'PROCESSED' || statusRaw === 'RECEIVED';
          if (isApproved) {
            try { slot = await api.appointment.getSlot(patient.patientId, prescId); } catch {}
          }
          const presc = mapApiPrescriptionToFrontend(p, slot);

          // If there's an invoice for this prescription, load full details and attach to pickup
          const invoiceSummary = invoiceMap.get(prescId);
          if (invoiceSummary && presc.pickups.length > 0) {
            try {
              const invoiceRes = await api.invoice.getInvoice(parseInt(patient.id), prescId);
              if (invoiceRes.invoiceExists && invoiceRes.invoice) {
                const inv = invoiceRes.invoice;
                const invoice: Invoice = {
                  invoiceNumber: inv.invoiceNumber || invoiceSummary.invoiceNumber,
                  prescriptionId: inv.prescriptionId,
                  patientId: inv.patientId,
                  items: (inv.items || []).map((item: any) => ({
                    medicineName: item.medicineName || '',
                    inventoryId: item.inventoryId ?? null,
                    mrp: item.mrp || 0,
                    discount: item.discount || 0,
                    finalPrice: item.finalPrice || 0,
                    isAvailable: item.isAvailable ?? true,
                  })),
                  subtotal: inv.subtotal || 0,
                  totalDiscount: inv.totalDiscount || 0,
                  totalAmount: inv.totalAmount || invoiceSummary.totalAmount || 0,
                  generatedDate: inv.generatedDate,
                };
                presc.pickups[0].invoice = invoice;
                // If invoice is already paid, preserve slot_booked if a slot was loaded,
                // otherwise mark as slot_available so the patient can book a slot.
                if ((invoiceSummary.status || '').toUpperCase() === 'PAID') {
                  presc.pickups[0].paymentMethod = 'online';
                  if (presc.pickups[0].status !== 'slot_booked' && presc.pickups[0].status !== 'collected') {
                    presc.pickups[0].status = 'slot_available';
                  }
                } else {
                  presc.pickups[0].status = 'invoice_ready';
                }
              }
            } catch { /* couldn't load full invoice, that's ok */ }
          }

          return presc;
        })
      );
      const updated = { ...patient, prescriptions: mapped };
      setCurrentPatient(updated);
      localStorage.setItem('currentPatient', JSON.stringify(updated));
    } catch { /* silently fail */ }
  };

  // Load prescription data when patient logs in
  useEffect(() => {
    if (userType === 'patient' && currentPatient?.patientId && localStorage.getItem('token')) {
      refreshPatientData();
    }
  }, [userType]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth ─────────────────────────────────────────────────────────────────

  const registerPatient = async (mobile: string, email?: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.patient.register(mobile, email);
      pendingMobileRef.current = mobile;
      pendingEmailRef.current = email || '';
      toast.success(`OTP sent to ${mobile}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (otp: string): Promise<boolean> => {
    const mobile = pendingMobileRef.current;
    const email = pendingEmailRef.current;
    if (!mobile) { toast.error('Session expired. Please enter your mobile again.'); return false; }
    setIsLoading(true);
    try {
      const res = await api.patient.login({ mobileNumber: mobile, otp, email: email || '' });
      if (res.isAuthenticated && res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('userType', 'patient');
        
        let patient = mapApiPatientToFrontend(res.patient);
        try {
          // Fetch full patient record to get kycDocumentUrl and other details
          const fetched = await api.patient.getByMobile(mobile);
          if (fetched) {
            patient = mapApiPatientToFrontend(fetched);
          }
        } catch (fetchErr) {
          console.error('Failed to fetch full patient details', fetchErr);
        }

        setCurrentPatient(patient);
        localStorage.setItem('currentPatient', JSON.stringify(patient));
        setIsAuthenticated(true);
        setUserType('patient');
        toast.success(`Welcome back, ${patient.name || 'Patient'}!`);
        return true;
      } else if (res.patientId) {
        // New patient — try to fetch their DB record
        let patient: Patient;
        try {
          const fetched = await api.patient.getByMobile(mobile);
          patient = mapApiPatientToFrontend(fetched);
        } catch {
          patient = { id: '0', patientId: res.patientId, mobile, email: null, name: '', dateOfBirth: '', aadhaarNumber: null, incomeDocumentUrl: null, incomeLevel: null, discountPercentage: 0, kycStatus: 'pending', kycRejectionReason: null, registrationStatus: '', registrationDate: new Date().toISOString(), prescriptions: [] };
        }
        localStorage.setItem('userType', 'patient');
        localStorage.setItem('currentPatient', JSON.stringify(patient));
        setCurrentPatient(patient);
        setIsAuthenticated(true);
        setUserType('patient');
        toast.success('Registration successful! Please complete your profile.');
        return true;
      } else if (res.isValid === false || (res.message || '').toLowerCase().includes('invalid')) {
        toast.error('Invalid OTP. Please try again.');
        return false;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify OTP');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.login.admin({ username, password });
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('userType', 'admin');
        if (res.user) localStorage.setItem('adminUser', JSON.stringify(res.user));
        setIsAuthenticated(true);
        setUserType('admin');
        toast.success('Login successful!');
        return true;
      }
      toast.error(res.message || 'Login failed');
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Invalid credentials');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('currentPatient');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setUserType(null);
    setCurrentPatient(null);
    setAllPatients([]);
    api.login.logout().catch(() => {});
  };

  const navigateToLanding = () => { setNavigationTrigger(prev => prev + 1); logout(); };

  // ─── Patient ───────────────────────────────────────────────────────────────

  const submitKYC = async (name: string, dob: string, aadhaar: string, file: File): Promise<void> => {
    if (!currentPatient) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', name);
      formData.append('aadharNumber', aadhaar.replace(/\s/g, ''));
      formData.append('mobileNumber', currentPatient.mobile);
      if (currentPatient.email) formData.append('email', currentPatient.email);
      if (dob) formData.append('dob', dob);
      if (file && file.size > 0) formData.append('kycDocument', file);
      if (currentPatient.id && currentPatient.id !== '0') formData.append('id', currentPatient.id);
      if (currentPatient.patientId) formData.append('patientId', currentPatient.patientId);

      await api.patient.saveInfo(formData);
      const updated: Patient = { ...currentPatient, name, dateOfBirth: dob, aadhaarNumber: aadhaar, incomeDocumentUrl: 'kyc-submitted' };
      setCurrentPatient(updated);
      localStorage.setItem('currentPatient', JSON.stringify(updated));
      toast.success('KYC submitted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save details');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPrescription = async (file: File, doctorName: string, hospitalName: string): Promise<void> => {
    if (!currentPatient) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', currentPatient.patientId);
      formData.append('id', currentPatient.id);

      const uploadRes = await api.prescription.upload(formData);

      await api.prescription.save({
        prescriptionKey: uploadRes.prescriptionKey || '',
        patientId: currentPatient.patientId,
        pId: parseInt(currentPatient.id) || 0,
        doctorName,
        hospitalName,
        medicines: uploadRes.medicines?.length > 0 ? uploadRes.medicines : [{ name: 'Unknown', dosage: '', frequency: '' }],
      });

      toast.success('Prescription uploaded! Awaiting admin review.');
      await refreshPatientData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload prescription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Slot booking ──────────────────────────────────────────────────────────

  const bookPickupSlot = async (patientId: string, prescriptionId: string, _pickupId: string, date: string, time: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.appointment.bookSlot({ patientId, prescriptionId: parseInt(prescriptionId), slotDate: `${date}T00:00:00`, slotTime: time });
      toast.success('Slot booked successfully!');
      await refreshPatientData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to book slot');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reschedulePickup = async (patientId: string, prescriptionId: string, pickupId: string, newDate: string, newTime: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.appointment.reschedule({ bookingId: parseInt(pickupId), patientId, prescriptionId: parseInt(prescriptionId), slotDate: `${newDate}T00:00:00`, slotTime: newTime });
      toast.success('Slot rescheduled!');
      await refreshPatientData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reschedule');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getBookedSlots = () => (currentPatient?.prescriptions || []).flatMap(pr =>
    pr.pickups.filter(pk => pk.slotDate && pk.slotTime && pk.status === 'slot_booked').map(pk => `${pk.slotDate}|${pk.slotTime}`)
  );

  const checkPickupExpiry = (_patientId: string) => {};

  // ─── Admin prescription & KYC ──────────────────────────────────────────────

  const approvePatientKYC = async (patientId: string, incomeLevel: string, discountPercentage: number): Promise<void> => {
    const patient = allPatients.find(p => p.patientId === patientId);
    const dbId = patient ? parseInt(patient.id) : 0;
    if (!dbId) { toast.error('Patient DB ID not found'); return; }
    setIsLoading(true);
    try {
      await api.admin.approveKyc({ id: dbId, incomeLevel });
      await api.admin.updateRegStatus({ id: dbId, patientId, registrationStatus: 'Approved' });
      setAllPatients(prev => prev.map(p => p.patientId === patientId ? { ...p, kycStatus: 'approved' as const, kycRejectionReason: null } : p));
      toast.success('KYC approved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve KYC');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectPatientKYC = async (patientId: string, reason: string): Promise<void> => {
    const patient = allPatients.find(p => p.patientId === patientId);
    const dbId = patient ? parseInt(patient.id) : 0;
    if (!dbId) { toast.error('Patient DB ID not found'); return; }
    setIsLoading(true);
    try {
      await api.admin.updateRegStatus({ id: dbId, patientId, registrationStatus: 'Rejected' });
      setAllPatients(prev => prev.map(p => p.patientId === patientId ? { ...p, kycStatus: 'rejected' as const, kycRejectionReason: reason } : p));
      toast.success('KYC rejected.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject KYC');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const approvePrescription = async (patientId: string, prescriptionId: string): Promise<void> => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    setIsLoading(true);
    try {
      await api.prescription.approve({ prescriptionId: parseInt(prescriptionId), approvedBy: adminUser.username || 'Admin', remarks: '' });
      toast.success('Prescription approved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const rejectPrescription = async (patientId: string, prescriptionId: string, reason: string): Promise<void> => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    setIsLoading(true);
    try {
      await api.prescription.reject({ prescriptionId: parseInt(prescriptionId), rejectedBy: adminUser.username || 'Admin', reason });
      toast.success('Prescription rejected.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const notifyMissingMedicine = (_p: string, _pr: string, _m: string[]) => { toast.info('Patient notified about missing medicines.'); };
  const initiatePayment = (_p: string, _pr: string, _pk: string, _method: string) => {};
  const confirmPayment = (_p: string, _pr: string, _pk: string) => {};

  const patientConfirmCollection = async (patientId: string, prescriptionId: string, _pickupId: string) => {
    if (!currentPatient) return;
    try {
      await api.prescription.markCollected(parseInt(prescriptionId));
      toast.success('Collection confirmed! Your prescription has been marked as received.');
      await refreshPatientData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm collection. Please try again.');
    }
  };

  const markPickupCollected = (_p: string, _pr: string, _pk: string) => { toast.success('Marked as collected.'); };

  // ─── Inventory ─────────────────────────────────────────────────────────────

  const addMedicine = async (med: Omit<Medicine, 'id'>): Promise<void> => {
    setIsLoading(true);
    try {
      await api.inventory.save([mapMedicineToApi(med, 0)]);
      const updated = await api.inventory.getList();
      setMedicines((updated || []).map(mapApiMedicineToFrontend));
      toast.success('Medicine added!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add medicine');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMedicine = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
      await api.inventory.delete(parseInt(id), adminUser.id || 1);
      setMedicines(prev => prev.filter(m => m.id !== id));
      toast.success('Medicine removed.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMedicine = async (id: string, updates: Partial<Medicine>): Promise<void> => {
    setIsLoading(true);
    try {
      const existing = medicines.find(m => m.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      await api.inventory.save([mapMedicineToApi(merged, parseInt(id))]);
      setMedicines(prev => prev.map(m => m.id === id ? merged : m));
      toast.success('Medicine updated.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AppContextType = {
    userType, currentPatient, isAuthenticated, isLoading, navigateToLanding, navigationTrigger,
    registerPatient, verifyOTP, logout, submitKYC, uploadPrescription,
    bookPickupSlot, reschedulePickup, getBookedSlots, checkPickupExpiry,
    adminLogin, approvePatientKYC, rejectPatientKYC, approvePrescription, rejectPrescription,
    notifyMissingMedicine, initiatePayment, confirmPayment, patientConfirmCollection, markPickupCollected,
    addMedicine, removeMedicine, updateMedicine,
    allPatients, medicines, refreshPatientData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function getActivePrescription(patient: Patient): Prescription | null {
  const active = patient.prescriptions.filter(p => p.approvalStatus === 'approved' && p.expiryDate && new Date(p.expiryDate) > new Date() && p.pickups.some(pickup => !pickup.itemReceived));
  return active.length > 0 ? active[0] : null;
}
