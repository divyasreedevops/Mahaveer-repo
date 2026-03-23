import { useState, useEffect } from 'react';
import { useApp, Prescription, Pickup } from '@/app/context/AppContext';
import { Invoice } from '@/app/context/AppContextDef';
import { api } from '@/app/services/api';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PatientDetailsForm } from './PatientDetailsForm';
import { PrescriptionUploadForm } from './PrescriptionUploadForm';
import { SlotBookingModal } from './SlotBookingModal';
import { PatientHistory } from './PatientHistory';
import { InvoicePaymentModal } from './InvoicePaymentModal';
import {
  LogOut,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Calendar,
  History,
  FileText,
  Receipt,
  AlertTriangle,
  Loader2,
  Download,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export function PatientDashboard() {
  const { currentPatient, logout, patientConfirmCollection, refreshPatientData } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isResubmitting, setIsResubmitting] = useState(false);

  useEffect(() => {
    setIsRefreshing(true);
    refreshPatientData().finally(() => setIsRefreshing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<{
    prescriptionId: string;
    pickupId: string;
    invoice: any;
  } | null>(null);

  const [selectedPickup, setSelectedPickup] = useState<{
    prescriptionId: string;
    pickupId: string;
    isReschedule: boolean;
  } | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState<string | null>(null);

  if (!currentPatient || isRefreshing) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // pending + details not yet submitted → show the personal details / KYC form
  if ((currentPatient.kycStatus === 'pending' && !currentPatient.incomeDocumentUrl) || isResubmitting) {
    return (
      <div className="min-h-screen bg-blue-50">
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl text-gray-800 font-normal">Mahaveer Pharmacy</h1>
            </div>
            <Button variant="outline" onClick={logout} className="border-gray-100 rounded-xl">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <PatientDetailsForm />
        </main>
      </div>
    );
  }

  // pending + details submitted → show review-in-progress card
  if (currentPatient.kycStatus === 'pending' && currentPatient.incomeDocumentUrl) {
    return (
      <div className="min-h-screen bg-blue-50">
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl text-gray-800 font-normal">Mahaveer Pharmacy</h1>
            </div>
            <Button variant="outline" onClick={logout} className="border-gray-100 rounded-xl">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto border-gray-100 shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-blue-600 h-2 w-full"></div>
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Clock className="w-10 h-10 text-blue-600 animate-pulse" />
              </div>
              <CardTitle className="text-2xl text-gray-800 font-normal">
                KYC Review in Progress
              </CardTitle>
              <CardDescription className="text-gray-500 font-light text-base">
                Your documents have been submitted and are being verified by our medical
                administration team.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 font-light">Patient ID</span>
                  <span className="text-gray-800 font-normal">{currentPatient.patientId}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 font-light">Name</span>
                  <span className="text-gray-800 font-normal">{currentPatient.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-light">Status</span>
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-normal px-3 py-1 rounded-full">
                    Verification Pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (currentPatient.kycStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-blue-50">
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl text-gray-800 font-normal">Mahaveer Pharmacy</h1>
            </div>
            <Button variant="outline" onClick={logout} className="border-gray-100 rounded-xl">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          <Card className="max-w-lg mx-auto border-gray-100 shadow-xl rounded-3xl overflow-hidden">
            <div className="bg-red-500 h-2 w-full"></div>
            <CardHeader className="text-center pt-8">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-gray-800 font-normal">
                KYC Submission Rejected
              </CardTitle>
              <CardDescription className="text-gray-500 font-light">
                We couldn't verify your documents. Please review the reason below and resubmit.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 space-y-6">
              <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6">
                <p className="text-sm text-red-800 font-light leading-relaxed">
                  <strong className="font-normal block mb-1">Feedback from Admin:</strong>
                  {currentPatient.kycRejectionReason ||
                    'Documents provided were unclear or incomplete.'}
                </p>
              </div>
              <Button 
                onClick={() => setIsResubmitting(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 py-6 rounded-xl font-normal text-lg"
              >
                Resubmit KYC Documents
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Both pending and rejected are handled above; only 'approved' reaches here — go straight to dashboard.

  if (showHistory) {
    return <PatientHistory onBack={() => setShowHistory(false)} />;
  }

  const activePrescriptions = currentPatient.prescriptions.filter(
    (p) => p.approvalStatus === 'approved' && p.pickups.some((pk) => pk.status !== 'collected')
  );
  const pendingPrescription = currentPatient.prescriptions.find(
    (p) => p.approvalStatus === 'pending'
  );
  const rejectedPrescription = currentPatient.prescriptions.find(
    (p) => p.approvalStatus === 'rejected'
  );

  const handleViewAndPay = async (presc: Prescription) => {
    if (!currentPatient) return;
    setIsGeneratingInvoice(presc.id);
    try {
      let res: any;

      // First check if an invoice already exists for this prescription
      try {
        const existing = await api.invoice.getInvoice(
          parseInt(currentPatient.id),
          parseInt(presc.id)
        );
        if (existing.invoiceExists && existing.invoice) {
          res = existing.invoice;
        }
      } catch {
        /* no existing invoice, will generate */
      }

      // Generate a new invoice if none exists
      if (!res) {
        res = await api.invoice.generate(
          currentPatient.patientId,
          parseInt(presc.id),
          parseInt(currentPatient.id)
        );
      }

      const invoice: Invoice = {
        invoiceNumber: res.invoiceNumber || `INV-${presc.id}`,
        prescriptionId: res.prescriptionId,
        patientId: res.patientId,
        items: (res.items || []).map((item: any) => ({
          medicineName: item.medicineName || '',
          inventoryId: item.inventoryId ?? null,
          mrp: item.mrp || 0,
          discount: item.discount || 0,
          finalPrice: item.finalPrice || 0,
          isAvailable: item.isAvailable ?? true,
        })),
        subtotal: res.subtotal || 0,
        totalDiscount: res.totalDiscount || 0,
        totalAmount: res.totalAmount || 0,
        generatedDate: res.generatedDate,
      };
      const pickupId = presc.pickups[0]?.id || `pickup-${presc.id}`;
      setShowInvoiceModal({ prescriptionId: presc.id, pickupId, invoice });
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate invoice. Please try again.');
    } finally {
      setIsGeneratingInvoice(null);
    }
  };

  const handleBookSlot = (prescriptionId: string, pickupId: string) => {
    setSelectedPickup({ prescriptionId, pickupId, isReschedule: false });
    setShowSlotModal(true);
  };
  const handleReschedule = (prescriptionId: string, pickupId: string) => {
    setSelectedPickup({ prescriptionId, pickupId, isReschedule: true });
    setShowSlotModal(true);
  };

  const handleDownloadNotice = (prescription: Prescription) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const today = new Date().toLocaleDateString();
    const medicinesHtml = prescription.missingMedicines.map((med, i) => `<li>${med}</li>`).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Medicine Availability Notice</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; position: relative; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(0,0,0,0.05); white-space: nowrap; z-index: -1; pointer-events: none; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .pharmacy-name { font-size: 24px; color: #2563eb; font-weight: bold; }
            .notice-title { text-align: center; font-size: 20px; margin-bottom: 30px; text-decoration: underline; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; }
            .footer { margin-top: 50px; font-size: 12px; color: #666; font-style: italic; border-top: 1px solid #eee; padding-top: 10px; }
            ol { padding-left: 20px; }
          </style>
        </head>
        <body>
          <div class="watermark">PHARMACY NOTICE</div>
          <div class="header">
            <div class="pharmacy-name">Mahaveer Pharmacy</div>
            <div>Date: ${today}</div>
          </div>
          <div class="notice-title">NOTICE OF MEDICINE UNAVAILABILITY</div>
          <div class="section">
            <div class="section-title">PATIENT DETAILS</div>
            <div><strong>Name:</strong> ${currentPatient.name}</div>
            <div><strong>Patient ID:</strong> ${currentPatient.patientId}</div>
          </div>
          <div class="section">
            <div class="section-title">PRESCRIPTION DETAILS</div>
            <div><strong>Doctor:</strong> Dr. ${prescription.doctorName}</div>
            <div><strong>Hospital:</strong> ${prescription.hospitalName}</div>
            <div><strong>Upload Date:</strong> ${new Date(prescription.uploadDate).toLocaleDateString()}</div>
          </div>
          <div class="section">
            <div class="section-title">MEDICINES CURRENTLY UNAVAILABLE</div>
            <ol>${medicinesHtml}</ol>
          </div>
          <div class="section">
            <p>Please contact the pharmacy for an estimated availability date. Your prescription remains valid and on file.</p>
          </div>
          <div class="footer">
            This is a computer-generated notice for the Mahaveer Cancer Care Foundation.
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl hidden sm:block">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl text-gray-800 font-normal leading-tight">Mahaveer Pharmacy</h1>
              <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest hidden sm:block">
                Cancer Care Foundation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowHistory(true)}
              className="text-gray-600 font-normal rounded-xl hover:bg-gray-100"
            >
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Order History</span>
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className="border-gray-100 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Banner */}
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-white shadow-inner flex items-center justify-center overflow-hidden">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-normal text-gray-800">
                  Namaste, {currentPatient.name.split(' ')[0]}!
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-green-50 text-green-700 border-green-200 font-normal rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wider">
                    KYC Verified
                  </Badge>
                  <span className="text-xs text-gray-400 font-light">
                    ID: {currentPatient.patientId}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8 text-center sm:text-right border-t sm:border-t-0 sm:border-l border-gray-100 pt-6 sm:pt-0 sm:pl-8 w-full sm:w-auto">
              <div>
                <p className="text-2xl font-normal text-blue-600">
                  {currentPatient.discountPercentage}%
                </p>
                <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">
                  Active Discount
                </p>
              </div>
              <div>
                <p className="text-2xl font-normal text-gray-800">{activePrescriptions.length}</p>
                <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">
                  Active Orders
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex justify-center">
              <TabsList className="bg-white/50 backdrop-blur-md border border-white/50 shadow-sm p-1.5 h-auto rounded-2xl">
                <TabsTrigger
                  value="prescriptions"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm py-2.5 px-6 rounded-xl transition-all font-normal"
                >
                  Active Orders
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm py-2.5 px-6 rounded-xl transition-all font-normal"
                >
                  Upload New
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="prescriptions" className="space-y-6 focus-visible:outline-none">
              {activePrescriptions.length === 0 && !pendingPrescription && (
                <div className="text-center py-20 bg-white/40 border border-dashed border-gray-300 rounded-[2rem]">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Package className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-normal text-gray-800">No active orders found</h3>
                  <p className="text-gray-500 font-light mt-2 max-w-xs mx-auto">
                    Upload a new prescription to start the fulfilment process.
                  </p>
                  <Button
                    onClick={() => setActiveTab('upload')}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 rounded-xl px-8 font-normal"
                  >
                    Upload Now
                  </Button>
                </div>
              )}

              {/* Status Section for Active Prescriptions */}
              <div className="grid gap-8">
                {activePrescriptions.map((presc) => {
                  const pickup = presc.pickups[0]; // Only one pickup now
                  if (!pickup) return null;

                  return (
                    <Card
                      key={presc.id}
                      className="border-gray-100 shadow-xl rounded-[2rem] overflow-hidden bg-white group"
                    >
                      <div
                        className={`h-2 w-full ${
                          pickup.status === 'missing_medicine'
                            ? 'bg-amber-500'
                            : pickup.status === 'invoice_ready'
                              ? 'bg-blue-600'
                              : pickup.status === 'slot_booked'
                                ? 'bg-purple-600'
                                : 'bg-blue-600'
                        }`}
                      ></div>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 px-8 pt-8">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-2xl ${
                              pickup.status === 'missing_medicine' ? 'bg-amber-50' : 'bg-blue-50'
                            }`}
                          >
                            <Package
                              className={`w-6 h-6 ${
                                pickup.status === 'missing_medicine'
                                  ? 'text-amber-600'
                                  : 'text-blue-600'
                              }`}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-normal text-gray-800">
                              Dr. {presc.doctorName}
                            </CardTitle>
                            <CardDescription className="font-light text-gray-500">
                              {presc.hospitalName}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-light uppercase tracking-widest mb-1">
                            Uploaded On
                          </p>
                          <p className="text-sm font-normal text-gray-800">
                            {formatDate(presc.uploadDate)}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="px-8 pb-8 space-y-6">
                        {/* THE FLOW TILES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* TILE 1: INVOICE */}
                          <div
                            className={`p-6 rounded-[1.5rem] border-2 transition-all ${
                              pickup.paymentMethod !== null
                                ? 'border-green-500 bg-green-50/50'
                                : pickup.status === 'invoice_ready'
                                  ? 'border-blue-500 bg-blue-50/50'
                                  : presc.approvalStatus === 'approved' &&
                                      (!presc.processingStatus ||
                                        presc.processingStatus === 'NOT_PROCESSED')
                                    ? 'border-blue-200 bg-blue-50/30'
                                    : pickup.status === 'missing_medicine'
                                      ? 'border-gray-100 bg-gray-50 opacity-60'
                                      : 'border-gray-100 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div
                                className={`p-2 rounded-xl ${
                                  pickup.paymentMethod !== null
                                    ? 'bg-green-500 text-white'
                                    : pickup.status === 'invoice_ready'
                                      ? 'bg-blue-600 text-white'
                                      : presc.approvalStatus === 'approved' &&
                                          (!presc.processingStatus ||
                                            presc.processingStatus === 'NOT_PROCESSED')
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                <Receipt className="w-6 h-6" />
                              </div>
                              {pickup.paymentMethod !== null && (
                                <Badge className="bg-green-600 text-white border-none font-normal">
                                  Payment Complete
                                </Badge>
                              )}
                              {pickup.paymentMethod === null && pickup.status === 'invoice_ready' && (
                                <Badge className="bg-blue-600 text-white border-none font-normal">
                                  Ready to Pay
                                </Badge>
                              )}
                              {pickup.paymentMethod === null &&
                                presc.approvalStatus === 'approved' &&
                                (!presc.processingStatus ||
                                  presc.processingStatus === 'NOT_PROCESSED') &&
                                pickup.status !== 'invoice_ready' && (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-normal">
                                    Generate Invoice
                                  </Badge>
                                )}
                            </div>
                            <h4
                              className={`text-lg font-normal ${
                                pickup.paymentMethod !== null
                                  ? 'text-green-800'
                                  : pickup.status === 'invoice_ready'
                                    ? 'text-blue-800'
                                    : presc.approvalStatus === 'approved' &&
                                        (!presc.processingStatus ||
                                          presc.processingStatus === 'NOT_PROCESSED')
                                      ? 'text-blue-700'
                                      : 'text-gray-400'
                              }`}
                            >
                              {pickup.paymentMethod !== null
                                ? 'Invoice Generated & Payment Done'
                                : pickup.status === 'missing_medicine'
                                  ? 'Invoice on Hold'
                                  : 'Your Invoice'}
                            </h4>
                            <p className="text-sm font-light text-gray-500 mt-1">
                              {pickup.paymentMethod !== null
                                ? `Total Paid: ₹${pickup.invoice?.totalAmount}`
                                : pickup.status === 'invoice_ready'
                                  ? `Total: ₹${pickup.invoice?.totalAmount}`
                                  : pickup.status === 'missing_medicine'
                                    ? 'Wait for stock resolution'
                                    : presc.approvalStatus === 'approved' &&
                                        (!presc.processingStatus ||
                                          presc.processingStatus === 'NOT_PROCESSED')
                                      ? 'Click to generate and view your invoice'
                                      : 'Billing details available'}
                            </p>
                            {pickup.paymentMethod === null && pickup.status === 'invoice_ready' && (
                              <Button
                                onClick={() =>
                                  setShowInvoiceModal({
                                    prescriptionId: presc.id,
                                    pickupId: pickup.id,
                                    invoice: pickup.invoice,
                                  })
                                }
                                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-normal group/btn"
                              >
                                View & Pay{' '}
                                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                              </Button>
                            )}
                            {pickup.paymentMethod === null &&
                              presc.approvalStatus === 'approved' &&
                              (!presc.processingStatus ||
                                presc.processingStatus === 'NOT_PROCESSED') &&
                              pickup.status !== 'invoice_ready' && (
                                <Button
                                  onClick={() => handleViewAndPay(presc)}
                                  disabled={isGeneratingInvoice === presc.id}
                                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-normal group/btn"
                                >
                                  {isGeneratingInvoice === presc.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{' '}
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      View &amp; Pay{' '}
                                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                  )}
                                </Button>
                              )}
                            {pickup.paymentMethod !== null && (
                              <div className="mt-4 flex items-center gap-2 text-green-700 text-sm font-light">
                                <CheckCircle className="w-4 h-4" />
                                <span>Payment received successfully</span>
                              </div>
                            )}
                          </div>

                          {/* TILE 2: STOCK STATUS */}
                          <div
                            className={`p-6 rounded-[1.5rem] border-2 transition-all ${
                              pickup.status === 'missing_medicine'
                                ? 'border-amber-500 bg-amber-50/50'
                                : pickup.invoice !== null
                                  ? 'border-green-200 bg-green-50/30'
                                  : 'border-gray-100 bg-white opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div
                                className={`p-2 rounded-xl ${
                                  pickup.status === 'missing_medicine'
                                    ? 'bg-amber-500 text-white'
                                    : pickup.invoice !== null
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {pickup.status === 'missing_medicine' ? (
                                  <AlertTriangle className="w-6 h-6" />
                                ) : (
                                  <CheckCircle className="w-6 h-6" />
                                )}
                              </div>
                              {pickup.status === 'missing_medicine' && (
                                <Badge className="bg-amber-500 text-white border-none font-normal">
                                  Action Required
                                </Badge>
                              )}
                              {pickup.status !== 'missing_medicine' && pickup.invoice !== null && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 font-normal">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <h4
                              className={`text-lg font-normal ${
                                pickup.status === 'missing_medicine'
                                  ? 'text-amber-800'
                                  : pickup.invoice !== null
                                    ? 'text-green-700'
                                    : 'text-gray-400'
                              }`}
                            >
                              {pickup.status === 'missing_medicine'
                                ? 'Stock Alert'
                                : pickup.invoice !== null
                                  ? 'Stock Confirmed'
                                  : 'Stock Status'}
                            </h4>
                            <div className="mt-1">
                              {pickup.status === 'missing_medicine' ? (
                                <ul className="text-xs font-light text-amber-700 space-y-1">
                                  {presc.missingMedicines.map((m) => (
                                    <li key={m} className="flex items-center gap-1">
                                      • {m}
                                    </li>
                                  ))}
                                </ul>
                              ) : pickup.invoice !== null ? (
                                <p className="text-sm font-light text-gray-500">
                                  All medicines are available
                                </p>
                              ) : (
                                <p className="text-sm font-light text-gray-400">
                                  Stock will be verified after invoice is generated
                                </p>
                              )}
                            </div>
                            {pickup.status === 'missing_medicine' && (
                              <Button
                                variant="outline"
                                onClick={() => handleDownloadNotice(presc)}
                                className="w-full mt-4 border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl font-normal"
                              >
                                <Download className="w-4 h-4 mr-2" /> Download Notice
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* OTHER STATES */}
                        <div className="pt-4 border-t border-gray-100">
                          {pickup.status === 'payment_pending' && (
                            <div className="flex flex-col items-center py-6 text-center space-y-4">
                              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                              <div>
                                <h4 className="text-lg font-normal text-gray-800">
                                  Processing Payment...
                                </h4>
                                <p className="text-sm font-light text-gray-500">
                                  Securely confirming your transaction with the bank.
                                </p>
                              </div>
                            </div>
                          )}

                          {pickup.status === 'slot_available' && pickup.paymentMethod !== null && (
                            <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl">
                                  <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-normal text-lg">Ready for Slot Booking</h4>
                                  <p className="text-blue-100 text-sm font-light">
                                    Choose your preferred collection time at the pharmacy.
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleBookSlot(presc.id, pickup.id)}
                                className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto rounded-xl px-8 font-normal h-12"
                              >
                                Book Slot Now
                              </Button>
                            </div>
                          )}

                          {pickup.status === 'slot_booked' && pickup.paymentMethod !== null && (
                            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-purple-600 text-white rounded-xl">
                                  <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-normal text-lg text-purple-900">
                                    Slot Confirmed
                                  </h4>
                                  <p className="text-purple-700 text-sm font-light">
                                    {formatDate(pickup.slotDate!)} at {formatTime(pickup.slotTime!)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button
                                  variant="ghost"
                                  onClick={() => handleReschedule(presc.id, pickup.id)}
                                  className="text-purple-600 hover:bg-purple-100 rounded-xl px-6 font-normal"
                                >
                                  Reschedule
                                </Button>
                                <Button
                                  onClick={() =>
                                    patientConfirmCollection(
                                      currentPatient.patientId,
                                      presc.id,
                                      pickup.id
                                    )
                                  }
                                  className="bg-purple-600 hover:bg-purple-700 rounded-xl px-6 font-normal shadow-md"
                                >
                                  Confirm Collection
                                </Button>
                              </div>
                            </div>
                          )}

                          {pickup.status === 'collection_confirmed' && (
                            <div className="bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-green-500 text-white rounded-xl">
                                  <CheckCircle className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-normal text-lg text-green-900">
                                    Collection Confirmed ✓
                                  </h4>
                                  <p className="text-green-700 text-sm font-light">
                                    Please wait while the pharmacist completes the final
                                    verification.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {pendingPrescription && (
                  <Card className="border-gray-100 shadow-lg rounded-[2rem] bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                      <div className="p-3 bg-purple-50 rounded-full animate-pulse">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <CardHeader className="p-8">
                      <CardTitle className="text-2xl font-normal text-gray-800">
                        Under Review
                      </CardTitle>
                      <CardDescription className="text-gray-500 font-light text-base mt-2">
                        Our pharmacists are reviewing your prescription (Dr.{' '}
                        {pendingPrescription.doctorName}). You'll be notified of the next steps.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                        <div>
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">
                            Upload Date
                          </p>
                          <p className="text-sm font-normal text-gray-800">
                            {formatDate(pendingPrescription.uploadDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">
                            Doctor
                          </p>
                          <p className="text-sm font-normal text-gray-800">
                            Dr. {pendingPrescription.doctorName}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">
                            Hospital
                          </p>
                          <p className="text-sm font-normal text-gray-800">
                            {pendingPrescription.hospitalName}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="focus-visible:outline-none">
              {pendingPrescription ? (
                <Card className="border-gray-100 shadow-xl rounded-[2rem] overflow-hidden max-w-lg mx-auto bg-white">
                  <div className="bg-blue-600 h-2 w-full"></div>
                  <CardHeader className="text-center pt-8">
                    <div className="flex flex-col items-center gap-3 mb-6">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                        <Clock className="w-10 h-10 text-blue-600" />
                      </div>
                      <span className="text-xs font-normal text-blue-600 uppercase tracking-widest bg-blue-50/50 px-3 py-1 rounded-full border border-blue-100">
                        Waiting for Approval
                      </span>
                    </div>
                    <CardTitle className="text-2xl text-gray-800 font-normal">
                      One at a Time
                    </CardTitle>
                    <CardDescription className="text-gray-500 font-light">
                      To ensure accuracy, we process one prescription review at a time.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-8 space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <p className="text-sm text-gray-600 font-light leading-relaxed">
                        Your current upload (<strong>Dr. {pendingPrescription.doctorName}</strong>)
                        is in queue. Once approved, this section will be unlocked for new uploads.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {rejectedPrescription && (
                    <div className="max-w-lg mx-auto bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-start gap-4 mb-6">
                      <div className="p-2 bg-red-100 rounded-xl">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-normal text-red-900">Upload Corrected Prescription</h4>
                        <p className="text-xs text-red-700 font-light mt-1">
                          {rejectedPrescription.rejectionReason}
                        </p>
                      </div>
                    </div>
                  )}
                  <PrescriptionUploadForm />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* MODALS */}
      {showInvoiceModal && (
        <InvoicePaymentModal
          patientId={currentPatient.patientId}
          prescriptionId={showInvoiceModal.prescriptionId}
          pickupId={showInvoiceModal.pickupId}
          invoice={showInvoiceModal.invoice}
          onClose={() => setShowInvoiceModal(null)}
        />
      )}

      {showSlotModal && selectedPickup && (
        <SlotBookingModal
          patientId={currentPatient.patientId}
          prescriptionId={selectedPickup.prescriptionId}
          pickupId={selectedPickup.pickupId}
          isReschedule={selectedPickup.isReschedule}
          expiryDate={
            currentPatient.prescriptions.find((p) => p.id === selectedPickup.prescriptionId)
              ?.expiryDate || null
          }
          onClose={() => {
            setShowSlotModal(false);
            setSelectedPickup(null);
          }}
        />
      )}
    </div>
  );
}
