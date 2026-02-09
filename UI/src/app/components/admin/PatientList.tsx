import { usePatients } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Users, Phone, Calendar, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { TableSkeleton, CardListSkeleton } from '@/app/components/ui/loaders';
import { RegistrationStatus } from '@/types';

export function PatientList() {
  const { patients: paidPatients, isLoading } = usePatients(RegistrationStatus.APPROVED);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6" />
            <CardTitle>Registered & Paid Patients</CardTitle>
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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6" />
          <CardTitle>Registered & Paid Patients</CardTitle>
        </div>
        <CardDescription>
          Total: {paidPatients.length} patient(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {paidPatients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No patients have registered and paid yet
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {paidPatients.map((patient) => (
                <Card key={patient.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{patient.fullName || 'Unnamed Patient'}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {patient.patientId}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{patient.mobileNumber}</span>
                      </div>
                      {patient.dob && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(patient.dob).toLocaleDateString()}</span>
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
                      {patient.email && (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs">{patient.email}</span>
                        </div>
                      )}
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
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Aadhar</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-mono">{patient.patientId}</TableCell>
                      <TableCell>{patient.fullName || '-'}</TableCell>
                      <TableCell>{patient.mobileNumber}</TableCell>
                      <TableCell className="text-sm">{patient.email || '-'}</TableCell>
                      <TableCell>
                        {patient.dob ? new Date(patient.dob).toLocaleDateString() : '-'}
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