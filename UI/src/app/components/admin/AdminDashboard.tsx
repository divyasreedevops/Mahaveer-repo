import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { PatientList } from './PatientList';
import { InventoryManagement } from './InventoryManagement';
import { ApprovalsList } from './ApprovalsList';
import { LogOut, Shield } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();

  const handleLogout = async () => {
    const toastId = toast.loading('Logging out...');
    try {
      await logout();
      toast.dismiss(toastId);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl text-gray-800 font-normal">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="bg-white border border-gray-100 shadow-sm">
            <TabsTrigger value="approvals" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">Approvals</TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">Patients</TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <ApprovalsList />
          </TabsContent>

          <TabsContent value="patients">
            <PatientList />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}