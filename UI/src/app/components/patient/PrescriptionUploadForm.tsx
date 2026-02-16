import React, { useState, useRef, useEffect } from 'react';
import { prescriptionService } from '@/api';
import type { UploadPrescriptionResponse, GenerateInvoiceResponse } from '@/api/prescription.service';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export interface PrescriptionResult {
  prescription: UploadPrescriptionResponse;
  invoice: GenerateInvoiceResponse;
}

interface PrescriptionUploadFormProps {
  onUploadComplete?: (result: PrescriptionResult) => void;
}

export function PrescriptionUploadForm({ onUploadComplete }: PrescriptionUploadFormProps) {
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [patientData, setPatientData] = useState<{ patientId: string; id: number } | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<UploadPrescriptionResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load patient data from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('patient_data');
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        
        if (parsed.patientId && parsed.id) {
          setPatientData({ patientId: parsed.patientId, id: parsed.id });
        }
      }
    } catch (err) {
      console.error('Error loading patient data:', err);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      toast.error('File size exceeds 10MB. Please select a smaller file.');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image or PDF file.');
      toast.error('Invalid file type. Please upload JPG, PNG, GIF, or PDF.');
      return;
    }

    if (!patientData) {
      setError('Patient data not found. Please log in again.');
      toast.error('Patient data not found. Please log in again.');
      return;
    }

    setSelectedFile(file);
    setError('');
    
    // Load preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      toast.error('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Upload prescription and extract medicines immediately
    setIsLoading(true);
    const toastId = toast.loading('Uploading prescription and extracting details...');

    try {
      const uploadResult = await prescriptionService.uploadPrescription(
        file,
        patientData.patientId,
        patientData.id
      );

      toast.dismiss(toastId);

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload prescription');
      }

      const data = uploadResult.data;
      setPrescriptionData(data);

      // Auto-fill doctor and hospital names from API response
      if (data.doctorName) {
        setDoctorName(data.doctorName);
      }
      if (data.hospitalName) {
        setHospitalName(data.hospitalName);
      }

      toast.success(`Successfully extracted ${data.medicines.length} medicines from prescription`);
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMessage = err?.message || 'Failed to upload prescription. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
      setSelectedFile(null);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!prescriptionData || !patientData) {
      toast.error('Please upload a prescription first');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(`Generating invoice for ${prescriptionData.medicines.length} medicines...`);

    try {
      const invoiceResult = await prescriptionService.generateInvoice(
        prescriptionData.medicines,
        patientData.patientId,
        prescriptionData.prescriptionKey,
        patientData.id
      );

      toast.dismiss(toastId);

      if (!invoiceResult.success || !invoiceResult.data) {
        throw new Error(invoiceResult.error || 'Failed to generate invoice');
      }

      const result: PrescriptionResult = {
        prescription: prescriptionData,
        invoice: invoiceResult.data,
      };

      setIsComplete(true);
      toast.success('Invoice generated! Review your invoice below.');

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMessage = err?.message || 'Failed to generate invoice. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return null; // Invoice generated, parent component will show invoice
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-6 h-6" />
          <CardTitle>Upload Prescription</CardTitle>
        </div>
        <CardDescription>
          Upload your prescription - doctor details and medicines will be automatically extracted using AI
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
            <Label htmlFor="doctorName" className="flex items-center gap-1">
              Referred Doctor Name
              <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Input
              id="doctorName"
              type="text"
              placeholder="Leave empty to auto-extract from prescription"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Will be automatically extracted from the prescription by AI
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospitalName" className="flex items-center gap-1">
              Hospital Name
              <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Input
              id="hospitalName"
              type="text"
              placeholder="Leave empty to auto-extract from prescription"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Will be automatically extracted from the prescription by AI
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
        
        {prescriptionData && (
          <div className="space-y-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <h3 className="font-semibold text-green-800">Extracted Medicines ({prescriptionData.medicines.length})</h3>
            <div className="space-y-2">
              {prescriptionData.medicines.map((medicine, index) => (
                <div key={index} className="p-3 bg-white rounded border border-green-200">
                  <p className="font-medium text-gray-900">{medicine.name}</p>
                  {medicine.dosage && (
                    <p className="text-sm text-gray-600">Dosage: {medicine.dosage}</p>
                  )}
                  {medicine.frequency && (
                    <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>
                  )}
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleGenerateInvoice} 
              className="w-full" 
              disabled={isLoading}
              type="button"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Generating Invoice...</span>
                  <span className="animate-pulse">⏳</span>
                </>
              ) : (
                'Generate Invoice'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}  