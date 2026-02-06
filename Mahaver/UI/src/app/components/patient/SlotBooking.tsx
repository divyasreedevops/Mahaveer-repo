import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Calendar, Clock, Package, Hash } from 'lucide-react';

export function SlotBooking() {
  const { currentPatient, markItemReceived } = useApp();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkItemReceived = async () => {
    setIsLoading(true);
    const toastId = toast.loading('Marking item as received...');
    
    try {
      markItemReceived();
      toast.dismiss(toastId);
      toast.success('Item marked as received successfully');
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Failed to mark item as received');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentPatient || currentPatient.paymentStatus !== 'paid') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-6 h-6" />
          <CardTitle>Pickup Slot</CardTitle>
        </div>
        <CardDescription>
          Your pickup slot has been automatically assigned
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-600" />
            <span className="text-lg">
              <strong>Registration ID:</strong> {currentPatient.patientId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-lg">
              {currentPatient.slotDate && new Date(currentPatient.slotDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-lg">{currentPatient.slotTime}</span>
          </div>
        </div>

        {!currentPatient.itemReceived && (
          <Button 
            onClick={handleMarkItemReceived}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Package className="w-5 h-5 mr-2" />
            {isLoading ? 'Processing...' : 'Mark Item as Received'}
          </Button>
        )}

        {currentPatient.itemReceived && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Package className="w-5 h-5" />
              <span className="text-lg">✓ Item Received Successfully</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}