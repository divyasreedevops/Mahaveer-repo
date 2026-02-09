import { usePatients, useUpdatePatientStatus } from '@/hooks';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { CheckCircle, XCircle, Clock, User, Phone, Mail, CreditCard, Calendar } from 'lucide-react';
import { TableSkeleton, CardListSkeleton } from '@/app/components/ui/loaders';
import { RegistrationStatus } from '@/types';

export function ApprovalsList() {
  const { patients: pendingApprovals, isLoading, mutate } = usePatients(RegistrationStatus.PENDING);
  const { updateStatus } = useUpdatePatientStatus();
  const toast = useToast();

  const handleApprove = async (patientId: string | null) => {
    if (!patientId) return;
    const toastId = toast.loading('Approving patient...');
    try {
      const patient = pendingApprovals.find(p => p.patientId === patientId);
      if (patient) {
        const result = await updateStatus({ ...patient, registrationStatus: RegistrationStatus.APPROVED });
        if (result.success) {
          mutate();
          toast.dismiss(toastId);
          toast.success('Patient approved successfully');
        } else {
          toast.dismiss(toastId);
          toast.error(result.error || 'Failed to approve patient');
        }
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Failed to approve patient');
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
    } catch (error) {
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
                        onClick={() => handleApprove(patient.patientId)}
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
                    <TableHead>Aadhar</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.patientId}</TableCell>
                      <TableCell>{patient.fullName || '-'}</TableCell>
                      <TableCell>{patient.mobileNumber}</TableCell>
                      <TableCell>{patient.email || '-'}</TableCell>
                      <TableCell>{patient.aadharNumber || '-'}</TableCell>
                      <TableCell>
                        {patient.dob ? new Date(patient.dob).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(patient.registrationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(patient.patientId)}
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
    </Card>
  );
}
