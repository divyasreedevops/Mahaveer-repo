import { useState } from 'react';
import { usePatients, useUpdatePatientStatus, useApproveKyc, useIncomeLevels } from '@/hooks';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { CheckCircle, XCircle, Clock, User, Phone, Mail, CreditCard, Calendar, FileText, Loader2 } from 'lucide-react';
import { TableSkeleton, CardListSkeleton } from '@/app/components/ui/loaders';
import { RegistrationStatus } from '@/types';
import type { PatientDetails } from '@/types';

export function ApprovalsList() {
  const { patients: pendingApprovals, isLoading, mutate } = usePatients(RegistrationStatus.PENDING);
  const { updateStatus } = useUpdatePatientStatus();
  const { approveKyc } = useApproveKyc();
  const { incomeLevels } = useIncomeLevels();
  const toast = useToast();

  const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);
  const [incomeLevel, setIncomeLevel] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isApproving, setIsApproving] = useState(false);

  const handleApproveClick = (patient: PatientDetails) => {
    setSelectedPatient(patient);
    // Default to first income level from API, fallback to empty
    if (incomeLevels.length > 0) {
      setIncomeLevel(incomeLevels[0].incomeLevelName);
      setDiscountPercentage(incomeLevels[0].discountPercentage);
    } else {
      setIncomeLevel('');
      setDiscountPercentage(0);
    }
  };

  const handleIncomeLevelChange = (value: string) => {
    setIncomeLevel(value);
    // Auto-fill discount from API income level data
    const level = incomeLevels.find(l => l.incomeLevelName === value);
    if (level) {
      setDiscountPercentage(level.discountPercentage);
    }
  };

  const handleApproveConfirm = async () => {
    if (!selectedPatient?.patientId || !incomeLevel) return;
    setIsApproving(true);
    const toastId = toast.loading('Approving patient...');
    try {
      // Step 1: Update registration status to Approved
      const statusResult = await updateStatus({
        ...selectedPatient,
        registrationStatus: RegistrationStatus.APPROVED,
      });
      if (!statusResult.success) {
        toast.dismiss(toastId);
        toast.error(statusResult.error || 'Failed to approve patient');
        setIsApproving(false);
        return;
      }

      // Step 2: Approve KYC with income level and discount
      const kycResult = await approveKyc({
        ...selectedPatient,
        incomeLevel,
        discountPercentage,
        updatedBy: 1,
      });
      
      mutate();
      toast.dismiss(toastId);
      
      if (kycResult.success) {
        toast.success(`Patient approved with ${discountPercentage}% discount (${incomeLevel})`);
      } else {
        // Status updated but KYC approve failed - still approved but warn about income level
        toast.success('Patient approved, but income level assignment failed. Please update manually.');
      }
    } catch {
      toast.dismiss(toastId);
      toast.error('Failed to approve patient');
    } finally {
      setIsApproving(false);
      setSelectedPatient(null);
    }
  };

  const handleReject = async (patientId: string | null) => {
    if (!patientId) return;
    const toastId = toast.loading('Rejecting patient...');
    try {
      const patient = pendingApprovals.find(p => p.patientId === patientId);
      if (patient) {
        const result = await updateStatus({ ...patient, registrationStatus: RegistrationStatus.REJECTED });
        if (result.success) {
          mutate();
          toast.dismiss(toastId);
          toast.success('Patient rejected');
        } else {
          toast.dismiss(toastId);
          toast.error(result.error || 'Failed to reject patient');
        }
      }
    } catch {
      toast.dismiss(toastId);
      toast.error('Failed to reject patient');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6" />
            <CardTitle>Pending Approvals</CardTitle>
          </div>
          <CardDescription>Loading pending approvals...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="md:hidden">
            <CardListSkeleton count={3} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={5} columns={8} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-6 h-6" />
          <CardTitle>Pending Approvals</CardTitle>
        </div>
        <CardDescription>
          Review and approve patient registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingApprovals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
                        <CardTitle className="text-lg">
                          {patient.fullName || 'Unnamed Patient'}
                        </CardTitle>
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
                        <span>{patient.mobileNumber}</span>
                      </div>
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      {patient.aadharNumber && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span>{patient.aadharNumber}</span>
                        </div>
                      )}
                      {patient.kycDocumentUrl && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <a
                            href={patient.kycDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View KYC Document
                          </a>
                        </div>
                      )}
                      {patient.dob && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(patient.dob).toLocaleDateString()}</span>
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
                        onClick={() => handleReject(patient.patientId)}
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patientId}</TableCell>
                      <TableCell>{patient.fullName || '-'}</TableCell>
                      <TableCell>{patient.mobileNumber}</TableCell>
                      <TableCell>{patient.email || '-'}</TableCell>
                      <TableCell>
                        {patient.kycDocumentUrl ? (
                          <a
                            href={patient.kycDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-4 h-4" />
                            View
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.dob ? new Date(patient.dob).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(patient.registrationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
                            onClick={() => handleReject(patient.patientId)}
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

      {/* Approval Dialog with Income Level + Discount */}
      <Dialog open={selectedPatient !== null} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve Patient</DialogTitle>
            <DialogDescription>
              Review patient details and set income level with discount percentage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPatient && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                <h4 className="font-semibold text-base mb-3">Patient Information</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                  </div>
                  <div className="font-medium">{selectedPatient.fullName || '-'}</div>

                  {selectedPatient.aadharNumber && (
                    <>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Aadhaar:</span>
                      </div>
                      <div className="font-medium">{selectedPatient.aadharNumber}</div>
                    </>
                  )}

                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mobile:</span>
                  </div>
                  <div className="font-medium">{selectedPatient.mobileNumber}</div>

                  {selectedPatient.dob && (
                    <>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">DOB:</span>
                      </div>
                      <div className="font-medium">
                        {new Date(selectedPatient.dob).toLocaleDateString()}
                      </div>
                    </>
                  )}

                  {selectedPatient.kycDocumentUrl && (
                    <>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">KYC:</span>
                      </div>
                      <div>
                        <a
                          href={selectedPatient.kycDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
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
              <Select value={incomeLevel} onValueChange={handleIncomeLevelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select income level" />
                </SelectTrigger>
                <SelectContent>
                  {incomeLevels.length > 0 ? (
                    incomeLevels.map((level) => (
                      <SelectItem key={level.id} value={level.incomeLevelName}>
                        {level.incomeLevelName} ({level.discountPercentage}% discount)
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="Low">Low (Higher Discount)</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High (Lower Discount)</SelectItem>
                    </>
                  )}
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
            <Button size="sm" variant="outline" onClick={() => setSelectedPatient(null)} disabled={isApproving}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleApproveConfirm}
              className="bg-green-600 hover:bg-green-700"
              disabled={isApproving || !incomeLevel}
            >
              {isApproving ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              {isApproving ? 'Approving...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
