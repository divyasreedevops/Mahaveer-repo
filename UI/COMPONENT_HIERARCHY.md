# Mahaveer Pharmacy - Component Hierarchy & Data Flow

## 1. APPLICATION ROUTING

```
App.tsx (Routes)
│
├─ / ........................... LandingPage (public)
│
├─ /patient/login ............ PatientLogin (public)
│  └─ Uses: registerPatient(), verifyOTP()
│
├─ /admin/login .............. AdminLogin (public)
│  └─ Uses: adminLogin()
│
├─ [Protected: patient]
│  └─ /patient/dashboard .... PatientDashboard (main hub)
│     ├─ PatientDetailsForm (if KYC incomplete)
│     ├─ PrescriptionUploadForm (if KYC approved)
│     ├─ InvoiceView (if prescription approved)
│     ├─ SlotBookingModal (if payment done)
│     └─ PatientHistory (order history)
│
└─ [Protected: admin]
   └─ /admin/dashboard ..... AdminDashboard (4 tabs)
      ├─ Tab: KYC Approvals → ApprovalsList
      ├─ Tab: Prescriptions → PrescriptionApprovalsList
      ├─ Tab: Patients → PatientList
      └─ Tab: Inventory → InventoryManagement
```

---

## 2. COMPONENT TREE WITH DATA FLOW

### PATIENT FLOW COMPONENTS

```
PatientFlow (Router)
│
├─ /register
│  └─ PatientRegistration
│     ├─ State: { mobile, otpSent, otp }
│     ├─ Props: { patientData, updateData }
│     └─ Calls: registerPatient(mobile, email)
│           → updateData({ mobile })
│           → navigate to /details
│
├─ /details
│  └─ PatientDetails
│     ├─ State: { name, dob, aadhaar, ... }
│     ├─ Props: { patientData, updateData }
│     └─ Calls: submitKYC(name, dob, aadhaar, file)
│           → updateData({ name, dob, aadhaar, ... })
│           → navigate to /upload-prescription
│
├─ /upload-prescription
│  └─ PrescriptionUpload
│     ├─ State: { file, uploading }
│     ├─ Props: { patientData, updateData }
│     └─ Calls: (mock upload in Flow)
│           → updateData({ prescriptionUrl })
│           → navigate to /invoice
│
├─ /invoice
│  └─ InvoiceView
│     ├─ State: { invoice, payment details }
│     ├─ Props: { patientData, updateData }
│     └─ Calls: (payment processing)
│           → updateData({ paymentComplete: true })
│           → navigate to next step
│
├─ /slot-booking
│  └─ SlotBooking
│     ├─ Shows: Assigned slot info
│     └─ Calls: markItemReceived()
│
└─ /payment-complete
   └─ PaymentComplete
      └─ Confirmation screen
```

#### Alternative: Real PatientLogin + Dashboard

```
PatientLogin (Direct Login)
│
├─ State: { step: 'mobile'|'otp', mobile, otp, error }
├─ Calls: 
│  1. registerPatient(mobile, email)
│  2. verifyOTP(otp)
│  └─ navigate to /patient/dashboard
│
PatientDashboard (Main Hub)
│
├─ Conditional Rendering Based on State:
│
├─ If !KYC Submitted
│  └─ PatientDetailsForm
│     ├─ State: { name, dob, aadhaar, file, error }
│     └─ Calls: submitKYC(name, dob, aadhaar, file)
│
├─ If KYC Status = 'pending'
│  └─ Show: "KYC Review in Progress" card
│
├─ If KYC Status = 'rejected'
│  └─ Show: Rejection reason + resubmit button
│
├─ If KYC Approved
│  └─ PrescriptionUploadForm (with actual API)
│     ├─ State: { file, doctorName, hospitalName, preview }
│     └─ Calls: uploadPrescription(file, doctorName, hospitalName)
│
├─ If Rx Approved
│  ├─ InvoiceView (fetched from context)
│  │  ├─ Display: items, totals, discount
│  │  └─ Button: "Pay Now" → InvoicePaymentModal
│  │
│  └─ InvoicePaymentModal
│     ├─ Razorpay Integration
│     └─ On Success: Update payment status
│
├─ If Payment Done
│  └─ SlotBookingModal
│     ├─ State: { selectedDate, selectedTime, bookedSlots }
│     └─ Calls: bookPickupSlot(patientId, prescriptionId, pickupId, date, time)
│
├─ If Slot Booked
│  └─ SlotBooking (confirmation view)
│     ├─ Display: Registration ID, Date, Time
│     └─ Button: "Mark Item as Received"
│
└─ PatientHistory (Tab/Page)
   ├─ Display: All prescriptions sorted by date
   ├─ For each: Show status badge, doctor, hospital, invoice link
   └─ Actions: Download invoice
```

