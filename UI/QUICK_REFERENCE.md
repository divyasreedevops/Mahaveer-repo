# Mahaveer Pharmacy App - Visual Quick Reference

## 1. PATIENT WORKFLOW AT A GLANCE

```
PATIENT JOURNEY MAP

┌─ Step 1: Authentication ────────────────┐
│ Phone Number ──[OTP]──> Verified        │
│ Email (optional)                         │
└────────────────────────────────────────┘
                  ↓
┌─ Step 2: KYC Submission ────────────────┐
│ Name, DOB, Aadhaar                       │
│ Income Document Upload                   │
│ Status: PENDING ──[Admin Review]──> ✓A  │
└────────────────────────────────────────┘
                  ↓
┌─ Step 3: Prescription Upload ──────────┐
│ File Upload (PDF/JPG/PNG)                │
│ Doctor Name + Hospital                   │
│ Status: PENDING ──[Admin Review]──> ✓A  │
└────────────────────────────────────────┘
                  ↓
┌─ Step 4: Invoice & Payment ────────────┐
│ Medicines Listed (with discount)         │
│ Payment via Razorpay                     │
│ Status: PENDING ──[Payment]──> PAID      │
└────────────────────────────────────────┘
                  ↓
┌─ Step 5: Book Appointment Slot ────────┐
│ Calendar: Next 14 days                   │
│ Time: 10:00-12:30, 14:00-17:30          │
│ Respects: Expiry Date                    │
│ Max: 5 patients/slot                     │
└────────────────────────────────────────┘
                  ↓
┌─ Step 6: Collection at Pharmacy ───────┐
│ Show: Registration ID, Date, Time        │
│ Mark: Item as Received                   │
│ Status: COLLECTED                        │
└────────────────────────────────────────┘
                  ↓
          Order History View
```

---

## 2. STATUS PROGRESSION CHARTS

### KYC Status (Patient)
```
┌─────────┐
│ PENDING │ ←── Patient submits documents
└────┬────┘
     │
     ├──[Admin Approves]──> ┌──────────┐
     │                      │ APPROVED │ ←── Can upload prescriptions
     │                      └──────────┘
     │
     └──[Admin Rejects]───> ┌──────────┐
                            │ REJECTED │ ←── View reason, resubmit
                            └──────────┘
```

### Prescription Approval Status
```
┌─────────┐
│ PENDING │ ←── Patient uploads prescription
└────┬────┘
     │
     ├──[Admin Approves]──> ┌──────────┐
     │                      │ APPROVED │ ←── Invoice generated
     │                      └──────────┘
     │
     └──[Admin Rejects]───> ┌──────────┐
                            │ REJECTED │ ←── Upload new prescription
                            └──────────┘
```

### Pickup/Collection Status
```
          ┌──────────────┐
          │ INVOICE_READY│ ←── After prescription approval
          └──────┬───────┘
                 ↓
         ┌──────────────────┐
         │ PAYMENT_PENDING  │ ←── Awaiting payment
         └──────┬───────────┘
                ↓
         ┌──────────────────┐
         │ SLOT_AVAILABLE   │ ←── Can book appointment
         └──────┬───────────┘
                ↓
         ┌──────────────────┐
         │ SLOT_BOOKED      │ ←── Slot reserved
         └──────┬───────────┘
                ├─[At Pharmacy]─> ┌─────────────────┐
                │                 │ COLLECTION_CONF │
                │   (optional)    └────────┬────────┘
                │                          ↓
                │               ┌──────────────────┐
                │               │ COLLECTED        │ ✓ Complete
                │               └──────────────────┘
                │
                └──[Missing Meds]──> ┌────────────────┐
                                     │ MISSING_MEDICINE│
                                     └────────────────┘
```

---

## 3. ADMIN DASHBOARD QUICK MAP

```
ADMIN DASHBOARD (4 Tabs)

Tab 1: KYC Approvals
├─ View waiting list of patients with documents
├─ Review: Aadhaar, Income Document, DOB
├─ Action: [APPROVE with discount%] or [REJECT]
└─ Patient unlocks: Prescription upload

Tab 2: Prescriptions  
├─ View pending prescriptions
├─ Review: Doctor name, hospital, file, medicines
├─ Action: [APPROVE] or [REJECT with reason]
├─ Notify: Missing medicines (if needed)
└─ Patient can: Book appointment slot

Tab 3: Patients
├─ View all registered patients
├─ Sort by: KYC status, registration date
├─ Info: Patient ID, mobile, email, discount%
└─ Track: Document progress

Tab 4: Inventory
├─ View all medicines in stock
├─ Add medicine: Name, type, dosage, disease, MRP
├─ Set discount: Per medicine or bulk upload
├─ Remove: Inactive medicines
└─ Note: Discount cannot exceed MRP
```

---

## 4. DECISION TREE: WHAT BLOCKS PROGRESSION?

