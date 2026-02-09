import { Link } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { User, UserCog, Pill } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <Pill className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl mb-2">Medicine Management System</h1>
          <p className="text-gray-600">Your digital prescription and pharmacy solution</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl mb-3">Patient Portal</h2>
              <p className="text-gray-600 mb-6">
                Register, upload prescription, and receive medicines with 90% subsidy
              </p>
              <div className="space-y-2">
                <Link to="/patient/login">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Login as Patient
                  </Button>
                </Link>
                <Link to="/patient/register">
                  <Button variant="outline" className="w-full">
                    Register as Patient
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCog className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl mb-3">Admin Portal</h2>
              <p className="text-gray-600 mb-6">
                Manage inventory, view orders, and track patient registrations
              </p>
              <Link to="/admin/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Login as Admin
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
