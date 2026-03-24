import { useState, useEffect } from 'react';
import { api } from '@/app/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { ClipboardList, User, Calendar, ExternalLink, Loader2, RefreshCw, CheckCircle2, FileX } from 'lucide-react';
import { toast } from 'sonner';

interface OrderRow {
  prescriptionId: string;
  patientId: string;
  patientName: string;
  uploadDate: string;
  prescriptionUrl: string;
  doctorName: string;
  hospitalName: string;
  status: string;
}

type FilterTab = 'all' | 'booked' | 'collected';

const STATUS_PROCESSED = ['processed'];
const STATUS_COLLECTED = ['collected'];

function normalise(s: string) { return (s || '').toLowerCase(); }

function isProcessed(s: string) { return STATUS_PROCESSED.includes(normalise(s)); }
function isCollected(s: string) { return STATUS_COLLECTED.includes(normalise(s)); }

function StatusBadge({ status }: { status: string }) {
  if (isCollected(status)) return <Badge className="bg-green-100 text-green-700 border-green-200 font-normal">Collected</Badge>;
  if (isProcessed(status)) return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-normal">Ready for Collection</Badge>;
  return <Badge className="bg-gray-100 text-gray-500 border-gray-200 font-normal">{status || 'Unknown'}</Badge>;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return dateStr; }
};

function OrderTable({
  orders, isLoading, onMarkCollected, markingId,
}: {
  orders: OrderRow[];
  isLoading: boolean;
  onMarkCollected: (id: string) => void;
  markingId: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-light">Loading orders...</span>
      </div>
    );
  }
  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
        <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-light">No orders match the current filter.</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm bg-white">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
            <TableHead className="font-normal text-gray-500 py-6 pl-8">Patient</TableHead>
            <TableHead className="font-normal text-gray-500">Prescription</TableHead>
            <TableHead className="font-normal text-gray-500">Upload Date</TableHead>
            <TableHead className="font-normal text-gray-500">Status</TableHead>
            <TableHead className="font-normal text-gray-500">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.prescriptionId} className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0">
              <TableCell className="py-6 pl-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-normal text-gray-800">{o.patientName || o.patientId}</p>
                    <p className="text-xs text-gray-400 font-light mt-0.5">ID: {o.patientId}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {o.doctorName && (
                    <p className="text-sm text-gray-700 font-normal">Dr. {o.doctorName}</p>
                  )}
                  {o.hospitalName && (
                    <p className="text-xs text-gray-400 font-light">{o.hospitalName}</p>
                  )}
                  {o.prescriptionUrl ? (
                    <a href={o.prescriptionUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700">
                      <ExternalLink className="w-3 h-3" /> View Doc
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                      <FileX className="w-3 h-3" /> No doc
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-light">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {formatDate(o.uploadDate)}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={o.status} />
              </TableCell>
              <TableCell>
                {(isProcessed(o.status) || isCollected(o.status)) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkCollected(o.prescriptionId)}
                    disabled={markingId === o.prescriptionId}
                    className="border-gray-200 rounded-xl font-normal text-green-600 hover:text-green-700 hover:border-green-200 hover:bg-green-50"
                  >
                    {markingId === o.prescriptionId
                      ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                    Mark Collected
                  </Button>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PatientOrdersList() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [processedRaw, collectedRaw, patientsRaw] = await Promise.all([
        api.prescription.getByStatus('PROCESSED').catch(() => []),
        api.prescription.getByStatus('COLLECTED').catch(() => []),
        api.patient.getByStatus('Approved', 'Approved').catch(() => []),
      ]);

      const patientsMap: Record<string, string> = {};
      (patientsRaw || []).forEach((p: any) => { patientsMap[p.patientId] = p.fullName || p.patientId; });

      const mapRow = (p: any, statusOverride?: string): OrderRow => ({
        prescriptionId: String(p.id || p.prescriptionId || ''),
        patientId: p.patientId || '',
        patientName: patientsMap[p.patientId] || p.patientId || '',
        uploadDate: p.uploadDate || p.createdDate || '',
        prescriptionUrl: p.prescriptionUrl || '',
        doctorName: p.doctorName || '',
        hospitalName: p.hospitalName || '',
        status: statusOverride || p.status || p.prescriptionStatus || '',
      });

      const combined = [
        ...(processedRaw || []).map((p: any) => mapRow(p, p.status || 'PROCESSED')),
        ...(collectedRaw || []).map((p: any) => mapRow(p, p.status || 'COLLECTED')),
      ];

      // deduplicate by prescriptionId
      const seen = new Set<string>();
      const deduped = combined.filter(o => {
        if (seen.has(o.prescriptionId)) return false;
        seen.add(o.prescriptionId);
        return true;
      });

      deduped.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      setOrders(deduped);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkCollected = async (prescriptionId: string) => {
    setMarkingId(prescriptionId);
    try {
      await api.prescription.markCollected(Number(prescriptionId));
      toast.success('Marked as collected');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as collected');
    } finally {
      setMarkingId(null);
    }
  };

  useEffect(() => { loadData(); }, []);

  const bookedOrders    = orders.filter(o => isProcessed(o.status));
  const collectedOrders = orders.filter(o => isCollected(o.status));

  return (
    <Card className="border-gray-100 shadow-xl rounded-[2rem] overflow-hidden">
      <CardHeader className="p-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-2xl">
              <ClipboardList className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-normal text-gray-800">Patient Orders</CardTitle>
              <CardDescription className="font-light text-gray-500">Approved prescriptions and pickup status</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xl font-normal text-gray-800">{bookedOrders.length}</p>
              <p className="text-[10px] text-blue-600 uppercase tracking-widest">Booked</p>
            </div>
            <div className="text-center px-4 py-2 bg-green-50 rounded-2xl border border-green-100">
              <p className="text-xl font-normal text-gray-800">{collectedOrders.length}</p>
              <p className="text-[10px] text-green-600 uppercase tracking-widest">Collected</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="border-gray-200 rounded-xl font-normal">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)} className="space-y-6">
          <TabsList className="bg-gray-100/50 p-1.5 h-auto rounded-2xl w-full sm:w-auto">
            <TabsTrigger value="all" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700">All Orders</TabsTrigger>
            <TabsTrigger value="booked" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700">Booked Patients</TabsTrigger>
            <TabsTrigger value="collected" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-700">Collected</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0 outline-none">
            <OrderTable orders={orders} isLoading={isLoading} onMarkCollected={handleMarkCollected} markingId={markingId} />
          </TabsContent>
          <TabsContent value="booked" className="mt-0 outline-none">
            <OrderTable orders={bookedOrders} isLoading={isLoading} onMarkCollected={handleMarkCollected} markingId={markingId} />
          </TabsContent>
          <TabsContent value="collected" className="mt-0 outline-none">
            <OrderTable orders={collectedOrders} isLoading={isLoading} onMarkCollected={handleMarkCollected} markingId={markingId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
