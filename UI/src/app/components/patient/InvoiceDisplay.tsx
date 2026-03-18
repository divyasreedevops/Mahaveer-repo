import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Separator } from '@/app/components/ui/separator';
import { Receipt, CreditCard } from 'lucide-react';

export function InvoiceDisplay() {
  const { currentPatient, makePayment } = useApp();

  if (!currentPatient?.invoice) {
    return null;
  }

  const { invoice, paymentStatus, prescriptionData, patientId } = currentPatient;

  return (
    <Card className="w-full max-w-4xl mx-auto border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-gray-800 font-normal">Invoice</CardTitle>
        </div>
        <div className="space-y-1 text-sm text-gray-500 font-light">
          <div>Invoice Number: {invoice.invoiceNumber}</div>
          <div>Patient ID: {patientId}</div>
          {prescriptionData && (
            <>
              <div>Referred by: Dr. {prescriptionData.doctorName}</div>
              <div>Hospital: {prescriptionData.hospitalName}</div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-700">Medicine</TableHead>
                <TableHead className="text-right text-gray-700">MRP</TableHead>
                <TableHead className="text-right text-gray-700">Discount</TableHead>
                <TableHead className="text-right text-gray-700">Final Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index} className={!item.isAvailable ? 'opacity-50' : ''}>
                  <TableCell className="text-gray-600">
                    {item.medicineName}
                    {!item.isAvailable && <span className="text-xs text-red-500 ml-2">(Unavailable)</span>}
                  </TableCell>
                  <TableCell className="text-right text-gray-600">₹{item.mrp.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-gray-600">₹{item.discount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-gray-600">₹{item.finalPrice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />

        <div className="space-y-3 text-gray-700">
          <div className="flex justify-between text-lg">
            <span>Subtotal:</span>
            <span>₹{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg text-green-600">
            <span>Discount:</span>
            <span>- ₹{invoice.totalDiscount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-xl font-normal">
            <span>Total Amount:</span>
            <span>₹{invoice.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {paymentStatus === 'pending' && (
          <Button onClick={makePayment} className="w-full bg-gray-800 hover:bg-gray-900" size="lg">
            <CreditCard className="w-5 h-5 mr-2" />
            Make Payment
          </Button>
        )}

        {paymentStatus === 'paid' && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-lg text-green-700">✓ Payment Completed Successfully</p>
            <p className="text-sm text-gray-500 font-light mt-2">
              Confirmation sent to {currentPatient.mobile}
              {currentPatient.email && ` and ${currentPatient.email}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}