# Three Targeted Fixes

---

## Fix 1 — PatientLogin.tsx: New patient by default, existing patient on 1111111111

### Current behaviour
Any mobile number (or empty) falls back to `9999999999` (existing patient with a booked pickup).

### Required behaviour
- Any mobile number that is NOT `1111111111` → treat as a brand new patient (no history, no prescription, goes through KYC flow)
- Mobile `1111111111` → load the existing seed patient who already has one collected pickup and is ready to start next collection
- OTP step: unchanged — any 6 digits (or empty) passes through

### Change only `handleMobileSubmit` in `PatientLogin.tsx`

Replace:
```typescript
const handleMobileSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const mobileToUse = mobile.length === 10 ? mobile : '9999999999';
  registerPatient(mobileToUse, email || undefined);
  setStep('otp');
  setError('');
};
```

With:
```typescript
const handleMobileSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // 1111111111 → returning patient with history
  // anything else (including empty) → brand new patient using a unique timestamp-based number
  const mobileToUse = mobile === '1111111111' ? '9999999999' : (mobile.length === 10 ? mobile : `demo${Date.now()}`.slice(0, 10));
  registerPatient(mobileToUse, email || undefined);
  setStep('otp');
  setError('');
};
```

### Also update AppContext.tsx seed data — change Patient 1's mobile to match

In the seed data for the first patient, change:
```typescript
mobile: '9999999999',
patientId: 'UID9999999999',
```
No change needed — `1111111111` in the login maps to `9999999999` internally, so the seed data stays as-is.

---

## Fix 2 — SlotBookingModal.tsx: Fix broken layout

### Root cause
`DialogContent` in `src/app/components/ui/dialog.tsx` has `sm:max-w-lg` hardcoded in its base className. This overrides the `max-w-2xl` passed from `SlotBookingModal`, making the dialog too narrow for the time grid. The morning grid (`grid-cols-6`) and afternoon grid (`grid-cols-5`) overflow or wrap badly at `max-w-lg` width.

### Fix A — Override the dialog width from SlotBookingModal.tsx

Change:
```tsx
<DialogContent className="max-w-2xl border-gray-100">
```
To:
```tsx
<DialogContent className="!max-w-2xl w-full border-gray-100 overflow-hidden">
```
The `!` prefix forces Tailwind to override the `sm:max-w-lg` from the base component.

### Fix B — Add scroll protection to the modal body

The `div` wrapping `space-y-6 py-4` (the date + time sections) can overflow vertically on small screens. Add `max-h-[70vh] overflow-y-auto` to it:

Change:
```tsx
<div className="space-y-6 py-4">
```
To:
```tsx
<div className="space-y-6 py-2 max-h-[65vh] overflow-y-auto pr-1">
```

### Fix C — Fix the date strip on small screens

The horizontal date strip uses `flex gap-2 overflow-x-auto pb-2 scrollbar-hide`. Add `snap-x snap-mandatory` for smoother scrolling, and ensure each tile doesn't shrink below its content:

Change:
```tsx
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
```
To:
```tsx
<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
```

And on each date button, add `snap-start`:
```tsx
className={`flex-shrink-0 snap-start w-14 py-3 rounded-xl border text-center transition-all ${...}`}
```

### Fix D — Fix time grid column sizing for narrow screens

