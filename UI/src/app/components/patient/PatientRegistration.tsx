import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
import { toast } from 'sonner';
import { ArrowLeft, Smartphone, Shield } from 'lucide-react';
import { PatientData } from '../PatientFlow';
import { Link } from 'react-router-dom';

interface Props {
  patientData: PatientData;
  updateData: (data: Partial<PatientData>) => void;
}

export function PatientRegistration({ patientData, updateData }: Props) {
  const [mobile, setMobile] = useState(patientData.mobile || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleSendOTP = () => {
    if (mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setOtpSent(true);
    toast.success('OTP sent to ' + mobile);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }
    // Mock OTP verification - in real app, this would verify with backend
    if (otp === '123456' || otp.length === 6) {
      updateData({ mobile });
      toast.success('Mobile number verified successfully!');
      navigate('/patient/details');
    } else {
      toast.error('Invalid OTP');
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
              Verify your mobile number to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm">Mobile Number</label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  disabled={otpSent}
                />
                {!otpSent && (
                  <Button onClick={handleSendOTP}>Send OTP</Button>
                )}
              </div>
            </div>

            {otpSent && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <label className="text-sm">Enter OTP</label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
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
                  <p className="text-xs text-center text-gray-500">
                    For demo, use: 123456
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>Your data is secure and encrypted</span>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                  >
                    Change Number
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700" 
                    onClick={handleVerifyOTP}
                  >
                    Verify OTP
                  </Button>
                </div>

                <button
                  className="text-sm text-blue-600 hover:text-blue-700 w-full"
                  onClick={handleSendOTP}
                >
                  Resend OTP
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
