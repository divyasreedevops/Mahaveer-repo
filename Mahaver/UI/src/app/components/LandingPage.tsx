import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Shield, User } from 'lucide-react';

interface LandingPageProps {
  onSelectPortal?: (portal: 'patient' | 'admin') => void;
}

export function LandingPage({ onSelectPortal }: LandingPageProps) {
  const navigate = useNavigate();

  const handlePortalSelect = (portal: 'patient' | 'admin') => {
    if (onSelectPortal) {
      onSelectPortal(portal);
    } else {
      navigate(portal === 'patient' ? '/patient/login' : '/admin/login');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl">Pharmacy Management System</h1>
          <p className="text-xl text-muted-foreground">
            Select your portal to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePortalSelect('patient')}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-8 h-8 text-blue-600" />
                <CardTitle className="text-2xl">Patient Portal</CardTitle>
              </div>
              <CardDescription>
                Register, upload prescription, and manage your orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• Mobile OTP verification</li>
                <li>• Upload prescription</li>
                <li>• View invoice with 90% subsidy</li>
                <li>• Book pickup slot</li>
                <li>• Track order status</li>
              </ul>
              <Button className="w-full" onClick={() => handlePortalSelect('patient')}>
                Continue as Patient
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePortalSelect('admin')}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-8 h-8 text-purple-600" />
                <CardTitle className="text-2xl">Admin Portal</CardTitle>
              </div>
              <CardDescription>
                Manage patients and inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>• View all registered patients</li>
                <li>• Track payment status</li>
                <li>• Manage medicine inventory</li>
                <li>• Add/remove medicines</li>
                <li>• Approve/reject registrations</li>
              </ul>
              <Button className="w-full mt-2" variant="secondary" onClick={() => handlePortalSelect('admin')}>
                Continue as Admin
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}