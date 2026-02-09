import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import { FileText, CreditCard } from 'lucide-react';
import { PatientData } from '../PatientFlow';

interface Props {
  patientData: PatientData;
  updateData: (data: Partial<PatientData>) => void;
  onProceed?: () => void;
  embedded?: boolean;
}

interface InvoiceItem {
  id: string;
  medicine: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function InvoiceView({ patientData, updateData, onProceed, embedded = false }: Props) {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<{
    invoiceNumber: string;
    date: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    grandTotal: number;
  } | null>(null);

  useEffect(() => {
    // Generate mock invoice from prescription
    const mockItems: InvoiceItem[] = [
      { id: '1', medicine: 'Paracetamol 500mg', quantity: 10, unitPrice: 5, total: 50 },
      { id: '2', medicine: 'Amoxicillin 250mg', quantity: 15, unitPrice: 12, total: 180 },
      { id: '3', medicine: 'Vitamin D3', quantity: 30, unitPrice: 8, total: 240 },
      { id: '4', medicine: 'Cough Syrup', quantity: 1, unitPrice: 85, total: 85 },
    ];

    const subtotal = mockItems.reduce((acc, item) => acc + item.total, 0);
    const tax = subtotal * 0.05; // 5% tax
    const discount = (subtotal + tax) * 0.90; // 90% subsidy
    const grandTotal = (subtotal + tax) - discount;

    const newInvoice = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString(),
      items: mockItems,
      subtotal,
      tax,
      discount,
      grandTotal,
    };

    setInvoice(newInvoice);
    updateData({ invoice: newInvoice });
  }, []);

  const handleProceedToPayment = () => {
    toast.success('Proceeding to payment...');
    // Mock payment success
    setTimeout(() => {
      updateData({ paymentComplete: true, orderId: `ORD-${Date.now().toString().slice(-8)}` });
      toast.success('Payment completed successfully!');
      if (onProceed) {
        onProceed();
      } else {
        navigate('/patient/slot-booking');
      }
    }, 1500);
  };

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Generating invoice...</p>
      </div>
    );
  }

  const containerClassName = embedded
    ? 'w-full'
    : 'min-h-screen p-4 md:p-8';

  return (
    <div className={containerClassName}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle>Invoice</CardTitle>
            <CardDescription>
              Review your medicine invoice and proceed to payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Invoice Header */}
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p>{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p>{invoice.date}</p>
              </div>
            </div>

            {/* Patient Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm mb-2"><strong>Patient Details:</strong></p>
              <p className="text-sm">Name: {patientData.name}</p>
              <p className="text-sm">Mobile: {patientData.mobile}</p>
              <p className="text-sm">DOB: {patientData.dateOfBirth}</p>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.medicine}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unitPrice}</TableCell>
                      <TableCell className="text-right">₹{item.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (5%):</span>
                <span>₹{invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Subsidy (90% discount):</span>
                <span>- ₹{invoice.discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <strong>Grand Total:</strong>
                <strong className="text-green-600">₹{invoice.grandTotal.toFixed(2)}</strong>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                <strong>Great News!</strong> You're saving ₹{invoice.discount.toFixed(2)} with our 90% subsidy program.
              </p>
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700" 
              onClick={handleProceedToPayment}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment (₹{invoice.grandTotal.toFixed(2)})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