---

## 3. ADMIN COMPONENTS TREE

```
AdminDashboard
│
├─ Tabs: { approvals | prescriptions | patients | inventory }
│
├─ Tab: "KYC Approvals" → ApprovalsList
│  │
│  └─ State: { patientList, selectedPatient, incomeLevel, discount }
│  │
│  ├─ List Pending KYC
│  │ ├─ Fetch: GET /Patient/GetPatientsByStatus?kycstatus=pending
│  │ └─ Display: Card per patient with document preview
│  │
│  ├─ Expand Patient Card
│  │ ├─ Show: Name, DOB, Aadhaar, document preview
│  │ ├─ Form: Select income level + discount %
│  │ └─ Buttons: [APPROVE] [REJECT]
│  │
│  ├─ On APPROVE
│  │ ├─ Calls: approvePatientKYC(patientId, incomeLevel, discountPercentage)
│  │ ├─ Backend: POST /Admin/ApproveKyc
│  │ └─ Reload list
│  │
│  └─ On REJECT
│     ├─ Dialog: Enter rejection reason
│     ├─ Calls: rejectPatientKYC(patientId, reason)
│     └─ Reload list
│
├─ Tab: "Prescriptions" → PrescriptionApprovalsList
│  │
│  └─ State: { prescriptionList, rejectingId, rejectionReason }
│  │
│  ├─ Load Pending Prescriptions
│  │ ├─ Fetch: GET /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=PENDING
│  │ ├─ Also fetch: GET /Patient/GetPatientsByStatus (for patient names)
│  │ └─ Display: List with prescription image, doctor, hospital
│  │
│  ├─ For Each Prescription Card
│  │ ├─ Image: Click to preview prescription document
│  │ ├─ Buttons: [APPROVE] [REJECT] [NOTIFY MISSING]
│  │ └─ Status: PENDING
│  │
│  ├─ On APPROVE
│  │ ├─ Calls: api.prescription.approve({ prescriptionId, approvedBy, remarks })
│  │ ├─ Backend: POST /api/Prescription/ApprovePrescription
│  │ ├─ Patient can now generate invoice
│  │ └─ Reload list
│  │
│  ├─ On REJECT
│  │ ├─ Dialog: Enter rejection reason
│  │ ├─ Calls: api.prescription.reject({ prescriptionId, rejectedBy, reason })
│  │ ├─ Backend: POST /api/Prescription/RejectPrescription
│  │ ├─ Patient notified
│  │ └─ Reload list
│  │
│  └─ On NOTIFY MISSING
│     ├─ Dialog: Select missing medicines from inventory
│     ├─ Calls: notifyMissingMedicine(patientId, prescriptionId, medicineNames)
│     └─ Pickup status: missing_medicine
│
├─ Tab: "Patients" → PatientList
│  │
│  └─ State: { patientList, filters }
│  │
│  ├─ Load All Patients
│  │ ├─ Fetch: GET /Patient/GetPatientsByStatus (no filters)
│  │ └─ Display: Table with patient info
│  │
│  ├─ Table Columns
│  │ ├─ Patient ID (e.g. PAT-2025-0042)
│  │ ├─ Full Name
│  │ ├─ Mobile
│  │ ├─ Email
│  │ ├─ Registration Date
│  │ ├─ KYC Status (badge: pending/approved/rejected)
│  │ ├─ Discount %
│  │ └─ Registration Status
│  │
│  └─ Filters
│     ├─ By KYC Status
│     └─ By Registration Status
│
└─ Tab: "Inventory" → InventoryManagement
   │
   └─ State: { medicineList, isAddDialog, isEditDialog, selectedMedicine }
   │
   ├─ Load Medicines
   │ ├─ Fetch: GET /Inventory/GetInventoryList
   │ └─ Display: Table with all medicines
   │
   ├─ Table Columns
   │ ├─ Name
   │ ├─ Type (tablet/capsule/injection/syrup)
   │ ├─ Disease
   │ ├─ Dosage (value + units)
   │ ├─ Quantity (value + units)
   │ ├─ MRP
   │ ├─ Discount
   │ ├─ Final Price
   │ ├─ Status (active/inactive)
   │ └─ Actions: [EDIT] [DELETE] [SET DISCOUNT]
   │
   ├─ Button: [+ ADD MEDICINE]
   │ └─ Dialog: Add Medicine Form
   │    ├─ Name (text)
   │    ├─ Type (dropdown: tablet/capsule/injection/syrup)
   │    ├─ Dosage (number + units)
   │    ├─ Quantity (number + units)
   │    ├─ Disease (text)
   │    ├─ MRP (number)
   │    ├─ Discount (number, capped at MRP)
   │    └─ Calls: addMedicine(medicineData)
   │       ├─ Backend: POST /Inventory/save
   │       └─ Reload list
   │
   ├─ Button: [DELETE] (per row)
   │ └─ Calls: removeMedicine(medicineId)
   │    ├─ Backend: DELETE /Inventory
   │    └─ Reload list
   │
   ├─ Button: [SET DISCOUNT] (per row)
   │ └─ Dialog: Set Discount
   │    ├─ Percentage input (0-100%)
   │    ├─ Calculates: fixed discount = (%) * MRP
   │    ├─ Validator: Cannot exceed MRP
   │    └─ Calls: updateMedicine(medId, { discount: ... })
   │       ├─ Backend: POST /Inventory/save
   │       └─ Reload list
   │
   └─ Button: [BULK UPLOAD] (optional)
      └─ CSV upload → Parse → POST /Inventory/save
```

