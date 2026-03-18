# Mahaveer Pharmacy App - Complete Workflow Guide

## Overview
This document maps the complete patient and admin workflows, including status types, approval processes, and appointment management.

---

## 1. PATIENT'S JOURNEY

### Phase 1: Authentication & Registration
**Location:** `PatientLogin.tsx`, `PatientRegistration.tsx`

#### Login Flow (Existing Patients)
1. **Mobile Verification**: Patient enters 10-digit mobile number
   - Backend: `POST /Patient/Login`
   - OTP sent to mobile number

2. **OTP Verification**: Patient enters 6-digit OTP
   - Backend: `POST /Patient/verifyOTP` (via context)
   - Success → Redirects to `/patient/dashboard`

#### Registration Flow (New Patients)
1. **Mobile Registration**: New patients enter mobile + optional email
   - Backend: `POST /Patient/Register`
   - OTP sent to mobile

2. **OTP Verification**: Verify OTP (demo: use 123456)
3. **Complete Setup**: Redirects to patient details form

---

### Phase 2: KYC (Know Your Customer) Verification
**Location:** `PatientDetailsForm.tsx`, `PatientDashboard.tsx`

#### Required Information
- **Full Name**: String
- **Date of Birth**: Date (YYYY-MM-DD)
- **Aadhaar Number**: 12-digit unique identifier (auto-formatted with spaces)
- **Income Document**: PDF/JPG/PNG file upload

#### KYC Status Flow
1. **Pending**: Documents submitted, awaiting admin review
   - Dashboard shows: "KYC Review in Progress"
   - Patient cannot upload prescriptions yet
   - Can view patient ID and submission status

2. **Approved**: Admin approves with discount percentage
   - Unlocks prescription upload
   - Discount applied to invoice

3. **Rejected**: Admin rejects with specific reason
   - Shows rejection reason to patient
   - Option to resubmit documents

#### Backend Endpoints
- **Submit KYC**: `POST /Patient/SavePatientInfo` (FormData)
- **Admin Approve**: `POST /Admin/ApproveKyc` 
  - Params: `patientId`, `incomeLevel`, `discountPercentage`
- **Admin Reject**: (via context method)

---

### Phase 3: Prescription Upload & Approval
**Location:** `PrescriptionUploadForm.tsx`, `PatientDashboard.tsx`

#### Upload Process
1. Patient selects prescription file (PDF/JPG/PNG, max 10MB)
2. Enters **Prescribing Doctor Name** and **Hospital/Clinic Name**
3. Submits for admin review
   - Backend: `POST /api/Prescription/uploadPrescription` (FormData)
   - Backend: `POST /api/Prescription/SavePrescription` (metadata)

#### Prescription Status Types
All defined in `AppContextDef.ts`:

```typescript
type PrescriptionApprovalStatus = 'pending' | 'approved' | 'rejected';
```

| Status | Description | Patient Actions |
|--------|-------------|-----------------|
| **PENDING** | Waiting for admin review | View uploaded prescription, track status |
| **APPROVED** | Admin reviewed and approved | Can proceed to slot booking |
| **REJECTED** | Admin rejected (illegible, expired, etc.) | View rejection reason, upload new prescription |
| **PROCESSED** | Pickup completed, delivery finished | View order history |

#### Admin Approval Endpoints
- **Approve**: `POST /api/Prescription/ApprovePrescription`
  - Params: `prescriptionId`, `approvedBy`, `remarks`
- **Reject**: `POST /api/Prescription/RejectPrescription`
  - Params: `prescriptionId`, `rejectedBy`, `reason`
- **Fetch Pending**: `GET /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=PENDING`

---

### Phase 4: Invoice Generation & Payment
**Location:** `InvoiceView.tsx`, `InvoicePaymentModal.tsx`

#### Invoice Creation
- Triggered after prescription approval
- Backend: `POST /api/Invoice/GenerateInvoice`
  - Includes: patient details, prescribed medicines, discounts
  - Shows: subtotal, taxes, discount, grand total

#### Payment Processing
1. **Initiate Payment**:
   - Backend: `POST /Payment/create-order` (Razorpay integration)
   - Returns: order ID, amount

