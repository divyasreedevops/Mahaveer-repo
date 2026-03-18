# Responsive Patient-Admin Pharmacy App — Full Rebuild Prompt

## Context

This is a full feature upgrade of an existing React + TypeScript + Tailwind + shadcn/ui pharmacy management app.
The codebase uses Vite, React context for state, and shadcn/ui components throughout.

**Preserve exactly:**
- All existing color usage: `blue-600` for patient portal, `purple-600` for admin portal, `gray-800` for text, `blue-50` backgrounds
- All CSS variables in `theme.css` — do not change any token values
- All shadcn/ui component imports and usage patterns (Card, Button, Dialog, Table, Badge, Tabs, Select, Input, Label, etc.)
- Font weights: `font-normal` for body, `font-medium` for labels/buttons
- Border style: `border-gray-100` or `border-gray-200` throughout
- Card style: `rounded-2xl`, `shadow-sm` or `shadow-lg`, white background
- Responsive pattern: mobile card view + desktop table view in admin screens
- Button style: `bg-blue-600 hover:bg-blue-700` for patient actions, `bg-purple-600 hover:bg-purple-700` for admin actions, `bg-green-600 hover:bg-green-700` for approve, `variant="destructive"` for reject

---

## 1. Data Model — Replace AppContext.tsx entirely

Remove the old flat `Patient` type and replace with the following. Keep all existing `Medicine` and `Invoice` types unchanged.

```typescript
// New types to add

export type SplitInterval = 1 | 2 | 3 | 6; // months between pickups

export type PickupStatus =
  | 'awaiting_stock'   // stock not yet available
  | 'slot_available'   // stock confirmed, patient must book slot
  | 'slot_booked'      // slot chosen, invoice generated
  | 'collected'        // itemReceived = true
  | 'expired';         // prescription window passed without collection

export interface Pickup {
  id: string;
  pickupNumber: number;          // e.g. 1, 2, 3
  totalPickups: number;          // e.g. 3 (for "1 of 3")
  dueDate: string;               // ISO date — approvedDate + (n * interval months)
  status: PickupStatus;
  slotDate: string | null;
  slotTime: string | null;       // e.g. "10:00", "10:30" ... "17:30"
  invoice: Invoice | null;
  itemReceived: boolean;
}

export type PrescriptionApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Prescription {
  id: string;
  uploadDate: string;
  prescriptionUrl: string;
  doctorName: string;
  hospitalName: string;
  splitInterval: SplitInterval;  // patient chosen at upload
  totalPickups: number;          // 6 / splitInterval
  approvalStatus: PrescriptionApprovalStatus;
  rejectionReason: string | null;
  approvedDate: string | null;
  expiryDate: string | null;     // approvedDate + 6 months
  pickups: Pickup[];
}

export interface Patient {
  id: string;
  patientId: string;             // uid — derived from mobile number, e.g. "UID9876543210"
  mobile: string;                // unique identifier
  email: string | null;
  name: string;
  dateOfBirth: string;
  aadhaarNumber: string | null;
  incomeDocumentUrl: string | null;
  incomeLevel: 'low' | 'medium' | 'high' | null;
  discountPercentage: number;    // 0-100, set by admin at KYC approval
  kycStatus: 'pending' | 'approved' | 'rejected';
  registrationDate: string;
  prescriptions: Prescription[]; // full history, newest last
}
```

**Derived helpers to add to context:**
```typescript
// Get the patient's currently active prescription (latest approved, not expired, not all pickups collected)
function getActivePrescription(patient: Patient): Prescription | null

// Get the next pending pickup for a prescription
function getNextPickup(prescription: Prescription): Pickup | null

// Check if all medicines in a pickup's invoice are in stock
function isStockAvailable(invoice: Invoice, inventory: Medicine[]): boolean
```

**Medicine type — add one field:**
```typescript
export interface Medicine {
  // ... all existing fields unchanged ...
  stockQuantity: number; // NEW — integer, units in stock
}
```
Add `stockQuantity: 50` as default for all existing seed medicines.

---

## 2. AppContext — Actions to implement

Keep all existing admin inventory actions (`addMedicine`, `removeMedicine`, `updateMedicine`, `updateMedicineDiscount`).
Keep `adminLogin`, `logout`.
Replace all patient actions with the following:

```typescript
// Auth
registerPatient(mobile: string, email?: string): void
verifyOTP(otp: string): boolean  // any 6-digit OTP accepted (mock)

// KYC — only called once for new patients
submitKYC(name: string, dob: string, aadhaar: string, file: File): void

// Prescription cycle
uploadPrescription(file: File, doctorName: string, hospitalName: string, splitInterval: SplitInterval): void
// Creates a new Prescription with status 'pending', calculates totalPickups = 6 / splitInterval

// Admin prescription approval
approvePrescription(patientId: string, prescriptionId: string): void
// Sets approvalStatus = 'approved', approvedDate = today, expiryDate = today + 6 months
// Generates all Pickup objects with dueDate = approvedDate + (n * splitInterval months), status = 'awaiting_stock'
// Immediately calls checkAndActivatePickups for the patient

rejectPrescription(patientId: string, prescriptionId: string, reason: string): void

// Stock check — called after admin approves prescription AND after admin updates stock
checkAndActivatePickups(patientId: string): void
// For each pickup with status 'awaiting_stock' where dueDate <= today:
//   if all medicines in inventory have stockQuantity > 0 → set status = 'slot_available'
// Also expire any pickups where dueDate is past expiryDate

// Slot booking — patient picks from available slots
bookPickupSlot(patientId: string, prescriptionId: string, pickupId: string, date: string, time: string): void
// Sets slotDate, slotTime, status = 'slot_booked'
// Generates invoice for this pickup (same logic as existing generateInvoice but scoped to pickup)
// Does NOT reserve stock — stock is only consumed on collection

// Reschedule — releases old slot, patient picks new one
reschedulePickup(patientId: string, prescriptionId: string, pickupId: string, newDate: string, newTime: string): void
// Updates slotDate and slotTime, status stays 'slot_booked'

// Collection — admin marks received
markPickupCollected(patientId: string, prescriptionId: string, pickupId: string): void
// Sets itemReceived = true, status = 'collected'
// Deducts 1 unit from each medicine's stockQuantity for medicines in the pickup's invoice
// Calls checkAndActivatePickups to potentially unblock the next pickup

// Slot availability — returns array of booked "date|time" strings across all patients
getBookedSlots(): string[]  // e.g. ["2026-03-15|10:00", "2026-03-15|10:30"]
```

**Slot grid logic:**
- Available times: 10:00, 10:30, 11:00 ... 17:30 (16 slots per day)
- A slot is unavailable if it appears in `getBookedSlots()`
- Both patient booking and rescheduling use this same pool

**KYC gate:**
- `verifyOTP` checks if patient already exists by mobile
- If patient exists AND `kycStatus === 'approved'` → skip KYC, go straight to dashboard
- If patient is new OR `kycStatus !== 'approved'` → show KYC form

---

## 3. Patient Flow — Screen by screen

### PatientLogin.tsx — minor change
Keep existing mobile + OTP two-step form exactly as-is visually.
After successful OTP verification:
- If patient exists and `kycStatus === 'approved'` → render PatientDashboard
- If patient is new or KYC incomplete → render PatientDetailsForm
- If patient KYC is pending → render KYC pending screen (same as existing, blue color)
- If patient KYC rejected → render rejection screen (same as existing)

### PatientDetailsForm.tsx — no visual changes needed
Keep all existing fields: Full Name, DOB, Aadhaar, income document upload.
Change submit handler to call `submitKYC()` instead of `updatePatientKYC()`.
This screen is shown exactly once — never again after `kycStatus === 'approved'`.

### PatientDashboard.tsx — significant logic change
The dashboard now has two sections side by side on desktop, stacked on mobile:

**Section 1 — Active Prescription Panel**
Shows the current active prescription's pickup timeline as a vertical stepper:
- Each step = one Pickup
- Step label: "Pickup 1 of 3 — Due Mar 15"
- Step status badge using existing badge colors:
  - `awaiting_stock` → yellow badge "Awaiting Stock"
  - `slot_available` → blue badge "Book Slot" with a Book button
  - `slot_booked` → purple badge "Slot Booked — Mar 15 at 2:00 PM" with a Reschedule button
  - `collected` → green badge "Collected ✓"
  - `expired` → gray badge "Expired"
- Only show Book / Reschedule buttons on the current active pickup (the first non-collected, non-expired one)
- If no active prescription: show "Upload Prescription" card (see below)
- If prescription is pending admin approval: show "Prescription Under Review" card with Clock icon, purple accent

**Section 2 — Upload Prescription** (only shown if no active or pending prescription)
Keep existing upload UI exactly — drag-drop area, doctor name, hospital name.
Add below the existing fields:

```
Pickup Schedule
[Every month (6 pickups)]  [Every 2 months (3 pickups)]
[Every 3 months (2 pickups)]  [One bulk pickup]
```
As a 4-option radio/toggle group styled with `border-gray-200 rounded-lg p-3`, active state `border-blue-600 bg-blue-50`.
Selected interval shown in text: "Your medicines will be split into X pickups, approximately every Y months."