```
CAN PATIENT UPLOAD PRESCRIPTION?
│
├─ No KYC Submitted?
│  └─ ACTION: Prompt to submit KYC
│
├─ KYC Status = PENDING?
│  └─ ACTION: Show "Please wait for admin review"
│
├─ KYC Status = REJECTED?
│  └─ ACTION: Show rejection reason, "Resubmit KYC"
│
├─ KYC Status = APPROVED?
│  └─ ✓ YES - Can upload prescription
      
CAN PATIENT BOOK APPOINTMENT?
│
├─ Prescription Status ≠ APPROVED?
│  └─ ACTION: Show "Waiting for admin approval"
│
├─ Payment Status ≠ PAID?
│  └─ ACTION: "Complete payment"
│
├─ Selected Date > 14 days?
│  └─ ACTION: "Cannot book beyond 14 days"
│
├─ Selected Date > Prescription Expiry?
│  └─ ACTION: "Cannot book beyond expiry"
│
├─ Selected Slot Full (≥5 patients)?
│  └─ ACTION: Slot unavailable (grayed out)
│
└─ ✓ ALL CHECKS PASS?
   └─ ✓ YES - Enable booking button
```

---

## 5. API CALL SEQUENCES

### Patient Registration Flow
```
1. Patient enters mobile → /Patient/Register
   ↓ (OTP sent)
2. Patient enters OTP → /Patient/verifyOTP (context)
   ↓ (Redirects to dashboard)
3. Dashboard loads → /Patient/GetPatientsByStatus (fetch current)
```

### Prescription Upload Flow
```
1. Patient uploads file → /api/Prescription/uploadPrescription (FormData)
   ↓ (Returns prescriptionKey)
2. Save metadata → /api/Prescription/SavePrescription (JSON)
   ↓ (Status: PENDING)
3. [Admin action] → /api/Prescription/ApprovePrescription (POST)
   ↓
4. Patient sees APPROVED → /api/Invoice/GenerateInvoice (POST)
   ↓
5. Patient sees invoice → Ready for payment
```

### Appointment Booking Flow
```
1. Patient clicks "Book Slot" → /api/AppointmentSlot/GetAvailableSlots
   ↓ (Shows calendar with available times)
2. Patient selects date/time → /api/AppointmentSlot/BookSlot (POST)
   ↓ (Status: SLOT_BOOKED)
3. Confirmation displayed
4. [Patient can] → /api/AppointmentSlot/RescheduleSlot (POST)
```

---

## 6. DATA FIELD REFERENCE

### Patient Object
```
{
  id: "123",
  patientId: "PAT-2025-0042",        ← Human-readable ID
  mobile: "9876543210",
  email: "patient@example.com",
  name: "Raj Kumar",
  dateOfBirth: "1990-05-15",         ← YYYY-MM-DD
  aadhaarNumber: "1234 5678 9012",   ← Auto-formatted with spaces
  incomeDocumentUrl: "https://...",
  discountPercentage: 50,             ← Set by admin on KYC approval
  kycStatus: "approved",              ← pending | approved | rejected
  kycRejectionReason: null,
  registrationDate: "2025-03-10T14:30:00",
  prescriptions: [...]
}
```

### Prescription Object
```
{
  id: "45",
  uploadDate: "2025-03-10T10:30:00",
  prescriptionUrl: "s3://...",
  doctorName: "Dr. Mehta",
  hospitalName: "City Hospital",
  approvalStatus: "approved",         ← pending | approved | rejected
  rejectionReason: null,
  approvedDate: "2025-03-10T11:00:00",
  expiryDate: "2025-04-10T00:00:00",
  pickups: [
    {
      id: "101",
      status: "slot_booked",          ← Current pickup status
      slotDate: "2025-03-20",         ← Date selected
      slotTime: "10:00",              ← Time selected
      bookedAt: "2025-03-10T15:20:00",
      invoice: { ... },
      itemReceived: false
    }
  ],
  missingMedicines: ["Paracetamol"]
}
```

### Medicine Inventory Object
```
{
  id: 1,
  name: "Paracetamol",
  type: "tablet",                     ← tablet | capsule | injection | syrup
  disease: "Fever & Pain",
  dosageValue: 500,
  dosageUnits: "mg",
  quantityValue: 10,
  quantityUnits: "strip",
  mrp: { parsedValue: 50.00 },
  discount: { parsedValue: 10.00 },
  finalPrice: { parsedValue: 40.00 },
  createdBy: "admin",
  createdDate: "2025-03-10T09:00:00",
  updatedDate: "2025-03-15T14:30:00",
  updatedBy: "admin",
  status: "active"                    ← active | inactive
}
```

---

## 7. IMPORTANT NUMBERS & LIMITS

| Item | Value | Notes |
|---|---|---|
| Mobile Number | 10 digits | Required for registration |
| OTP | 6 digits | Demo: "123456" |
| Aadhaar | 12 digits | Auto-formatted XXXX XXXX XXXX |
| Prescription File | Max 10MB | PDF, JPG, PNG |
| Slot Booking | 14 days | From tomorrow only |
| Patients per Slot | 5 max | Beyond 5: slot unavailable |
| Operating Hours | 10:00-17:30 | Lunch: 13:00-13:30 (closed) |
| Slot Intervals | 30 mins | Standard interval |
| Discount % | 0-100% | Set by admin on KYC |
| Discount Amount | ≤ MRP | Cannot exceed medicine price |

