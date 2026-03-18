import { useState, useEffect } from 'react';
import { api } from '@/app/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Button } from '@/app/components/ui/button';
import { Users, Phone, Calendar, CheckCircle, Clock, Package, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PrescriptionRow {
  id: number;
  patientId: string;
  pId: number;
  doctorName: string;
  hospitalName: string;
  uploadDate: string;
  status: string;
  slot: {
    id?: number;
    slotDate?: string;
    slotTime?: string;
    processingStatus?: string;
  } | null;
}

type FilterTab = 'all' | 'pending' | 'completed';

// Derive a processing status label from the slot data
function getProcessingStatus(row: PrescriptionRow): string {
  if (!row.slot) return 'awaiting_slot';
  const s = (row.slot.processingStatus || '').toLowerCase();
  if (s === 'collected' || s === 'completed' || s === 'delivered') return 'completed';
  if (s === 'payment_done' || s === 'paid') return 'payment_done';
  if (s === 'slot_booked' || row.slot.slotDate) return 'slot_booked';
  return 'awaiting_slot';
}

export function PatientList() {
  const [rows, setRows] = useState<PrescriptionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list: any[] = await api.prescription.getByStatus('APPROVED');
      const prescriptions = list || [];

      // Fetch slot info for each prescription in parallel
      const rowsWithSlots: PrescriptionRow[] = await Promise.all(
        prescriptions.map(async (p: any) => {
          let slot: PrescriptionRow['slot'] = null;
          try {
            const s = await api.appointment.getSlot(p.patientId, p.id);
            if (s) slot = s;
          } catch {}
          return {
            id: p.id,
            patientId: p.patientId,
            pId: p.pId,
            doctorName: p.doctorName || '',
            hospitalName: p.hospitalName || '',
            uploadDate: p.uploadDate || p.createdDate || '',
            status: p.status || 'APPROVED',
            slot,
          };
        })
      );
      setRows(rowsWithSlots);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load prescriptions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const pendingRows = rows.filter(r => getProcessingStatus(r) !== 'completed');
  const completedRows = rows.filter(r => getProcessingStatus(r) === 'completed');
  const filteredRows =
    activeTab === 'all' ? rows :
    activeTab === 'pending' ? pendingRows :
    completedRows;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getStatusBadge = (row: PrescriptionRow) => {
    const ps = getProcessingStatus(row);
    switch (ps) {
      case 'completed':     return <Badge className="bg-green-100 text-green-700 border-green-200 font-normal">Completed</Badge>;
      case 'payment_done':  return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-normal">Payment Done</Badge>;
      case 'slot_booked':   return <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-normal">Slot Booked</Badge>;
      default:              return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-normal">Awaiting Slot</Badge>;
    }
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
              <CardTitle className="text-2xl font-normal text-gray-800">Pharmacy Operations</CardTitle>
              <CardDescription className="font-light text-gray-500">Approved prescriptions pending fulfilment</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xl font-normal text-gray-800">{pendingRows.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Active Tasks</p>
            </div>
            <div className="text-center px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xl font-normal text-gray-800">{completedRows.length}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Fulfilled</p>
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
            <TabsTrigger value="all" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">All Orders</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">Pending Actions</TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl px-6 py-2.5 font-normal data-[state=active]:bg-white data-[state=active]:shadow-sm">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 outline-none">
            {isLoading ? (
              <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="font-light">Loading prescriptions...</span>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-light">No orders match the current filter.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="font-normal text-gray-500 py-6 pl-8">Prescription</TableHead>
                      <TableHead className="font-normal text-gray-500">Patient</TableHead>
                      <TableHead className="font-normal text-gray-500">Slot</TableHead>
                      <TableHead className="font-normal text-gray-500">Processing Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50/30 transition-colors border-b border-gray-50 last:border-0">
                        <TableCell className="py-6 pl-8">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                              <Package className="w-5 h-5 text-purple-500" />
                            </div>
                            <div>
                              <p className="font-normal text-gray-800">Dr. {row.doctorName}</p>
                              <p className="text-xs text-gray-400 font-light mt-0.5">{row.hospitalName}</p>
                              <p className="text-xs text-gray-400 font-light mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Uploaded {formatDate(row.uploadDate)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-normal text-gray-800 text-sm">{row.patientId}</p>
                            <p className="text-xs text-gray-400 font-light mt-0.5">Presc ID: #{row.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.slot?.slotDate ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Calendar className="w-4 h-4 text-purple-400" />
                                <span>{formatDate(row.slot.slotDate)}</span>
                              </div>
                              {row.slot.slotTime && (
                                <p className="text-xs text-gray-400 pl-6">{formatTime(row.slot.slotTime)}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic font-light">Not booked yet</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(row)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}