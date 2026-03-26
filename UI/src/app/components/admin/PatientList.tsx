import { useState, useEffect } from 'react';
import { api } from '@/app/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Users, Phone, Mail, Calendar, User, Loader2, RefreshCw, ExternalLink, FileX, Percent, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ApprovalsList } from './ApprovalsList';

interface PatientRow {
  patientId: string;
  regNo?: string | null;
  fullName: string;
  mobileNumber: string;
  email: string | null;
  dob: string;
  aadharNumber: string | null;
  govtId?: string | null;
  govtIdNo?: string | null;
  cityOrDistrict?: string | null;
  pincode?: string | null;
  state?: string | null;
  country?: string | null;
  streetAddress?: string | null;
  ngoPartner?: string | null;
  criticalIllness?: string | null;
  kycStatus: string;
  registrationStatus: string;
  registrationDate: string;
  discountPercentage: number | null;
  incomeLevel: string | null;
  kycDocumentUrl: string | null;
}

type FilterTab = 'all' | 'approved' | 'pending';

function getKycBadge(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-200 font-normal">Approved</Badge>;
  if (s === 'pending' || s === 'pending approval') return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-normal">Pending</Badge>;
  if (s === 'rejected') return <Badge className="bg-red-100 text-red-700 border-red-200 font-normal">Rejected</Badge>;
  return <Badge className="bg-gray-100 text-gray-500 border-gray-200 font-normal">{status}</Badge>;
}

