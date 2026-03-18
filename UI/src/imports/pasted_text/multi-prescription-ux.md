# Multi-Prescription Support — UX & Code Changes

---

## The Problem Today

The dashboard only allows one prescription at a time. The logic `canUploadPrescription = !activePrescription && !pendingPrescription` completely blocks a second upload. A patient with two chronic conditions (e.g. diabetes AND hypertension) has no way to track both simultaneously.

---

## UX Decision: What to Build

Each prescription is an independent treatment track. The dashboard becomes a multi-card view — one card per prescription, stacked vertically on the left, each fully self-contained with its own pickup timeline, status, and actions. The upload form always stays accessible on the right as long as the patient has an approved KYC.

The only constraint is: a patient cannot have two prescriptions with the exact same approval status of "pending" at the same time — admin would be overwhelmed. But they can have one pending alongside one or more active ones.

---

## Changes Required

---

### 1. AppContext.tsx — Remove the one-active-prescription constraint

**Change `getActivePrescription`** — this currently returns only one. Rename it or add a new helper that returns ALL active prescriptions as an array:

```
Add a new exported helper: getAllActivePrescriptions(patient)
Returns all prescriptions where approvalStatus is 'approved', expiryDate is in the future,
and at least one pickup is not yet collected.
Returns an array, not a single item. Can be empty array.
```

Keep the existing `getActivePrescription` untouched so nothing else breaks — it is used in SlotBookingModal's expiryDate prop.

**Change the upload gate** — in `uploadPrescription` action, remove any check that blocks upload when an active prescription exists. The only remaining gate: if a prescription with `approvalStatus === 'pending'` already exists, block a second pending upload (one pending at a time is enough). Everything else is allowed.

---

### 2. PatientDashboard.tsx — Rewrite the dashboard layout

#### Remove these variables:
```
const activePrescription = getActivePrescription(currentPatient);
const canUploadPrescription = !activePrescription && !pendingPrescription;
```

#### Replace with:
```
const allActivePrescriptions = getAllActivePrescriptions(currentPatient);
  — array of all approved, non-expired prescriptions with uncollected pickups

const pendingPrescription = currentPatient.prescriptions.find(p => p.approvalStatus === 'pending');
  — at most one pending at a time

const canUploadNew = !pendingPrescription;
  — can always upload unless one is already waiting for admin approval
```

#### New layout structure:

The main content area becomes a single full-width column (remove the `lg:grid-cols-2` split), `max-w-3xl mx-auto`, with sections stacked vertically:

**Section 1 — Active Prescriptions (one card per prescription)**

If `allActivePrescriptions` has items, render each as its own card. Each card shows:
- Header: "Active Prescription" with a small colored dot or number pill if there are multiple (e.g. "Active Prescription · 1 of 2")
- Subheader: Doctor name · Hospital name
- The existing pickup timeline (the stepper with green/blue/gray circles) — exactly as it is today
- Expiry date at the bottom
- Book Slot / Reschedule buttons per pickup — exactly as today

Each card is fully independent. The `handleBookSlot` and `handleReschedule` functions already accept `prescriptionId` so they work correctly per-card without changes.

**Section 2 — Pending Prescription (if exists)**

Same "Prescription Under Review" card as today. No change.

**Section 3 — Upload New Prescription**

Always render the `PrescriptionUploadForm` when `canUploadNew` is true, regardless of how many active prescriptions exist.

When `canUploadNew` is false (one already pending), show the current "Prescription Under Review" card only — no upload form.

Remove the "Upload Prescription" blocked card entirely (the one that said "You can only have one active prescription at a time"). It no longer applies.

**Section 4 — Previously Rejected Notice (if exists)**

If there is a rejected prescription, show the red rejection card above the upload form — same as today.

#### SlotBookingModal — fix the expiryDate prop

Today it passes `activePrescription?.expiryDate`. Since there are now multiple active prescriptions, pass the expiryDate from the specific prescription whose pickupId is being booked. The `selectedPickup` state already stores `prescriptionId` — use that to look up the right prescription:

```
const prescriptionForModal = currentPatient.prescriptions.find(
  p => p.id === selectedPickup.prescriptionId
);
expiryDate={prescriptionForModal?.expiryDate || null}
```

---

### 3. PatientHistory.tsx — Group by prescription, add context label

Today history is a flat list of prescription cards. No structural change needed — each card already shows one prescription independently. 

One small addition: if a prescription has `approvalStatus === 'approved'` and all pickups are collected (every pickup has `itemReceived: true`), add a small "Completed ✓" green badge next to the Approved badge to distinguish fully finished prescriptions from ones still in progress.

---

### 4. Seed data — Add a second active prescription to Patient 1 (UID9999999999 / login 1111111111)

So the multi-prescription dashboard is visible immediately in demo, add a second approved prescription to John Smith with a different doctor and hospital, with 1 collected pickup and 1 upcoming slot_available pickup. This way when you log in as 1111111111 you immediately see two active prescription cards side by side.

---

## What Does NOT Change

- All admin screens — zero changes
- KYC flow — zero changes
- SlotBookingModal internals — zero changes except the expiryDate prop fix above
- PatientLogin — zero changes
- All styles, colors, card designs — zero changes
- The pickup timeline stepper UI inside each card — zero changes
- AppContext actions for booking, collecting, rescheduling — zero changes
- PatientHistory card design — only the "Completed" badge addition