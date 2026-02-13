export type RootStackParamList = {
  Landing: undefined;
  AdminLogin: undefined;
  PatientLogin: undefined;
  PatientOtp: { mobileNumber: string; email?: string };
  PatientDetails: { mobileNumber: string; patientId?: string; isFirstLogin?: boolean };
  AdminMain: undefined;
  PatientMain: { mobileNumber: string; patientId: string };
  PrescriptionUpload: { patientId: string; mobileNumber: string };
  InvoiceView: { patientId: string; mobileNumber: string; prescriptionData?: { doctorName: string; hospitalName: string }; discountPercentage?: number };
  SlotBooking: { patientId: string; mobileNumber: string };
  PatientProfile: { mobileNumber: string; patientId: string };
};

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Approvals: undefined;
  Patients: undefined;
  Inventory: undefined;
  Users: undefined;
  Profile: undefined;
};

export type PatientDrawerParamList = {
  Dashboard: { mobileNumber: string; patientId: string };
  PrescriptionUpload: { patientId: string; mobileNumber: string };
  InvoiceView: { patientId: string; mobileNumber: string };
  SlotBooking: { patientId: string; mobileNumber: string };
  Profile: { mobileNumber: string; patientId: string };
};

export type PatientStackParamList = {
  PatientDashboard: { mobileNumber: string; patientId: string };
  PrescriptionUpload: { patientId: string };
  InvoiceView: { patientId: string };
  SlotBooking: { patientId: string };
};

export type InventoryStackParamList = {
  InventoryList: undefined;
  AddEditInventory: { item?: import('./api').InventoryItem };
};