---

## 4. CORE STATE MANAGEMENT

### AppContext.tsx
```
Provider wraps entire App

State Variables:
├─ userType: 'patient' | 'admin' | null
├─ isAuthenticated: boolean
├─ isLoading: boolean (for all async ops)
├─ currentPatient: Patient | null
├─ allPatients: Patient[]
├─ medicines: Medicine[]
└─ navigationTrigger: number (force refresh)

Functions:
├─ Authentication
│  ├─ registerPatient(mobile, email?)
│  ├─ verifyOTP(otp)
│  ├─ adminLogin(username, password)
│  └─ logout()
│
├─ Patient Management
│  ├─ submitKYC(name, dob, aadhaar, file)
│  ├─ uploadPrescription(file, doctorName, hospitalName)
│  ├─ bookPickupSlot(patientId, prescriptionId, pickupId, date, time)
│  ├─ reschedulePickup(patientId, prescriptionId, pickupId, newDate, newTime)
│  ├─ getBookedSlots() → string[]
│  ├─ checkPickupExpiry(patientId)
│  ├─ markPickupCollected(patientId, prescriptionId, pickupId)
│  └─ patientConfirmCollection(patientId, prescriptionId, pickupId)
│
├─ Admin Actions
│  ├─ approvePatientKYC(patientId, incomeLevel, discountPercentage)
│  ├─ rejectPatientKYC(patientId, reason)
│  ├─ approvePrescription(patientId, prescriptionId)
│  ├─ rejectPrescription(patientId, prescriptionId, reason)
│  ├─ notifyMissingMedicine(patientId, prescriptionId, medicineNames)
│  ├─ addMedicine(medicine)
│  ├─ removeMedicine(id)
│  └─ updateMedicine(id, updates)
│
├─ Inventory
│  ├─ initiatePayment(patientId, prescriptionId, pickupId, method)
│  ├─ confirmPayment(patientId, prescriptionId, pickupId)
│  └─ refreshPatientData()
│
└─ Navigation
   └─ navigateToLanding()
```

