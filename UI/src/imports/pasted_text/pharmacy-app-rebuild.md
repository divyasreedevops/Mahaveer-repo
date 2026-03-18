# Pharmacy App — Final Rebuild Prompt
## Version 2 Changes Over Current Codebase

---

## DESIGN SYSTEM — DO NOT CHANGE ANYTHING BELOW

These are locked. Touch nothing in `src/styles/`, `src/app/components/ui/`, or `src/imports/`.

**Colors in use (keep exactly):**
- Patient portal accent: `blue-600`, `blue-50`, `blue-700`
- Admin portal accent: `purple-600`, `purple-50`, `purple-700`
- Success: `green-600`, `green-50`, `green-700`
- Destructive: use `variant="destructive"` (maps to `#d4183d`)
- Warning: `yellow-50`, `yellow-700`
- Text: `gray-800` primary, `gray-600` secondary, `gray-500` muted
- Backgrounds: `blue-50` page bg, `white` cards
- Borders: `border-gray-100` default, `border-gray-200` inputs

**Typography:** `font-normal` for body/titles, `font-light` for descriptions/meta, `font-medium` for labels only

**Cards:** `rounded-2xl shadow-lg border-gray-100` — used everywhere

**Buttons:**
- Primary patient action: `bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-300 font-normal`
- Primary admin action: `bg-purple-600 hover:bg-purple-700`
- Approve: `bg-green-600 hover:bg-green-700`
- Reject: `variant="destructive"`
- Secondary: `variant="outline" className="border-gray-100 font-normal"`

**Layout:** All pages use `min-h-screen bg-blue-50` with a white `border-b border-gray-100 shadow-sm` header. Main content uses `container mx-auto px-4 py-8`.

**Transitions:** `transition-all duration-300` on interactive elements. Page/section transitions use CSS opacity + translate: enter with `opacity-0 translate-y-2` → `opacity-100 translate-y-0` over 300ms.

---

## GLOBAL LAYOUT & UI IMPROVEMENTS

Apply these across every screen. This is the most important section.

### Centering & max-width
Every page's main content must be horizontally centered with generous max-widths:
- Full-page forms (KYC, login, prescription upload): `max-w-lg mx-auto`
- Dashboard panels: `max-w-5xl mx-auto`
- Admin tables: `max-w-6xl mx-auto`
- History views: `max-w-3xl mx-auto`

Never allow content to stretch edge-to-edge on wide screens.

### Smooth transitions
Add a fade+slide transition whenever the view changes — between login steps, between dashboard states, between tabs. Use this wrapper pattern:

```tsx
// Wrap each "view" in this div — change the key to trigger re-animation
<div
  key={viewKey}
  className="animate-in fade-in slide-in-from-bottom-2 duration-300"
>
  {content}
</div>
```

Add to `src/styles/index.css` (after existing imports):
```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-in { animation: fadeSlideIn 0.3s ease-out both; }
.fade-in { animation-name: fadeSlideIn; }
.slide-in-from-bottom-2 { --tw-translate-y: 8px; }
.duration-300 { animation-duration: 0.3s; }
```

### Header cleanup
Every header follows this exact pattern — consistent across all pages:
```tsx
<header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
  <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-6xl">
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-[portal-color]" />
      <h1 className="text-xl text-gray-800 font-normal tracking-tight">Title</h1>
    </div>
    <div className="flex items-center gap-2">
      {/* right side actions */}
    </div>
  </div>
</header>
```

### Card spacing
All cards use `p-6` padding internally (CardContent uses `px-6 pb-6`). Sections within cards are separated with `space-y-6`. Form fields use `space-y-5`.

### Empty states
All empty states (no pending approvals, no history, etc.) must be centered, vertically padded with `py-16`, icon at `w-10 h-10 text-gray-300 mx-auto mb-3`, message in `text-sm text-gray-400 font-light`.

---

## CHANGES TO AppContext.tsx

The current `AppContext.tsx` is mostly correct but needs these specific changes:

### 1. Remove `SplitInterval` type and all references
Delete:
```typescript
export type SplitInterval = 1 | 2 | 3 | 6;
```

