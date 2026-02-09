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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="w-6 h-6" />
          <CardTitle>Invoice</CardTitle>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
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
                <TableHead>Medicine</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
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

        <Separator />

        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span>Subtotal:</span>
            <span>₹{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Taxes (5%):</span>
            <span>₹{invoice.taxes.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg text-green-600">
            <span>Discount (90%):</span>
            <span>- ₹{invoice.discount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-xl">
            <span>Grand Total:</span>
            <span>₹{invoice.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {paymentStatus === 'pending' && (
          <Button onClick={makePayment} className="w-full" size="lg">
            <CreditCard className="w-5 h-5 mr-2" />
            Make Payment
          </Button>
        )}

        {paymentStatus === 'paid' && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-lg text-green-700">✓ Payment Completed Successfully</p>
            <p className="text-sm text-muted-foreground mt-2">
              Confirmation sent to {currentPatient.mobile}
              {currentPatient.email && ` and ${currentPatient.email}`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}