### SlotBookingModal.tsx — NEW component
Triggered by "Book Slot" or "Reschedule" button on the dashboard.
Renders as a Dialog (use existing Dialog component from shadcn/ui).

**Inside the dialog:**
- Title: "Book Pickup Slot" or "Reschedule Pickup"
- Date picker: use existing Calendar component. Disable past dates and dates > expiryDate.
- Time grid: render 16 buttons in a 4-column grid for times 10:00–17:30 in 30-min intervals.
  - Available: `border-gray-200 bg-white hover:border-blue-600 hover:bg-blue-50`
  - Booked by others: `bg-gray-100 text-gray-400 cursor-not-allowed opacity-50`
  - Selected: `border-blue-600 bg-blue-600 text-white`
- Confirm button: "Confirm Slot" — `bg-blue-600 hover:bg-blue-700`
- On confirm, call `bookPickupSlot()` or `reschedulePickup()`

### InvoiceDisplay.tsx — minor change
Keep existing invoice display visually unchanged.
Add a "Download Invoice" button at the bottom: `variant="outline"` with a Download icon.
Mock download: `window.open(invoice.invoiceUrl || '#', '_blank')` or generate a simple text blob.

### PatientHistory.tsx — NEW component
Accessible via a "History" tab or button in the patient dashboard header.
Shows a chronological list of all prescriptions (newest first).

For each prescription:
- Card with: Upload date, Doctor name, Hospital name, Status badge
- If approved: show expiry date and a mini pickup list
  - Each pickup row: "Pickup N — [date] — [status badge]"
  - If collected: show "Download Invoice" link/button next to it (same style as InvoiceDisplay download button)
- If rejected: show rejection reason in a `bg-red-50 border-red-200 rounded` callout

Navigation: Add a "History" button to the patient dashboard header, next to the logout button. Same style as the existing logout button (`variant="outline"`), with a History/Clock icon.

---

## 4. Admin Flow — Screen by screen

### AdminDashboard.tsx — add a tab
Change the Tabs from 3 to 4:
```
Approvals | Prescriptions | Patients | Inventory
```
- "Approvals" = KYC queue (existing ApprovalsList, no visual change)
- "Prescriptions" = NEW PrescriptionApprovalsList
- "Patients" = upgraded PatientList (see below)
- "Inventory" = existing InventoryManagement with stock field added

### PrescriptionApprovalsList.tsx — NEW component
Same visual pattern as existing ApprovalsList.
Lists all prescriptions across all patients where `approvalStatus === 'pending'`.

Each row (desktop table) or card (mobile) shows:
- Patient name, Patient ID, mobile
- Upload date
- Doctor name, Hospital name
- View Prescription link (same pattern as existing KYC document link)
- Split interval: "Every 2 months (3 pickups)"
- Approve button: `bg-green-600 hover:bg-green-700`
- Reject button: `variant="destructive"`

Reject triggers a Dialog (same pattern as existing approval dialog) with a text input for rejection reason. Required field before confirming.

Approve has no dialog — immediate on click, calls `approvePrescription()`.

### PatientList.tsx — upgrade to profile view
Remove the edit functionality for slot dates (admin has no slot control).
Add a "View Profile" button on each patient row that opens a Dialog (or a new full-screen panel).

**Patient Profile Dialog:**
- Header: Patient name, UID, mobile, Aadhaar, income level, discount %
- Section: KYC status badge
- Section: "Prescription History" — same list as PatientHistory on the patient side but read-only, no download buttons
- Section: "Pickup History" — flat list of all collected pickups across all prescriptions with dates and invoice reference numbers
- "Mark Collected" button on any pickup that is `slot_booked` → calls `markPickupCollected()`
- This replaces the existing "Mark as Received" functionality

Keep the existing mobile/desktop responsive pattern.
Keep the existing Pending / Collected tab split but now based on pickup status, not `itemReceived`.

### InventoryManagement.tsx — add stock quantity
Add `stockQuantity` field to the Add Medicine form and the Edit Medicine dialog.
Label: "Stock Quantity (units)"
Input: number, min 0
Display it as a column in the desktop table and a row in mobile cards.
When admin saves a medicine update with increased `stockQuantity`, call `checkAndActivatePickups` for all patients (to unblock any awaiting_stock pickups).

---

## 5. File structure — new files to create