### 2. Replace `Prescription` interface
Replace `splitInterval` and `totalPickups` with `totalCollections`:
```typescript
export interface Prescription {
  id: string;
  uploadDate: string;
  prescriptionUrl: string;
  doctorName: string;
  hospitalName: string;
  totalCollections: number;    // patient chosen: 1–12
  approvalStatus: PrescriptionApprovalStatus;
  rejectionReason: string | null;
  approvedDate: string | null;
  expiryDate: string | null;   // approvedDate + 6 months
  pickups: Pickup[];
}
```

### 3. Replace `Pickup` interface
Remove `dueDate` and `totalPickups`. Simplify to patient-initiated model:
```typescript
export interface Pickup {
  id: string;
  pickupNumber: number;
  totalPickups: number;        // copy of prescription.totalCollections for display
  status: PickupStatus;
  slotDate: string | null;
  slotTime: string | null;
  bookedAt: string | null;     // ISO timestamp when slot was booked — for 7-day expiry
  invoice: Invoice | null;
  itemReceived: boolean;
}
```

### 4. Update `uploadPrescription` signature
```typescript
uploadPrescription: (file: File, doctorName: string, hospitalName: string, totalCollections: number) => void;
```
Implementation: creates Prescription with `totalCollections`, empty `pickups: []`, `approvalStatus: 'pending'`.

### 5. Update `approvePrescription`
On approval, generate only the FIRST pickup (not all of them):
```typescript
const approvePrescription = (patientId: string, prescriptionId: string) => {
  // ... find patient and prescription ...
  const approvedDate = new Date();
  const expiryDate = addMonths(approvedDate, 6);

  // Create only pickup #1
  const firstPickup: Pickup = {
    id: `pickup-${prescriptionId}-1`,
    pickupNumber: 1,
    totalPickups: prescription.totalCollections,
    status: 'slot_available',   // immediately available, no stock gate on first pickup
    slotDate: null,
    slotTime: null,
    bookedAt: null,
    invoice: null,
    itemReceived: false,
  };

  const updatedPrescription = {
    ...prescription,
    approvalStatus: 'approved',
    approvedDate: approvedDate.toISOString(),
    expiryDate: expiryDate.toISOString(),
    pickups: [firstPickup],
  };
  // ... update state ...
};
```

### 6. Add `startNextCollection` action
Called by patient from History after a pickup is collected. Creates the next pickup:
```typescript
startNextCollection: (patientId: string, prescriptionId: string) => void;
```
Implementation:
```typescript
const startNextCollection = (patientId: string, prescriptionId: string) => {
  const patient = allPatients.find(p => p.patientId === patientId);
  const prescription = patient?.prescriptions.find(p => p.id === prescriptionId);
  if (!patient || !prescription) return;

  const nextNumber = prescription.pickups.length + 1;
  if (nextNumber > prescription.totalCollections) return; // all collections used

  const newPickup: Pickup = {
    id: `pickup-${prescriptionId}-${nextNumber}`,
    pickupNumber: nextNumber,
    totalPickups: prescription.totalCollections,
    status: 'slot_available',
    slotDate: null,
    slotTime: null,
    bookedAt: null,
    invoice: null,
    itemReceived: false,
  };

  // Update prescription with new pickup appended
  // ... update allPatients and currentPatient ...
};
```

### 7. Update `bookPickupSlot` — set `bookedAt`
```typescript
const bookPickupSlot = (...) => {
  // existing logic, plus:
  // set bookedAt: new Date().toISOString() on the pickup
};
```

### 8. Add `checkPickupExpiry` — 7-day rule
Run this on dashboard mount (useEffect in PatientDashboard):
```typescript
const checkPickupExpiry = (patientId: string) => void;
```
Logic: for any pickup with `status === 'slot_booked'` and `bookedAt` set, if `new Date() > new Date(bookedAt) + 7 days`, set `status = 'expired'`. Does NOT consume the collection — the pickup number is just expired; patient must start a new collection from history.

### 9. Update `getBookedSlots` — exclude expired
Only include slots where `status === 'slot_booked'` (not expired, not collected).

