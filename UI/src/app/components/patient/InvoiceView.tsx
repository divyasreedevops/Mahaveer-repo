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
}

interface InvoiceItem {
  medicineName: string;
  inventoryId: number | null;
  mrp: number;
  discount: number;
  finalPrice: number;
  isAvailable: boolean;
}

export function InvoiceView({ patientData, updateData }: Props) {
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<{
    invoiceNumber: string;
    date: string;
    items: InvoiceItem[];
    subtotal: number;
    totalDiscount: number;
    totalAmount: number;
  } | null>(null);

  useEffect(() => {
    // Generate mock invoice from prescription
    const mockItems: InvoiceItem[] = [
      { medicineName: 'Paracetamol 500mg', inventoryId: 1, mrp: 50.00, discount: 25.00, finalPrice: 25.00, isAvailable: true },
      { medicineName: 'Amoxicillin 250mg', inventoryId: 2, mrp: 180.00, discount: 90.00, finalPrice: 90.00, isAvailable: true },
      { medicineName: 'Vitamin D3', inventoryId: 3, mrp: 240.00, discount: 120.00, finalPrice: 120.00, isAvailable: true },
      { medicineName: 'Cough Syrup', inventoryId: 4, mrp: 85.00, discount: 42.50, finalPrice: 42.50, isAvailable: true },
    ];

    const subtotal = mockItems.reduce((acc, item) => acc + item.mrp, 0);
    const totalDiscount = mockItems.reduce((acc, item) => acc + item.discount, 0);
    const totalAmount = mockItems.reduce((acc, item) => acc + item.finalPrice, 0);

    const newInvoice = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString(),
      items: mockItems,
      subtotal,
      totalDiscount,
      totalAmount,
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
      navigate('/patient/slot-booking');
    }, 1500);
  };

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Generating invoice...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
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
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items.map((item, idx) => (
                    <TableRow key={idx} className={!item.isAvailable ? 'opacity-50' : ''}>
                      <TableCell>
                        {item.medicineName}
                        {!item.isAvailable && <span className="text-xs text-red-500 ml-2">(Unavailable)</span>}
                      </TableCell>
                      <TableCell className="text-right">₹{item.finalPrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <strong>Total Amount:</strong>
                <strong className="text-green-600">₹{invoice.totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700" 
              onClick={handleProceedToPayment}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Payment (₹{invoice.totalAmount.toFixed(2)})
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
