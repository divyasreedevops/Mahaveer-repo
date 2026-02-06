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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <h1 className="text-2xl">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList>
            <TabsTrigger value="approvals">Approvals</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
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