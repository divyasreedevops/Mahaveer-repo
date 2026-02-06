import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { User, Calendar } from 'lucide-react';
import { PatientData } from '../PatientFlow';
import { PatientHeader } from './PatientHeader';

interface Props {
  patientData: PatientData;
  updateData: (data: Partial<PatientData>) => void;
}

export function PatientDetails({ patientData, updateData }: Props) {
  const [name, setName] = useState(patientData.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(patientData.dateOfBirth || '');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!dateOfBirth) {
      toast.error('Please select your date of birth');
      return;
    }

    updateData({ name, dateOfBirth });
    toast.success('Details saved successfully!');
    navigate('/patient/upload-prescription');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PatientHeader showLogout={true} />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>
              Please provide your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm">Full Name</label>
              <Input
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Birth
              </label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Mobile:</strong> {patientData.mobile}
              </p>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              onClick={handleSubmit}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
