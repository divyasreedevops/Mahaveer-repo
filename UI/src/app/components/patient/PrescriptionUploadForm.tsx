import { useState, useRef } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface PrescriptionUploadFormProps {
  onInvoiceRequested?: (data: { file: File; doctorName: string; hospitalName: string }) => void;
}

export function PrescriptionUploadForm({ onInvoiceRequested }: PrescriptionUploadFormProps) {
  const { currentPatient, uploadAndGenerateInvoice } = useApp();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        
        // Mock OCR - automatically extract doctor and hospital names
        const mockDoctorNames = ['Dr. Sharma', 'Dr. Patel', 'Dr. Kumar', 'Dr. Singh', 'Dr. Reddy'];
        const mockHospitalNames = ['City Hospital', 'Apollo Clinic', 'Max Healthcare', 'Fortis Hospital', 'AIIMS'];
        
        const randomDoctor = mockDoctorNames[Math.floor(Math.random() * mockDoctorNames.length)];
        const randomHospital = mockHospitalNames[Math.floor(Math.random() * mockHospitalNames.length)];
        
        setDoctorName(randomDoctor);
        setHospitalName(randomHospital);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a prescription file');
      toast.error('Please select a prescription file');
      return;
    }
    if (!doctorName || !hospitalName) {
      setError('Please enter doctor name and hospital name');
      toast.error('Please enter doctor name and hospital name');
      return;
    }
    
    setIsLoading(true);
    const toastId = toast.loading('Uploading prescription and generating invoice...');
    
    try {
      console.log('PrescriptionUploadForm - Uploading and generating invoice...');
      
      if (onInvoiceRequested) {
        onInvoiceRequested({ file: selectedFile, doctorName, hospitalName });
      } else {
        // Use combined function to update prescription and generate invoice in one state update
        uploadAndGenerateInvoice(selectedFile, doctorName, hospitalName);

        // Wait for state to propagate
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log('PrescriptionUploadForm - Complete. Current patient has invoice:', !!currentPatient?.invoice);
      }
      
      toast.dismiss(toastId);
      toast.success('Invoice generated successfully! Review your invoice below.');
      setError('');
    } catch (err) {
      console.error('PrescriptionUploadForm - Error:', err);
      toast.dismiss(toastId);
      toast.error('Failed to upload prescription');
      setError('Failed to upload prescription');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentPatient?.invoice) {
    return null; // Invoice already generated
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6" />
          <CardTitle>Upload Prescription</CardTitle>
        </div>
        <CardDescription>
          Upload your prescription and provide doctor details to generate an invoice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Prescription preview"
                className="max-w-full max-h-64 mx-auto rounded-lg"
              />
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>File selected: {selectedFile?.name}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-lg">Click to upload prescription</p>
                <p className="text-sm text-muted-foreground">
                  Support for PDF, JPG, PNG (Max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="doctorName">Referred Doctor Name</Label>
            <Input
              id="doctorName"
              type="text"
              placeholder="Auto-filled from prescription"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Auto-extracted from prescription (editable)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospitalName">Hospital Name</Label>
            <Input
              id="hospitalName"
              type="text"
              placeholder="Auto-filled from prescription"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Auto-extracted from prescription (editable)
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        
        {selectedFile && (
          <Button onClick={handleUpload} className="w-full" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Upload & Generate Invoice'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}