2. **Verify Payment**:
   - Backend: `POST /api/Invoice/UpdateInvoiceStatus`
   - Changes pickup status from `payment_pending` → `slot_available`

#### Pickup Status Progression

```typescript
type PickupStatus =
  | 'invoice_ready'        // Invoice generated, ready for payment
  | 'payment_pending'      // Awaiting payment confirmation
  | 'slot_available'       // Payment received, can book slot
  | 'slot_booked'          // Patient selected date/time
  | 'collection_confirmed' // Pickup confirmed by pharmacy
  | 'collected'            // Patient received medicines
  | 'missing_medicine'     // Some medicines unavailable
  | 'expired'              // Prescription expired
```

---

### Phase 5: Slot Booking & Appointment
**Location:** `SlotBookingModal.tsx`, `SlotBooking.tsx`

#### Availability Window
- **Next 14 days** from tomorrow
- Respects **prescription expiry date** (cannot book beyond)
- Operating Hours:
  - **Morning**: 10:00 - 12:30 (30-min intervals)
  - **Afternoon**: 14:00 - 17:30 (30-min intervals)
  - **Lunch Break**: 13:00 - 13:30 (closed)

#### Slot Booking Process
1. Patient selects **Date** and **Time**
   - Already-booked slots shown as unavailable (grayed out)
   - Maximum 5 patients per slot

2. System calls: `POST /api/AppointmentSlot/BookSlot`
   - Params: `patientId`, `prescriptionId`, `slotDate` (ISO), `slotTime`
   - Response: `bookingId`, `remainingSlots`

3. Confirmation shows:
   - Registration ID (Patient ID)
   - Pickup Date & Time
   - Status badge

#### Slot Availability Check
- Backend: `GET /api/AppointmentSlot/GetAvailableSlots?date=YYYY-MM-DD`
- Response includes: `isAvailable`, `bookedCount`, `maxPersons`, `remainingSlots`

#### Reschedule
- Patient can reschedule booked slots (before appointment date)
- Backend: `POST /api/AppointmentSlot/RescheduleSlot`
- Params: `bookingId`, `patientId`, `prescriptionId`, `slotDate`, `slotTime`

---

### Phase 6: Collection & Completion
**Location:** `SlotBooking.tsx`

#### Before Pickup
- Patient sees assigned slot with **Date**, **Time**, and **Registration ID**
- Can reschedule if needed

#### At Pharmacy
1. Patient arrives at assigned time
2. Pharmacy staff confirms collection (internal process)
3. Patient may be notified of missing medicines (if applicable)

#### Mark Item Received
- Patient clicks "Mark Item as Received"
- Pickup status: `collected`
- Order appears in **Order History** with:
  - Prescription image
  - Doctor/Hospital info
  - Invoice number (clickable to download)
  - Collection date

---

## 2. ADMIN'S JOURNEY

### Admin Dashboard Tabs
**Location:** `AdminDashboard.tsx`

```
┌─ KYC Approvals ────────────────────────┐
│ • Review patient documents              │
│ • Approve: set income level, discount % │
│ • Reject: provide reason               │
└────────────────────────────────────────┘

┌─ Prescriptions ────────────────────────┐
│ • View pending prescriptions            │
│ • Approve/Reject                        │
│ • Notify re: missing medicines          │
└────────────────────────────────────────┘

┌─ Patients ─────────────────────────────┐
│ • View all registered patients          │
│ • Monitor KYC & registration status     │
│ • See discount percentages              │
└────────────────────────────────────────┘

┌─ Inventory ────────────────────────────┐
│ • Add/remove medicines                  │
│ • See: name, type, dosage, MRP, discount│
│ • Set global price discounts            │
└────────────────────────────────────────┘
```

---

### Task 1: KYC Approvals
**Location:** `ApprovalsList.tsx`

#### Approve Patient
1. Admin reviews patient documents
   - Name, DOB, Aadhaar, income document
2. Sets **Income Level**: `low`, `medium`, `high`
3. Sets **Discount Percentage**: 0-100% (applied to all invoices)
4. Clicks "Approve"
   - Backend: `POST /Admin/ApproveKyc`
   - Patient unlocked for prescription uploads

#### Reject Patient
1. Admin reviews rejection reason
2. Clicks "Reject"
3. Provides reason (patient sees this)
   - Backend: Updates KYC status to `rejected`