Morning uses `grid-cols-6` (6 slots) and afternoon uses `grid-cols-5` (8 slots across 5 columns doesn't work — 8 slots need `grid-cols-4`). Fix the afternoon grid:

Change:
```tsx
<div className="grid grid-cols-5 gap-1.5">
  {AFTERNOON_SLOTS.map(slot => (
    <TimeSlotButton key={slot} time={slot} dateStr={selectedDate} />
  ))}
</div>
```
To:
```tsx
<div className="grid grid-cols-4 gap-1.5">
  {AFTERNOON_SLOTS.map(slot => (
    <TimeSlotButton key={slot} time={slot} dateStr={selectedDate} />
  ))}
</div>
```
8 afternoon slots ÷ 4 columns = 2 clean rows. Morning stays `grid-cols-6` (6 slots = 1 clean row).

### Fix E — Fix the footer overlap

The footer (`flex items-center justify-between pt-4 border-t`) is inside `DialogContent` after the scrollable div. Move it outside the scrollable area so it's always visible. The current structure is:

```tsx
<DialogContent>
  <DialogHeader>...</DialogHeader>
  <div className="space-y-6 py-2 max-h-[65vh] overflow-y-auto pr-1">
    {/* date + time sections */}
  </div>
  {/* Footer */}
  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
    ...
  </div>
</DialogContent>
```

This structure is already correct — footer is outside the scrollable div. Just ensure the footer div is NOT inside the `space-y-6` wrapper. If it currently is, move it out.

---

## Fix 3 — Centre-align all screens and cards

Apply these changes across the listed files. Do not change any colours, fonts, content, or logic.

### PatientLogin.tsx
The outer wrapper already has `flex items-center justify-center` — no change needed.
Add `mx-auto` to the Card if not already present:
```tsx
<Card className="w-full max-w-md mx-auto border-gray-100 shadow-lg rounded-2xl">
```

### AdminLogin.tsx
Same — already centred. Confirm Card has `mx-auto`:
```tsx
<Card className="w-full max-w-md mx-auto border-gray-100 shadow-lg rounded-2xl">
```

### PatientDetailsForm.tsx
Card is `max-w-2xl mx-auto` — change to `max-w-lg mx-auto` to match login card width for visual consistency on this single-column form:
```tsx
<Card className="w-full max-w-lg mx-auto border-gray-100 shadow-lg rounded-2xl">
```
The outer `<main>` that wraps this should have `flex items-start justify-center` or the card's `mx-auto` will handle it — confirm the `<main>` in PatientDashboard that renders PatientDetailsForm uses:
```tsx
<main className="container mx-auto px-4 py-8 flex justify-center">
```

### PatientDashboard.tsx — KYC pending and rejected screens
Both already use `max-w-2xl mx-auto` on the Card inside `container mx-auto px-4 py-8`. Change to `max-w-lg mx-auto` for tighter centering:
```tsx
<Card className="max-w-lg mx-auto border-gray-100 shadow-lg rounded-2xl">
```
Apply to both the `kycStatus === 'pending'` card and the `kycStatus === 'rejected'` card.

### PatientDashboard.tsx — main approved dashboard
The main grid is `grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto`.
Change to `max-w-5xl` for a tighter, better-proportioned layout:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
```

### PatientHistory.tsx
Already uses `max-w-4xl mx-auto space-y-6` — change to `max-w-3xl mx-auto space-y-6` for tighter centering on this list view.

### PrescriptionUploadForm.tsx
Already has `max-w-lg mx-auto` on the Card — no change needed.

### AdminDashboard.tsx
The `<main>` uses `container mx-auto px-4 py-8` with no max-width on the Tabs content.
Add a max-width wrapper inside main:
```tsx
<main className="container mx-auto px-4 py-8">
  <div className="max-w-6xl mx-auto">
    <Tabs ...>
      ...
    </Tabs>
  </div>
</main>
```

### All headers (PatientDashboard, PatientHistory, AdminDashboard)
Every header inner div uses `container mx-auto px-4 py-4`. 
Add a consistent max-width to match content below:
```tsx
{/* PatientDashboard and PatientHistory headers */}
<div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">

{/* AdminDashboard header */}
<div className="container mx-auto px-4 py-4 max-w-6xl flex justify-between items-center">
```

---

## Files changed summary
- `PatientLogin.tsx` — Fix 1 (login logic) + Fix 3 (confirm mx-auto on card)
- `SlotBookingModal.tsx` — Fix 2 (all 5 sub-fixes)
- `PatientDashboard.tsx` — Fix 3 (max-w on KYC cards, main grid, headers, KYC-pending main)
- `PatientHistory.tsx` — Fix 3 (max-w-3xl, header max-w)
- `AdminDashboard.tsx` — Fix 3 (max-w wrapper, header max-w)
- `PatientDetailsForm.tsx` — Fix 3 (max-w-lg)

## Files NOT changed
Everything else — AppContext, all admin screens content, all ui/ components, LandingPage, styles.