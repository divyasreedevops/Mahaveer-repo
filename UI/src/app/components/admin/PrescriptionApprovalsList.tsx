import { useState, useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { api } from '@/app/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Checkbox } from '@/app/components/ui/checkbox';
import { FileText, Check, X, ExternalLink, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export function PrescriptionApprovalsList() {
  const { notifyMissingMedicine, medicines } = useApp();
  const [pendingPrescriptions, setPendingPrescriptions] = useState<{ patient: { id: string; name: string; patientId: string }; prescription: any }[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [rejectingPrescription, setRejectingPrescription] = useState<{
    patientId: string; prescriptionId: string;
  } | null>(null);
  const [notifyingPrescription, setNotifyingPrescription] = useState<{
    patientId: string; prescriptionId: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedMissingMedicines, setSelectedMissingMedicines] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPrescriptions = async () => {
    setLoadingList(true);
    try {
      const [prescRaw, patientsRaw] = await Promise.all([
        api.prescription.getByStatus('PENDING').catch(() => []),
        api.patient.getByStatus('Approved', 'Approved').catch(() => []),
      ]);
      const patientsMap: Record<string, string> = {};
      (patientsRaw || []).forEach((p: any) => { patientsMap[p.patientId] = p.fullName || p.patientId; });
      const mapped = (prescRaw || []).map((p: any) => ({
        patient: { id: String(p.pId || 0), name: patientsMap[p.patientId] || p.patientId, patientId: p.patientId },
        prescription: {
          id: String(p.id || p.prescriptionId),
          uploadDate: p.uploadDate || new Date().toISOString(),
          prescriptionUrl: p.prescriptionKey || '',
          doctorName: p.doctorName || '',
          hospitalName: p.hospitalName || '',
          approvalStatus: 'pending' as const,
          rejectionReason: null,
          approvedDate: null,
          expiryDate: null,
          pickups: [],
          missingMedicines: [],
        },
      }));
      setPendingPrescriptions(mapped);
    } catch {
      toast.error('Failed to load pending prescriptions');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadPrescriptions(); }, []);

  const handleApprove = async (patientId: string, prescriptionId: string) => {
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    try {
      await api.prescription.approve({
        prescriptionId: parseInt(prescriptionId),
        approvedBy: adminUser.username || 'Admin',
        remarks: '',
      });
      toast.success('Prescription approved');
      loadPrescriptions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve prescription');
    }
  };

  const handleRejectClick = async (patientId: string, prescriptionId: string) => {
    setRejectingPrescription({ patientId, prescriptionId: parseInt(prescriptionId) });
    setRejectionReason('');
  };

  const handleNotifyClick = (patientId: string, prescriptionId: string) => {
    setNotifyingPrescription({ patientId, prescriptionId });
    setSelectedMissingMedicines([]);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingPrescription || !rejectionReason.trim()) return;
    setIsSubmitting(true);
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    try {
      await api.prescription.reject({
        prescriptionId: rejectingPrescription.prescriptionId,
        rejectedBy: adminUser.username || 'Admin',
        reason: rejectionReason,
      });
      toast.success('Prescription rejected');
      setRejectingPrescription(null);
      setRejectionReason('');
      loadPrescriptions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyConfirm = () => {
    if (notifyingPrescription && selectedMissingMedicines.length > 0) {
      notifyMissingMedicine(
        notifyingPrescription.patientId,
        notifyingPrescription.prescriptionId,
        selectedMissingMedicines
      );
      setNotifyingPrescription(null);
      setSelectedMissingMedicines([]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleMedicine = (name: string) => {
    setSelectedMissingMedicines(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <>
      <Card className="border-gray-100 shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-gray-800 font-normal">Prescription Approvals</CardTitle>
          </div>
          <CardDescription className="text-gray-500 font-light">
            Review and approve patient prescriptions for single-session fulfilment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingList ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-600" />
              <p className="text-gray-400 mt-2">Loading pending prescriptions...</p>
            </div>
          ) : pendingPrescriptions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-light">No pending prescription approvals</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-xl border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-normal text-gray-700 py-4">Patient</TableHead>
                      <TableHead className="font-normal text-gray-700">Upload Date</TableHead>
                      <TableHead className="font-normal text-gray-700">Doctor & Hospital</TableHead>
                      <TableHead className="font-normal text-gray-700">Prescription</TableHead>
                      <TableHead className="font-normal text-gray-700 text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPrescriptions.map(({ patient, prescription }, idx) => (
                      <TableRow key={prescription.id || `prescription-${idx}`} className="hover:bg-gray-50/30 transition-colors">
                        <TableCell className="py-4">
                          <div>
                            <p className="font-normal text-gray-800">{patient.name}</p>
                            <p className="text-xs text-gray-500 font-light">{patient.patientId} • {patient.mobile}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 font-light">
                          {formatDate(prescription.uploadDate)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-gray-800 font-normal">Dr. {prescription.doctorName}</p>
                            <p className="text-xs text-gray-500 font-light mt-0.5">{prescription.hospitalName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => window.open(prescription.prescriptionUrl, '_blank')}
                            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View File
                          </Button>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(patient.patientId, prescription.id)}
                              className="bg-green-600 hover:bg-green-700 shadow-sm transition-all duration-300 font-normal h-9 px-4 rounded-lg"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            {/* <Button
                              size="sm"
                              onClick={() => handleNotifyClick(patient.patientId, prescription.id)}
                              className="bg-amber-500 hover:bg-amber-600 shadow-sm transition-all duration-300 font-normal h-9 px-4 rounded-lg text-white"
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Notify
                            </Button> */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRejectClick(patient.patientId, prescription.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300 font-normal h-9 px-4 rounded-lg"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {pendingPrescriptions.map(({ patient, prescription }) => (
                  <Card key={prescription.id} className="border-gray-100 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="pb-3 bg-gray-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-normal text-gray-800">
                            {patient.name}
                          </CardTitle>
                          <CardDescription className="text-xs font-light mt-1">
                            {patient.patientId} • {patient.mobile}
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-light rounded-full px-2.5">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400 font-light uppercase tracking-wider mb-1">Uploaded</p>
                          <p className="text-gray-800 font-normal">{formatDate(prescription.uploadDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 font-light uppercase tracking-wider mb-1">Doctor</p>
                          <p className="text-gray-800 font-normal">Dr. {prescription.doctorName}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-400 font-light uppercase tracking-wider mb-1">Hospital</p>
                          <p className="text-gray-800 font-normal">{prescription.hospitalName}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(prescription.prescriptionUrl, '_blank')}
                        className="w-full border-gray-100 font-normal rounded-xl py-5"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Prescription
                      </Button>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(patient.patientId, prescription.id)}
                          className="bg-green-600 hover:bg-green-700 shadow-sm font-normal rounded-xl py-5"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleNotifyClick(patient.patientId, prescription.id)}
                          className="bg-amber-500 hover:bg-amber-600 shadow-sm font-normal rounded-xl py-5 text-white"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Notify
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRejectClick(patient.patientId, prescription.id)}
                          className="col-span-2 text-red-600 font-normal"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notify Dialog */}
      <Dialog open={!!notifyingPrescription} onOpenChange={() => setNotifyingPrescription(null)}>
        <DialogContent className="border-gray-100 max-w-md rounded-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-gray-800 font-normal text-xl">Notify Patient — Missing Medicine</DialogTitle>
            <DialogDescription className="text-gray-500 font-light">
              Select the medicines that are currently out of stock for this prescription.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            {medicines.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 font-normal">No medicines found in inventory.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-gray-700 font-normal ml-1">Medicines — select out of stock items to notify</Label>
                <div className="grid gap-2">
                  {medicines.map((med) => {
                    const isOutOfStock = med.stockQuantity === 0;
                    const isSelected = selectedMissingMedicines.includes(med.name);
                    return (
                      <div
                        key={med.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleMedicine(med.name)}
                      >
                        <Checkbox
                          id={`med-${med.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleMedicine(med.name)}
                          className="rounded border-gray-300"
                        />
                        <div className="flex-1 min-w-0">
                          <Label
                            htmlFor={`med-${med.id}`}
                            className={`font-normal cursor-pointer block truncate ${
                              isSelected ? 'text-amber-800' : 'text-gray-700'
                            }`}
                          >
                            {med.name}
                          </Label>
                          <p className="text-xs text-gray-400 font-light">{med.genericName}</p>
                        </div>
                        <span className={`text-xs font-normal px-2 py-0.5 rounded-full shrink-0 ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : `Qty: ${med.stockQuantity}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setNotifyingPrescription(null)} className="font-normal rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleNotifyConfirm}
              disabled={selectedMissingMedicines.length === 0}
              className="bg-amber-500 hover:bg-amber-600 text-white font-normal rounded-xl shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectingPrescription} onOpenChange={() => setRejectingPrescription(null)}>
        <DialogContent className="border-gray-100 max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-800 font-normal text-xl">Reject Prescription</DialogTitle>
            <DialogDescription className="text-gray-500 font-light">
              Please provide a clear reason for the patient.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason" className="text-gray-700 font-normal ml-1">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Image blurry, invalid doctor details, hospital not recognised..."
              className="border-gray-100 min-h-[120px] rounded-xl focus:ring-red-500/20"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setRejectingPrescription(null)} disabled={isSubmitting} className="font-normal rounded-xl">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || isSubmitting}
              className="font-normal rounded-xl shadow-md transition-all duration-300"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Rejecting...</> : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}