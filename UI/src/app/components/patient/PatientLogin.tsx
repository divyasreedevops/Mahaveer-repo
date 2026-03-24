import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { Phone, ArrowLeft } from 'lucide-react';

export function PatientLogin() {
  const { registerPatient, verifyOTP, isAuthenticated, userType, isLoading } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (isAuthenticated && userType === 'patient') {
      navigate('/patient/dashboard', { replace: true });
    }
  }, [isAuthenticated, userType, navigate]);

  const handleMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    try {
      setError('');
      await registerPatient(mobile, email || undefined);
      setStep('otp');
      setResendTimer(30);
    } catch {
      // error shown via toast from context
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);
    try {
      await registerPatient(mobile, email || undefined);
      setResendTimer(30);
    } catch {
      // error shown via toast from context
    } finally {
      setIsResending(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP sent to your mobile');
      return;
    }
    setError('');
    const success = await verifyOTP(otp);
    if (success) {
      navigate('/patient/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-blue-50">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>
      <Card className="w-full max-w-md border-gray-100 shadow-lg rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-gray-800 font-normal">Patient Portal</CardTitle>
          </div>
          <CardDescription className="text-gray-500 font-light">
            {step === 'mobile' 
              ? 'Enter your mobile number to get started'
              : 'Enter the OTP sent to your mobile'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'mobile' ? (
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-gray-700 font-normal">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  className="border-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-normal">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-100"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-300 font-normal">
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-normal">Enter OTP</Label>
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
                <p className="text-sm text-gray-500 text-center font-light">
                  Enter the OTP sent to {mobile}
                </p>
              </div>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-400 font-light">Resend OTP in {resendTimer}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-sm text-blue-600 hover:text-blue-700 font-normal underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    {isResending ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep('mobile')}
                  className="flex-1 border-gray-100"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-300 font-normal">
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}