const formatDate = (input: string | number | undefined | null) => {
  if (!input && input !== 0) return '—';
  try {
    let t: number;
    if (typeof input === 'number') {
      // seconds vs milliseconds
      t = input > 1e12 ? input : input * 1000;
    } else if (/^\d+$/.test(String(input))) {
      // numeric string
      const n = parseInt(String(input), 10);
      t = n > 1e12 ? n : n * 1000;
    } else {
      t = new Date(String(input)).getTime();
    }
    const d = new Date(t);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
};

function PatientTable({ patients, isLoading }: { patients: PatientRow[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-light">Loading patients...</span>
      </div>
    );
  }
  if (patients.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-light">No patients match the current filter.</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
            <TableHead className="font-normal text-gray-500 py-6 pl-8">Patient</TableHead>
            <TableHead className="font-normal text-gray-500">Reg No</TableHead>
            <TableHead className="font-normal text-gray-500">Contact</TableHead>
            <TableHead className="font-normal text-gray-500">Aadhar / Govt ID</TableHead>
            <TableHead className="font-normal text-gray-500">Registered</TableHead>
            <TableHead className="font-normal text-gray-500">Status</TableHead>
            <TableHead className="font-normal text-gray-500">Income / Discount</TableHead>
            <TableHead className="font-normal text-gray-500">NGO / Illness</TableHead>
            <TableHead className="font-normal text-gray-500">KYC Doc</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.map((p) => (
            <TableRow key={p.patientId} className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0">
              <TableCell className="py-6 pl-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-normal text-gray-800">{p.fullName || '—'}</p>
                    <p className="text-xs text-gray-400 font-light mt-0.5">ID: {p.patientId}</p>
                    {p.dob && (
                      <p className="text-xs text-gray-400 font-light mt-0.5">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        DOB: {formatDate(p.dob)}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-700">{p.regNo || '—'}</span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{p.mobileNumber || '—'}</span>
                  </div>
                  {p.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Mail className="w-3 h-3" />
                      <span>{p.email}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {p.aadharNumber || p.govtIdNo ? (
                  <div className="text-sm text-gray-600 font-light tracking-wider">
                    {p.aadharNumber ? p.aadharNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') : p.govtIdNo}
                    {p.govtId && <div className="text-xs text-gray-400 font-light mt-1">{p.govtId}</div>}
                  </div>
                ) : (
                  <span className="text-sm text-gray-300">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600 font-light">{formatDate(p.registrationDate)}</span>
              </TableCell>
              <TableCell>
                {getKycBadge(p.kycStatus)}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {p.incomeLevel ? (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <ShieldCheck className="w-3 h-3 text-gray-400" />
                      <span>{p.incomeLevel}</span>
                    </div>
                  ) : null}
                  {p.discountPercentage != null && p.discountPercentage > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Percent className="w-3 h-3 text-green-500" />
                      <span className="text-sm text-green-600 font-normal">{p.discountPercentage}%</span>
                    </div>
                  ) : (
                    !p.incomeLevel && <span className="text-sm text-gray-300">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-700 space-y-1">
                  {p.ngoPartner ? <div>{p.ngoPartner}</div> : null}
                  {p.criticalIllness ? <div className="text-xs text-gray-500">{p.criticalIllness}</div> : null}
                </div>
              </TableCell>
              <TableCell>
                {p.kycDocumentUrl ? (
                  <a
                    href={p.kycDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="border-gray-200 rounded-xl font-normal text-purple-600 hover:text-purple-700 hover:border-purple-200 hover:bg-purple-50">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      View
                    </Button>
                  </a>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-300">
                    <FileX className="w-4 h-4" />
                    <span>None</span>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PatientList() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [approvedPatients, setApprovedPatients] = useState<PatientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApprovedLoading, setIsApprovedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const mapAndSort = (raw: any[], sortBy: 'name' | 'date' = 'name'): PatientRow[] => {
    const list: any[] = raw || [];
    const seen = new Set<string>();
    const deduped = list.filter(p => {
      const key = p.patientId || String(p.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const mapped: PatientRow[] = deduped.map((p: any) => ({
      patientId: p.patientId || String(p.id),
      regNo: p.regNo || p.regno || null,
      fullName: p.fullName || '',
      mobileNumber: p.mobileNumber || p.mothersMobileNumber || p.fathersMobileNumber || '',
      email: p.email || null,
      dob: p.dob || '',
      aadharNumber: p.aadharNumber || null,
      govtId: p.govtId || null,
      govtIdNo: p.govtIdNo || p.govtIdNumber || null,
      cityOrDistrict: p.city_or_District || p.cityOrDistrict || null,
      pincode: p.pincode || null,
      state: p.state || null,
      country: p.country || null,
      streetAddress: p.streetAddress || null,
      ngoPartner: p.ngoPartner || null,
      criticalIllness: p.criticalIllness || null,
      kycStatus: p.kycStatus || '',
      registrationStatus: p.registrationStatus || '',
      registrationDate: p.registrationDate || p.createdDate || '',
      discountPercentage: p.discountPercentage ?? null,
      incomeLevel: p.incomeLevel || p.annualIncome || null,
      kycDocumentUrl: p.kycDocumentUrl || p.kyCdocURL || p.kycDocURL || null,
    }));
    mapped.sort((a, b) =>
      sortBy === 'date'
        ? new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
        : (a.fullName || '').localeCompare(b.fullName || '')
    );
    return mapped;
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const raw = await api.patient.getByStatus('Approved').catch(() => []);
      setPatients(mapAndSort(raw));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const loadApproved = async () => {
    setIsApprovedLoading(true);
    try {
      const approvedRaw = await api.patient.getByStatus('Approved', 'Completed').catch(() => []);
      setApprovedPatients(mapAndSort(approvedRaw || []));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load approved patients');
    } finally {
      setIsApprovedLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleTabChange = (value: string) => {
    const tab = value as FilterTab;
    setActiveTab(tab);
    if (tab === 'approved') loadApproved();
  };

  const pendingPatients = patients.filter(p => {
    const s = (p.kycStatus || '').toLowerCase();
    return s === 'pending';
  });

  const handleRefresh = () => {
    loadData();
    if (activeTab === 'approved') loadApproved();
  };

  return (
    <Card className="border-gray-100 shadow-xl rounded-[2rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-normal text-gray-800">Patient Registry</CardTitle>
              <CardDescription className="font-light text-gray-500">KYC approved and pending patients</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-xl font-normal text-gray-800">{approvedPatients.length}</p>
              <p className="text-[10px] text-green-600 uppercase tracking-widest">Approved</p>
            </div>
            <div className="text-center px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-xl font-normal text-gray-800">{pendingPatients.length}</p>
              <p className="text-[10px] text-amber-600 uppercase tracking-widest">Pending</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || isApprovedLoading} className="border-gray-200 rounded-xl font-normal">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isApprovedLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-gray-100/50 p-1.5 h-auto rounded-2xl w-full sm:w-auto">
            <TabsTrigger value="all" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700">All Patients</TabsTrigger>
            <TabsTrigger value="approved" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700">Approved</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0 outline-none">
            <PatientTable patients={patients} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="approved" className="mt-0 outline-none">
            <PatientTable patients={approvedPatients} isLoading={isApprovedLoading} />
          </TabsContent>
          <TabsContent value="pending" className="mt-0 outline-none">
            <ApprovalsList child={true} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}