import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ArrowLeft, Download, User, FileText, CheckCircle, Receipt, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface PatientHistoryProps {
  onBack: () => void;
}

export function PatientHistory({ onBack }: PatientHistoryProps) {
  const { currentPatient, logout } = useApp();

  if (!currentPatient) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDownloadInvoice = (invoiceNumber: string) => {
    // In demo mode, we just show an alert or open a placeholder
    alert(`Downloading invoice ${invoiceNumber}... (Demo Mode)`);
  };

  // Sort prescriptions by upload date, newest first
  const sortedPrescriptions = [...currentPatient.prescriptions].sort((a, b) => 
    new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl text-gray-800 font-normal">Order History</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack} className="text-gray-600 font-normal rounded-xl hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={logout} className="border-gray-100 rounded-xl text-red-500 font-normal">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {sortedPrescriptions.length === 0 ? (
            <div className="text-center py-20 bg-white/40 border border-dashed border-gray-300 rounded-[2rem]">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <History className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-normal text-gray-800">No history found</h3>
              <p className="text-gray-500 font-light mt-2">Your completed and pending orders will appear here.</p>
            </div>
          ) : (
            sortedPrescriptions.map((prescription) => (
              <Card key={prescription.id} className="border-gray-100 shadow-xl rounded-[2rem] overflow-hidden bg-white group hover:shadow-2xl transition-all duration-500">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${
                        prescription.approvalStatus === 'approved' ? 'bg-green-50' :
                        prescription.approvalStatus === 'rejected' ? 'bg-red-50' : 'bg-blue-50'
                      }`}>
                        <Receipt className={`w-6 h-6 ${
                          prescription.approvalStatus === 'approved' ? 'text-green-600' :
                          prescription.approvalStatus === 'rejected' ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-normal text-gray-800">
                          Dr. {prescription.doctorName}
                        </CardTitle>
                        <CardDescription className="font-light text-gray-500">{prescription.hospitalName}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {prescription.approvalStatus === 'pending' && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-normal rounded-full px-3 py-1">Under Review</Badge>
                      )}
                      {prescription.approvalStatus === 'approved' && (
                        <div className="flex items-center gap-2">
                          {prescription.pickups.every(p => p.status === 'collected') ? (
                            <Badge className="bg-green-500 text-white border-none font-normal rounded-full px-3 py-1">Completed ✓</Badge>
                          ) : (
                            <Badge className="bg-green-50 text-green-700 border-green-100 font-normal rounded-full px-3 py-1">Approved</Badge>
                          )}
                        </div>
                      )}
                      {prescription.approvalStatus === 'rejected' && (
                        <Badge className="bg-red-50 text-red-700 border-red-100 font-normal rounded-full px-3 py-1">Rejected</Badge>
                      )}
                      <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">{formatDate(prescription.uploadDate)}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8 pt-4 space-y-6">
                  {/* Status Timeline / Info */}
                  <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 space-y-4">
                    {prescription.approvalStatus === 'approved' && prescription.pickups.map(pickup => (
                      <div key={pickup.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            pickup.status === 'collected' ? 'bg-green-500' :
                            pickup.status === 'missing_medicine' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-normal text-gray-800 capitalize">
                              {pickup.status.replace('_', ' ')}
                            </p>
                            {pickup.slotDate && (
                              <p className="text-xs text-gray-500 font-light">
                                Collected on {formatDate(pickup.slotDate)}
                              </p>
                            )}
                          </div>
                        </div>
                        {pickup.status === 'collected' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadInvoice(pickup.invoice?.invoiceNumber || '')}
                            className="rounded-xl border-gray-200 text-blue-600 hover:bg-blue-50 font-normal"
                          >
                            <Download className="w-3 h-3 mr-2" /> Invoice
                          </Button>
                        )}
                        {pickup.status === 'missing_medicine' && (
                          <div className="flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-xs font-normal">Action Required</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {prescription.approvalStatus === 'rejected' && (
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-normal text-red-900">Rejection Feedback</p>
                          <p className="text-sm text-red-700 font-light mt-1">{prescription.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {prescription.approvalStatus === 'pending' && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <p className="text-sm text-gray-600 font-light">Currently being reviewed by our medical team.</p>
                      </div>
                    )}
                  </div>

                  {prescription.approvalStatus === 'approved' && prescription.expiryDate && (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-light">
                        <Clock className="w-3 h-3" />
                        <span>Valid until {formatDate(prescription.expiryDate)}</span>
                      </div>
                      <Button variant="link" className="text-blue-600 font-normal text-xs p-0 h-auto">View Details</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
