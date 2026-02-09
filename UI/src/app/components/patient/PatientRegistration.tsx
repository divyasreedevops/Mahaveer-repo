import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { patientService } from '@/api';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Smartphone, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

export function PatientRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobile, setMobile] = useState((location.state as any)?.mobile || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Register patient with mobile number
      const result = await patientService.registerPatient(mobile);
      
      if (result.success) {
        toast.success('Registration submitted successfully! Please wait for admin approval.');
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/patient/login');
        }, 2000);
      } else {
        setError(result.error || 'Failed to register. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle>Patient Registration</CardTitle>
            <CardDescription>
              Register your mobile number to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm">Mobile Number</label>
              <Input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Your registration will be pending until approved by admin
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              onClick={handleRegister}
              disabled={isLoading || mobile.length !== 10}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already registered?{' '}
              <Link to="/patient/login" className="text-blue-600 hover:underline">
                Login here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
