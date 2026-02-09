import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';
import { PatientData } from '../PatientFlow';

interface Props {
  updateData: (data: Partial<PatientData>) => void;
  onUploaded?: () => void;
  embedded?: boolean;
}

export function PrescriptionUpload({ updateData, onUploaded, embedded = false }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a prescription file');
      return;
    }

    setUploading(true);
    // Mock upload delay
    setTimeout(() => {
      const prescriptionUrl = URL.createObjectURL(file);
      updateData({ prescriptionUrl });
      toast.success('Prescription uploaded successfully!');
      setUploading(false);
      if (onUploaded) {
        onUploaded();
      } else {
        navigate('/patient/invoice');
      }
    }, 2000);
  };

  const containerClassName = embedded
    ? 'w-full'
    : 'min-h-screen flex items-center justify-center p-4';

  return (
    <div className={containerClassName}>
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle>Upload Prescription</CardTitle>
            <CardDescription>
              Upload your doctor's prescription to generate invoice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <input
                type="file"
                id="prescription"
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              <label htmlFor="prescription" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-12 h-12 text-gray-400" />
                  <div>
                    <p className="text-sm">
                      <span className="text-purple-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG or PDF (max 5MB)
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {file && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> Make sure the prescription includes medicine names, dosages, and duration clearly.
              </p>
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload & Generate Invoice'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
