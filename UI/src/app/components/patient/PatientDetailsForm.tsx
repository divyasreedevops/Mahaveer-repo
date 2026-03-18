import { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { User, FileText, AlertCircle, CreditCard } from 'lucide-react';

export function PatientDetailsForm() {
  const { currentPatient, submitKYC, isLoading } = useApp();
  const [name, setName] = useState(currentPatient?.name || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentPatient?.dateOfBirth || '');
  const [aadhaarNumber, setAadhaarNumber] = useState(currentPatient?.aadhaarNumber || '');
  const [incomeDocument, setIncomeDocument] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIncomeDocument(e.target.files[0]);
      setError('');
    }
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format Aadhaar number with spaces (XXXX XXXX XXXX)
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    setAadhaarNumber(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!dateOfBirth) { setError('Please enter your date of birth'); return; }
    if (aadhaarNumber.replace(/\s/g, '').length !== 12) { setError('Please enter a valid 12-digit Aadhaar number'); return; }
    if (!incomeDocument) { setError('Please upload an income document'); return; }
    try {
      setError('');
      await submitKYC(name.trim(), dateOfBirth, aadhaarNumber, incomeDocument);
    } catch {
      // error shown via toast from context
    }
  };

  if (currentPatient?.name && currentPatient?.dateOfBirth && currentPatient?.aadhaarNumber && currentPatient?.incomeDocumentUrl) {
    return null; // Details already filled
  }

  return (
    <Card className="w-full max-w-lg mx-auto border-gray-100 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <User className="w-6 h-6 text-blue-600" />
          <CardTitle className="text-gray-800 font-normal">Personal Details & KYC</CardTitle>
        </div>
        <CardDescription className="text-gray-500 font-light">
          Please provide your details and upload income document for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-normal">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-gray-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob" className="text-gray-700 font-normal">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="border-gray-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaar" className="flex items-center gap-2 text-gray-700 font-normal">
              <CreditCard className="w-4 h-4" />
              Aadhaar Number
            </Label>
            <Input
              id="aadhaar"
              type="text"
              placeholder="XXXX XXXX XXXX"
              value={aadhaarNumber}
              onChange={handleAadhaarChange}
              maxLength={14}
              className="border-gray-100"
            />
            <p className="text-xs text-gray-500 font-light">
              Enter your 12-digit Aadhaar number for identity verification
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kyc" className="text-gray-700 font-normal">Income Document (Bank Statement)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="kyc"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentChange}
                className="flex-1 border-gray-100"
              />
              {incomeDocument && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <FileText className="w-4 h-4" />
                  <span>{incomeDocument.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 font-light">
              Upload your bank statement for income verification. This will be reviewed by admin to determine your discount eligibility.
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-300 font-normal">
            {isLoading ? 'Submitting...' : 'Continue'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}