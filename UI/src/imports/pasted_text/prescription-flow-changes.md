# Prescription Flow Redesign — One-Shot Fulfilment with Notify & Missing Medicine

---

## Summary of What Changes

1. Remove `totalCollections` — every prescription is now a single one-shot fulfilment
2. Remove `startNextCollection` — no repeat collections
3. Admin gets two actions on a prescription: Approve and Notify (for missing stock)
4. Patient sees two cards after approval: Invoice or Missing Medicine
5. Invoice leads to payment then slot booking
6. Missing Medicine shows a list of out-of-stock medicines and generates a downloadable PDF notice
7. Patient confirms collection from their end after visiting the pharmacy

---

## 1. AppContext.tsx — Data Model Changes

### Remove from `Prescription` interface
Remove the `totalCollections` field entirely.

### Remove from `Pickup` interface
Remove `pickupNumber` and `totalPickups` — there is now only ever one pickup per prescription.

### Update `PickupStatus` type
Replace the entire type with:
```
'invoice_ready'       — admin approved, invoice generated, patient must review and pay
'payment_pending'     — patient initiated payment, processing
'slot_available'      — payment confirmed, patient can now book a slot
'slot_booked'         — slot chosen
'collection_confirmed'— patient confirmed they collected
'collected'           — admin finalised collection
'missing_medicine'    — admin sent a notify, some medicines are out of stock
'expired'             — slot_booked for 7 days without collection
```

### Add to `Prescription` interface
Add a `missingMedicines` field:
```typescript
missingMedicines: string[]; // list of medicine names that are out of stock, empty by default
```

### Add to `Pickup` interface
Add a `paymentMethod` field:
```typescript
paymentMethod: string | null; // 'UPI' | 'Card' | 'Net Banking' | null
```

### Update `uploadPrescription`
Remove the `totalCollections` parameter. The function signature becomes:
```typescript
uploadPrescription(file, doctorName, hospitalName)
```
When creating the new prescription, set `missingMedicines: []` and no `totalCollections`.

### Update `approvePrescription`
When admin approves, create one single pickup (no loop, no totalCollections). Generate the invoice immediately at approval time using `generateInvoiceForPickup`. Set the pickup status to `invoice_ready` with the invoice already attached. Set `paymentMethod: null`.

### Add `notifyMissingMedicine` action
```typescript
notifyMissingMedicine(patientId: string, prescriptionId: string, missingMedicineNames: string[]): void
```
This sets the prescription's `missingMedicines` to the provided array and sets the single pickup's status to `missing_medicine`. The prescription `approvalStatus` stays `'approved'` — it is approved but partially unfulfillable right now.

### Add `initiatePayment` action
```typescript
initiatePayment(patientId: string, prescriptionId: string, pickupId: string, paymentMethod: string): void
```
Sets pickup status to `payment_pending` and sets `paymentMethod`. After a 1500ms setTimeout, automatically calls `confirmPayment` internally to simulate processing.

### Add `confirmPayment` action (internal + exposed)
```typescript
confirmPayment(patientId: string, prescriptionId: string, pickupId: string): void
```
Sets pickup status from `payment_pending` to `slot_available`.

### Add `patientConfirmCollection` action
```typescript
patientConfirmCollection(patientId: string, prescriptionId: string, pickupId: string): void
```
Sets pickup status from `slot_booked` to `collection_confirmed`.

### Update `markPickupCollected`
Only works when pickup status is `collection_confirmed`. Sets status to `collected`, `itemReceived` to true, deducts stock from medicines inventory. Unchanged otherwise.

### Remove entirely
Remove `startNextCollection` action and its type declaration.

### Add all new actions to `AppContextType` interface and to the `value` object.

### Update seed data for Patient 1 (UID9999999999)
Replace the two prescriptions with two clean single-pickup prescriptions that demonstrate different states:

Prescription 1 — Dr. Sarah Johnson, City General Hospital. Status approved. Single pickup with status `invoice_ready`, invoice already attached with realistic values (subtotal 5000, discount 2500, tax 125, grandTotal 2625). `missingMedicines: []`.

Prescription 2 — Dr. Rajesh Sharma, Apollo Specialty Center. Status approved. Single pickup with status `missing_medicine`. `missingMedicines: ['Amoxicillin Capsules', 'Cetirizine Tablets']`.

This way logging in as 1111111111 immediately shows both states.

---

## 2. PrescriptionUploadForm.tsx

Remove the collections dropdown entirely — the `totalCollections` state, the Select component for it, and its label and hint text below it. The form now has only: file upload, doctor name, hospital name, and the Upload button. Update the `handleUpload` call to `uploadPrescription(file, doctorName, hospitalName)` with no fourth argument.

---

## 3. PrescriptionApprovalsList.tsx — Admin Actions

### Add Notify button alongside Approve and Reject

The Notify button appears in amber/orange: `bg-amber-500 hover:bg-amber-600`. It opens a new dialog.

