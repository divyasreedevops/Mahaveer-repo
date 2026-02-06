import { Button } from '@/app/components/ui/button';
import { User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/app/context/AppContext';
import { useToast } from '@/lib';

interface PatientHeaderProps {
  showLogout?: boolean;
}

export function PatientHeader({ showLogout = false }: PatientHeaderProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useApp();

  const handleLogout = async () => {
    const toastId = toast.loading('Logging out...');
    try {
      await logout();
      localStorage.removeItem('patient_data');
      localStorage.removeItem('patient_mobile');
      localStorage.removeItem('patient_temp');
      toast.dismiss(toastId);
      toast.success('Logged out successfully');
      navigate('/patient/login');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <User className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Patient Portal</h1>
        </div>
        {showLogout && (
          <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </header>
  );
}
