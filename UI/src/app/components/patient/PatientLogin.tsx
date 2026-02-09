import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '@/api';
import { useToast } from '@/lib';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { Phone, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

export function PatientLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mobile.length !== 10) {
      const errorMsg = 'Please enter a valid 10-digit mobile number';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Generating OTP...');

    try {
      // Call Patient/Register - only needs mobile number
      const result = await patientService.registerPatient(mobile);
      
      toast.dismiss(toastId);
      if (result.success) {
        // Store the OTP if it's returned (development mode)
        if (result.data?.otp) {
          setGeneratedOtp(result.data.otp);
        }
        setStep('otp');
        setError('');
        toast.success('OTP generated successfully!');
      } else {
        const errorMsg = result.error || 'Failed to generate OTP. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMsg = err.message || 'Failed to generate OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      const errorMsg = 'Please enter complete 6-digit OTP';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Verifying OTP...');

    try {
      // Call Patient/Verify for OTP validation
      const result = await patientService.verifyPatient({ 
        mobileNumber: mobile, 
        email: email || '', // Use empty string if email is not provided
        otp 
      });
      
      toast.dismiss(toastId);
      if (result.success && result.data?.patientId) {
        // OTP verified successfully - patient exists or was created
        const patientId = result.data.patientId;
        
        // Try to get full patient details
        const patientResult = await patientService.getPatientByMobileNumber(mobile);
        
        console.log('Patient fetch result:', patientResult);
        
        if (patientResult.success && patientResult.data) {
          const patient = patientResult.data;
          
          console.log('Patient data:', patient);
          console.log('Registration Status:', patient.registrationStatus);
          console.log('Aadhar Number:', patient.aadharNumber);
          
          // Check if it's first login (no aadhar number or basic details filled)
          const isFirstLogin = !patient.aadharNumber || patient.aadharNumber.trim() === '';
          
          // Normalize status for comparison (case-insensitive)
          const status = (patient.registrationStatus || '').toLowerCase();
          
          // Priority Check: If status is Pending, always show approval page (profile already submitted)
          if (status === 'pending') {
            // Pending approval - profile already submitted
            console.log('Pending approval - showing approval pending page');
            localStorage.setItem('patient_data', JSON.stringify(patient));
            localStorage.setItem('patient_mobile', mobile);
            localStorage.setItem('auth_token', patientId); // Set auth token for protected route
            toast.info('Your registration is pending approval.');
            navigate('/patient/dashboard');
          } else if (status === 'rejected') {
            console.log('User rejected');
            toast.error('Your registration was rejected. Please contact support.');
            setError('Your registration was rejected. Please contact support.');
          } else if (status === 'approved') {
            // Check if it's first login (no aadhar number or basic details filled)
            if (isFirstLogin) {
              // Approved but need to complete profile
              console.log('Approved but first login - completing profile');
              localStorage.setItem('patient_temp', JSON.stringify({ mobile, email, patientId }));
              toast.success('OTP verified! Please complete your profile.');
              navigate('/patient/details', { state: { patient, isFirstLogin: true, mobile, email } });
            } else {
              // Approved and has full profile - go to dashboard
              console.log('User approved with complete profile - navigating to dashboard');
              localStorage.setItem('patient_data', JSON.stringify(patient));
              localStorage.setItem('patient_mobile', mobile);
              localStorage.setItem('auth_token', patientId); // Set auth token for protected route
              toast.success('Login successful!');
              navigate('/patient/dashboard');
            }
          } else {
            // Unknown status - complete profile
            console.log('Unknown status - completing profile');
            localStorage.setItem('patient_temp', JSON.stringify({ mobile, email, patientId }));
            toast.success('OTP verified! Please complete your profile.');
            navigate('/patient/details', { state: { patient, isFirstLogin: true, mobile, email } });
          }
        } else {
          // Patient record not found (new registration) - complete profile
          console.log('Patient not found - new registration');
          localStorage.setItem('patient_temp', JSON.stringify({ mobile, email, patientId }));
          toast.success('OTP verified! Please complete your profile.');
          navigate('/patient/details', { state: { isFirstLogin: true, mobile, email, patientId } });
        }
      } else {
        const errorMsg = result.error || 'Invalid OTP. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMsg = err.message || 'Invalid OTP. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-6 h-6" />
              <CardTitle>Patient Portal</CardTitle>
            </div>
            <CardDescription>
              {step === 'mobile' 
                ? 'Enter your mobile number to get started'
                : 'Enter the OTP sent to your mobile'}
            </CardDescription>
          </CardHeader>
        <CardContent>
          {step === 'mobile' ? (
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || mobile.length !== 10}>
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              {generatedOtp && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="font-semibold">Development Mode</div>
                    <div className="text-sm mt-1">Your OTP is: <span className="font-mono font-bold text-lg tracking-widest">{generatedOtp}</span></div>
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              {error && (
                <Alert variant={error.includes('successfully') || error.includes('approval') ? 'default' : 'destructive'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setStep('mobile');
                    setOtp('');
                    setGeneratedOtp('');
                    setError('');
                  }}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={otp.length !== 6 || isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