### Custom Hooks
```
useApp()
├─ Returns: AppContextType
├─ Throws: Error if used outside AppProvider
└─ Usage: const { currentPatient, registerPatient, ... } = useApp()

useInventory()
├─ State: { inventory[], isLoading, isRefreshing, error }
├─ Functions: { loadInventory(), addMedicine(), removeMedicine(), updateMedicine() }
├─ Utilities: 
│  ├─ formatInventoryPrice(price)
│  ├─ getInventoryNumericValue(price)
│  ├─ calculateInventoryDiscountedPrice(mrp, discount)
│  └─ getDiscountPercentageCapped(discount, mrp)
└─ Used by: InventoryManagement component
```

---

## 5. DATA FLOW DIAGRAMS

### Authentication Data Flow
```
Patient Login Page
  ↓
  └─ enterPhone ──→ registerPatient(mobile, email)
     └─ Backend: POST /Patient/Register
        ├─ Validate: mobile (10 digits)
        ├─ Send OTP via SMS
        └─ Frontend: Show OTP input
           ↓
           └─ enterOTP ──→ verifyOTP(otp)
              └─ Backend: POST /Patient/verifyOTP
                 ├─ Validate OTP
                 ├─ Create JWT token
                 ├─ Store in localStorage
                 └─ Frontend: Update context.isAuthenticated = true
                    └─ Redirect to /patient/dashboard
```

### KYC Submission Data Flow
```
Patient Dashboard
  ↓
  └─ Is KYC Complete? NO
     ├─ Show: PatientDetailsForm
     └─ User fills: name, dob, aadhaar, document
        ↓
        └─ Submit ──→ submitKYC(name, dob, aadhaar, file)
           └─ Frontend: Create FormData with file
              └─ Backend: POST /Patient/SavePatientInfo
                 ├─ Upload file to S3
                 ├─ Save patient info to DB
                 ├─ Set kycStatus = 'pending'
                 └─ Frontend: Refresh data, show "Pending Review"


Admin Dashboard → KYC Approvals Tab
  ↓
  └─ Fetch: GET /Patient/GetPatientsByStatus?kycstatus=pending
     └─ Show pending list with documents
        ↓
        └─ Admin clicks APPROVE or REJECT
           ├─ APPROVE
           │  ├─ Select: income level, discount %
           │  └─ Backend: POST /Admin/ApproveKyc
           │     ├─ Set kycStatus = 'approved'
           │     ├─ Store discountPercentage
           │     └─ Frontend: List refreshes
           │
           └─ REJECT
              ├─ Enter: rejection reason
              └─ Backend: Update patient record
                 ├─ Set kycStatus = 'rejected'
                 ├─ Store rejectionReason
                 └─ Frontend: List refreshes


Patient Sees Updated Status
  ↓
  ├─ If approved → Show PrescriptionUploadForm
  └─ If rejected → Show rejection reason + resubmit button
```

