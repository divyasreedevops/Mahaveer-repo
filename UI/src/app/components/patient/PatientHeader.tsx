import { Button } from '@/app/components/ui/button';
import { ShieldCheck, LogOut } from 'lucide-react';
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
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 max-w-5xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl text-gray-800 font-normal leading-tight">Mahaveer Pharmacy</h1>
            <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest hidden sm:block">Cancer Care Foundation</p>
          </div>
        </div>
        {showLogout && (
          <Button variant="outline" onClick={handleLogout} className="border-gray-100 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4 mr-2" />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
