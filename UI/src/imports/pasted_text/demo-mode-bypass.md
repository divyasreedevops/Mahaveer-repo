# Demo Mode — Bypass All Gates Only

Zero changes to screens, content, layout, or logic.
Only change: make every button always work and every condition always pass.
Four files. Exact line-level changes only.

---

## PatientLogin.tsx

**Gate 1 — Mobile length check**
Change:
```typescript
if (mobile.length === 10) {
  registerPatient(mobile, email || undefined);
  setStep('otp');
  setError('');
} else {
  setError('Please enter a valid 10-digit mobile number');
}
```
To:
```typescript
const mobileToUse = mobile.length === 10 ? mobile : '9999999999';
registerPatient(mobileToUse, email || undefined);
setStep('otp');
setError('');
```

**Gate 2 — OTP disabled prop**
Change:
```tsx
disabled={otp.length !== 6}
```
To:
```tsx
disabled={false}
```

**Gate 3 — OTP submit logic**
Change:
```typescript
const handleOTPSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const success = verifyOTP(otp);
  if (!success) {
    setError('Invalid OTP. Please try again.');
  }
};
```
To:
```typescript
const handleOTPSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const otpToUse = otp.length === 6 ? otp : '123456';
  verifyOTP(otpToUse);
};
```

---

## AdminLogin.tsx

**Gate 4 — Credentials check**
Change:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const success = adminLogin(username, password);
  if (!success) {
    setError('Invalid credentials. Try admin/admin');
  }
};
```
To:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  adminLogin('admin', 'admin');
};
```

---

## PatientDetailsForm.tsx

**Gate 5 — All three validation blocks**
Change:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !dateOfBirth) {
    setError('Please fill in all fields');
    return;
  }
  if (!aadhaarNumber || aadhaarNumber.replace(/\s/g, '').length !== 12) {
    setError('Please enter a valid 12-digit Aadhaar number');
    return;
  }
  if (!currentPatient?.incomeDocumentUrl && !incomeDocument) {
    setError('Please upload your income document (bank statement) for KYC verification');
    return;
  }
  if (incomeDocument) {
    submitKYC(name, dateOfBirth, aadhaarNumber.replace(/\s/g, ''), incomeDocument);
  }
  setError('');
  toast.success('Details saved successfully! Please upload your prescription next.');
};
```
To:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const finalName = name || 'Demo Patient';
  const finalDob = dateOfBirth || '1990-01-01';
  const finalAadhaar = aadhaarNumber.replace(/\s/g, '').padEnd(12, '0').slice(0, 12);
  const finalFile = incomeDocument || new File([], 'demo-kyc.pdf');
  submitKYC(finalName, finalDob, finalAadhaar, finalFile);
  setError('');
  toast.success('Details saved successfully! Please upload your prescription next.');
};
```

---

## PrescriptionUploadForm.tsx

**Gate 6 — File required check**
Change:
```typescript
if (!selectedFile) {
  setError('Please select a prescription file');
  return;
}
if (!doctorName || !hospitalName) {
  setError('Please enter doctor name and hospital name');
  return;
}
uploadPrescription(selectedFile, doctorName, hospitalName, splitInterval);
```
To:
```typescript
const finalFile = selectedFile || new File([], 'demo-prescription.pdf');
const finalDoctor = doctorName || 'Dr. Demo';
const finalHospital = hospitalName || 'Demo Hospital';
uploadPrescription(finalFile, finalDoctor, finalHospital, splitInterval);
```

**Gate 7 — Upload button disabled prop**
Change:
```tsx
disabled={!selectedFile}
```
To:
```tsx
disabled={false}
```

---

## SlotBookingModal.tsx

**Gate 8 — Confirm button disabled prop**
Change:
```tsx
disabled={!selectedDate || !selectedTime}
```
To:
```tsx
disabled={false}
```

**Gate 9 — Confirm handler early return**
Change:
```typescript
const handleConfirm = () => {
  if (!selectedDate || !selectedTime) return;
  ...
```
To:
```typescript
const handleConfirm = () => {
  const dateToUse = selectedDate || new Date(Date.now() + 24 * 60 * 60 * 1000);
  const timeToUse = selectedTime || '10:00';
  const dateStr = dateToUse.toISOString().split('T')[0];
  if (isReschedule) {
    reschedulePickup(patientId, prescriptionId, pickupId, dateStr, timeToUse);
  } else {
    bookPickupSlot(patientId, prescriptionId, pickupId, dateStr, timeToUse);
  }
  onClose();
};
```
(Remove the original if/else block that was inside the guard and replace the whole function body with the above.)

---

## Nothing else changes

Every screen, every label, every input, every layout, every color stays exactly as-is.
Only the 9 conditions above are modified.