---

## 8. ROLE-BASED ACCESS MATRIX

```
              PATIENT  ADMIN
Login            ✓      ✓
Register         ✓      
Submit KYC       ✓      
View KYC Status  ✓      
────────────────────────────
Approve KYC             ✓
Reject KYC              ✓
────────────────────────────
Upload Rx        ✓      
View Rx Status   ✓      
────────────────────────────
Approve Rx              ✓
Reject Rx               ✓
Notify Missing          ✓
────────────────────────────
View Patients           ✓
────────────────────────────
Book Appointment ✓      
View Slot Status ✓      
────────────────────────────
Manage Inventory        ✓
Add Medicine            ✓
Set Discount            ✓
────────────────────────────
View History     ✓      
Mark Received    ✓      
```

---

## 9. ERROR HANDLING CHECKLIST

### Common Patient Errors
- [ ] "KYC not submitted" → Show KYC form
- [ ] "KYC under review" → Show waiting state with refresh timer
- [ ] "KYC rejected" → Show rejection reason + resubmit button
- [ ] "Prescription rejected" → Show rejection reason + upload new
- [ ] "Slot is fully booked" → Show alternative times (409 response)
- [ ] "Cannot book beyond expiry" → Disable dates after expiry
- [ ] "Invalid OTP" → Let user retry

### Common Admin Errors
- [ ] "Discount > MRP" → Show error, cap at MRP
- [ ] "Prescription already processed" → Show alert, reload list
- [ ] "Patient not found" → Show 404, prompt retry

---

## 10. RESPONSIVE UI STRUCTURE

```
┌─ Mobile (< 640px) ──────────────────┐
│ Single column layout                 │
│ Full-width forms                     │
│ Stacked buttons                      │
│ Tab scrolling (overflow-x)           │
└─────────────────────────────────────┘

┌─ Tablet (640-1024px) ───────────────┐
│ Max-width: container                │
│ 2-column forms                       │
│ Side-by-side buttons                 │
│ Visible tabs                         │
└─────────────────────────────────────┘

┌─ Desktop (> 1024px) ────────────────┐
│ Max-width: 6xl (88rem)              │
│ Multi-column layouts                 │
│ All tabs visible                     │
│ Full feature access                  │
└─────────────────────────────────────┘
```

All components styled with **Tailwind CSS** + **Shadcn UI** components

---

## 11. QUICK TROUBLESHOOTING

| Issue | Check | Solution |
|---|---|---|
| Patient can't login | Mobile number | Try format: 10 digits only, no spaces |
| OTP not received | SMS service | Demo mode: Use "123456" |
| Can't upload Rx | KYC status | Approve in admin dashboard first |
| Slot booking fails | Date range | Can only book 1-14 days forward |
| Slot booking fails | Slot capacity | Show message: "Slot full, choose another" |
| Missing medicines show | Admin notification | Admin marks in Prescriptions tab |
| Invoice doesn't calc discount | Patient KYC | Ensure KYC "approved" status |
| Payment fails | Razorpay key | Check `/Payment/key` endpoint |

---

## 12. KEY CONTEXT VALUES

```javascript
// From useApp() hook:
const {
  // Authentication
  userType,           // 'patient' | 'admin' | null
  isAuthenticated,    // boolean
  isLoading,          // boolean (during async ops)
  
  // Patient data
  currentPatient,     // Patient object | null
  allPatients,        // Patient[] (admin only)
  
  // Medicine data
  medicines,          // Medicine[]
  
  // Functions
  registerPatient,
  verifyOTP,
  submitKYC,
  uploadPrescription,
  bookPickupSlot,
  reschedulePickup,
  
  // Admin functions
  adminLogin,
  approvePrescription,
  rejectPrescription,
  
  // Utilities
  logout,
  refreshPatientData,
  getBookedSlots,
} = useApp();
```

---

## 13. FILE STRUCTURE BY RESPONSIBILITY

```
Components by Feature:

AUTHENTICATION
  ├─ PatientLogin.tsx
  ├─ PatientRegistration.tsx
  └─ AdminLogin.tsx

KYC MANAGEMENT
  ├─ PatientDetailsForm.tsx
  ├─ ApprovalsList.tsx
  └─ (patient dashboard state display)

PRESCRIPTIONS
  ├─ PrescriptionUploadForm.tsx
  ├─ PrescriptionUpload.tsx
  ├─ PrescriptionApprovalsList.tsx
  └─ PatientHistory.tsx

APPOINTMENTS
  ├─ SlotBooking.tsx
  └─ SlotBookingModal.tsx

INVOICING
  ├─ InvoiceView.tsx
  ├─ InvoiceDisplay.tsx
  └─ InvoicePaymentModal.tsx

INVENTORY
  └─ InventoryManagement.tsx

ADMIN
  ├─ AdminDashboard.tsx
  └─ PatientList.tsx

CORE
  ├─ App.tsx
  ├─ AppContext.tsx
  ├─ AppContextDef.ts
  └─ services/api.ts
```

---

**Last Updated**: 2025-03-17