### 10. Remove `checkAndActivatePickups` entirely
No longer needed — stock gate is removed, patient initiates each collection manually.

### 11. Update seed data — Patient 1
Change `splitInterval: 2, totalPickups: 3` to `totalCollections: 6` and update pickups to remove `dueDate`, add `bookedAt`:
```typescript
prescriptions: [{
  id: 'presc-1',
  totalCollections: 6,
  approvalStatus: 'approved',
  approvedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  expiryDate: addMonths(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), 6).toISOString(),
  pickups: [
    {
      id: 'pickup-1-1', pickupNumber: 1, totalPickups: 6,
      status: 'collected', itemReceived: true,
      slotDate: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      slotTime: '10:00',
      bookedAt: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString(),
      invoice: { invoiceNumber: 'INV-001', invoiceUrl: '#', items: [], subtotal: 5000, taxes: 250, discount: 2500, grandTotal: 2750 },
    },
    {
      id: 'pickup-1-2', pickupNumber: 2, totalPickups: 6,
      status: 'slot_booked', itemReceived: false,
      slotDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      slotTime: '14:30',
      bookedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      invoice: { invoiceNumber: 'INV-002', invoiceUrl: '#', items: [], subtotal: 5000, taxes: 250, discount: 2500, grandTotal: 2750 },
    },
  ],
}]
```

### 12. Add `startNextCollection` and `checkPickupExpiry` to context value object

---

## CHANGES TO PrescriptionUploadForm.tsx

### Remove the interval selector entirely
Delete the `intervalOptions` array, the `splitInterval` state, the `SplitInterval` import, and the entire "Pickup Schedule" section with the 4-option grid.

### Add collection count selector
Replace with a number picker for how many times patient wants to collect:

```tsx
{/* Number of Collections */}
<div className="space-y-3 pt-2">
  <Label className="text-gray-700 font-normal">How many times do you need to collect?</Label>
  <p className="text-xs text-gray-500 font-light -mt-1">
    Based on your prescription — maximum 12 collections within 6 months
  </p>
  <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-4">
    <button
      type="button"
      onClick={() => setTotalCollections(c => Math.max(1, c - 1))}
      className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-lg font-light"
    >−</button>
    <div className="text-center">
      <span className="text-3xl font-normal text-gray-800">{totalCollections}</span>
      <p className="text-xs text-gray-500 font-light mt-0.5">
        collection{totalCollections > 1 ? 's' : ''}
      </p>
    </div>
    <button
      type="button"
      onClick={() => setTotalCollections(c => Math.min(12, c + 1))}
      className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors text-lg font-light"
    >+</button>
  </div>
  <p className="text-xs text-gray-600 font-light bg-blue-50 border border-blue-100 p-3 rounded-lg">
    Your first slot will be available immediately after admin approval.
    Each subsequent collection is started from your History.
  </p>
</div>
```

State: `const [totalCollections, setTotalCollections] = useState(6);`

Update `handleUpload` to call `uploadPrescription(selectedFile, doctorName, hospitalName, totalCollections)`.

---

## CHANGES TO SlotBookingModal.tsx

This is the most significant UI change — PVR-style seat map grid.

### Replace the entire component with the following structure:

```tsx
// Time slot generation — 10:00 to 17:30 with 1hr lunch break (13:00-14:00 blocked)
const ALL_SLOTS = [
  '10:00','10:30','11:00','11:30','12:00','12:30',
  // 13:00 and 13:30 = lunch break, not generated
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'
];
// 14 slots total per day
```

### Layout inside Dialog:
- Dialog size: `max-w-2xl`
- Two sections stacked vertically (not side by side):

**Section 1 — Date selection (horizontal scrollable row)**
```tsx
<div className="space-y-2">
  <p className="text-xs text-gray-500 font-light uppercase tracking-wide">Select Date</p>
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {next14Days.map(date => (
      <button
        key={date}
        onClick={() => setSelectedDate(date)}
        className={`flex-shrink-0 w-14 py-3 rounded-xl border text-center transition-all
          ${isSelectedDate
            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'
          }`}
      >
        <p className="text-[10px] font-light">{dayName}</p>   {/* MON TUE etc */}
        <p className="text-lg font-normal leading-tight">{dayNum}</p>  {/* 14 15 etc */}
        <p className="text-[10px] font-light">{monthName}</p>  {/* MAR APR etc */}
      </button>
    ))}
  </div>
</div>
```
Generate `next14Days` as an array of date strings starting from tomorrow, excluding dates past prescription expiry.

