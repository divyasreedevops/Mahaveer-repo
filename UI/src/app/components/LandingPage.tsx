import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Shield, User } from 'lucide-react';
import containerSvg from '@/assets/Container.svg';
import minfyLogo from '@/assets/minfy_logo.png';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onSelectPortal?: (portal: 'patient' | 'admin') => void;
}

export function LandingPage({ onSelectPortal }: LandingPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'about'>('home');

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Foundation Name */}
            <div className="flex items-center gap-3">
              <div className="w-10">
                <img src={containerSvg} alt="Mahaveer Cancer Care Logo" className="w-full h-auto object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight text-[#1c398e]">
                Mahaveer Cancer Care Foundation
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-5 py-2.5 rounded-lg text-sm font-normal transition-all ${
                  activeTab === 'home'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >Login</button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-5 py-2.5 rounded-lg text-sm font-normal transition-all ${
                  activeTab === 'about'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >About Us</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-8 pb-48 bg-blue-50">
        {activeTab === 'home' ? (
          <div className="w-full max-w-5xl space-y-5 pt-[30px]">
            {/* Header Section */}
            <div className="text-center space-y-2.5">
              <h1 className="text-3xl text-gray-800 font-normal tracking-tight">
                Pharmacy Management System
              </h1>
              <p className="text-base text-gray-500 font-light mt-2.5">
                Select your portal to continue
              </p>
            </div>

            {/* Portal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
              {/* Patient Portal Card */}
              <div
                onClick={() => handlePortalSelect('patient')}
                className="group bg-white rounded-2xl p-10 border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="flex-1 space-y-8 flex flex-col">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                      <User className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h2 className="text-xl text-gray-800 font-normal mb-2">Patient Portal</h2>
                      <p className="text-sm text-gray-500 font-light leading-relaxed">Register, upload prescription, &amp; manage your orders</p>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 text-sm text-gray-600 font-light pl-0 flex-1">
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                      <span>Mobile OTP verification</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                      <span>Upload prescription</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                      <span>View invoice with subsidy</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                      <span>Book pickup slot</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                      <span>Track order status</span>
                    </li>
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-normal"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePortalSelect('patient');
                    }}
                  >
                    Continue as Patient
                  </Button>
                </div>
              </div>

              {/* Admin Portal Card */}
              <div
                onClick={() => handlePortalSelect('admin')}
                className="group bg-white rounded-2xl p-10 border border-gray-100 hover:border-purple-100 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="flex-1 space-y-8 flex flex-col">
                  {/* Icon and Title */}
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-300">
                      <Shield className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h2 className="text-xl text-gray-800 font-normal mb-2">Admin Portal</h2>
                      <p className="text-sm text-gray-500 font-light leading-relaxed">
                        Manage patients and inventory
                      </p>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 text-sm text-gray-600 font-light pl-0 flex-1">
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                      <span>View all registered patients</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                      <span>Track payment status</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                      <span>Manage medicine inventory</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                      <span>Add/remove medicines</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                      <span>Approve/reject registrations</span>
                    </li>
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 font-normal"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePortalSelect('admin');
                    }}
                  >Continue as Admin</Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-3xl space-y-5">
            {/* About Us Content */}
            <div className="text-center space-y-[15px]">
              <h1 className="text-3xl text-gray-800 font-normal tracking-tight pt-5">
                About Us
              </h1>
              <p className="text-base text-gray-500 font-light mt-2.5 mb-5">
                Committed to accessible healthcare for all
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-12 space-y-10">
              <div className="space-y-3">
                <h2 className="text-lg text-gray-800 font-normal">Our Mission</h2>
                <p className="text-sm text-gray-600 leading-relaxed font-light">
                  Mahaveer Cancer Care Foundation is dedicated to providing affordable and accessible cancer care to patients across all economic backgrounds. Through our income-based discount system and partnerships with leading pharmaceutical companies, we ensure that no patient is denied treatment due to financial constraints.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg text-gray-800 font-normal">What We Do</h2>
                <p className="text-sm text-gray-600 leading-relaxed font-light">
                  Our Pharmacy Management System streamlines the process of prescription fulfillment, KYC verification, and discount allocation. Patients can upload prescriptions, get approved for subsidies, and book convenient pickup slots—all through a simple digital interface.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg text-gray-800 font-normal">Our Impact</h2>
                <p className="text-sm text-gray-600 leading-relaxed font-light">
                  With the support of our generous sponsors and partners, we've helped thousands of patients access life-saving medications at significantly reduced costs. Every patient undergoes a thorough KYC process to ensure subsidies reach those who need them most.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg text-gray-800 font-normal">Bank Details for Donations</h2>
                <div className="text-sm text-gray-600 font-light space-y-2">
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">Account Name:</span>
                    <span>Mahaveer Cancer Care Foundation</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">Bank Name:</span>
                    <span>State Bank of India</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">Account Number:</span>
                    <span>1234 5678 9012</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">IFSC Code:</span>
                    <span>SBIN0004587</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">Branch:</span>
                    <span>Jayanagar 4th Block, Bengaluru</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">Account Type:</span>
                    <span>Current Account</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">UPI ID:</span>
                    <span>donate@mahaveercare</span>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] gap-2">
                    <span className="text-gray-500">SWIFT Code:</span>
                    <span>SBININBBXXX (For International Donations)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sponsors at bottom */}
      <div className="fixed bottom-0 w-screen left-0 py-6 overflow-hidden bg-white border-t border-gray-100 z-10">

        {/* Sponsored by label and logo */}
        <div className="absolute top-2 right-6 flex items-center gap-2 z-20">
          <span className="text-[10px] text-gray-400 font-light uppercase tracking-wide">sponsored by</span>
          <img src={minfyLogo} alt="Minfy" className="h-4 object-contain opacity-50" />
        </div>

        <div className="text-center mb-4">
          <h3 className="text-[11px] font-normal text-gray-400 uppercase tracking-widest">Our Sponsors</h3>
        </div>

        <div className="relative">
          <div className="flex animate-scroll hover:[animation-play-state:paused] space-x-8">
            {[...sponsors, ...sponsors, ...sponsors].map((sponsor, index) => (
              <div
                key={index}
                className="flex-shrink-0 px-6 py-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3 hover:bg-white hover:border-gray-200 transition-all duration-200"
              >
                <ImageWithFallback
                  src={sponsor.logo}
                  alt={sponsor.name}
                  className="h-8 w-8 object-cover rounded-lg"
                />
                <span className="text-xs font-light text-gray-600 whitespace-nowrap">
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