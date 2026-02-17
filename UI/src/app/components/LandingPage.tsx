import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Shield, User } from 'lucide-react';
import minfyLogo from '@/assets/minfy_logo.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

  const sponsors = [
    { 
      name: 'Dr. Reddys',
      logo: 'https://images.unsplash.com/photo-1719319384332-82f969b6e48c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEciUyMFJlZGR5cyUyMGxvZ28lMjBwaGFybWFjZXV0aWNhbHxlbnwxfHx8fDE3NzAzNzUxMDh8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Cipla',
      logo: 'https://images.unsplash.com/photo-1698506455775-42635fdd16a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjeSUyMG1lZGljYWwlMjBjYXBzdWxlJTIwcGlsbHxlbnwxfHx8fDE3NzAzNzUxMTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Novartis',
      logo: 'https://images.unsplash.com/photo-1728470164693-95f5e7bade80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMHBoYXJtYWNldXRpY2FsJTIwY29tcGFueXxlbnwxfHx8fDE3NzAzNzUxMTN8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Lupin',
      logo: 'https://images.unsplash.com/photo-1737264791501-4c0626832e82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjZXV0aWNhbCUyMGluZHVzdHJ5JTIwYnVpbGRpbmd8ZW58MXx8fHwxNzcwMzc1MTEzfDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Alkem Labs',
      logo: 'https://images.unsplash.com/photo-1768498950658-87ecfe232b59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwc2NpZW5jZSUyMGxhYm9yYXRvcnl8ZW58MXx8fHwxNzcwMzc1MTE0fDA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Aurobindo Pharma',
      logo: 'https://images.unsplash.com/photo-1659019722097-17e298f43491?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwcGhhcm1hY3klMjBwaWxsc3xlbnwxfHx8fDE3NzAzNzUxMTR8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'Glenmark',
      logo: 'https://images.unsplash.com/photo-1662467150566-f3f12de2ee57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHbGVubWFyayUyMHBoYXJtYWNldXRpY2FsJTIwbG9nb3xlbnwxfHx8fDE3NzAzNzUxMTB8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    { 
      name: 'GSK',
      logo: 'https://images.unsplash.com/photo-1698365140635-42894e5e63b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2luZSUyMGJvdHRsZXMlMjBwaGFybWFjeXxlbnwxfHx8fDE3NzAzMDM1MDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 pb-52 md:pb-56 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl space-y-8">
        {/* Logo at top center */}
        <div className="flex flex-col items-center justify-center pt-4">
          {/* <img src={logo} alt="Mahaveer Hospital" className="h-24 md:h-32 object-contain" /> */}
          <h2 className="text-2xl font-bold text-blue-900 mt-2">Mahaveer Cancer Care Foundation</h2>
        </div>

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
                <li>• View invoice with subsidy</li>
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

      {/* Sponsors at bottom center */}
      <div className="fixed bottom-0 w-screen left-0 py-6 overflow-hidden bg-white m-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        
        {/* Sponsored by label and logo */}
        <div className="absolute top-2 right-4 flex items-center gap-2 z-20">
          <span className="text-xs text-gray-500 font-medium">sponsored by</span>
          <img src={minfyLogo} alt="Minfy" className="h-6 object-contain" />
        </div>

        <h3 className="text-center text-lg font-semibold mb-4 text-gray-700">Our Sponsors</h3>
        <div className="relative">
          <div className="flex animate-scroll space-x-8">
            {/* Duplicate the sponsors array for seamless loop */}
            {[...sponsors, ...sponsors].map((sponsor, index) => (
              <div
                key={index}
                className="flex-shrink-0 px-6 py-3 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center gap-3"
              >
                <ImageWithFallback
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-10 w-10 object-cover rounded"
                />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {sponsor.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}