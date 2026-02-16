import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Separator } from '@/app/components/ui/separator';
import { Receipt, CreditCard, CheckCircle2, XCircle, Calendar, Clock, Package } from 'lucide-react';
import { useState } from 'react';
import type { GenerateInvoiceResponse } from '@/api/prescription.service';

interface InvoiceDisplayProps {
  /** Invoice data from API - takes priority over context data */
  apiInvoice?: GenerateInvoiceResponse | null;
  /** Prescription info extracted by AI */
  prescriptionInfo?: {
    doctorName: string;
    hospitalName: string;
    medicines: { name: string; dosage?: string; frequency?: string }[];
    prescriptionKey: string;
  } | null;
}

export function InvoiceDisplay({ apiInvoice, prescriptionInfo }: InvoiceDisplayProps) {
  const { currentPatient, makePayment, markItemReceived } = useApp();
  const [localPaymentStatus, setLocalPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [localItemReceived, setLocalItemReceived] = useState(false);

  const handleMakePayment = () => {
    console.log('InvoiceDisplay - Make Payment clicked');
    console.log('InvoiceDisplay - Current patient:', currentPatient);
    console.log('InvoiceDisplay - makePayment function:', makePayment);
    makePayment();
    console.log('InvoiceDisplay - Payment function called');
    
    // Update local state immediately for better UX
    setLocalPaymentStatus('paid');
  };

  const handleMarkReceived = () => {
    console.log('InvoiceDisplay - Mark as Received clicked');
    
    if (currentPatient) {
      markItemReceived();
    } else {
      // Update localStorage
      try {
        const storedData = localStorage.getItem('patient_data');
        if (storedData) {
          const patientData = JSON.parse(storedData);
          const updatedData = {
            ...patientData,
            itemReceived: true
          };
          localStorage.setItem('patient_data', JSON.stringify(updatedData));
          console.log('InvoiceDisplay - Item marked as received in localStorage');
        }
      } catch (error) {
        console.error('InvoiceDisplay - Error updating localStorage:', error);
      }
    }
    
    setLocalItemReceived(true);
  };

  // Use API invoice data if provided, fall back to context data
  const hasApiInvoice = !!apiInvoice;
  const hasContextInvoice = !!currentPatient?.invoice;

  if (!hasApiInvoice && !hasContextInvoice) {
    return null;
  }

  // Get patient info from localStorage
  let storedPatientId = currentPatient?.patientId || '';
  let storedMobile = currentPatient?.mobile || '';
  let storedEmail = currentPatient?.email || '';
  let storedPaymentStatus: 'pending' | 'paid' = 'pending';
  let storedSlotDate = '';
  let storedSlotTime = '';
  let storedItemReceived = false;
  
  try {
    const storedData = localStorage.getItem('patient_data');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      storedPatientId = parsed.patientId || storedPatientId;
      storedMobile = parsed.mobileNumber || storedMobile;
      storedEmail = parsed.email || storedEmail;
      storedPaymentStatus = parsed.paymentStatus || storedPaymentStatus;
      storedSlotDate = parsed.slotDate || '';
      storedSlotTime = parsed.slotTime || '';
      storedItemReceived = parsed.itemReceived || false;
    }
  } catch { /* ignore */ }

  // Determine what to display
  const doctorName = prescriptionInfo?.doctorName || currentPatient?.prescriptionData?.doctorName || '';
  const hospitalName = prescriptionInfo?.hospitalName || currentPatient?.prescriptionData?.hospitalName || '';
  const paymentStatus = localPaymentStatus === 'paid' ? 'paid' : (currentPatient?.paymentStatus || storedPaymentStatus || 'pending');
  const slotDate = currentPatient?.slotDate || storedSlotDate;
  const slotTime = currentPatient?.slotTime || storedSlotTime;
  const itemReceived = localItemReceived || currentPatient?.itemReceived || storedItemReceived;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="w-6 h-6" />
          <CardTitle>Invoice</CardTitle>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Invoice Number: {apiInvoice?.invoiceNumber || currentPatient?.invoice?.invoiceNumber}</div>
          <div>Patient ID: {apiInvoice?.patientId || storedPatientId}</div>
          {apiInvoice?.generatedDate && (
            <div>Date: {new Date(apiInvoice.generatedDate).toLocaleDateString()}</div>
          )}
          {doctorName && <div>Referred by: Dr. {doctorName}</div>}
          {hospitalName && <div>Hospital: {hospitalName}</div>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prescription medicines extracted by AI */}
        {prescriptionInfo?.medicines && prescriptionInfo.medicines.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Prescribed Medicines (Extracted by AI)</h3>
            <div className="grid gap-2">
              {prescriptionInfo.medicines.map((med, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-muted/50 rounded-md">
                  <span className="font-medium">{med.name}</span>
                  {med.dosage && <span className="text-muted-foreground">| Dosage: {med.dosage}</span>}
                  {med.frequency && <span className="text-muted-foreground">| Frequency: {med.frequency}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice items table */}
        {hasApiInvoice ? (
          /* Render from API response */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-right">MRP (₹)</TableHead>
                  <TableHead className="text-right">Discount (₹)</TableHead>
                  <TableHead className="text-right">Final Price (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiInvoice!.items.map((item, index) => (
                  <TableRow key={index} className={!item.isAvailable ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{item.medicineName}</TableCell>
                    <TableCell className="text-center">
                      {item.isAvailable ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 inline" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 inline" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">₹{item.mrp.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600">₹{item.discount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">₹{item.finalPrice.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Render from context data (fallback) */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPatient!.invoice!.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.medicineName}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          {hasApiInvoice ? (
            <>
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>₹{apiInvoice!.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg text-green-600">
                <span>Total Discount:</span>
                <span>- ₹{apiInvoice!.totalDiscount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl">
                <span>Total Amount:</span>
                <span>₹{apiInvoice!.totalAmount.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>₹{currentPatient!.invoice!.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Taxes (5%):</span>
                <span>₹{currentPatient!.invoice!.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg text-green-600">
                <span>Discount:</span>
                <span>- ₹{currentPatient!.invoice!.discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl">
                <span>Grand Total:</span>
                <span>₹{currentPatient!.invoice!.grandTotal.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {paymentStatus === 'pending' && (
          <Button onClick={handleMakePayment} className="w-full" size="lg">
            <CreditCard className="w-5 h-5 mr-2" />
            Make Payment
          </Button>
        )}

        {paymentStatus === 'paid' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-lg text-green-700">✓ Payment Completed Successfully</p>
              <p className="text-sm text-muted-foreground mt-2">
                Confirmation sent to {storedMobile}
                {storedEmail && ` and ${storedEmail}`}
              </p>
            </div>

            {/* Slot Booking Information */}
            {slotDate && slotTime && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Pickup Slot
                </h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(slotDate).toLocaleDateString('en-IN', { 
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{slotTime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mark as Received Button/Status */}
            {!itemReceived ? (
              <Button 
                onClick={handleMarkReceived} 
                className="w-full" 
                size="lg"
                variant="outline"
              >
                <Package className="w-4 h-4 mr-2" />
                Mark as Received
              </Button>
            ) : (
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-700">✓ Items Received</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}