#### Statuses
| Patient Status | Admin Can... |
|---|---|
| KYC Pending | Approve / Reject |
| KYC Approved | View only |
| KYC Rejected | Patient can resubmit |

---

### Task 2: Prescription Approvals
**Location:** `PrescriptionApprovalsList.tsx`

#### Workflow
1. **Pending Prescriptions Tab**
   - Fetch: `GET /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=PENDING`
   - Shows: Patient name, doctor, hospital, upload date, prescription image

2. **Approve Prescription**
   - Backend: `POST /api/Prescription/ApprovePrescription`
   - Params: `prescriptionId`, `approvedBy`, `remarks`
   - Status: PENDING → APPROVED
   - Patient can now generate invoice

3. **Reject Prescription**
   - Backend: `POST /api/Prescription/RejectPrescription`
   - Params: `prescriptionId`, `rejectedBy`, `reason` (required)
   - Status: PENDING → REJECTED
   - Patient notified

4. **Notify Missing Medicine**
   - If some medicines unavailable:
   - Select medicines from list
   - Patient notified to adjust prescription
   - Pickup status: `missing_medicine`

#### Prescription Statuses (API)
- `PENDING` - Awaiting review
- `APPROVED` - Approved by admin
- `REJECTED` - Rejected by admin
- `PROCESSED` - Order completed

---

### Task 3: Patient Management
**Location:** `PatientList.tsx`

#### Patient List View
Shows all registered patients:
- Patient ID
- Full Name
- Mobile Number
- Registration Date
- KYC Status badge (Pending/Approved/Rejected)
- Discount Percentage
- Registration Status

#### Filters Available
- By KYC status: `pending`, `approved`, `rejected`
- By registration status: `active`, `inactive`

#### Backend Endpoint
- `GET /Patient/GetPatientsByStatus?regstatus=&kycstatus=`

---

### Task 4: Inventory Management
**Location:** `InventoryManagement.tsx`

#### Medicine Data Structure
```typescript
{
  id: number,
  name: string,
  type: 'tablet' | 'capsule' | 'injection' | 'syrup',
  disease: string,
  dosageValue: number,
  dosageUnits: 'mg' | 'ml',
  quantityValue: number,
  quantityUnits: 'strip' | 'ml',
  mrp: { source: string, parsedValue: number },
  discount: { source: string, parsedValue: number },
  finalPrice: { source: string, parsedValue: number },
  createdBy: string,
  createdDate: timestamp,
  updatedDate: timestamp,
  updatedBy: string,
  status: 'active' | 'inactive'
}
```

#### Admin Operations

**1. Add Medicine**
- Form fields:
  - Medicine name
  - Type dropdown (tablet/capsule/injection/syrup)
  - Dosage value & units (mg/ml)
  - Quantity & units
  - Disease
  - MRP (Maximum Retail Price)
  - Discount amount
- Backend: `POST /Inventory/save`
- Validator: Discount cannot exceed MRP

**2. Remove Medicine**
- Backend: `DELETE /Inventory?inventoryId={id}&userId={userId}`

**3. Set Discount**
- Can set discount as percentage or fixed amount
- Capped at MRP
- Applied to patient invoices
- Backend: `POST /Inventory/save`

**4. Bulk Upload** (Optional)
- Upload CSV with medicines
- System parses and creates inventory

#### Inventory Endpoints
- **Get List**: `GET /Inventory/GetInventoryList`
- **Save**: `POST /Inventory/save`
- **Delete**: `DELETE /Inventory`

---

## 3. STATUS TYPES & ENUMERATIONS

### Patient KYC Status
```typescript
kycStatus: 'pending' | 'approved' | 'rejected'
```
- **Pending**: Documents submitted, under review
- **Approved**: Verified, discount assigned
- **Rejected**: Not verified, can resubmit

### Prescription Status
```typescript
approvalStatus: 'pending' | 'approved' | 'rejected'
```
- **Pending**: Awaiting admin review
- **Approved**: Ready for invoice generation
- **Rejected**: Resubmit with new prescription

### Pickup Status
```typescript
status: 
  | 'invoice_ready'        
  | 'payment_pending'      
  | 'slot_available'       
  | 'slot_booked'          
  | 'collection_confirmed' 
  | 'collected'            
  | 'missing_medicine'     
  | 'expired'              
```

