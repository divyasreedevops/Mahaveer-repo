import { useState, useRef } from 'react';
import { useApp } from '@/app/context/AppContext';
import { api } from '@/app/services/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function PrescriptionUploadForm() {
  const { currentPatient, refreshPatientData } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [prescriptionKey, setPrescriptionKey] = useState('');
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPatient) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError('');

    // Call upload API immediately to extract prescription details
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', currentPatient.patientId);
      formData.append('id', currentPatient.id);
      const res = await api.prescription.upload(formData);
      setPrescriptionKey(res.prescriptionKey || '');
      setMedicines(res.medicines || []);
      if (res.doctorName) setDoctorName(res.doctorName);
      if (res.hospitalName) setHospitalName(res.hospitalName);
    } catch (err: any) {
      toast.error(err.message || 'Failed to read prescription');
      setPrescriptionKey('');
      setMedicines([]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) { setError('Please select a prescription file'); return; }
    if (isAnalyzing) { setError('Please wait while the prescription is being analysed'); return; }
    if (!doctorName.trim()) { setError("Please enter the prescribing doctor's name"); return; }
    if (!hospitalName.trim()) { setError('Please enter the hospital or clinic name'); return; }
    if (!currentPatient) return;

    setIsSaving(true);
    setError('');
    try {
      await api.prescription.save({
        prescriptionKey,
        patientId: currentPatient.patientId,
        pId: parseInt(currentPatient.id) || 0,
        doctorName: doctorName.trim(),
        hospitalName: hospitalName.trim(),
        medicines: medicines.length > 0 ? medicines : [{ name: 'Unknown', dosage: '', frequency: '' }],
      });
      toast.success('Prescription uploaded! Awaiting admin review.');
      await refreshPatientData();
      setSelectedFile(null);
      setPreview(null);
      setDoctorName('');
      setHospitalName('');
      setPrescriptionKey('');
      setMedicines([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save prescription');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="border-gray-100 shadow-lg rounded-2xl max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-gray-800 font-normal">Upload Prescription</CardTitle>
          </div>
          <CardDescription className="text-gray-500 font-light">
            Upload your prescription for a single-session fulfilment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-300 transition-all bg-gray-50/50 hover:bg-blue-50/30 group"
            onClick={() => fileInputRef.current?.click()}
          >
            {isAnalyzing ? (
              <div className="space-y-4 py-4">
                <Loader2 className="w-10 h-10 mx-auto text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 font-light">Analysing prescription...</p>
              </div>
            ) : preview ? (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <img
                    src={preview}
                    alt="Prescription preview"
                    className="max-w-full max-h-64 mx-auto rounded-xl shadow-sm border border-gray-100"
                  />
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="font-normal text-gray-800 text-sm">{selectedFile?.name}</p>
                  <p className="text-xs text-blue-600 font-normal mt-1">Click to change file</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-700 font-normal">Drop your prescription here</p>
                  <p className="text-xs text-gray-400 font-light mt-1 uppercase tracking-wider">
                    PDF, JPG, PNG • Max 10MB
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
          
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label htmlFor="doctorName" className="text-gray-600 font-normal text-sm ml-1">Prescribing Doctor</Label>
                <Input
                  id="doctorName"
                  type="text"
                  placeholder="Doctor Name"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="border-gray-100 bg-white rounded-xl focus:ring-blue-500/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hospitalName" className="text-gray-600 font-normal text-sm ml-1">Hospital / Clinic</Label>
                <Input
                  id="hospitalName"
                  type="text"
                  placeholder="Hospital Name"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="border-gray-100 bg-white rounded-xl focus:ring-blue-500/20"
                />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 font-light leading-relaxed">
                <span className="font-normal text-gray-700 block mb-1">Single Fulfilment</span>
                All prescriptions are now processed as one-shot collections. You will be notified once the pharmacist reviews your upload.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
          
          <Button 
            onClick={handleSave}
            disabled={isSaving || isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-300 font-normal py-6 rounded-xl text-base"
          >
            {isSaving ? 'Saving...' : isAnalyzing ? 'Analysing...' : 'Upload for Review'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}