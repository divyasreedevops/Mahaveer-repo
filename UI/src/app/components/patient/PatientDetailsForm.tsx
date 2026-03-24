import { useState } from 'react';
import { useApp, INCOME_LABELS, HOSPITAL_PARTNERS, INDIAN_STATES } from '@/app/context/AppContext';
import type { KYCFormData } from '@/app/context/AppContextDef';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { User, FileText, Upload, CreditCard, MapPin, Users, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { label: 'Patient Info', icon: User },
  { label: 'Income Verification', icon: Users },
  { label: 'Address', icon: MapPin },
  { label: 'Review and Submit', icon: Check },
];

const EMPTY: KYCFormData = {
  name: '', dateOfBirth: '', gender: 'Male',
  govtIdType: 'Aadhaar Card', aadhaarNumber: '',
  incomeDocument: new File([], ''), annualFamilyIncome: '50000_100000',
  guardianName: '', guardianRelation: 'Father', guardianMobile: '',
  streetAddress: '', city: '', pinCode: '', state: '', country: 'India',
  hospitalPartner: '', criticalIllness: '', illnessDetails: '',
};

export function PatientDetailsForm() {
  const { currentPatient, submitKYC } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<KYCFormData>(EMPTY);
  const [docFile, setDocFile] = useState<File | null>(null);

  if (currentPatient?.name && currentPatient?.dateOfBirth && currentPatient?.aadhaarNumber && currentPatient?.incomeDocumentUrl) return null;

  const set = (key: keyof KYCFormData, val: any) => setForm(f => ({ ...f, [key]: val }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) { toast.error('Full name is required'); return false; }
      if (!form.dateOfBirth) { toast.error('Date of birth is required'); return false; }
      if (!form.aadhaarNumber.trim()) { toast.error('Govt ID number is required'); return false; }
    }
    if (step === 1) {
      if (!form.guardianName.trim()) { toast.error('Guardian name is required'); return false; }
      if (!form.guardianMobile.trim() || form.guardianMobile.length !== 10) { toast.error('Valid 10-digit mobile is required'); return false; }
      if (!form.annualFamilyIncome) { toast.error('Please select annual family income'); return false; }
    }
    if (step === 2) {
      if (!form.city.trim()) { toast.error('City is required'); return false; }
      if (!form.state) { toast.error('State is required'); return false; }
      if (!form.pinCode || form.pinCode.length !== 6) { toast.error('Valid 6-digit PIN code is required'); return false; }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep(s => Math.min(s + 1, 3)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = () => {
    if (!validateStep()) return;
    submitKYC({ ...form, incomeDocument: docFile || new File([], 'demo-kyc.pdf') });
    toast.success('Details submitted! Awaiting admin verification.');
  };

  const inputCls = 'border-gray-200 rounded-xl focus:border-blue-400 bg-white';
  const labelCls = 'text-gray-600 text-sm font-normal';

  return (
    <Card className="w-full max-w-lg mx-auto border-gray-100 shadow-lg rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-gray-800 font-normal text-lg">Patient Registration & KYC</CardTitle>
        </div>
        <CardDescription className="text-gray-400 font-light text-xs">
          Fill in details to register the patient for subsidised medicine access
        </CardDescription>
        <div className="flex items-center gap-1 mt-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-normal transition-all ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < 3 && <div className={`h-px flex-1 mx-1 ${i < step ? 'bg-green-300' : 'bg-gray-200'}`} />}
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {step === 0 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className={labelCls}>Full Name <span className="text-red-400">*</span> <span className="text-gray-400 text-xs">(as per ID / Aadhaar)</span></Label>
              <Input className={inputCls} placeholder="Exact name as on ID document" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}>Date of Birth <span className="text-red-400">*</span></Label>
                <Input className={inputCls} type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>Gender <span className="text-red-400">*</span></Label>
                <Select value={form.gender || ''} onValueChange={v => set('gender', v)}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Government ID Type <span className="text-red-400">*</span></Label>
              <Select value={form.govtIdType || ''} onValueChange={v => set('govtIdType', v)}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select ID type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                  <SelectItem value="Ration Card">Ration Card</SelectItem>
                  <SelectItem value="Voter ID">Voter ID</SelectItem>
                  <SelectItem value="NREGA Job Card">NREGA Job Card</SelectItem>
                  <SelectItem value="Jan Dhan Account Passbook">Jan Dhan Account Passbook</SelectItem>
                  <SelectItem value="Ayushman Bharat Card">Ayushman Bharat Card</SelectItem>
                  <SelectItem value="Birth Certificate">Birth Certificate</SelectItem>
                  <SelectItem value="Caste Certificate">Caste Certificate</SelectItem>
                  <SelectItem value="Disability ID Card">Disability ID Card</SelectItem>
                  <SelectItem value="Senior Citizen ID Card">Senior Citizen ID Card</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Any one valid government ID is sufficient</p>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}><CreditCard className="w-3 h-3 inline mr-1" />{form.govtIdType || 'Govt ID'} Number <span className="text-red-400">*</span></Label>
              <Input className={inputCls} placeholder={form.govtIdType === 'Aadhaar Card' ? 'XXXX XXXX XXXX' : 'Enter ID number'} value={form.aadhaarNumber}
                onChange={e => {
                  if (form.govtIdType === 'Aadhaar Card') {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 12);
                    set('aadhaarNumber', v.replace(/(\d{4})(?=\d)/g, '$1 ').trim());
                  } else {
                    set('aadhaarNumber', e.target.value);
                  }
                }} />
            </div>

            <div className="pt-2">
              <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Clinical Details (Optional)</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Hospital / NGO Partner</Label>
                    <Select value={form.hospitalPartner || ''} onValueChange={v => set('hospitalPartner', v)}>
                      <SelectTrigger className="h-8 text-xs border-gray-200 rounded-lg bg-white"><SelectValue placeholder="Select hospital" /></SelectTrigger>
                      <SelectContent>
                        {HOSPITAL_PARTNERS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Diagnosis</Label>
                    <Input className="h-8 text-xs border-gray-200 rounded-lg bg-white" placeholder="e.g. Leukemia" value={form.criticalIllness} onChange={e => set('criticalIllness', e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className={labelCls}>Guardian Relation <span className="text-red-400">*</span></Label>
              <Select value={form.guardianRelation || ''} onValueChange={v => set('guardianRelation', v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Legal Guardian</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Father, mother, or any one guardian is sufficient</p>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>{form.guardianRelation}'s Full Name <span className="text-red-400">*</span></Label>
              <Input className={inputCls} placeholder={`Enter ${form.guardianRelation?.toLowerCase()}'s name`} value={form.guardianName} onChange={e => set('guardianName', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>{form.guardianRelation}'s Mobile Number <span className="text-red-400">*</span></Label>
              <Input className={inputCls} type="tel" placeholder="10-digit mobile number" value={form.guardianMobile} maxLength={10} onChange={e => set('guardianMobile', e.target.value.replace(/\D/g, '').slice(0, 10))} />
              <p className="text-xs text-gray-400">Used for all communications and OTP login</p>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Annual Family Income <span className="text-red-400">*</span></Label>
              <Select value={form.annualFamilyIncome || ''} onValueChange={v => set('annualFamilyIncome', v)}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select income range" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INCOME_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}><Upload className="w-3 h-3 inline mr-1" />Income Proof Document <span className="text-gray-400 text-xs">(optional)</span></Label>
              <Input className={inputCls} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { if (e.target.files?.[0]) setDocFile(e.target.files[0]); }} />
              {docFile && <p className="text-xs text-green-600 flex items-center gap-1"><FileText className="w-3 h-3" /> {docFile.name}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className={labelCls}>Street Address</Label>
              <Input className={inputCls} placeholder="House no., street, landmark" value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}>City / District <span className="text-red-400">*</span></Label>
                <Input className={inputCls} placeholder="City or district" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>PIN Code <span className="text-red-400">*</span></Label>
                <Input className={inputCls} placeholder="6-digit PIN" maxLength={6} value={form.pinCode} onChange={e => set('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className={labelCls}>State <span className="text-red-400">*</span></Label>
                <Select value={form.state || ''} onValueChange={v => set('state', v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className={labelCls}>Country</Label>
                <Input className={inputCls} value={form.country} onChange={e => set('country', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-blue-50/30 rounded-2xl p-4 text-gray-600 space-y-4 border border-blue-100/50">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-100/50">
                <Check className="w-5 h-5 text-green-600" />
                <p className="font-medium text-blue-700 text-base">Registration Review</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                  <div className="col-span-2 text-gray-400 font-medium uppercase tracking-wider text-[10px]">Patient Information</div>
                  <div className="text-gray-400">Name</div><div className="font-medium text-gray-800 text-right">{form.name || '---'}</div>
                  <div className="text-gray-400">DOB</div><div className="font-medium text-gray-800 text-right">{form.dateOfBirth || '---'}</div>
                  <div className="text-gray-400">Gender</div><div className="font-medium text-gray-800 text-right">{form.gender}</div>
                  <div className="text-gray-400">{form.govtIdType}</div><div className="font-medium text-gray-800 text-right truncate">{form.aadhaarNumber || '---'}</div>

                  <div className="col-span-2 pt-1 border-t border-blue-50"></div>
                  <div className="col-span-2 text-gray-400 font-medium uppercase tracking-wider text-[10px]">Income Verification</div>
                  <div className="text-gray-400">{form.guardianRelation}</div><div className="font-medium text-gray-800 text-right">{form.guardianName || '---'}</div>
                  <div className="text-gray-400">Mobile</div><div className="font-medium text-gray-800 text-right">{form.guardianMobile || '---'}</div>
                  <div className="text-gray-400">Annual Income</div><div className="font-medium text-gray-800 text-right">{INCOME_LABELS[form.annualFamilyIncome as string] || '---'}</div>

                  <div className="col-span-2 pt-1 border-t border-blue-50"></div>
                  <div className="col-span-2 text-gray-400 font-medium uppercase tracking-wider text-[10px]">Address Details</div>
                  <div className="text-gray-400">Location</div><div className="font-medium text-gray-800 text-right truncate">{form.city || '---'}, {form.state || '---'}</div>
                  <div className="text-gray-400">PIN Code</div><div className="font-medium text-gray-800 text-right">{form.pinCode || '---'}</div>

                  {form.criticalIllness && (
                    <>
                      <div className="col-span-2 pt-1 border-t border-blue-50"></div>
                      <div className="col-span-2 text-gray-400 font-medium uppercase tracking-wider text-[10px]">Medical Status</div>
                      <div className="text-gray-400">Diagnosis</div><div className="font-medium text-gray-800 text-right truncate">{form.criticalIllness}</div>
                      {form.hospitalPartner && (
                        <><div className="text-gray-400">Hospital</div><div className="font-medium text-gray-800 text-right truncate">{form.hospitalPartner}</div></>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 text-center px-4 leading-relaxed">
              By clicking "Submit for Verification", you agree that the information provided is correct and matches your official government documents.
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <Button variant="outline" onClick={back} className="flex-1 border-gray-200 rounded-xl font-normal">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={next} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-normal">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl font-normal">
              <Check className="w-4 h-4 mr-1" /> Submit for Verification
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
