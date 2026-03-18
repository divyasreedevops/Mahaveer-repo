# PharmaCare API Documentation

> **Version:** 2.0  
> **Last Updated:** March 2026  
> **Base URL:** `https://<host>/`  
> **Swagger UI:** `https://<host>/swagger`

---

## Table of Contents

1. [Frontend Integration Guide](#frontend-integration-guide)
2. [Authentication](#authentication)
3. [Login](#1-login)
4. [User](#2-user)
5. [Admin](#3-admin)
6. [Patient](#4-patient)
7. [Prescription](#5-prescription)
    - [uploadPrescription](#post-apiprescriptionuploadprescription)
    - [SavePrescription](#post-apiprescriptionsaveprescription)
    - [ApprovePrescription](#post-apiprescriptionapproveprescription)
    - [RejectPrescription](#post-apiprescriptionrejectprescription)
    - [GetPrescriptionsByStatus](#get-apiprescriptiongetprescriptionsbystatus)
    - [GetPrescriptionsByPatientId](#get-apiprescriptiongetprescriptionsbypatientid)
    - [MarkPrescriptionCollected](#post-apiprescriptionmarkprescriptioncollected)
8. [AppointmentSlot](#6-appointmentslot)
9. [OTP](#7-otp)
10. [Inventory](#8-inventory)
11. [Invoice](#9-invoice)
    - [GenerateInvoice](#post-apiinvoicegenerateinvoice)
    - [UpdateInvoiceStatus](#post-apiinvoiceupdateinvoicestatus)
    - [GetInvoicesByPatient](#get-apiinvoicegetinvoicesbypatient)
    - [GetInvoice](#get-apiinvoicegetinvoice)
12. [Payment](#10-payment)
13. [Common](#11-common)
14. [Model Reference](#model-reference)
15. [Error Codes Summary](#error-codes-summary)
16. [Complete Workflow Flows](#complete-workflow-flows)

---

## Frontend Integration Guide

This section covers everything needed to integrate the PharmaCare API into a frontend application (React / Vue / Angular / any SPA).

### Base URL Configuration

```js
// config/api.js
export const BASE_URL = "https://<host>";          // production
export const BASE_URL_DEV = "http://localhost:5120"; // local dev
```

### CORS — Allowed Origins

The backend allows cross-origin requests from the following origins:

| Origin | Purpose |
|--------|---------|
| `http://localhost:3000` | React dev server (CRA) |
| `http://localhost:5173` | Vite dev server |
| `http://16.112.1.32` | Production server |
| `http://16.112.1.32:8080` | Production server (port 8080) |
| `https://16.112.1.32` | Production server (HTTPS) |

### JWT Authentication

- Token is returned in the login response body (`token` field).
- Store the token in `localStorage` or a secure cookie.
- Send the token in every protected request:

```
Authorization: Bearer <token>
```

**JWT Token Payload claims:**

| Claim | Description |
|-------|-------------|
| `sub` | User ID or PatientId |
| `role` | `Admin`, `Staff`, or `Patient` |
| `patientId` | Human-readable patient ID (Patient role only) |

**Endpoints that require JWT (`[Authorize]`):**
- All `/api/Prescription/*` endpoints

**Endpoints that do NOT require JWT:**
- `/Login/*`, `/Patient/Register`, `/Patient/Login`, `/Common/*`, `/Payment/key`, `/Otp/*`, `/Inventory/*`, `/api/AppointmentSlot/*`

---

### Axios Setup (Recommended)

```js
// services/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://<host>",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### multipart/form-data Requests

For file-upload endpoints (`SavePatientInfo`, `uploadPrescription`), use `FormData`:

```js
const formData = new FormData();
formData.append("fullName", "Ravi Kumar");
formData.append("aadharNumber", "123456789012");
formData.append("kycDocument", fileInput.files[0]);

await apiClient.post("/Patient/SavePatientInfo", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

---

### Patient Authentication Flow (OTP)

```
1. POST /Patient/Register    → send OTP to mobile
2. POST /Patient/Login       → verify OTP → returns JWT token + patient object
3. Store token in localStorage
4. Use token for subsequent protected calls
```

### Admin Authentication Flow

```
1. POST /Login/admin         → returns JWT token + user object
2. Store token in localStorage
3. Use token for all admin operations
```

### Full Prescription → Invoice → Payment Flow

```
1.  POST /api/Prescription/uploadPrescription  → AI extracts medicines from file
2.  POST /api/Prescription/SavePrescription    → persist prescription record
3.  GET  /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=PENDING
4.  POST /api/Prescription/ApprovePrescription  (or RejectPrescription)
5.  GET  /api/AppointmentSlot/GetAvailableSlots?date=YYYY-MM-DD
6.  POST /api/AppointmentSlot/BookSlot
7.  POST /api/Invoice/GenerateInvoice          → generate invoice (body: { patientId, prescriptionKey, id })
8.  GET  /Payment/key                          → get Razorpay public key
9.  POST /Payment/create-order                 → create Razorpay order
10. [Razorpay checkout on frontend]
11. POST /Payment/verify                       → verify payment signature
12. POST /api/Invoice/UpdateInvoiceStatus      → mark invoice paid
```

---

### Razorpay Integration

```js
// 1. Get public key
const { data: { key } } = await apiClient.get("/Payment/key");

// 2. Create order
const { data: order } = await apiClient.post("/Payment/create-order", {
  amount: 90.00,          // INR amount (NOT paise) — backend converts
  patientId: "PAT-2025-0012"
});

// 3. Open Razorpay Checkout
const rzp = new Razorpay({
  key,
  amount: order.amount,       // paise (returned by backend)
  currency: order.currency,
  order_id: order.orderId,
  name: "PharmaCare",
  handler: async (response) => {
    // 4. Verify payment on your server
    const result = await apiClient.post("/Payment/verify", {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature,
    });
    if (result.data.success) {
      // 5. Mark invoice paid
      await apiClient.post(
        `/api/Invoice/UpdateInvoiceStatus?InvoiceNumber=${invoiceNumber}&PrescriptionId=${prescriptionId}`
      );
    }
  },
});
rzp.open();
```

---

### Appointment Slots — Time Windows

Slots have 30-minute intervals with a max of **5 persons per slot**:

| Session | Start | End |
|---------|-------|-----|
| Morning | 10:00 | 12:30 |
| Afternoon | 14:00 | 17:30 |

---

## Authentication

### Token Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT Configuration

> **Note:** Issuer and Audience validation are currently **disabled** on the server. Any well-formed JWT signed with the correct key will be accepted.

---

## 1. Login

Base path: `/Login`

---

### POST `/Login/admin`

Authenticates an admin or staff user and returns a JWT token.

**No Authentication Required**

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | ✅ | Admin username |
| `password` | string | ✅ | Admin password |

**Example Request**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Login successful |
| 400 | Bad Request | `username` or `password` not provided |
| 401 | Unauthorized | Invalid credentials |
| 500 | Server Error | Internal error |

**200 Response**
```json
{
  "message": "Login successful",
  "isAuthenticated": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@pharmacare.com",
    "role": "Admin",
    "firstname": "John",
    "lastname": "Doe"
  }
}
```

**400 Response**
```json
{ "message": "Username and password are required" }
```

**401 Response**
```json
{ "message": "Invalid credentials", "isAuthenticated": false }
```

**Frontend Usage**
```js
const res = await axios.post("/Login/admin", { username, password });
localStorage.setItem("token", res.data.token);
localStorage.setItem("user", JSON.stringify(res.data.user));
```

---

### POST `/Login/logout`

Logs out the current session.

**No Authentication Required**  
**No Request Body**

**200 Response**
```json
{ "message": "Logout successful" }
```

> **Note:** JWT is stateless. On logout, simply remove the token from `localStorage`.

---

## 2. User

Base path: `/User`

---

### POST `/User/CreateUser`

Creates a new system user (Admin / Staff).

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstname` | string | ❌ | First name |
| `lastname` | string | ❌ | Last name |
| `username` | string | ✅ | Unique login username |
| `password` | string | ✅ | Plain-text password |
| `email` | string | ❌ | Email address |
| `role` | string | ❌ | `Admin` or `Staff` |
| `status` | int | ❌ | `1` = Active, `0` = Inactive |

**Example Request**
```json
{
  "firstname": "Jane",
  "lastname": "Smith",
  "username": "janesmith",
  "password": "SecurePass@1",
  "email": "jane.smith@pharmacare.com",
  "role": "Staff",
  "status": 1
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | User created |
| 400 | Bad Request | `username` or `password` missing |
| 500 | Server Error | Internal error |

**200 Response**
```json
{ "message": "User created successfully" }
```

---

## 3. Admin

Base path: `/Admin`

---

### POST `/Admin/ApproveKyc`

Approves a patient's KYC and assigns an income level (which determines the discount percentage).

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | long | ✅ | Patient's internal DB ID |
| `incomeLevel` | string | ✅ | Income level name — use `GET /Common/GetIncomeLevels` for valid values |

**Example Request**
```json
{
  "id": 12,
  "incomeLevel": "BPL"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | KYC approved |
| 400 | Bad Request | `id` or `incomeLevel` missing |
| 404 | Not Found | Patient not found |
| 500 | Server Error | Unexpected error |

**200 Response**
```json
{ "message": "KYC approved successfully" }
```

**404 Response**
```json
{ "message": "Patient not found" }
```

---

### POST `/Admin/UpdateRegistrationStatus`

Updates the registration status of a patient and assigns their permanent patient ID.

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | long | ✅ | Patient's internal DB ID |
| `patientId` | string | ✅ | Unique patient ID to assign (e.g. `PAT-2025-0012`) |
| `registrationStatus` | string | ✅ | `Pending`, `Approved`, or `Rejected` |

**Example Request**
```json
{
  "id": 12,
  "patientId": "PAT-2025-0012",
  "registrationStatus": "Approved"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Status updated |
| 400 | Bad Request | Required fields missing or invalid `registrationStatus` value |
| 404 | Not Found | Patient not found |
| 500 | Server Error | Unexpected error |

**200 Response**
```json
{ "message": "Registration status updated successfully" }
```

**400 Response (invalid status)**
```json
{ "message": "Invalid registration status" }
```

---

## 4. Patient

Base path: `/Patient`

---

### POST `/Patient/Register`

Sends a 6-digit OTP to the patient's mobile number via **AWS SNS SMS**.

**No Authentication Required**

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobileNumber` | string | ✅ | 10-digit mobile number |

**Example Request**
```json
{ "mobileNumber": "9876543210" }
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | OTP sent |
| 400 | Bad Request | `mobileNumber` is empty |

**200 Response**
```json
{
  "message": "OTP sent successfully",
  "mobileNumber": "9876543210",
  "otp": "482910"
}
```

> **Security Note:** Remove the `otp` field from the response before going to production.

---

### POST `/Patient/Login`

Verifies the OTP and logs in or registers the patient. Returns JWT token for existing patients.

**No Authentication Required**

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobileNumber` | string | ✅ | Mobile number used to receive OTP |
| `otp` | string | ✅ | 6-digit OTP |
| `email` | string | ❌ | Optional email |

**Example Request**
```json
{
  "mobileNumber": "9876543210",
  "otp": "482910"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Returns login or registration result |
| 400 | Bad Request | `mobileNumber` or `otp` missing |

**200 Response — Existing patient login**
```json
{
  "message": "Login Successful",
  "isAuthenticated": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "patient": {
    "id": 12,
    "patientId": "PAT-2025-0012",
    "fullName": "Ravi Kumar",
    "mobileNumber": "9876543210",
    "email": "ravi@example.com",
    "role": "Patient",
    "registrationStatus": "Approved",
    "kycStatus": "Approved"
  }
}
```

**200 Response — New patient registered**
```json
{
  "message": "Patient registered successfully",
  "patientId": "TEMP-1710590400000"
}
```

**200 Response — Invalid OTP**
```json
{
  "message": "Invalid OTP",
  "isValid": false
}
```

**Frontend Usage**
```js
// Step 1: Send OTP
await apiClient.post("/Patient/Register", { mobileNumber: "9876543210" });

// Step 2: Verify OTP + Login
const res = await apiClient.post("/Patient/Login", {
  mobileNumber: "9876543210",
  otp: "482910"
});
if (res.data.isAuthenticated) {
  localStorage.setItem("token", res.data.token);
  localStorage.setItem("patient", JSON.stringify(res.data.patient));
}
```

---

### GET `/Patient/GetPatientsByStatus`

Returns a list of patients filtered by registration and/or KYC status.

**Query Parameters**

| Parameter | Type | Required | Allowed Values |
|-----------|------|----------|----------------|
| `regstatus` | string | ❌ | `Pending`, `Approved`, `Rejected` |
| `kycstatus` | string | ❌ | `Pending`, `Approved`, `Rejected` |

> Omit a parameter to skip that filter. Use both together for combined filtering.

**Example Requests**
```
GET /Patient/GetPatientsByStatus
GET /Patient/GetPatientsByStatus?regstatus=Pending
GET /Patient/GetPatientsByStatus?regstatus=Pending&kycstatus=Pending
GET /Patient/GetPatientsByStatus?kycstatus=Approved
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Array of patient records (empty array if none match) |
| 500 | Server Error | Internal error |

**200 Response**
```json
[
  {
    "id": 12,
    "patientId": "PAT-2025-0012",
    "fullName": "Ravi Kumar",
    "mobileNumber": "9876543210",
    "email": "ravi@example.com",
    "aadharNumber": "XXXX-XXXX-9012",
    "dob": "1990-05-15T00:00:00",
    "registrationDate": "2025-01-10T09:30:00",
    "registrationStatus": "Pending",
    "kycStatus": "Pending",
    "kycDocumentUrl": "https://s3.amazonaws.com/mahaveer-new-buckett/kyc/12/doc.pdf",
    "incomeLevel": null,
    "discountPercentage": null,
    "status": 1
  }
]
```

---

### POST `/Patient/SavePatientInfo`

Creates or updates a patient profile and optionally uploads a KYC document to S3.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | ✅ | Patient's full name |
| `aadharNumber` | string | ✅ | 12-digit Aadhaar number (must be unique) |
| `id` | long | ❌ | Existing DB record ID (`0` or omit for new) |
| `patientId` | string | ❌ | Pre-assigned patient ID string |
| `mobileNumber` | string | ❌ | 10-digit mobile number |
| `email` | string | ❌ | Email address |
| `dob` | datetime | ❌ | Date of birth (ISO 8601, e.g. `1990-05-15`) |
| `kycDocument` | file | ❌ | KYC document (PDF, JPG, or PNG) |

**Example Request (JavaScript)**
```js
const form = new FormData();
form.append("fullName", "Ravi Kumar");
form.append("aadharNumber", "123456789012");
form.append("mobileNumber", "9876543210");
form.append("email", "ravi@example.com");
form.append("dob", "1990-05-15");
form.append("kycDocument", fileInput.files[0]); // optional

await apiClient.post("/Patient/SavePatientInfo", form, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Patient saved |
| 400 | Bad Request | `fullName` or `aadharNumber` missing |
| 404 | Not Found | Patient with given `id` not found (on update) |
| 409 | Conflict | Aadhaar number already registered |
| 500 | Server Error | Unexpected error |

**200 Response**
```json
{ "message": "Patient updated successfully" }
```

**409 Response**
```json
{ "message": "Aadhaar number already exists" }
```

---

### GET `/Patient/GetPatientByMobileNumber`

Fetches complete patient details by mobile number.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mobile` | string | ✅ | Patient's 10-digit mobile number |

**Example Request**
```
GET /Patient/GetPatientByMobileNumber?mobile=9876543210
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Patient record |
| 400 | Bad Request | `mobile` is empty |
| 404 | Not Found | Patient not found |

**200 Response**
```json
{
  "id": 12,
  "patientId": "PAT-2025-0012",
  "fullName": "Ravi Kumar",
  "mobileNumber": "9876543210",
  "email": "ravi@example.com",
  "aadharNumber": "XXXX-XXXX-9012",
  "dob": "1990-05-15T00:00:00",
  "registrationDate": "2025-01-10T09:30:00",
  "registrationStatus": "Approved",
  "kycStatus": "Approved",
  "kycDocumentUrl": "https://s3.amazonaws.com/mahaveer-new-buckett/kyc/12/doc.pdf",
  "incomeLevel": "BPL",
  "discountPercentage": 100.00,
  "status": 1,
  "firstLogin": 0
}
```

---

## 5. Prescription

Base path: `/api/Prescription`

> **Authentication Required** — All endpoints require `Authorization: Bearer <token>`

---

### POST `/api/Prescription/uploadPrescription`

Uploads a prescription file and uses **AWS Textract + AWS Comprehend Medical** to extract medicine information automatically.

**Content-Type:** `multipart/form-data`  
**Permission:** `ProcessPrescription`

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `file` | file | ✅ | Max 10 MB; `.pdf`, `.jpg`, `.jpeg`, `.png` | Prescription file |
| `patientId` | string | ✅ | — | Patient's human-readable ID |
| `id` | string | ✅ | — | Patient's numeric DB ID (as string, i.e. `pId`) |

**Example Request**
```js
const form = new FormData();
form.append("file", prescriptionFile);   // File object from <input type="file">
form.append("patientId", "PAT-2025-0012");
form.append("id", "12");                 // patient's internal numeric DB id

const res = await apiClient.post("/api/Prescription/uploadPrescription", form, {
  headers: { "Content-Type": "multipart/form-data" },
});
// res.data → PrescriptionInfo
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Extraction successful |
| 400 | Bad Request | File missing / too large / wrong type / `patientId` missing |
| 401 | Unauthorized | Missing or invalid JWT |
| 500 | Server Error | AI pipeline or S3 error |

**200 Response**
```json
{
  "medicines": [
    { "name": "Paracetamol", "dosage": "500mg", "frequency": "Twice daily" },
    { "name": "Amoxicillin", "dosage": "250mg", "frequency": "Three times daily" }
  ],
  "doctorName": "Dr. Mehta",
  "hospitalName": "City Hospital",
  "prescriptionKey": "prescriptions/PAT-2025-0012/a1b2c3d4-uuid.jpg",
  "prescriptionId": null
}
```

**400 Response examples**
```json
{ "error": "File size exceeds 10MB limit" }
{ "error": "Only PDF, JPG, and PNG files are allowed" }
{ "error": "Patient ID is required" }
```

---

### POST `/api/Prescription/SavePrescription`

Saves the prescription record (and medicine list) to the database after upload and review.

**Content-Type:** `application/json`  
**Permission:** `ProcessPrescription`

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prescriptionKey` | string | ✅ | S3 key returned from `uploadPrescription` |
| `patientId` | string | ✅ | Patient's human-readable ID |
| `pId` | long | ❌ | Patient's internal numeric DB ID |
| `doctorName` | string | ❌ | Doctor's name |
| `hospitalName` | string | ❌ | Hospital name |
| `medicines` | MedicineInfo[] | ✅ | At least 1 medicine object required |

**MedicineInfo object**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Medicine name |
| `dosage` | string | ❌ | Dosage (e.g. `500mg`) |
| `frequency` | string | ❌ | Frequency (e.g. `Twice daily`) |

**Example Request**
```json
{
  "prescriptionKey": "prescriptions/PAT-2025-0012/a1b2c3d4-uuid.jpg",
  "patientId": "PAT-2025-0012",
  "pId": 12,
  "doctorName": "Dr. Mehta",
  "hospitalName": "City Hospital",
  "medicines": [
    { "name": "Paracetamol", "dosage": "500mg", "frequency": "Twice daily" },
    { "name": "Amoxicillin", "dosage": "250mg", "frequency": "Three times daily" }
  ]
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Prescription saved |
| 400 | Bad Request | `prescriptionKey`, `patientId`, or `medicines` missing |
| 401 | Unauthorized | Missing or invalid JWT |
| 500 | Server Error | DB error |

**200 Response**
```json
{
  "message": "Prescription saved successfully",
  "prescriptionId": 45
}
```

---

### POST `/api/Prescription/ApprovePrescription`

Approves a pending prescription (admin action).

**Content-Type:** `application/json`

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prescriptionId` | long | ✅ | ID of the prescription to approve (> 0) |
| `approvedBy` | string | ✅ | Username or name of the approver |
| `remarks` | string | ❌ | Optional remarks |

**Example Request**
```json
{
  "prescriptionId": 45,
  "approvedBy": "admin",
  "remarks": "Document verified and medicines confirmed"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Approved |
| 400 | Bad Request | `prescriptionId` invalid or `approvedBy` missing |
| 401 | Unauthorized | Missing or invalid JWT |
| 404 | Not Found | Prescription not found or already processed |

**200 Response**
```json
{ "message": "Prescription approved successfully" }
```

---

### POST `/api/Prescription/RejectPrescription`

Rejects a pending prescription (admin action).

**Content-Type:** `application/json`

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prescriptionId` | long | ✅ | ID of the prescription to reject (> 0) |
| `rejectedBy` | string | ✅ | Username or name of the rejector |
| `reason` | string | ✅ | Reason for rejection |

**Example Request**
```json
{
  "prescriptionId": 45,
  "rejectedBy": "admin",
  "reason": "Prescription is expired or illegible"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Rejected |
| 400 | Bad Request | Required fields missing |
| 401 | Unauthorized | Missing or invalid JWT |
| 404 | Not Found | Prescription not found or already processed |

**200 Response**
```json
{ "message": "Prescription rejected successfully" }
```

---

### GET `/api/Prescription/GetPrescriptionsByStatus`

Retrieves prescriptions filtered by status. Used by the admin dashboard.

**Query Parameters**

| Parameter | Type | Required | Allowed Values |
|-----------|------|----------|----------------|
| `PrescriptionStatus` | string | ❌ | `PENDING`, `APPROVED`, `REJECTED`, `PROCESSED`, `RECEIVED` |

> Omit the parameter to fetch all prescriptions.

**Example Requests**
```
GET /api/Prescription/GetPrescriptionsByStatus
GET /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=PENDING
GET /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=APPROVED
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Array of prescription records |
| 401 | Unauthorized | Missing or invalid JWT |
| 500 | Server Error | Internal error |

**200 Response**
```json
[
  {
    "id": 45,
    "prescriptionKey": "prescriptions/PAT-2025-0012/a1b2c3d4-uuid.jpg",
    "patientId": "PAT-2025-0012",
    "pId": 12,
    "doctorName": "Dr. Mehta",
    "hospitalName": "City Hospital",
    "prescriptionUrl": "https://s3.amazonaws.com/mahaveer-new-buckett/prescriptions/PAT-2025-0012/a1b2c3d4-uuid.jpg",
    "uploadDate": "2025-03-10T10:30:00",
    "status": "PENDING",
    "createdDate": "2025-03-10T10:30:00",
    "updatedDate": "2025-03-10T10:30:00",
    "medicines": [
      { "name": "Paracetamol", "dosage": "500mg", "frequency": "Twice daily" }
    ],
    "approvedBy": null,
    "approvedDate": null,
    "approvalRemarks": null
  }
]
```

---

### GET `/api/Prescription/GetPrescriptionsByPatientId`

Retrieves all prescriptions for a specific patient.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patientId` | string | ✅ | Patient's human-readable ID |

**Example Request**
```
GET /api/Prescription/GetPrescriptionsByPatientId?patientId=PAT-2025-0012
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | List of prescriptions |
| 400 | Bad Request | `patientId` is empty |
| 401 | Unauthorized | Missing or invalid JWT |
| 404 | Not Found | No prescriptions found for this patient |
| 500 | Server Error | Internal error |

**200 Response** — Same structure as `GetPrescriptionsByStatus` filtered to one patient.
```json
[
  {
    "id": 45,
    "prescriptionKey": "prescriptions/PAT-2025-0012/a1b2c3d4-uuid.jpg",
    "patientId": "PAT-2025-0012",
    "pId": 12,
    "doctorName": "Dr. Mehta",
    "hospitalName": "City Hospital",
    "prescriptionUrl": "https://s3.amazonaws.com/mahaveer-new-buckett/prescriptions/PAT-2025-0012/a1b2c3d4-uuid.jpg",
    "uploadDate": "2025-03-10T10:30:00",
    "status": "APPROVED",
    "medicines": [
      { "name": "Paracetamol", "dosage": "500mg", "frequency": "Twice daily" },
      { "name": "Amoxicillin", "dosage": "250mg", "frequency": "Three times daily" }
    ],
    "approvedBy": "admin",
    "approvedDate": "2025-03-11T09:00:00",
    "approvalRemarks": "Verified"
  }
]
```

---

### POST `/api/Prescription/MarkPrescriptionCollected`

Marks a prescription as `RECEIVED` when the patient has physically collected their medicines. This is the final status transition in the prescription lifecycle.

**Authentication Required** — `Authorization: Bearer <token>`

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `PrescriptionId` | int | ✅ | ID of the prescription to mark as collected (> 0) |

**Example Request**
```
POST /api/Prescription/MarkPrescriptionCollected?PrescriptionId=45
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Prescription marked as collected |
| 400 | Bad Request | `PrescriptionId` is missing or < 1 |
| 401 | Unauthorized | Missing or invalid JWT |
| 404 | Not Found | Prescription not found or already processed |
| 500 | Server Error | Internal error |

**200 Response**
```json
{ "message": "Prescription updated successfully" }
```

**400 Response**
```json
{ "error": "Invoicedetails are required are required." }
```

---

## 6. AppointmentSlot

Base path: `/api/AppointmentSlot`

---

### GET `/api/AppointmentSlot/GetAvailableSlots`

Returns all slots for a given date with remaining capacity.

**No Authentication Required**

> **Note:** Returns an empty array for **Sundays** — no slots are available on Sundays.

**Query Parameters**

| Parameter | Type | Required | Format | Description |
|-----------|------|----------|--------|-------------|
| `date` | datetime | ✅ | `YYYY-MM-DD` | Date to check availability |

**Example Requests**
```
GET /api/AppointmentSlot/GetAvailableSlots?date=2025-03-20
GET /api/AppointmentSlot/GetAvailableSlots?date=2025-03-20T00:00:00
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Array of slot objects |
| 500 | Server Error | Internal error |

**200 Response**
```json
[
  {
    "slotDate": "2025-03-20T00:00:00",
    "slotTime": "10:00",
    "bookedCount": 2,
    "maxPersons": 5,
    "remainingSlots": 3,
    "isAvailable": true
  },
  {
    "slotDate": "2025-03-20T00:00:00",
    "slotTime": "10:30",
    "bookedCount": 5,
    "maxPersons": 5,
    "remainingSlots": 0,
    "isAvailable": false
  },
  {
    "slotDate": "2025-03-20T00:00:00",
    "slotTime": "14:00",
    "bookedCount": 1,
    "maxPersons": 5,
    "remainingSlots": 4,
    "isAvailable": true
  }
]
```

> In the UI, only display slots where `isAvailable === true`.

---

### POST `/api/AppointmentSlot/BookSlot`

Books an appointment slot for a patient linked to a specific prescription.

**No Authentication Required**

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | ✅ | Patient's human-readable ID |
| `prescriptionId` | long | ✅ | Approved prescription ID (> 0) |
| `slotDate` | datetime | ✅ | ISO 8601 date (e.g. `2025-03-20T00:00:00`) |
| `slotTime` | string | ✅ | 24-hr time string (e.g. `"10:00"`, `"14:30"`) |

**Example Request**
```json
{
  "patientId": "PAT-2025-0012",
  "prescriptionId": 45,
  "slotDate": "2025-03-20T00:00:00",
  "slotTime": "10:00"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Slot booked |
| 400 | Bad Request | Required fields missing, invalid slot time, or Sunday |
| 409 | Conflict | Slot is fully booked |
| 500 | Server Error | Internal error |

**200 Response**
```json
{
  "bookingId": 101,
  "message": "Slot booked successfully at 10:00 on 2025-03-20",
  "remainingSlots": 2
}
```

**400 Response (Sunday)**
```json
{ "message": "Booking is not available on Sundays" }
```

**409 Response**
```json
{ "message": "Slot is fully booked" }
```

---

### GET `/api/AppointmentSlot/GetSlotByPatientAndPrescription`

Gets the booked slot for a patient + prescription combination.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patientId` | string | ✅ | Patient's human-readable ID |
| `prescriptionId` | long | ✅ | Prescription ID |

**Example Request**
```
GET /api/AppointmentSlot/GetSlotByPatientAndPrescription?patientId=PAT-2025-0012&prescriptionId=45
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Booking details |
| 400 | Bad Request | Parameters missing |
| 404 | Not Found | No booking found for this patient + prescription |

**200 Response**
```json
{
  "id": 101,
  "slotDate": "2025-03-20T00:00:00",
  "slotTime": "10:00:00",
  "bookedCount": 3,
  "maxPersons": 5
}
```

---

### POST `/api/AppointmentSlot/RescheduleSlot`

Cancels the existing booking and creates a new one at the requested slot.

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bookingId` | long | ✅ | Existing booking ID (from `BookSlot` response) |
| `patientId` | string | ✅ | Patient's human-readable ID |
| `prescriptionId` | long | ✅ | Same prescription ID as original booking |
| `slotDate` | datetime | ✅ | New date (ISO 8601) |
| `slotTime` | string | ✅ | New time (e.g. `"11:00"`) |

**Example Request**
```json
{
  "bookingId": 101,
  "patientId": "PAT-2025-0012",
  "prescriptionId": 45,
  "slotDate": "2025-03-21T00:00:00",
  "slotTime": "11:00"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Rescheduled |
| 400 | Bad Request | Required fields missing |
| 500 | Server Error | Internal error |

**200 Response**
```json
{
  "bookingId": 101,
  "message": "Slot rescheduled successfully",
  "remainingSlots": 4
}
```

---

## 7. OTP

Base path: `/Otp`

> **Note:** This controller is a standalone utility with in-memory OTP storage. For patient authentication, prefer `/Patient/Register` + `/Patient/Login` which use **AWS SNS** for SMS delivery.

---

### POST `/Otp/send`

Generates and stores a 6-digit OTP in memory for the given mobile number (no SMS sent).

**No Authentication Required**

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobileNumber` | string | ✅ | Recipient mobile number |

**Example Request**
```json
{ "mobileNumber": "9876543210" }
```

**200 Response**
```json
{
  "message": "OTP sent successfully",
  "mobileNumber": "9876543210"
}
```

---

### POST `/Otp/verify`

Verifies the OTP stored in memory.

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mobileNumber` | string | ✅ | Mobile number |
| `otp` | string | ✅ | 6-digit OTP |

**Example Request**
```json
{
  "mobileNumber": "9876543210",
  "otp": "123456"
}
```

**200 Response (valid)**
```json
{ "message": "OTP verified successfully", "isValid": true }
```

**200 Response (invalid)**
```json
{ "message": "Invalid OTP", "isValid": false }
```

---

## 8. Inventory

Base path: `/Inventory`

---

### GET `/Inventory/GetInventoryList`

Returns the full inventory master list.

**No Authentication Required**  
**No Parameters**

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Array of inventory items |
| 500 | Server Error | Internal error |

**200 Response**
```json
[
  {
    "id": 1,
    "name": "Paracetamol 500mg",
    "type": "Tablet",
    "disease": "Fever / Pain",
    "dosageValue": 500.0,
    "dosageUnits": "mg",
    "quantityValue": 10,
    "quantityUnits": "tablets",
    "mrp": 20.00,
    "discount": 5.00,
    "finalPrice": 15.00,
    "status": 1,
    "createdDate": "2025-01-01T00:00:00",
    "updatedDate": "2025-01-15T00:00:00"
  },
  {
    "id": 2,
    "name": "Amoxicillin 250mg",
    "type": "Capsule",
    "disease": "Bacterial Infection",
    "dosageValue": 250.0,
    "dosageUnits": "mg",
    "quantityValue": 15,
    "quantityUnits": "capsules",
    "mrp": 85.00,
    "discount": 10.00,
    "finalPrice": 75.00,
    "status": 1,
    "createdDate": "2025-01-01T00:00:00",
    "updatedDate": "2025-01-15T00:00:00"
  }
]
```

---

### POST `/Inventory/save`

Creates or updates inventory items in bulk. Item with `id > 0` is updated; `id = 0` creates a new record.

**Request Body** (`application/json`) — Array of `InventoryItem` objects

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | long | ❌ | `0` for new; existing DB ID to update |
| `name` | string | ✅ | Medicine name |
| `type` | string | ✅ | `Tablet`, `Capsule`, `Syrup`, `Injection`, `Ointment`, etc. |
| `disease` | string | ❌ | Associated disease/condition |
| `dosageValue` | decimal | ✅ | Numeric dosage (e.g. `500`) |
| `dosageUnits` | string | ✅ | `mg`, `ml`, `g` |
| `quantityValue` | int | ✅ | Units per pack |
| `quantityUnits` | string | ✅ | `tablets`, `capsules`, `strips`, `ml` |
| `mrp` | decimal | ✅ | Maximum Retail Price |
| `discount` | decimal | ❌ | Discount amount (default `0.00`) |
| `finalPrice` | decimal | ✅ | MRP minus discount |
| `status` | int | ❌ | `1` = Active, `0` = Inactive (default: `1`) |
| `createdBy` | long | ❌ | User ID of creator |
| `updatedBy` | long | ❌ | User ID of last modifier |

**Example Request**
```json
[
  {
    "id": 0,
    "name": "Paracetamol 500mg",
    "type": "Tablet",
    "disease": "Fever / Pain",
    "dosageValue": 500,
    "dosageUnits": "mg",
    "quantityValue": 10,
    "quantityUnits": "tablets",
    "mrp": 20.00,
    "discount": 5.00,
    "finalPrice": 15.00,
    "status": 1,
    "createdBy": 1
  },
  {
    "id": 3,
    "name": "Ibuprofen 400mg",
    "type": "Tablet",
    "disease": "Pain / Inflammation",
    "dosageValue": 400,
    "dosageUnits": "mg",
    "quantityValue": 15,
    "quantityUnits": "tablets",
    "mrp": 45.00,
    "discount": 5.00,
    "finalPrice": 40.00,
    "status": 1,
    "updatedBy": 1
  }
]
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Items saved |
| 400 | Bad Request | Empty array |
| 500 | Server Error | Internal error |

**200 Response**
```json
{ "message": "Items saved successfully", "count": 2 }
```

---

### DELETE `/Inventory`

Soft-deletes an inventory item (marks inactive; does not physically remove the record).

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `inventoryId` | long | ✅ | ID of inventory item to delete |
| `userId` | long | ✅ | ID of user performing the action (audit trail) |

**Example Request**
```
DELETE /Inventory?inventoryId=5&userId=1
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Deleted |
| 404 | Not Found | Item not found |
| 500 | Server Error | Internal error |

**200 Response**
```json
{ "message": "Inventory item deleted successfully" }
```

---

## 9. Invoice

Base path: `/api/Invoice`

---

### POST `/api/Invoice/GenerateInvoice`

Generates a prescription invoice by fetching the prescription's medicines from the database, matching them against inventory, and computing totals. Saves the invoice record in the database.

**Content-Type:** `application/json`

**Request Body** (`GenerateInvoiceRequest`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | ✅ | Patient's human-readable ID (e.g. `PAT-2025-0012`) |
| `prescriptionKey` | int | ✅ | Prescription's DB ID (> 0) |
| `id` | int | ✅ | Patient's internal numeric DB ID |

**Example Request**
```
POST /api/Invoice/GenerateInvoice
```
```json
{
  "patientId": "PAT-2025-0012",
  "prescriptionKey": 45,
  "id": 12
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Invoice object (even if some medicines not found) |
| 400 | Bad Request | `patientId` empty or `prescriptionKey` < 1 |
| 500 | Server Error | Prescription not found, no medicines, or internal error |

**200 Response**
```json
{
  "prescriptionId": 45,
  "patientId": "PAT-2025-0012",
  "items": [
    {
      "medicineName": "Paracetamol",
      "inventoryId": 1,
      "mrp": 20.00,
      "discount": 5.00,
      "finalPrice": 15.00,
      "isAvailable": true
    },
    {
      "medicineName": "Amoxicillin",
      "inventoryId": 2,
      "mrp": 85.00,
      "discount": 10.00,
      "finalPrice": 75.00,
      "isAvailable": true
    },
    {
      "medicineName": "UnlistedDrug",
      "inventoryId": null,
      "mrp": 0.00,
      "discount": 0.00,
      "finalPrice": 0.00,
      "isAvailable": false
    }
  ],
  "subtotal": 105.00,
  "totalDiscount": 15.00,
  "totalAmount": 90.00,
  "generatedDate": "2025-03-16T14:30:00Z",
  "invoiceNumber": "INV-2025-0045"
}
```

> Items where `isAvailable: false` were not found in inventory — display them as unavailable in the UI.

---

### GET `/api/Invoice/GetInvoicesByPatient`

Returns a list of all invoices for a patient by their internal numeric DB ID.

**No Authentication Required**

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patientId` | int | ✅ | Patient's internal numeric DB ID (> 0) |

**Example Request**
```
GET /api/Invoice/GetInvoicesByPatient?patientId=12
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Array of invoice summary records |
| 400 | Bad Request | `patientId` < 1 |
| 500 | Server Error | Internal error |

**200 Response**
```json
[
  {
    "invoiceNumber": "INV-2025-0045",
    "prescriptionId": 45,
    "pId": "12",
    "patientId": "PAT-2025-0012",
    "totalAmount": 90.00,
    "status": "PAID",
    "createdDate": "2025-03-16T14:30:00"
  }
]
```

---

### GET `/api/Invoice/GetInvoice`

Fetches the full invoice (with line items) for a specific patient + prescription combination.

**No Authentication Required**

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `patientId` | int | ✅ | Patient's internal numeric DB ID (> 0) |
| `prescriptionId` | int | ✅ | Prescription DB ID (> 0) |

**Example Request**
```
GET /api/Invoice/GetInvoice?patientId=12&prescriptionId=45
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Invoice found **or** `invoiceExists: false` (no 404) |
| 400 | Bad Request | `patientId` or `prescriptionId` < 1 |
| 500 | Server Error | Internal error |

**200 Response — invoice found**
```json
{
  "invoiceExists": true,
  "invoice": {
    "prescriptionId": 45,
    "patientId": "PAT-2025-0012",
    "items": [
      {
        "medicineName": "Paracetamol",
        "inventoryId": 1,
        "mrp": 20.00,
        "discount": 5.00,
        "finalPrice": 15.00,
        "isAvailable": true
      }
    ],
    "subtotal": 20.00,
    "totalDiscount": 5.00,
    "totalAmount": 90.00,
    "generatedDate": "2025-03-16T14:30:00Z",
    "invoiceNumber": "INV-2025-0045"
  }
}
```

**200 Response — no invoice**
```json
{ "invoiceExists": false, "message": "No invoice found" }
```

---

### POST `/api/Invoice/UpdateInvoiceStatus`

Marks an invoice as paid/processed after successful payment confirmation.

> **Query parameters only — no request body**

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `InvoiceNumber` | string | ✅ | Invoice number (e.g. `INV-2025-0045`) |
| `PrescriptionId` | int | ✅ | Associated prescription ID |

**Example Request**
```
POST /api/Invoice/UpdateInvoiceStatus?InvoiceNumber=INV-2025-0045&PrescriptionId=45
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Invoice updated |
| 400 | Bad Request | `InvoiceNumber` empty or `PrescriptionId` < 1 |
| 404 | Not Found | Invoice not found or already processed |
| 500 | Server Error | Internal error |

**200 Response**
```json
{ "message": "Invoice updated successfully" }
```

---

## 10. Payment

Base path: `/Payment`

> Powered by [Razorpay](https://razorpay.com). Include Razorpay JS SDK:
> `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`

---

### GET `/Payment/key`

Returns the Razorpay public key ID needed to initialize the checkout widget.

**No Authentication Required**  
**No Parameters**

**200 Response**
```json
{ "key": "rzp_test_xxxxxxxxxxxx" }
```

---

### POST `/Payment/create-order`

Creates a Razorpay payment order and returns order details.

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | decimal | ✅ | Amount in **INR** (e.g. `90.00`) — backend converts to paise |
| `patientId` | string | ✅ | Patient ID for the receipt reference |

**Example Request**
```json
{
  "amount": 90.00,
  "patientId": "PAT-2025-0012"
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Order created |
| 500 | Server Error | Razorpay API error |

**200 Response**
```json
{
  "orderId": "order_PkKm9xxxxxxxx",
  "amount": 9000,
  "currency": "INR",
  "receipt": "PAT-2025-0012_1710590400"
}
```

> `amount` in the response is in **paise** (INR × 100). Pass it directly to Razorpay checkout.

---

### POST `/Payment/verify`

Verifies the Razorpay payment HMAC signature to confirm payment authenticity.

**Request Body** (`application/json`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | string | ✅ | `razorpay_order_id` from Razorpay callback |
| `paymentId` | string | ✅ | `razorpay_payment_id` from Razorpay callback |
| `signature` | string | ✅ | `razorpay_signature` from Razorpay callback |

**Example Request**
```json
{
  "orderId": "order_PkKm9xxxxxxxx",
  "paymentId": "pay_PkKnxxxxxxxx",
  "signature": "a1b2c3d4e5f6..."
}
```

**Responses**

| Status | Meaning | When |
|--------|---------|------|
| 200 | OK | Returns verification result |
| 500 | Server Error | Verification failed |

**200 Response (success)**
```json
{ "success": true, "message": "Payment verified" }
```

**200 Response (failed)**
```json
{ "success": false, "message": "Payment verification failed" }
```

---

## 11. Common

Base path: `/Common`

---

### GET `/Common/GetIncomeLevels`

Returns all income level categories with discount percentages. Used to populate the KYC approval dropdown.

**No Authentication Required**  
**No Parameters**

**200 Response**
```json
[
  {
    "id": 1,
    "incomeLevelName": "BPL",
    "discountPercentage": 100.0,
    "description": "Below Poverty Line — full subsidy",
    "status": 1
  },
  {
    "id": 2,
    "incomeLevelName": "APL",
    "discountPercentage": 50.0,
    "description": "Above Poverty Line — 50% subsidy",
    "status": 1
  },
  {
    "id": 3,
    "incomeLevelName": "General",
    "discountPercentage": 0.0,
    "description": "No subsidy",
    "status": 1
  }
]
```

---

## Model Reference

### `User`

| Property | Type | Description |
|----------|------|-------------|
| `id` | int | Internal DB ID |
| `firstname` | string | First name |
| `lastname` | string | Last name |
| `username` | string | Login username (unique) |
| `password` | string | Password (write-only, never returned) |
| `email` | string | Email address |
| `role` | string | `Admin` or `Staff` |
| `status` | int | `1` = Active, `0` = Inactive |

---

### `Patientdetails`

| Property | Type | Description |
|----------|------|-------------|
| `id` | long | Internal numeric DB ID |
| `patientId` | string? | Human-readable ID (e.g. `PAT-2025-0012`) |
| `fullName` | string? | Full name |
| `mobileNumber` | string? | 10-digit mobile |
| `email` | string? | Email |
| `aadharNumber` | string? | Aadhaar number |
| `dob` | datetime? | Date of birth |
| `registrationDate` | datetime | Date of registration |
| `registrationStatus` | string? | `Pending` / `Approved` / `Rejected` |
| `kycStatus` | string? | `Pending` / `Approved` / `Rejected` |
| `status` | int | `1` = Active, `0` = Inactive |
| `firstLogin` | int | `1` = first login, `0` = returning |
| `kycDocumentUrl` | string? | S3 URL to uploaded KYC document |
| `incomeLevel` | string? | Assigned income level name |
| `discountPercentage` | decimal? | Discount % based on income level |

---

### `InventoryItem`

| Property | Type | Description |
|----------|------|-------------|
| `id` | long | Internal DB ID |
| `name` | string | Medicine name |
| `type` | string | `Tablet`, `Capsule`, `Syrup`, `Injection` |
| `disease` | string? | Associated disease/condition |
| `dosageValue` | decimal | Numeric dosage |
| `dosageUnits` | string | `mg`, `ml`, `g` |
| `quantityValue` | int | Units per pack |
| `quantityUnits` | string | `tablets`, `capsules`, `strips` |
| `mrp` | decimal | Maximum Retail Price |
| `discount` | decimal | Discount amount |
| `finalPrice` | decimal | MRP − discount |
| `status` | int | `1` = Active, `0` = Inactive |
| `createdBy` | long? | Creator user ID |
| `createdDate` | datetime | Creation timestamp |
| `updatedDate` | datetime | Last update timestamp |
| `updatedBy` | long? | Last modifier user ID |

---

### `PrescriptionInfo` (upload result)

| Property | Type | Description |
|----------|------|-------------|
| `medicines` | MedicineInfo[] | AI-extracted medicine list |
| `doctorName` | string | Extracted doctor name |
| `hospitalName` | string | Extracted hospital name |
| `prescriptionKey` | string | S3 object key |
| `prescriptionId` | long? | DB ID (null until saved via SavePrescription) |

---

### `PrescriptionSaveRequest`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `prescriptionKey` | string | ✅ | S3 object key |
| `patientId` | string | ✅ | Patient's human-readable ID |
| `pId` | long | ❌ | Patient's internal numeric DB ID |
| `doctorName` | string? | ❌ | Doctor name |
| `hospitalName` | string? | ❌ | Hospital name |
| `medicines` | MedicineInfo[] | ✅ | At least 1 item |

---

### `PrescriptionDetails`

| Property | Type | Description |
|----------|------|-------------|
| `id` | long | Internal DB ID |
| `prescriptionKey` | string | S3 object key |
| `patientId` | string | Patient's human-readable ID |
| `pId` | long | Patient's internal numeric DB ID |
| `doctorName` | string? | Doctor name |
| `hospitalName` | string? | Hospital name |
| `prescriptionUrl` | string | Full S3 URL |
| `uploadDate` | datetime | Upload timestamp |
| `status` | string | `PENDING` / `APPROVED` / `REJECTED` / `PROCESSED` / `RECEIVED` |
| `createdDate` | datetime | Record creation time |
| `updatedDate` | datetime | Last update time |
| `medicines` | MedicineInfo[]? | Extracted medicines list |
| `approvedBy` | string? | Approver username |
| `approvedDate` | datetime? | Approval timestamp |
| `approvalRemarks` | string? | Admin remarks |

---

### `MedicineInfo`

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Medicine name |
| `dosage` | string? | Dosage (e.g. `500mg`) |
| `frequency` | string? | Frequency (e.g. `Twice daily`) |

---

### `SlotAvailability`

| Property | Type | Description |
|----------|------|-------------|
| `slotDate` | datetime | Date of slot |
| `slotTime` | string | Time (`HH:mm`) |
| `bookedCount` | int | Current bookings |
| `maxPersons` | int | Max capacity (5) |
| `remainingSlots` | int | `maxPersons − bookedCount` |
| `isAvailable` | bool | `true` if `remainingSlots > 0` |

---

### `BookAppointmentRequest`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `patientId` | string | ✅ | Patient ID |
| `prescriptionId` | long | ✅ | Prescription ID (> 0) |
| `slotDate` | datetime | ✅ | ISO 8601 date |
| `slotTime` | string | ✅ | `HH:mm` time string |

---

### `BookAppointmentResponse`

| Property | Type | Description |
|----------|------|-------------|
| `bookingId` | long | Created booking ID (use for reschedule) |
| `message` | string | Status message |
| `remainingSlots` | int | Remaining capacity after booking |

---

### `GenerateInvoiceRequest`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `patientId` | string | ✅ | Patient's human-readable ID |
| `prescriptionKey` | int | ✅ | Prescription's DB ID |
| `id` | int | ✅ | Patient's internal numeric DB ID |

---

### `InvoiceDetails`

| Property | Type | Description |
|----------|------|-------------|
| `invoiceNumber` | string | Unique invoice reference |
| `prescriptionId` | int | Associated prescription DB ID |
| `pId` | string | Patient's internal numeric DB ID |
| `patientId` | string | Patient's human-readable ID |
| `totalAmount` | decimal | Total amount charged |
| `status` | string | Invoice status (e.g. `PAID`, `PENDING`) |
| `createdDate` | datetime | Invoice creation timestamp |

---

### `PrescriptionInvoice`

| Property | Type | Description |
|----------|------|-------------|
| `prescriptionId` | int | Prescription DB ID |
| `patientId` | string | Patient ID |
| `items` | InvoiceItem[] | Line items |
| `subtotal` | decimal | Sum of all MRPs |
| `totalDiscount` | decimal | Sum of all discounts |
| `totalAmount` | decimal | Sum of all final prices (amount to charge) |
| `generatedDate` | datetime | UTC generation timestamp |
| `invoiceNumber` | string | Unique invoice reference |

---

### `InvoiceItem`

| Property | Type | Description |
|----------|------|-------------|
| `medicineName` | string | Medicine name |
| `inventoryId` | long? | Matched inventory ID (`null` if not found) |
| `mrp` | decimal | Unit MRP |
| `discount` | decimal | Applied discount |
| `finalPrice` | decimal | Net price |
| `isAvailable` | bool | `false` if medicine not found in inventory |

---

### `PaymentOrder`

| Property | Type | Description |
|----------|------|-------------|
| `orderId` | string | Razorpay order ID |
| `amount` | decimal | Amount in **paise** |
| `currency` | string | Always `INR` |
| `receipt` | string | Receipt reference |

---

### `PaymentDetails`

| Property | Type | Description |
|----------|------|-------------|
| `id` | long | Internal DB ID |
| `patientId` | string? | Patient's human-readable ID |
| `orderId` | string | Razorpay order ID |
| `paymentId` | string? | Razorpay payment ID (set after payment) |
| `amount` | decimal | Amount in INR |
| `status` | string | Payment status |
| `createdDate` | datetime | Payment record creation timestamp |

---

### `IncomeLevel`

| Property | Type | Description |
|----------|------|-------------|
| `id` | int | DB ID |
| `incomeLevelName` | string | Level name (e.g. `BPL`) |
| `discountPercentage` | decimal | Discount % applied |
| `description` | string? | Human-readable description |
| `status` | int | `1` = Active |

---

## Error Codes Summary

| HTTP Status | Meaning | Common Causes |
|-------------|---------|---------------|
| `200` | Success | — |
| `400` | Bad Request | Missing required fields, invalid values |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Insufficient RBAC permissions |
| `404` | Not Found | Record not found in database |
| `409` | Conflict | Duplicate record (Aadhaar), fully booked slot |
| `500` | Server Error | Unhandled exception — check server logs |

**Standard error response:**
```json
{
  "message": "Human-readable error description",
  "details": "Optional technical detail (dev only)"
}
```

**Prescription/Invoice error response:**
```json
{
  "error": "Short error label",
  "details": "Optional technical detail"
}
```

---

## Complete Workflow Flows

### Flow 1 — Patient Onboarding

```
1. POST /Patient/Register
   Body: { mobileNumber }
   ← OTP sent via AWS SNS SMS

2. POST /Patient/Login
   Body: { mobileNumber, otp }
   ← Token + patient object (existing) OR patientId (new registration)

3. POST /Patient/SavePatientInfo  [multipart/form-data]
   Fields: fullName, aadharNumber, dob, mobileNumber, email, kycDocument
   ← Patient profile created; KYC doc uploaded to S3

4. [Admin] GET /Patient/GetPatientsByStatus?kycstatus=Pending
   ← View pending KYC queue

5. [Admin] GET /Common/GetIncomeLevels
   ← Get income category options for dropdown

6. [Admin] POST /Admin/ApproveKyc
   Body: { id, incomeLevel }
   ← KYC approved; discount percentage set on patient

7. [Admin] POST /Admin/UpdateRegistrationStatus
   Body: { id, patientId: "PAT-2025-XXXX", registrationStatus: "Approved" }
   ← Patient fully onboarded with permanent ID
```

---

### Flow 2 — Prescription Processing

```
1. POST /api/Prescription/uploadPrescription  [multipart/form-data, JWT required]
   Fields: file, patientId, id (pId)
   ← { medicines[], doctorName, hospitalName, prescriptionKey }

2. POST /api/Prescription/SavePrescription  [JWT required]
   Body: { prescriptionKey, patientId, pId, doctorName, hospitalName, medicines[] }
   ← { prescriptionId: 45 }

3. [Admin] GET /api/Prescription/GetPrescriptionsByStatus?PrescriptionStatus=PENDING  [JWT]
   ← Pending prescriptions list

4a. [Admin] POST /api/Prescription/ApprovePrescription  [JWT]
    Body: { prescriptionId: 45, approvedBy: "admin", remarks: "..." }
    ← Prescription marked APPROVED

4b. [Admin] POST /api/Prescription/RejectPrescription  [JWT]
    Body: { prescriptionId: 45, rejectedBy: "admin", reason: "..." }
    ← Prescription marked REJECTED

5. POST /api/Prescription/MarkPrescriptionCollected?PrescriptionId=45  [JWT]
   ← Prescription marked RECEIVED (patient collected medicines)
```

---

### Flow 3 — Appointment Booking

```
1. GET /api/AppointmentSlot/GetAvailableSlots?date=2025-03-20
   ← Slots array; filter where isAvailable === true

2. POST /api/AppointmentSlot/BookSlot
   Body: { patientId, prescriptionId, slotDate, slotTime }
   ← { bookingId: 101, remainingSlots: 2 }

3. (Check booking) GET /api/AppointmentSlot/GetSlotByPatientAndPrescription
   ?patientId=PAT-2025-0012&prescriptionId=45

4. (Reschedule) POST /api/AppointmentSlot/RescheduleSlot
   Body: { bookingId, patientId, prescriptionId, slotDate, slotTime }
```

---

### Flow 4 — Invoice & Payment

```
0. (Optional) GET /api/Invoice/GetInvoice?patientId=12&prescriptionId=45
   ← Check if an invoice already exists for this prescription

1. POST /api/Invoice/GenerateInvoice
   Body: { patientId: "PAT-2025-0012", prescriptionKey: 45, id: 12 }
   ← { invoiceNumber, totalAmount, items[] }  (medicines fetched from DB automatically)

2. GET /Payment/key
   ← { key: "rzp_test_..." }

3. POST /Payment/create-order
   Body: { amount: totalAmount, patientId }
   ← { orderId, amount (paise), currency }

4. [Frontend] Open Razorpay checkout with orderId + amount (paise)

5. POST /Payment/verify
   Body: { orderId, paymentId, signature }  (from Razorpay callback)
   ← { success: true }

6. POST /api/Invoice/UpdateInvoiceStatus
   ?InvoiceNumber=INV-2025-0045&PrescriptionId=45
   ← { message: "Invoice updated successfully" }
```

---

### Prescription Status Lifecycle

```
PENDING → APPROVED → PROCESSED → RECEIVED
       ↘
         REJECTED
```

| Status | Set By | Meaning |
|--------|--------|---------|
| `PENDING` | System (on save) | Uploaded, awaiting admin review |
| `APPROVED` | Admin (`ApprovePrescription`) | Verified and ready for dispensing |
| `REJECTED` | Admin (`RejectPrescription`) | Declined; patient must re-upload |
| `PROCESSED` | System (on invoice update) | Invoice paid and order fulfilled |
| `RECEIVED` | Staff (`MarkPrescriptionCollected`) | Patient physically collected medicines |

---

*Generated from PharmaCare backend source — March 2026*
