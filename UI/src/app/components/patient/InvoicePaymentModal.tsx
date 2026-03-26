import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Invoice } from '@/app/context/AppContextDef';
import { useApp } from '@/app/context/AppContext';
import { api } from '@/app/services/api';
import { toast } from 'sonner';
import { X, CreditCard, ChevronLeft, Loader2, Smartphone, Building2, Wallet, QrCode } from 'lucide-react';

interface InvoicePaymentModalProps {
  patientId: string;
  prescriptionId: string;
  pickupId: string;
  invoice: Invoice;
  onClose: () => void;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'scanpay';

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'upi',
    label: 'UPI',
    description: 'Pay using Google Pay, PhonePe, Paytm',
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    description: 'Visa, Mastercard, RuPay',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    description: 'All major banks supported',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: 'wallet',
    label: 'Wallet',
    description: 'Paytm, Amazon Pay, Mobikwik',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    id: 'scanpay',
    label: 'Scan & Pay',
    description: 'Scan QR code to pay instantly',
    icon: <QrCode className="w-5 h-5" />,
  },
];

export function InvoicePaymentModal({
  patientId,
  prescriptionId,
  pickupId,
  invoice,
  onClose,
}: InvoicePaymentModalProps) {
  const { refreshPatientData } = useApp();
  const [view, setView] = useState<'invoice' | 'payment'>('invoice');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method.');
      return;
    }
    setIsProcessing(true);
    try {
      await api.invoice.updateStatus(invoice.invoiceNumber, parseInt(prescriptionId));
      toast.success('Payment completed successfully!');
      await refreshPatientData();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {view === 'payment' && (
              <button
                onClick={() => setView('invoice')}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-normal text-gray-800">
              {view === 'invoice' ? 'Invoice Review' : 'Select Payment Method'}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* ── Invoice View ── */}
          {view === 'invoice' && (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500 font-light">Invoice Number</p>
                  <p className="text-gray-800 font-normal">{invoice.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-light">Date</p>
                  <p className="text-gray-800 font-normal">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-normal text-gray-600">Medicine</th>
                      <th className="px-4 py-3 text-right font-normal text-gray-600">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className={!item.isAvailable ? 'opacity-50' : ''}>
                        <td className="px-4 py-3">
                          <p className="font-normal text-gray-800">{item.medicineName}</p>
                          {!item.isAvailable && (
                            <p className="text-xs text-red-500 font-light">Unavailable</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-800 font-normal">
                          ₹{item.finalPrice}
                        </td>
                      </tr>
                    ))}
                    {invoice.items.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-6 text-center text-gray-500 font-light">
                          No items in the invoice.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {invoice.items.length > 0 && (
                <>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-lg font-normal text-blue-600">
                      <span>Total Amount</span>
                      <span>₹{invoice.totalAmount}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setView('payment')}
                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-300 py-6 rounded-xl text-lg font-normal"
                  >
                    <CreditCard className="w-5 h-5 mr-2" /> Pay ₹{invoice.totalAmount}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── Payment Method View ── */}
          {view === 'payment' && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500 font-light">Choose how you'd like to pay</p>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      selectedMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 ${selectedMethod === method.id ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                      {method.icon}
                    </span>
                    <div>
                      <p
                        className={`font-normal text-sm ${selectedMethod === method.id ? 'text-blue-700' : 'text-gray-800'}`}
                      >
                        {method.label}
                      </p>
                      <p className="text-xs text-gray-400 font-light">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* QR Code for Scan & Pay */}
              {selectedMethod === 'scanpay' && (
                <div className="flex flex-col items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm font-normal text-gray-700">Scan the QR code to pay</p>
                  {/* Dummy QR code using a public QR generator */}
                  <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <svg
                      width="160"
                      height="160"
                      viewBox="0 0 160 160"
                      xmlns="http://www.w3.org/2000/svg"
                      className="block"
                    >
                      {/* Outer border squares */}
                      <rect x="10" y="10" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="5" />
                      <rect x="20" y="20" width="30" height="30" rx="2" fill="#111" />
                      <rect x="100" y="10" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="5" />
                      <rect x="110" y="20" width="30" height="30" rx="2" fill="#111" />
                      <rect x="10" y="100" width="50" height="50" rx="4" fill="none" stroke="#111" strokeWidth="5" />
                      <rect x="20" y="110" width="30" height="30" rx="2" fill="#111" />
                      {/* Center pattern */}
                      <rect x="70" y="10" width="10" height="10" fill="#111" />
                      <rect x="70" y="30" width="10" height="10" fill="#111" />
                      <rect x="70" y="50" width="10" height="20" fill="#111" />
                      <rect x="10" y="70" width="20" height="10" fill="#111" />
                      <rect x="40" y="70" width="10" height="10" fill="#111" />
                      <rect x="60" y="70" width="20" height="10" fill="#111" />
                      <rect x="90" y="70" width="10" height="10" fill="#111" />
                      <rect x="110" y="70" width="10" height="10" fill="#111" />
                      <rect x="130" y="70" width="20" height="10" fill="#111" />
                      <rect x="80" y="80" width="10" height="10" fill="#111" />
                      <rect x="100" y="80" width="20" height="10" fill="#111" />
                      <rect x="130" y="80" width="20" height="10" fill="#111" />
                      <rect x="70" y="90" width="10" height="20" fill="#111" />
                      <rect x="90" y="100" width="10" height="10" fill="#111" />
                      <rect x="110" y="100" width="10" height="10" fill="#111" />
                      <rect x="130" y="100" width="20" height="10" fill="#111" />
                      <rect x="80" y="110" width="10" height="10" fill="#111" />
                      <rect x="100" y="120" width="20" height="10" fill="#111" />
                      <rect x="70" y="130" width="10" height="20" fill="#111" />
                      <rect x="90" y="130" width="10" height="10" fill="#111" />
                      <rect x="110" y="130" width="10" height="20" fill="#111" />
                      <rect x="130" y="130" width="20" height="10" fill="#111" />
                      <rect x="130" y="120" width="10" height="10" fill="#111" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 font-light text-center">
                    Open any UPI app · Scan · Enter ₹{invoice.totalAmount} · Pay
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-lg font-normal text-blue-600 mb-4">
                  <span>Total Amount</span>
                  <span>₹{invoice.totalAmount}</span>
                </div>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={!selectedMethod || isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-300 py-6 rounded-xl text-lg font-normal disabled:bg-gray-300 disabled:text-gray-500"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Pay ₹{invoice.totalAmount}</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
