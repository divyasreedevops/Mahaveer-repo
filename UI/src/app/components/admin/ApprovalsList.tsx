import { useState, useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { api } from '@/app/services/api';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { CheckCircle, XCircle, Clock, User, Phone, Mail, FileText, Calendar, DollarSign, CreditCard, Loader2, RefreshCw } from 'lucide-react';
import type { Patient } from '@/app/context/AppContext';

// Format date to DD/MM/YYYY
const formatDateToDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

export function ApprovalsList() {
  const { rejectPatientKYC } = useApp();
  const [pendingApprovals, setPendingApprovals] = useState<Patient[]>([]);
  const [incomeOptions, setIncomeOptions] = useState<string[]>(['Low', 'Medium', 'High']);
  const [incomeLevelsData, setIncomeLevelsData] = useState<{ name: string; discount: number }[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [rejectingPatient, setRejectingPatient] = useState<Patient | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [incomeLevel, setIncomeLevel] = useState<string>('Medium');
  const [discountPercentage, setDiscountPercentage] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoadingList(true);
    try {
      const [patientsRaw, levelsRaw] = await Promise.all([
        api.patient.getByStatus('Completed', 'Pending').catch(() => []),
        api.common.getIncomeLevels().catch(() => null),
      ]);
      const mapped: Patient[] = (patientsRaw || []).map((p: any) => ({
        id: String(p.id),
        patientId: p.patientId,
        mobile: p.mobileNumber,
        email: p.email || null,
        name: p.fullName || '',
        dateOfBirth: p.dob || '',
        aadhaarNumber: p.aadharNumber || null,
        incomeDocumentUrl: p.kycDocumentUrl || null,
        incomeLevel: null,
        discountPercentage: p.discountPercentage || 0,
        kycStatus: 'pending' as const,
        kycRejectionReason: p.kycRejectionReason || null,
        registrationDate: p.registrationDate || new Date().toISOString(),
        prescriptions: [],
      }));
      setPendingApprovals(mapped);
      if (levelsRaw && Array.isArray(levelsRaw) && levelsRaw.length > 0) {
        const levelObjects = levelsRaw.map((l: any) => ({
          name: typeof l === 'string' ? l : (l.incomeLevelName || l.name || l.label || String(l)),
          discount: typeof l === 'object' ? (l.discountPercentage || 0) : 0,
        }));
        const levels = levelObjects.map(l => l.name);
        setIncomeLevelsData(levelObjects);
        setIncomeOptions(levels);
        setIncomeLevel(levels[0]);
        setDiscountPercentage(levelObjects[0]?.discount ?? 0);
      }
    } catch (err: any) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApproveClick = (patient: Patient) => {
    setSelectedPatient(patient);
    const firstLevel = incomeOptions[0] || 'Low';
    const firstDiscount = incomeLevelsData[0]?.discount ?? 50;
    setIncomeLevel(firstLevel);
    setDiscountPercentage(firstDiscount);
  };

  const handleApproveConfirm = async () => {
    if (!selectedPatient) return;
    setIsSubmitting(true);
    try {
      const dbId = parseInt(selectedPatient.id);
      await api.admin.approveKyc({ id: dbId, incomeLevel });
      await api.admin.updateRegStatus({ id: dbId, patientId: selectedPatient.patientId, registrationStatus: 'Approved' });
      toast.success(`KYC approved for ${selectedPatient.name || selectedPatient.patientId}`);
      setSelectedPatient(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = (patient: Patient) => {
    setRejectingPatient(patient);
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectingPatient || !rejectionReason.trim()) return;
    setIsSubmitting(true);
    try {
      // In a real app we would use rejectPatientKYC, but since we are interacting
      // with the API directly here to mimic the approve flow:
      await api.admin.updateRegStatus({ id: parseInt(rejectingPatient.id), patientId: rejectingPatient.patientId, registrationStatus: 'Rejected' });
      toast.success(`KYC rejected for ${rejectingPatient.name || rejectingPatient.patientId}`);
      setRejectingPatient(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncomeLevelChange = (value: string) => {
    setIncomeLevel(value);
    const found = incomeLevelsData.find(l => l.name === value);
    if (found) {
      setDiscountPercentage(found.discount);
    } else {
      // Fallback for unknown levels
      const lower = value.toLowerCase();
      if (lower.includes('bpl') || lower.includes('below') || lower === 'low') {
        setDiscountPercentage(80);
      } else if (lower.includes('apl') || lower === 'medium' || lower.includes('middle')) {
        setDiscountPercentage(50);
      } else if (lower === 'high' || lower.includes('general') || lower.includes('upper')) {
        setDiscountPercentage(20);
      }
    }
  };

  return (
    <Card className="border-gray-100 shadow-lg rounded-2xl">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-6 h-6 text-purple-600" />
          <CardTitle className="text-gray-800 font-normal">Pending Approvals</CardTitle>
        </div>
        <CardDescription className="text-gray-500 font-light">
          Review and approve patient registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadingList ? (
          <div className="text-center py-8 text-gray-400">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-600" />
            <p className="mt-2">Loading pending approvals...</p>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No pending approvals</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {pendingApprovals.map((patient) => (
                <Card key={patient.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{patient.name || 'Unnamed Patient'}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {patient.patientId}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{patient.mobile}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.incomeDocumentUrl && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <a 
                            href={patient.incomeDocumentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:underline"
                          >
                            View KYC Document
                          </a>
                        </div>
                      )}
                      {patient.dateOfBirth && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDateToDDMMYYYY(patient.dateOfBirth)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Registered: {new Date(patient.registrationDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApproveClick(patient)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(patient)}
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>KYC Document</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patientId}</TableCell>
                      <TableCell>{patient.name || '-'}</TableCell>
                      <TableCell>{patient.mobile}</TableCell>
                      <TableCell>{patient.email || '-'}</TableCell>
                      <TableCell>
                        {patient.incomeDocumentUrl ? (
                          <a 
                            href={patient.incomeDocumentUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            View
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatDateToDDMMYYYY(patient.dateOfBirth)}</TableCell>
                      <TableCell>
                        {new Date(patient.registrationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApproveClick(patient)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(patient)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      {/* Approval Dialog */}
      <Dialog open={selectedPatient !== null} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve Patient</DialogTitle>
            <DialogDescription>
              Review patient details and set income level with discount percentage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Patient Details */}
            {selectedPatient && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <h4 className="font-semibold text-base mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                  </div>
                  <div className="font-medium">{selectedPatient.name || '-'}</div>
                  
                  {selectedPatient.aadhaarNumber && (
                    <>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Aadhaar:</span>
                      </div>
                      <div className="font-medium">{selectedPatient.aadhaarNumber}</div>
                    </>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mobile:</span>
                  </div>
                  <div className="font-medium">{selectedPatient.mobile}</div>
                  
                  {selectedPatient.dateOfBirth && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">DOB:</span>
                      </div>
                      <div className="font-medium">
                        {formatDateToDDMMYYYY(selectedPatient.dateOfBirth)}
                      </div>
                    </>
                  )}
                  
                  {selectedPatient.incomeDocumentUrl && (
                    <>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">KYC:</span>
                      </div>
                      <div>
                        <a 
                          href={selectedPatient.incomeDocumentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:underline"
                        >
                          View Document
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Income Level Selection */}
            <div className="space-y-2">
              <Label htmlFor="incomeLevel">Income Level</Label>
              <Select
                value={incomeLevel}
                onValueChange={handleIncomeLevelChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select income level">{incomeLevel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {incomeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Discount Percentage */}
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount Percentage</Label>
              <Input
                type="number"
                id="discountPercentage"
                value={discountPercentage.toString()}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                min="0"
                max="100"
                step="1"
              />
              <p className="text-xs text-muted-foreground">
                This discount will be applied to all medicine purchases.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setSelectedPatient(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" variant="default" onClick={handleApproveConfirm} disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Approving...</> : <><CheckCircle className="w-4 h-4 mr-1" />Approve</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectingPatient !== null} onOpenChange={() => setRejectingPatient(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the KYC documents. The patient will see this reason and be prompted to resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Rejection Reason</Label>
              <Textarea
                id="rejectReason"
                placeholder="e.g. Document image is blurry, incorrect name matching..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setRejectingPatient(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleRejectConfirm} disabled={!rejectionReason.trim() || isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Rejecting...</> : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}