### Prescription Upload & Approval Data Flow
```
Patient → PrescriptionUploadForm
  │
  ├─ Select file (PDF/JPG/PNG)
  ├─ Enter: doctorName, hospitalName
  └─ Click: [Upload for Review]
     │
     ├─ Backend: POST /api/Prescription/uploadPrescription (multipart)
     │  ├─ Receive file
     │  ├─ Upload to S3
     │  └─ Return: prescriptionKey, medicines (extracted)
     │
     └─ Backend: POST /api/Prescription/SavePrescription (JSON)
        ├─ Store metadata in DB
        ├─ Set status = 'PENDING'
        └─ Frontend: Toast "Awaiting admin review"


Admin Dashboard → Prescriptions Tab
  │
  ├─ Fetch: GET /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=PENDING
  ├─ Also fetch: GET /Patient/GetPatientsByStatus (for names)
  └─ Display: List of pending prescriptions with preview images
     │
     └─ Admin clicks APPROVE or REJECT
        │
        ├─ APPROVE
        │  └─ Backend: POST /api/Prescription/ApprovePrescription
        │     ├─ Set status = 'APPROVED'
        │     ├─ Store approvedBy, approvedDate
        │     └─ Frontend: List refreshes
        │
        ├─ REJECT
        │  ├─ Enter: rejection reason
        │  └─ Backend: POST /api/Prescription/RejectPrescription
        │     ├─ Set status = 'REJECTED'
        │     ├─ Store reason
        │     └─ Frontend: List refreshes
        │
        └─ NOTIFY MISSING
           ├─ Select medicines from inventory
           └─ Backend: Notify patient
              └─ Pickup: status = 'missing_medicine'


Patient Sees Updated Status
  │
  ├─ If approved → Show InvoiceView (invoice auto-generated)
  └─ If rejected → Show rejection reason + upload new button
```

### Appointment Booking Flow
```
Patient → PatientDashboard (after payment)
  │
  └─ Show: [Book Appointment Slot] button
     │
     └─ Click → SlotBookingModal opens
        │
        ├─ Frontend: Generate next 14 days calendar
        │  ├─ Start: tomorrow
        │  ├─ Respects: prescription expiryDate
        │  └─ Disable: dates beyond 14 days or past expiry
        │
        ├─ Frontend: Fetch booked slots
        │  └─ From context: getBookedSlots() 
        │     └─ Grayed out: already booked slots
        │
        ├─ User selects: date and time
        │
        └─ Click: [CONFIRM BOOKING]
           │
           └─ Backend: POST /api/AppointmentSlot/BookSlot
              ├─ Params: patientId, prescriptionId, slotDate, slotTime
              ├─ Check: Slot capacity not exceeded
              │  ├─ Query: Current bookings for date|time
              │  ├─ Limit: 5 per slot
              │  └─ If full: Return 409 Conflict
              │
              ├─ If available:
              │  ├─ Create booking record
              │  ├─ Set status = 'SLOT_BOOKED'
              │  └─ Return: bookingId, remainingSlots
              │
              └─ Frontend: 
                 ├─ Close modal
                 ├─ Update context (refresh patient data)
                 │  └─ Fetch: GET /Patient/GetPatientsByStatus
                 └─ Show: Confirmation with date/time/ID


Patient Can Reschedule
  │
  └─ On confirmation card: [Reschedule] button
     │
     └─ Open: SlotBookingModal (isReschedule = true)
        │
        └─ Select new date/time
           │
           └─ Click: [RESCHEDULE]
              │
              └─ Backend: POST /api/AppointmentSlot/RescheduleSlot
                 ├─ Params: bookingId, patientId, prescriptionId, slotDate, slotTime
                 ├─ Update booking record
                 └─ Frontend: Refresh & show new slot
```

---

## 6. SHARED UI PATTERNS

### Forms Throughout App
```
Input Elements (from shadcn/ui):
├─ Input
│  ├─ phone (10 digits only)
│  ├─ email
│  ├─ name
│  ├─ aadhaar (formatted as XXXX XXXX XXXX)
│  └─ price / discount
│
├─ Label
│  └─ Styled with: "text-gray-700 font-normal"
│
├─ Select (Dropdown)
│  ├─ medicine type
│  ├─ income level
│  ├─ units (mg/ml/strip)
│  └─ disease
│
└─ Textarea / Dialog
   ├─ rejection reason
   └─ remarks

Card Patterns:
├─ Header
│  ├─ Icon (lucide-react)
│  ├─ Title
│  └─ Description
│
├─ Content
│  ├─ Form fields
│  ├─ Status badges
│  └─ Action buttons
│
└─ Footer
   └─ Buttons: [Primary] [Secondary]

Status Badges:
├─ Colors: green (approved), amber (pending), red (rejected)
├─ Text: "Verification Pending", "Approved", "Rejected"
└─ Applied to: KYC status, prescription status, pickup status
```