**Flow Progression:**
```
invoice_ready → payment_pending → slot_available → slot_booked → collection_confirmed → collected
                                                      ↓
                                               missing_medicine
                                                      ↓
                                               (notify patient)
```

### Medicine Type
```typescript
type: 'tablet' | 'capsule' | 'injection' | 'syrup'
```

---

## 4. API ENDPOINTS SUMMARY

### Authentication
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/Login/admin` | POST | No | Admin login |
| `/Patient/Register` | POST | No | Patient registration |
| `/Patient/Login` | POST | No | Patient OTP request |
| `/Login/logout` | POST | Yes | Logout |

### Patient Management
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/Patient/SavePatientInfo` | POST | Yes | Submit KYC |
| `/Patient/GetByMobileNumber` | GET | No | Fetch patient by mobile |
| `/Patient/GetPatientsByStatus` | GET | Yes | Admin: fetch patients |
| `/Admin/ApproveKyc` | POST | Yes | Admin: approve KYC |

### Prescriptions
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/Prescription/uploadPrescription` | POST | Yes | Upload prescription file |
| `/api/Prescription/SavePrescription` | POST | Yes | Save prescription metadata |
| `/api/Prescription/ApprovePrescription` | POST | Yes | Admin: approve |
| `/api/Prescription/RejectPrescription` | POST | Yes | Admin: reject |
| `/api/Prescription/GetPrescriptionsByStatus` | GET | Yes | Fetch by status |
| `/api/Prescription/GetPrescriptionsByPatientId` | GET | Yes | Fetch patient prescriptions |

### Appointments
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/AppointmentSlot/GetAvailableSlots` | GET | No | Check slot availability |
| `/api/AppointmentSlot/BookSlot` | POST | No | Book appointment |
| `/api/AppointmentSlot/GetSlotByPatientAndPrescription` | GET | No | Fetch booked appointment |
| `/api/AppointmentSlot/RescheduleSlot` | POST | No | Reschedule appointment |

### Invoices & Payments
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/Invoice/GenerateInvoice` | POST | Yes | Create invoice |
| `/api/Invoice/UpdateInvoiceStatus` | POST | Yes | Confirm payment |
| `/Payment/key` | GET | No | Razorpay key |
| `/Payment/create-order` | POST | Yes | Create payment order |
| `/Payment/verify` | POST | Yes | Verify payment |

### Inventory
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/Inventory/GetInventoryList` | GET | Yes | Fetch all medicines |
| `/Inventory/save` | POST | Yes | Add/update medicine |
| `/Inventory` | DELETE | Yes | Remove medicine |

---

## 5. KEY CONTEXT FUNCTIONS

### Patient Functions (AppContext.tsx)

```typescript
// Authentication
registerPatient(mobile, email?) → Promise<void>
verifyOTP(otp) → Promise<boolean>

// KYC
submitKYC(name, dob, aadhaar, file) → Promise<void>

// Prescriptions
uploadPrescription(file, doctorName, hospitalName) → Promise<void>

// Slots
bookPickupSlot(patientId, prescriptionId, pickupId, date, time) → Promise<void>
reschedulePickup(patientId, prescriptionId, pickupId, newDate, newTime) → Promise<void>
getBookedSlots() → string[] (returns "YYYY-MM-DD|HH:MM" format)

// General
logout() → void
refreshPatientData() → Promise<void>
```

### Admin Functions (AppContext.tsx)

```typescript
// Authentication
adminLogin(username, password) → Promise<boolean>

// KYC Approvals
approvePatientKYC(patientId, incomeLevel, discountPercentage) → Promise<void>
rejectPatientKYC(patientId, reason) → Promise<void>

// Prescription Approvals
approvePrescription(patientId, prescriptionId) → Promise<void>
rejectPrescription(patientId, prescriptionId, reason) → Promise<void>

// Inventory
addMedicine(medicine) → Promise<void>
removeMedicine(id) → Promise<void>
updateMedicine(id, updates) → Promise<void>

// Utilities
notifyMissingMedicine(patientId, prescriptionId, missingMedicineNames) → void
```

---