**Section 2 — Time grid (PVR-style)**
```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
      Select Time — {selectedDate formatted as "Mon, Mar 14"}
    </p>
    <div className="flex items-center gap-3 text-[10px] font-light text-gray-400">
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-white border border-gray-200 inline-block"/>Available</span>
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 inline-block"/>Taken</span>
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"/>Selected</span>
    </div>
  </div>

  {/* Morning row */}
  <div className="space-y-1">
    <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Morning</p>
    <div className="grid grid-cols-6 gap-1.5">
      {MORNING_SLOTS.map(slot => <TimeSlotButton />)}
    </div>
  </div>

  {/* Lunch break indicator */}
  <div className="flex items-center gap-2 py-1">
    <div className="flex-1 h-px bg-gray-100"/>
    <span className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Lunch 1:00 – 2:00 PM</span>
    <div className="flex-1 h-px bg-gray-100"/>
  </div>

  {/* Afternoon row */}
  <div className="space-y-1">
    <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Afternoon</p>
    <div className="grid grid-cols-5 gap-1.5">
      {AFTERNOON_SLOTS.map(slot => <TimeSlotButton />)}
    </div>
  </div>
</div>
```

**TimeSlotButton styling:**
```tsx
// Available
"px-2 py-2.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-700
 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer font-normal"

// Booked by others
"px-2 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-xs text-gray-300
 cursor-not-allowed line-through font-light"

// Selected
"px-2 py-2.5 rounded-lg border border-blue-600 bg-blue-600 text-xs text-white
 shadow-sm font-normal"
```

**Footer:**
```tsx
<div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
  <div className="text-sm text-gray-600 font-light min-h-[20px]">
    {selectedDate && selectedTime
      ? <span>📅 <strong className="font-normal">{formattedDate}</strong> at <strong className="font-normal">{formattedTime}</strong></span>
      : <span className="text-gray-400">No slot selected</span>
    }
  </div>
  <div className="flex gap-2">
    <Button variant="outline" onClick={onClose} className="border-gray-100 font-normal">Cancel</Button>
    <Button
      onClick={handleConfirm}
      disabled={!selectedDate || !selectedTime}
      className="bg-blue-600 hover:bg-blue-700 shadow-sm font-normal transition-all duration-300"
    >
      Confirm Slot
    </Button>
  </div>
</div>
```

---

## CHANGES TO PatientDashboard.tsx

### Add `useEffect` for expiry check on mount
```tsx
useEffect(() => {
  if (currentPatient) {
    checkPickupExpiry(currentPatient.patientId);
  }
}, []);
```

### Remove `splitInterval` references
Anywhere the dashboard shows "Every X month(s) (N pickups)" — replace with "N collections total".