### Loading States
```
While isLoading = true:
├─ Spinner: Loader2 icon + "animate-spin"
├─ Opacity: 50% transparency
└─ Button: disabled + "loading text"

While isRefreshing = true:
├─ Show: List with opacity 50%
├─ Spinner overlay
└─ Cannot interact with elements
```

---

## 7. TOKEN & SESSION MANAGEMENT

### localStorage Usage
```
Keys Stored:
├─ 'token' → JWT token from backend
├─ 'userType' → 'patient' | 'admin'
├─ 'adminUser' → { username, id, ...}  (admin)
└─ 'patientData' → Current patient object (optional)

On Login:
├─ Backend returns JWT
├─ Frontend stores in localStorage
└─ Set to request headers in api.ts

On Logout:
├─ Clear localStorage
├─ Clear context state
└─ Redirect to /
```

---

## 8. ERROR HANDLING FLOW

```
Try-Catch in Functions
  │
  ├─ Success Path
  │  └─ toast.success("Message")
  │     └─ Update context state
  │        └─ refreshPatientData() or reload list
  │
  └─ Error Path
     ├─ If known error type
     │  └─ toast.error(errorMessage)
     │     └─ Show specific reason to user
     │
     ├─ If 401/403
     │  └─ logout() + redirect to login
     │
     ├─ If 409 (conflict)
     │  └─ Show: "Slot fully booked, choose another"
     │
     ├─ If 404 (not found)
     │  └─ Show: "Resource not found, try again"
     │
     └─ Else
        └─ toast.error("Operation failed")
           └─ Show generic error message
```

---

## 9. CONDITIONAL RENDERING IN COMPONENTS

### PatientDashboard Rendering Logic
```
if (!currentPatient) return <Loading spinner>

if (!isKYCComplete) return <PatientDetailsForm>

switch(currentPatient.kycStatus) {
  case 'pending': return <KYC Pending Card>
  case 'rejected': return <KYC Rejected Card + Resubmit>
  case 'approved':
    // Can now upload prescription
    for(prescription in prescriptions) {
      switch(prescription.approvalStatus) {
        case 'pending': return <Waiting for approval>
        case 'approved':
          // Can now pay for invoice
          if(payment.status !== 'paid') return <Invoice + Pay>
          // Can now book appointment
          for(pickup of prescription.pickups) {
            if(pickup.status === 'slot_available') 
              return <SlotBookingModal>
            if(pickup.status === 'slot_booked')
              return <SlotBooking confirmation>
            if(pickup.status === 'collected')
              return <Order history item>
          }
        case 'rejected': return <Rejection reason + Upload new>
      }
    }
    return <New Prescription Upload>
}
```

---

## 10. KEY PERFORMANCE CONSIDERATIONS

```
Optimizations Used:
├─ useMemo() for:
│  └─ next14Days calculation in SlotBookingModal
│
├─ useCallback() avoided (not critical here)
│
├─ State lifting:
│  └─ patientData in PatientFlow (prevents re-renders)
│
└─ Context separation:
   └─ AppContext (global) avoids prop drilling

API Calls:
├─ Batch when possible
│  ├─ ApprovalsList: Promise.all([prescriptions, patients])
│  └─ PatientDashboard: Single refreshPatientData() call
│
├─ Lazy load where needed
│  └─ Prescriptions only loaded when tab opened
│
└─ Caching via context
   ├─ currentPatient cached in context
   └─ Refresh on-demand or after actions

List Rendering:
├─ Use key={id || index}
├─ Avoid object creation in map()
└─ Sort/filter before render
```

---

**Last Updated**: 2025-03-17
