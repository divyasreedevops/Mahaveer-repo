import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from '@/app/context/AppContext';
import { LandingPage } from '@/app/components/LandingPage';
import { PatientLogin } from '@/app/components/patient/PatientLogin';
import { PatientDashboard } from '@/app/components/patient/PatientDashboard';
import { AdminLogin } from '@/app/components/admin/AdminLogin';
import { AdminDashboard } from '@/app/components/admin/AdminDashboard';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Toaster richColors position="top-right" closeButton />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedRoute allowedRoles={['patient']} />}>
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
