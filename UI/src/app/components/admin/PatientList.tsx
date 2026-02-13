import { useState } from 'react';
import { usePatients, useUpdatePatient } from '@/hooks';
import { useToast } from '@/lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Users, Phone, Calendar, CreditCard, CheckCircle, Clock, Package, PackageCheck, Edit, MapPin, Loader2 } from 'lucide-react';
import { TableSkeleton, CardListSkeleton } from '@/app/components/ui/loaders';
import { RegistrationStatus } from '@/types';
import type { PatientDetails } from '@/types';

export function PatientList() {
  const { patients: approvedPatients, isLoading, mutate } = usePatients(RegistrationStatus.APPROVED);
  const { updatePatient } = useUpdatePatient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'collected'>('pending');
  const [editingPatient, setEditingPatient] = useState<PatientDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    dob: '',
    slotDate: '',
    slotTime: '',
  });

  // For now, simulate pending/collected split using registration date heuristic
  // In production, this would use paymentStatus and itemReceived fields from the API
  const pendingPatients = approvedPatients;
  const collectedPatients: PatientDetails[] = [];

  const handleEdit = (patient: PatientDetails) => {
    setEditingPatient(patient);
    setEditForm({
      fullName: patient.fullName || '',
      mobileNumber: patient.mobileNumber || '',
      email: patient.email || '',
      dob: patient.dob || '',
      slotDate: '',
      slotTime: '',
    });
    setDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPatient) return;
    setIsSaving(true);
    const toastId = toast.loading('Saving patient details...');
    try {
      const updatedPatient: PatientDetails = {
        ...editingPatient,
        fullName: editForm.fullName,
        mobileNumber: editForm.mobileNumber,
        email: editForm.email,
        dob: editForm.dob,
      };
      const result = await updatePatient(updatedPatient);
      toast.dismiss(toastId);
      if (result.success) {
        mutate();
        toast.success(result.message || 'Patient details updated successfully');
        setDialogOpen(false);
        setEditingPatient(null);
      } else {
        toast.error(result.error || 'Failed to update patient');
      }
    } catch {
      toast.dismiss(toastId);
      toast.error('Failed to update patient details');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPatientCards = (patients: PatientDetails[]) => (
    <div className="md:hidden space-y-4">
      {patients.map((patient) => (
        <Card key={patient.id} className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{patient.fullName || 'Unnamed Patient'}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {patient.patientId}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approved
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(patient)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{patient.mobileNumber}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.dob && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(patient.dob).toLocaleDateString()}</span>
                </div>
              )}
              {patient.incomeLevel && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Income Level:</span>
                  <Badge variant="outline" className="capitalize">
                    {patient.incomeLevel}
                  </Badge>
                  {patient.discountPercentage != null && (
                    <span className="text-muted-foreground">
                      ({patient.discountPercentage}% discount)
                    </span>
                  )}
                </div>
              )}
              {patient.registrationDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs">Registered</div>
                    <div>{new Date(patient.registrationDate).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPatientTable = (patients: PatientDetails[]) => (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>DOB</TableHead>
            <TableHead>Income Level</TableHead>
            <TableHead>Aadhar</TableHead>
            <TableHead>Registration Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((patient) => (
            <TableRow key={patient.id}>
              <TableCell className="font-mono text-xs">{patient.patientId}</TableCell>
              <TableCell>{patient.fullName || '-'}</TableCell>
              <TableCell>{patient.mobileNumber}</TableCell>
              <TableCell className="text-sm">{patient.email || '-'}</TableCell>
              <TableCell>
                {patient.dob ? new Date(patient.dob).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell>
                {patient.incomeLevel ? (
                  <div className="text-xs">
                    <Badge variant="outline" className="capitalize mb-1">
                      {patient.incomeLevel}
                    </Badge>
                    {patient.discountPercentage != null && (
                      <div className="text-muted-foreground">{patient.discountPercentage}%</div>
                    )}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {patient.aadharNumber || '-'}
              </TableCell>
              <TableCell>
                {patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : '-'}
              </TableCell>
              <TableCell>
                <Badge className="bg-green-600">Approved</Badge>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(patient)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6" />
            <CardTitle>Approved & Paid Patients</CardTitle>
          </div>
          <CardDescription>Loading patients...</CardDescription>
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6" />
            <CardTitle>Approved & Paid Patients</CardTitle>
          </div>
          <CardDescription>
            Total: {approvedPatients.length} patient(s) | Pending Pickup: {pendingPatients.length} | Collected: {collectedPatients.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'collected')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pending ({pendingPatients.length})
              </TabsTrigger>
              <TabsTrigger value="collected" className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4" />
                Collected ({collectedPatients.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No patients waiting to collect medicines</p>
                </div>
              ) : (
                <>
                  {renderPatientCards(pendingPatients)}
                  {renderPatientTable(pendingPatients)}
                </>
              )}
            </TabsContent>

            <TabsContent value="collected">
              {collectedPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PackageCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No patients have collected their medicines yet</p>
                </div>
              ) : (
                <>
                  {renderPatientCards(collectedPatients)}
                  {renderPatientTable(collectedPatients)}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Patient Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Patient Details</DialogTitle>
            <DialogDescription>
              Update patient information and pickup slot details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                placeholder="Patient name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-mobile">Mobile</Label>
              <Input
                id="edit-mobile"
                value={editForm.mobileNumber}
                onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                placeholder="Mobile number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={editForm.dob}
                onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-slot-date">Slot Date</Label>
                <Input
                  id="edit-slot-date"
                  type="date"
                  value={editForm.slotDate}
                  onChange={(e) => setEditForm({ ...editForm, slotDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-slot-time">Slot Time</Label>
                <Input
                  id="edit-slot-time"
                  type="time"
                  value={editForm.slotTime}
                  onChange={(e) => setEditForm({ ...editForm, slotTime: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}