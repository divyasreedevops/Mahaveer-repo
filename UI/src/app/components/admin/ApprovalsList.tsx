import { useState, useEffect } from 'react';
import { api } from '@/app/services/api';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Calendar,
  CreditCard,
  Loader2,
  MapPin,
  Heart,
  Users,
  Building2,
  Percent,
} from 'lucide-react';
import type { Patient } from '@/app/context/AppContext';
import { INCOME_LABELS } from '@/app/context/AppContextDef';

interface PendingPatientItem extends Patient {
  rawKycStatus: string;
}

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

const generatePatientId = (dbId: number): string => {
  const year = new Date().getFullYear();
  return `PAT-${year}-${String(dbId).padStart(4, '0')}`;
};

export function ApprovalsList({ child }: { child?: boolean }) {
  const [pendingApprovals, setPendingApprovals] = useState<PendingPatientItem[]>([]);
  const [incomeOptions, setIncomeOptions] = useState<string[]>(['Low', 'Medium', 'High']);
  const [incomeLevelsData, setIncomeLevelsData] = useState<{ name: string; discount: number }[]>(
    []
  );
  const [loadingList, setLoadingList] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [rejectingPatient, setRejectingPatient] = useState<Patient | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [incomeLevel, setIncomeLevel] = useState<string>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoadingList(true);
    try {
      const [submittedRaw, levelsRaw] = await Promise.all([
        api.patient.getByStatus('Approved', 'Submitted').catch(() => []),
        api.common.getIncomeLevels().catch(() => []),
      ]);

      const mapPatient = (p: any, rawKycStatus: string): PendingPatientItem => {
        let guardianName: string | null = null;
        let guardianRelation: string | null = null;
        let guardianMobile: string | null = null;
        if (p.fathersName) {
          guardianName = p.fathersName;
          guardianRelation = 'Father';
          guardianMobile = p.fathersMobileNumber || null;
        } else if (p.mothersName) {
          guardianName = p.mothersName;
          guardianRelation = 'Mother';
          guardianMobile = p.mothersMobileNumber || null;
        }
        return {
          id: String(p.id),
          patientId: p.patientId,
          mobile: p.mobileNumber,
          email: p.email || null,
          name: p.fullName || '',
          dateOfBirth: p.dob || '',
          aadhaarNumber: p.govtIdNo || null,
          incomeDocumentUrl: p.kycDocumentUrl || null,
          incomeLevel: null,
          discountPercentage: p.discountPercentage || 0,
          kycStatus: 'pending' as const,
          kycRejectionReason: p.kycRejectionReason || null,
          registrationDate: p.registrationDate || p.createdDate || new Date().toISOString(),
          prescriptions: [],
          rawKycStatus,
          gender: p.gender || null,
          govtIdType: p.govtId || null,
          guardianName,
          guardianRelation,
          guardianMobile,
          annualFamilyIncome: p.annualIncome || null,
          streetAddress: p.streetAddress || p.permanentFullAddress || null,
          city: p.city_or_District || p.city || null,
          state: p.state || null,
          pinCode: p.pincode || null,
          country: p.country || null,
          hospitalPartner: p.ngoPartner || null,
          criticalIllness: p.criticalIllness || null,
          illnessDetails: p.addedInfo || null,
        };
      };

      const allMapped: PendingPatientItem[] = [
        ...(submittedRaw || []).map((p: any) => mapPatient(p, 'Submitted')),
      ];

      // Deduplicate by id
      const seen = new Set<string>();
      const deduped = allMapped.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      deduped.sort((a, b) => parseInt(b.id || '0', 10) - parseInt(a.id || '0', 10));

      setPendingApprovals(deduped);
      if (levelsRaw && Array.isArray(levelsRaw) && levelsRaw.length > 0) {
        const levelObjects = levelsRaw.map((l: any) => ({
          name: typeof l === 'string' ? l : l.incomeLevelName || l.name || l.label || String(l),
        }));
        const levels = levelObjects.map((l) => l.name);
        setIncomeLevelsData(levelObjects.map((l) => ({ name: l.name, discount: 0 })));
        setIncomeOptions(levels);
        setIncomeLevel(levels[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveClick = (patient: PendingPatientItem) => {
    setSelectedPatient(patient);
    const firstLevel = incomeOptions[0] || 'Low';
    setIncomeLevel(firstLevel);
  };

  const handleApproveConfirm = async () => {
    if (!selectedPatient) return;
    setIsSubmitting(true);
    try {
      const dbId = parseInt(selectedPatient.id);
      await api.admin.approveKyc({ id: dbId, incomeLevel: '-', discountPercentage: 0 });
      const approveRes = await api.admin.updateRegStatus({
        id: dbId,
        patientId: selectedPatient.patientId || generatePatientId(dbId),
        registrationStatus: 'Approved',
      });
      toast.success(
        approveRes?.message ||
          `KYC approved for ${selectedPatient.name || selectedPatient.patientId}`
      );
      setSelectedPatient(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = (patient: PendingPatientItem) => {
    setRejectingPatient(patient);
    setRejectionReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectingPatient || !rejectionReason.trim()) return;
    setIsSubmitting(true);
    try {
      // In a real app we would use rejectPatientKYC, but since we are interacting
      // with the API directly here to mimic the approve flow:
      const rejectDbId = parseInt(rejectingPatient.id);
      const rejectRes = await api.admin.updateRegStatus({
        id: rejectDbId,
        patientId: rejectingPatient.patientId || generatePatientId(rejectDbId),
        registrationStatus: 'Rejected',
      });
      toast.success(
        rejectRes?.message ||
          `KYC rejected for ${rejectingPatient.name || rejectingPatient.patientId}`
      );
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
  };

  return (
    <Card className="border-gray-100 shadow-lg rounded-2xl">
      {!child && (
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-gray-800 font-normal">Pending Approvals</CardTitle>
          </div>
          <CardDescription className="text-gray-500 font-light">
            Review and approve patient registrations
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {loadingList ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-light">Loading pending approvals...</span>
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-light">No pending approvals.</p>
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
                        <CardTitle className="text-base">
                          {patient.name || 'Unnamed Patient'}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {patient.patientId}
                        </CardDescription>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-normal text-xs">
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

            {/* Desktop Expandable Rows */}
            <div className="hidden md:block">
              <div className="grid grid-cols-5 gap-6 px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <div className="pl-2">Patient</div>
                <div>Guardian & Contact</div>
                <div>ID / Income</div>
                <div>Location</div>
                <div className="text-right pr-2">Actions</div>
              </div>
              <div className="mt-2 space-y-3">
                {pendingApprovals.map((patient) => (
                  <details
                    key={patient.id}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
                  >
                    <summary className="list-none cursor-pointer px-6 py-4 focus:outline-none select-none">
                      <div className="grid grid-cols-5 gap-6 items-center">
                        <div className="flex flex-col min-w-0" title={patient.name}>
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {patient.name || '—'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">
                            {patient.patientId}
                          </p>
                          <div className="mt-1">
                            {patient.rawKycStatus === 'Submitted' ? (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-normal text-[9px] px-1 py-0">
                                <FileText className="w-2.5 h-2.5 mr-0.5" />
                                Submitted
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-normal text-[9px] px-1 py-0">
                                <Clock className="w-2.5 h-2.5 mr-0.5" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col min-w-0" title={patient.guardianName || ''}>
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {patient.guardianName || patient.mobile}
                          </p>
                          <p className="text-[11px] text-blue-500 font-medium truncate">
                            {patient.guardianMobile || patient.mobile}
                          </p>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">
                            {patient.govtIdType?.split(' ')[0] || 'ID'}
                          </p>
                          <p className="text-xs font-mono text-gray-600 truncate">
                            ****{patient.aadhaarNumber?.replace(/\s/g, '').slice(-4) || '----'}
                          </p>
                        </div>
                        <div
                          className="flex flex-col min-w-0"
                          title={`${patient.city}, ${patient.state}`}
                        >
                          <p className="text-xs text-gray-700 font-medium truncate">
                            {patient.city || '—'}
                            {patient.state ? `, ${patient.state}` : ''}
                          </p>
                        </div>
                        <div
                          className="flex justify-end items-center gap-2 pr-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {patient.rawKycStatus === 'Submitted' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleApproveClick(patient);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-lg h-8 px-4 text-[11px] font-bold"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRejectClick(patient);
                                }}
                                className="border-red-200 text-red-500 hover:bg-red-50 rounded-lg h-8 px-4 text-[11px] font-medium"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 pr-2">—</span>
                          )}
                        </div>
                      </div>
                    </summary>

                    <div className="px-6 pb-6 pt-2 bg-gray-50/30 border-t border-gray-100/50 grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Identification & Socio-Economic
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                              <span className="text-gray-500">Full ID Type:</span>
                              <span className="font-medium text-gray-900">
                                {patient.govtIdType || '—'}
                              </span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                              <span className="text-gray-500">ID Number:</span>
                              <span className="font-mono text-gray-900">
                                {patient.aadhaarNumber || '—'}
                              </span>
                            </div>
                            {patient.annualFamilyIncome && (
                              <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="text-gray-500">Annual Income:</span>
                                <span className="font-bold text-purple-700">
                                  {INCOME_LABELS[patient.annualFamilyIncome as string] ||
                                    patient.annualFamilyIncome}
                                </span>
                              </div>
                            )}
                            {patient.incomeDocumentUrl && (
                              <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="text-gray-500">Income Doc:</span>
                                <a
                                  href={patient.incomeDocumentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:underline flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" /> View
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Patient Demographics
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                              <span className="text-gray-500">Gender:</span>
                              <span className="font-medium text-gray-900">
                                {patient.gender || '—'}
                              </span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                              <span className="text-gray-500">Date of Birth:</span>
                              <span className="font-medium text-gray-900">
                                {patient.dateOfBirth
                                  ? formatDateToDDMMYYYY(patient.dateOfBirth)
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {(patient.criticalIllness || patient.hospitalPartner) && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                              Medical Info
                            </p>
                            <div className="space-y-1.5 text-xs">
                              {patient.criticalIllness && (
                                <div className="grid grid-cols-[140px_1fr] gap-2">
                                  <span className="text-gray-500">Diagnosis:</span>
                                  <span className="font-medium text-gray-900">
                                    {patient.criticalIllness}
                                  </span>
                                </div>
                              )}
                              {patient.hospitalPartner && (
                                <div className="grid grid-cols-[140px_1fr] gap-2">
                                  <span className="text-gray-500">Hospital:</span>
                                  <span className="font-medium text-gray-900">
                                    {patient.hospitalPartner}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Guardian & Contact Details
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                              <span className="text-gray-500">Primary Guardian:</span>
                              <span className="font-medium text-gray-900">
                                {patient.guardianName || '—'}
                                {patient.guardianRelation ? ` (${patient.guardianRelation})` : ''}
                              </span>
                            </div>
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                              <span className="text-gray-500">Mobile Number:</span>
                              <span className="font-bold text-blue-600">
                                {patient.guardianMobile || patient.mobile}
                              </span>
                            </div>
                            {patient.email && (
                              <div className="grid grid-cols-[140px_1fr] gap-2">
                                <span className="text-gray-500">Email:</span>
                                <span className="font-medium text-gray-900 truncate">
                                  {patient.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {(patient.city || patient.state || patient.streetAddress) && (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                              Full Residential Address
                            </p>
                            <div className="text-xs leading-relaxed text-gray-800 font-medium">
                              {patient.streetAddress && <p>{patient.streetAddress}</p>}
                              <p>
                                {[patient.city, patient.state, patient.pinCode]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                              {patient.country && (
                                <p className="text-[10px] text-gray-400 uppercase tracking-tight mt-1">
                                  {patient.country}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Registration
                          </p>
                          <div className="space-y-1.5 text-xs">
                            <div className="grid grid-cols-[140px_1fr] gap-2">
                              <span className="text-gray-500">Registered:</span>
                              <span className="font-medium text-gray-900">
                                {new Date(patient.registrationDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
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
              Review patient details and confirm approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPatient && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm border border-gray-100">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
                  Child Information
                </p>
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-500 shrink-0">Name:</span>
                  <span className="text-gray-800 font-medium">{selectedPatient.name || '—'}</span>
                </div>
                <div className="flex gap-6">
                  {selectedPatient.dateOfBirth && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-500 shrink-0">DOB:</span>
                      <span className="text-gray-800 font-medium">
                        {formatDateToDDMMYYYY(selectedPatient.dateOfBirth)}
                      </span>
                    </div>
                  )}
                  {selectedPatient.gender && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-500 shrink-0">Gender:</span>
                      <span className="text-gray-800 font-medium">{selectedPatient.gender}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-500 shrink-0">
                    {selectedPatient.govtIdType || 'Govt ID'}:
                  </span>
                  <span className="text-gray-800 font-medium">
                    {selectedPatient.aadhaarNumber || '—'}
                  </span>
                </div>
                {selectedPatient.incomeDocumentUrl && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Income Doc:</span>
                    <a
                      href={selectedPatient.incomeDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                )}

                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mt-3 mb-1">
                  Guardian & Contact
                </p>
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-500 shrink-0">
                    {selectedPatient.guardianRelation || 'Guardian'}:
                  </span>
                  <span className="text-gray-800 font-medium">
                    {selectedPatient.guardianName || '—'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-gray-500 shrink-0">Mobile:</span>
                  <span className="text-gray-800 font-medium">
                    {selectedPatient.guardianMobile || selectedPatient.mobile}
                  </span>
                </div>
                {selectedPatient.annualFamilyIncome && (
                  <div className="flex items-start gap-2">
                    <Percent className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-gray-500 shrink-0">Annual Income:</span>
                    <span className="text-gray-800 font-medium">
                      {INCOME_LABELS[selectedPatient.annualFamilyIncome as string] ||
                        selectedPatient.annualFamilyIncome}
                    </span>
                  </div>
                )}

                {(selectedPatient.city || selectedPatient.state) && (
                  <>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mt-3 mb-1">
                      Address
                    </p>
                    {selectedPatient.streetAddress && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-500 shrink-0">Street:</span>
                        <span className="text-gray-800 font-medium">
                          {selectedPatient.streetAddress}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-500 shrink-0">Location:</span>
                      <span className="text-gray-800 font-medium">
                        {[
                          selectedPatient.city,
                          selectedPatient.state,
                          selectedPatient.pinCode,
                          selectedPatient.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  </>
                )}

                {selectedPatient.criticalIllness && (
                  <>
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mt-3 mb-1">
                      Medical Info
                    </p>
                    <div className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-500 shrink-0">Illness:</span>
                      <span className="text-gray-800 font-medium">
                        {selectedPatient.criticalIllness}
                      </span>
                    </div>
                    {selectedPatient.hospitalPartner && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                        <span className="text-gray-500 shrink-0">Hospital:</span>
                        <span className="text-gray-800 font-medium">
                          {selectedPatient.hospitalPartner}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPatient(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleApproveConfirm}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </>
              )}
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
              Please provide a reason for rejecting the KYC documents. The patient will see this
              reason and be prompted to resubmit.
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRejectingPatient(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