### Active prescription card — simplify the stepper
The current stepper shows all pickups. Change to show only existing pickups (since future ones aren't created yet). Add a progress indicator:

```tsx
{/* Progress bar */}
<div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
  <div className="flex-1">
    <div className="flex justify-between text-xs text-gray-500 font-light mb-1.5">
      <span>Collections used</span>
      <span>{collectedCount} of {activePrescription.totalCollections}</span>
    </div>
    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-500"
        style={{ width: `${(collectedCount / activePrescription.totalCollections) * 100}%` }}
      />
    </div>
  </div>
  <div className="text-right">
    <p className="text-xs text-gray-400 font-light">Expires</p>
    <p className="text-xs text-gray-600 font-normal">{formatDate(activePrescription.expiryDate)}</p>
  </div>
</div>
```

### Pending prescription card
Change "Every X month(s) (N pickups)" to "N collections requested".

---

## CHANGES TO PatientHistory.tsx

### Add "Start Next Collection" button
After the pickup list for an approved prescription, if all existing pickups are `collected` or `expired` AND `pickups.length < totalCollections`:

```tsx
{prescription.approvalStatus === 'approved' &&
 prescription.pickups.length < prescription.totalCollections &&
 prescription.pickups.every(p => p.status === 'collected' || p.status === 'expired') && (
  <div className="pt-4 border-t border-gray-100">
    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
      <div>
        <p className="text-sm font-normal text-gray-800">
          Ready for collection {prescription.pickups.length + 1} of {prescription.totalCollections}
        </p>
        <p className="text-xs text-gray-500 font-light mt-0.5">
          Book a slot to collect your next batch of medicines
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => {
          startNextCollection(currentPatient.patientId, prescription.id);
          onBack(); // go back to dashboard where they can book the slot
        }}
        className="bg-blue-600 hover:bg-blue-700 font-normal shadow-sm transition-all duration-300"
      >
        Start Next Collection
      </Button>
    </div>
  </div>
)}
```

### Remove `splitInterval` references
Change "Every X month(s) (N pickups)" to "N collections total".

### Add `bookedAt` display for slot_booked pickups
Below the slot date/time line, show in tiny text: "Booked on [date] — expires [date+7days]"

---

## CHANGES TO AdminDashboard.tsx

### Make header sticky
Add `sticky top-0 z-10` to the header element.

### Tab layout — responsive
On mobile, tabs should scroll horizontally. Add `overflow-x-auto` to TabsList wrapper.

---

## CHANGES TO PrescriptionApprovalsList.tsx

### Remove schedule column
Delete the "Schedule" column from both desktop table and mobile cards. Replace with "Collections":

Desktop table cell:
```tsx
<TableCell>
  <div className="text-sm text-gray-600 font-light">
    {prescription.totalCollections} collection{prescription.totalCollections > 1 ? 's' : ''}
    <p className="text-xs text-gray-400">over 6 months</p>
  </div>
</TableCell>
```

Mobile card:
```tsx
<div>
  <p className="text-gray-500 font-light">Collections</p>
  <p className="text-gray-800 font-normal mt-0.5">{prescription.totalCollections}× over 6 months</p>
</div>
```

---

## CHANGES TO PatientList.tsx

This component references the old flat Patient model. It needs a full rewrite to work with the new prescription/pickup model.

### What to show
The patient list should show all patients who have `kycStatus === 'approved'`. Organize into two tabs: **Active** (has an approved prescription with uncollected pickups) and **All Patients**.

### Remove entirely
- `updatePatientFromAdmin` — this action no longer exists
- Edit dialog with slot date/time fields
- References to `patient.invoice`, `patient.paymentStatus`, `patient.slotDate`, `patient.slotTime`, `patient.itemReceived`

### New desktop table columns
Patient ID | Name | Mobile | Income Level | Discount | Active Prescription | Current Pickup | Actions

"Current Pickup" cell shows the current active pickup's status badge and slot date if booked.

### New "View Profile" button
Opens a Dialog showing:
- Patient info: name, UID, mobile, Aadhaar, income level, discount %
- KYC status badge
- Prescription history (all prescriptions, all pickups, read-only)
- For each pickup with `status === 'slot_booked'`: a "Mark Collected" button that calls `markPickupCollected()`

### Mark Collected button styling
```tsx
<Button
  size="sm"
  onClick={() => markPickupCollected(patient.patientId, prescription.id, pickup.id)}
  className="bg-green-600 hover:bg-green-700 font-normal text-xs shadow-sm transition-all duration-300"
>
  <CheckCircle className="w-3 h-3 mr-1" />
  Mark Collected
</Button>
```

---

## CHANGES TO InventoryManagement.tsx

### Fix `updateMedicine` call signature
The context `updateMedicine` now takes `(id: string, updates: Partial<Medicine>)`. Update `handleUpdateMedicine` to call:
```typescript
updateMedicine(editingMedicine.id, {
  name, genericName, type,
  dosage: `${dosage}${dosageUnit}`,
  quantityValue: `${quantityValue} ${quantityUnit}`,
  packingInfo: packingInfo || `Package of ${quantityValue} ${quantityUnit}`,
  disease,
  price: parseFloat(price),
  discount: discountValue || undefined,
  substitutes: substitutes ? substitutes.split(',').map(s => s.trim()).filter(s => s) : undefined,
  stockQuantity: parseInt(stockQuantity),
});
```
(Not the old signature that took a full Medicine object.)

No other changes to InventoryManagement.

---

## CHANGES TO PatientDetailsForm.tsx

No logic changes. Apply layout improvements:
- Wrap the Card in `<div className="animate-in fade-in slide-in-from-bottom-2 duration-300">`
- Card max-width: `max-w-lg mx-auto`
- Increase internal spacing to `space-y-5`

---

## CHANGES TO PatientLogin.tsx

No logic changes. Apply layout improvements:
- Animate the step change (mobile → otp) with `key={step}` on the form content wrapper
- Center the card: `max-w-sm mx-auto`
- Add `animate-in fade-in slide-in-from-bottom-2 duration-300` to the card

---

## FILES TO NOT TOUCH

- `src/app/App.tsx`
- `src/app/components/LandingPage.tsx`
- `src/app/components/admin/AdminLogin.tsx`
- `src/app/components/admin/ApprovalsList.tsx` (KYC approvals — already correct)
- `src/app/components/patient/InvoiceDisplay.tsx`
- `src/app/components/patient/InvoiceView.tsx`
- `src/app/components/patient/PatientRegistration.tsx`
- `src/app/components/patient/PatientDetails.tsx`
- `src/app/components/patient/SlotBooking.tsx` (superseded by SlotBookingModal)
- `src/app/components/patient/PrescriptionUpload.tsx`
- `src/app/components/patient/HomePage.tsx`
- `src/app/components/patient/PatientFlow.tsx`
- All `src/app/components/ui/` files
- All `src/imports/` files
- All `src/styles/` files (except adding the animation keyframes to index.css)
- `src/main.tsx`, `index.html`, `vite.config.ts`, `package.json`, `postcss.config.mjs`

---

## IMPLEMENTATION ORDER

Do these in order to avoid broken intermediate states:

1. `AppContext.tsx` — new types and actions
2. `src/styles/index.css` — add animation keyframes
3. `PrescriptionUploadForm.tsx` — remove interval selector, add collection counter
4. `SlotBookingModal.tsx` — full PVR-style rewrite
5. `PatientHistory.tsx` — add startNextCollection button, remove splitInterval refs
6. `PatientDashboard.tsx` — expiry check, simplify stepper, remove splitInterval refs
7. `PrescriptionApprovalsList.tsx` — update columns
8. `PatientList.tsx` — full rewrite for new data model
9. `InventoryManagement.tsx` — fix updateMedicine call signature
10. `PatientDetailsForm.tsx` + `PatientLogin.tsx` — layout polish only

---

## BEHAVIOUR RULES (unchanged from previous spec)

1. **No re-KYC.** Once `kycStatus === 'approved'`, KYC form never appears again.
2. **One active prescription.** Patient cannot upload while one is pending or has active pickups.
3. **Slot pool is shared.** `getBookedSlots()` aggregates across ALL patients, ALL prescriptions, ALL pickups with `status === 'slot_booked'`.
4. **First pickup auto-activates on prescription approval** (`status = 'slot_available'` immediately).
5. **Subsequent pickups are patient-initiated** from History → "Start Next Collection".
6. **7-day collection window.** If `status === 'slot_booked'` and now > `bookedAt + 7 days`, set `status = 'expired'`. The collection slot is NOT permanently consumed — patient must start next collection manually.
7. **Prescription hard expiry at 6 months.** Any uncollected/un-started pickups are simply inaccessible after expiry.
8. **Prescription rejection → re-upload allowed.** Rejected prescription stays in history. Patient can upload new one.
9. **No slot control for admin.** Admin only marks pickups as collected.
10. **Invoice generated at slot booking time**, scoped to that pickup, using patient's `discountPercentage` and 5% tax.
11. **Admin credentials:** `admin` / `admin`. **OTP:** any 6-digit number.