## 6. DATA FLOW DIAGRAM

```
┌─── PATIENT FLOW ──────────────────────────────────┐
│                                                    │
│  Auth (OTP)                                        │
│      ↓                                             │
│  KYC Submission                                    │
│      ↓ (admin approval req'd)                      │
│  Prescription Upload                               │
│      ↓ (admin approval req'd)                      │
│  Invoice Generation                                │
│      ↓                                             │
│  Payment (Razorpay)                                │
│      ↓                                             │
│  Slot Booking                                      │
│      ↓                                             │
│  Collection at Pharmacy                            │
│      ↓                                             │
│  Order History                                     │
│                                                    │
└────────────────────────────────────────────────────┘

┌─── ADMIN FLOW ────────────────────────────────────┐
│                                                    │
│  Auth (username/password)                          │
│      ↓                                             │
│  Dashboard Access                                  │
│      ├─ KYC Approvals (approve/reject patients)   │
│      ├─ Prescriptions (approve/reject uploads)    │
│      ├─ Patient List (view all)                   │
│      └─ Inventory (manage medicines)              │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 7. KEY FILES REFERENCE

### Patient Components
- `PatientLogin.tsx` - Phone + OTP login
- `PatientRegistration.tsx` - Registration flow
- `PatientDashboard.tsx` - Main patient hub, KYC status
- `PatientDetailsForm.tsx` - KYC document submission
- `PrescriptionUploadForm.tsx` - Upload prescription
- `InvoiceView.tsx` - Invoice display & payment
- `SlotBookingModal.tsx` - Date/time selection
- `PatientHistory.tsx` - Order history view

### Admin Components
- `AdminDashboard.tsx` - Main admin hub (4 tabs)
- `ApprovalsList.tsx` - KYC approvals
- `PrescriptionApprovalsList.tsx` - Prescription reviews
- `PatientList.tsx` - All patients view
- `InventoryManagement.tsx` - Medicine management

### Core Files
- `AppContext.tsx` - State & API orchestration
- `AppContextDef.ts` - Type definitions
- `api.ts` - API client methods
- `useInventory.ts` - Inventory hook for admin

---

## 8. COMMON DATA TRANSFORMATIONS

### KYC Status Mapping
```typescript
API → Frontend:
'approved' → 'approved'
'rejected' → 'rejected'
other → 'pending'
```

### Prescription Status Mapping
```typescript
API → Frontend:
'APPROVED' | 'PROCESSED' → 'approved'
'REJECTED' → 'rejected'
'PENDING' → 'pending'
```

### Patient Data Structure
```typescript
{
  id: string,
  patientId: string,          // Human-readable ID (PAT-2025-XXXX)
  mobile: string,
  email: string | null,
  name: string,
  dateOfBirth: string,        // YYYY-MM-DD
  aadhaarNumber: string | null,
  incomeDocumentUrl: string | null,
  kycStatus: 'pending' | 'approved' | 'rejected',
  discountPercentage: number,
  registrationDate: string,   // ISO timestamp
  prescriptions: Prescription[]
}
```

---

## 9. TESTING CREDENTIALS

### Patient
- **Mobile**: Any 10-digit number
- **Email**: Optional
- **OTP**: 123456 (demo mode)
- **Aadhaar**: Any 12-digit number

### Admin
- Check `AdminLogin.tsx` for credentials
- Typically: hardcoded test credentials or backend validation

---

## 10. IMPORTANT CONSTRAINTS

1. **Slot Booking**
   - Cannot book beyond 14 days
   - Cannot book beyond prescription expiry date
   - Maximum 5 patients per time slot
   - Lunch break: 13:00-13:30 (closed)

2. **KYC Verification**
   - Required before prescription upload
   - Admin approval needed for access
   - Can be rejected and resubmitted

3. **Prescription Upload**
   - Requires approved KYC status
   - File size max: 10MB
   - Accepted: PDF, JPG, PNG

4. **Invoice & Payment**
   - Generated after prescription approval
   - Razorpay integration for payment
   - Discount applied from KYC approval

5. **Discount Rules**
   - Set per patient by admin (KYC approval)
   - Inventory medicines also have discounts
   - Cannot exceed MRP

---

**Last Updated**: 2025-03-17  
**Version**: 1.0