```
src/app/components/patient/
  PatientDetailsForm.tsx       — exists, minor change
  PrescriptionUploadForm.tsx   — exists, add interval selector
  InvoiceDisplay.tsx           — exists, add download button
  SlotBookingModal.tsx         — NEW
  PatientHistory.tsx           — NEW
  PatientDashboard.tsx         — exists, significant change

src/app/components/admin/
  ApprovalsList.tsx            — exists, no change
  PrescriptionApprovalsList.tsx — NEW
  PatientList.tsx              — exists, upgrade profile view
  InventoryManagement.tsx      — exists, add stockQuantity
  AdminDashboard.tsx           — exists, add tab

src/app/context/
  AppContext.tsx                — full rewrite
```

---

## 6. Seed data — update mock patients

Replace the 3 existing seed patients with the following to cover all states:

**Patient 1 — Approved KYC, active prescription, one pickup collected, one slot_booked:**
```typescript
{
  patientId: 'UID9999999999',
  mobile: '9999999999',
  name: 'John Smith',
  kycStatus: 'approved',
  incomeLevel: 'medium',
  discountPercentage: 50,
  prescriptions: [{
    splitInterval: 2,
    totalPickups: 3,
    approvalStatus: 'approved',
    approvedDate: // 2 months ago
    expiryDate: // 4 months from now
    pickups: [
      { pickupNumber: 1, status: 'collected', itemReceived: true, slotDate: // 2 months ago },
      { pickupNumber: 2, status: 'slot_booked', slotDate: // tomorrow, slotTime: '10:00' },
      { pickupNumber: 3, status: 'awaiting_stock' }
    ]
  }]
}
```

**Patient 2 — Approved KYC, prescription pending admin approval:**
```typescript
{
  patientId: 'UID8888888888',
  mobile: '8888888888',
  name: 'Jane Doe',
  kycStatus: 'approved',
  discountPercentage: 70,
  prescriptions: [{
    approvalStatus: 'pending',
    splitInterval: 1,
    totalPickups: 6,
    pickups: []
  }]
}
```

**Patient 3 — KYC pending:**
```typescript
{
  patientId: 'UID7777777777',
  mobile: '7777777777',
  name: 'Bob Wilson',
  kycStatus: 'pending',
  prescriptions: []
}
```

**Patient 4 — Approved KYC, no prescriptions yet (new approved patient):**
```typescript
{
  patientId: 'UID6666666666',
  mobile: '6666666666',
  name: 'Priya Sharma',
  kycStatus: 'approved',
  discountPercentage: 30,
  prescriptions: []
}
```

---

## 7. Behaviour rules — implement exactly as described

1. **No re-KYC.** Once `kycStatus === 'approved'`, the KYC form is never shown again for that mobile number. OTP login is sufficient to access the dashboard.

2. **One active prescription at a time.** Patient cannot upload a new prescription while one is pending approval or has uncollected/unexpired pickups. Show a message explaining this.

3. **Slot pool is shared.** A slot (date + time) booked by any patient is unavailable to all others. `getBookedSlots()` must aggregate across all patients, all prescriptions, all pickups.

4. **Stock is not reserved upfront.** Stock is only deducted when a pickup is marked collected. Approving a prescription does not touch stock numbers.

5. **Stock check triggers.** Call `checkAndActivatePickups` in two places: (a) when admin approves a prescription, (b) when admin saves an inventory update that increases `stockQuantity`.

6. **Pickup activation timing.** A pickup becomes eligible (moves from `awaiting_stock` to `slot_available`) only when BOTH conditions are true: its `dueDate <= today` AND stock is available.

7. **Expiry.** On each dashboard load, run a pass that sets any pickup with `dueDate > expiryDate` and status not `collected` to `expired`.

8. **Prescription rejection → re-upload allowed.** After rejection, patient sees the rejection reason and a fresh PrescriptionUploadForm. The rejected prescription stays in history.

9. **Rescheduling.** Patient can reschedule any `slot_booked` pickup to any available slot before the prescription expiry date. No limit on number of reschedules.

10. **Invoice generation timing.** Invoice is generated at slot booking time (not at prescription approval time), scoped to that specific pickup. Apply the patient's `discountPercentage` and 5% tax logic exactly as the existing `generateInvoice()` function.

11. **History is read-only for patients.** No actions in history — only viewing and invoice download.

12. **Admin marks collection, not patient.** The "Mark Collected" action lives only in the admin Patient Profile view.

---

## 8. What NOT to change

- `LandingPage.tsx` — no changes
- `PatientLogin.tsx` — only the post-OTP routing logic changes, all UI stays identical  
- All files in `src/app/components/ui/` — do not modify any shadcn/ui primitives
- `src/styles/` — do not modify any CSS files
- `src/imports/` — do not modify
- `vite.config.ts`, `package.json`, `postcss.config.mjs` — do not modify
- Admin credentials: `admin` / `admin`
- OTP mock: any 6-digit number accepted