import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Calendar, Clock, Package, Hash } from 'lucide-react';

export function SlotBooking() {
  const { currentPatient, markItemReceived } = useApp();

  if (!currentPatient || currentPatient.paymentStatus !== 'paid') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-gray-800 font-normal">Pickup Slot</CardTitle>
        </div>
        <CardDescription className="text-gray-500 font-light">
          Your pickup slot has been automatically assigned
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg space-y-3 border border-blue-100">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-600" />
            <span className="text-lg text-gray-700">
              <strong>Registration ID:</strong> {currentPatient.patientId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-lg text-gray-700">
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
            <span className="text-lg text-gray-700">{currentPatient.slotTime}</span>
          </div>
        </div>

        {!currentPatient.itemReceived && (
          <Button 
            onClick={markItemReceived} 
            className="w-full bg-gray-800 hover:bg-gray-900"
          >
            <Package className="w-5 h-5 mr-2" />
            Mark Item as Received
          </Button>
        )}

        {currentPatient.itemReceived && (
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
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