### Notify Dialog
When admin clicks Notify, open a dialog that shows:
- Title: "Notify Patient — Missing Medicine"
- A checklist of all medicines currently in the inventory with `stockQuantity === 0`. Each medicine is a checkbox with its name. Admin checks the ones that are missing for this patient's prescription.
- If no medicines have zero stock, show a note: "All medicines are currently in stock. Use Approve instead."
- A "Send Notification" button that calls `notifyMissingMedicine(patientId, prescriptionId, selectedMedicineNames)` and closes the dialog.

### Remove the schedule/collections column
From both the desktop table and mobile cards, remove any column or field that references `totalCollections`, `splitInterval`, or pickup count.

---

## 4. PatientDashboard.tsx — Patient Prescription Card

Each approved prescription shows a single card. Inside the card, based on the pickup's current status, show the appropriate view:

### Status: `invoice_ready`
Show two action tiles side by side (or stacked on mobile):

**Tile 1 — Invoice** (blue border, blue icon)
Title: "Your Invoice is Ready"
Subtitle: Shows the grand total amount prominently
Button: "View Invoice & Pay" — opens the InvoicePaymentModal

**Tile 2 — Missing Medicine** (grayed out, locked appearance)
Title: "Missing Medicine"
Subtitle: "No items missing for this prescription"
No button — this tile is informational only and shows a green checkmark

### Status: `missing_medicine`
Show two action tiles:

**Tile 1 — Invoice** (grayed out, locked)
Title: "Invoice on Hold"
Subtitle: "Cannot generate full invoice until missing medicines are resolved"
No button

**Tile 2 — Missing Medicine** (amber border, amber icon)
Title: "Medicine Unavailable"
Subtitle: Lists each medicine name in `prescription.missingMedicines` as bullet points
Button: "Download Notice" — generates and downloads a PDF notice (see PDF section below)

### Status: `payment_pending`
Show a single card with a blue spinner animation and text: "Processing your payment…". No action buttons.

### Status: `slot_available`
Show the existing Book Slot button. No invoice tile needed at this stage.

### Status: `slot_booked`
Show the booked slot date and time. Show a Reschedule button. Show a "Confirm Collection" button in green — but only if the slot date is today or in the past. If slot is future, show only Reschedule.

### Status: `collection_confirmed`
Show a green badge "You Confirmed ✓" and muted text "Waiting for pharmacy to finalise."

### Status: `collected`
Show green collected badge. Show a "Download Invoice" button.

### Status: `expired`
Show gray expired badge.

Remove all references to `pickupNumber`, `totalPickups`, `totalCollections`, and `startNextCollection`.

---

## 5. InvoicePaymentModal — New Component

Create `src/app/components/patient/InvoicePaymentModal.tsx`.

Props: `patientId`, `prescriptionId`, `pickupId`, `invoice`, `onClose`.

Internal state: `view: 'invoice' | 'payment'`, `selectedMethod: string | null`.

**Invoice view:**
- Invoice number and date at the top
- Table of items: medicine name, quantity, unit price, discount, total per row
- Subtotal row, discount row in red, tax row, grand total row in large bold blue
- Button "Proceed to Pay" switches to payment view

**Payment view:**
- Grand total shown prominently at top
- Three selectable tiles: UPI (with phone icon), Credit/Debit Card (with card icon), Net Banking (with bank icon)
- Selected tile has blue border and blue background tint
- "Confirm Payment" button — disabled until a method is selected — calls `initiatePayment(patientId, prescriptionId, pickupId, selectedMethod)` and closes the modal

Style: `max-w-lg` dialog, `border-gray-100`, blue patient accent colours, `rounded-2xl` card sections.

---

## 6. Missing Medicine PDF Download

When the patient clicks "Download Notice" on the missing medicine tile, generate a PDF in the browser using the existing jsPDF or a simple printable HTML approach. The notice should contain:

- Header: Pharmacy name "City Pharmacy" and date
- Patient name and Patient ID
- Prescription details: doctor name, hospital name, upload date
- Section titled "Medicines Currently Unavailable" listing each medicine name from `prescription.missingMedicines` as a numbered list
- A note at the bottom: "Please contact the pharmacy for an estimated availability date. Your prescription remains valid and on file."
- A "Pharmacy Notice" watermark text in light gray diagonally across the page

Since jsPDF may not be installed, implement this as a browser print window instead: open a new window with styled HTML containing all the above content and call `window.print()` on it automatically. Style it cleanly with a white background, pharmacy header, and the content above.

---

## 7. PatientHistory.tsx

Remove any references to `totalCollections`, `splitInterval`, `pickupNumber`, or `startNextCollection`. Each prescription card in history shows the single pickup's final status and, if collected, a Download Invoice button. No other changes to history layout.

---

## 8. PatientList.tsx (Admin)

Update "Mark Collected" button to only appear when pickup status is `collection_confirmed`. For `slot_booked` pickups show muted text "Awaiting patient confirmation". For `missing_medicine` pickups show an amber badge "Medicine Notified". No other changes.

---

## Files NOT changed
AdminDashboard, AdminLogin, ApprovalsList (KYC), InventoryManagement, SlotBookingModal, PatientLogin, PatientDetailsForm, LandingPage, all UI components, all styles.