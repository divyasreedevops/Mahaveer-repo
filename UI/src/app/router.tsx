import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public pages
import { LandingPage } from './components/LandingPage';

// Patient pages
import { PatientLogin } from './components/patient/PatientLogin';
import { PatientDetailsForm } from './components/patient/PatientDetailsForm';
import { PatientDashboard } from './components/patient/PatientDashboard';

// Admin pages
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ApprovalsList } from './components/admin/ApprovalsList';
import { PatientList } from './components/admin/PatientList';
import { InventoryManagement } from './components/admin/InventoryManagement';

/**
 * Application router configuration
 * Defines all routes with public and protected access
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  
  // Patient routes
  {
    path: '/patient',
    children: [
      {
        index: true,
        element: <Navigate to="/patient/login" replace />,
      },
      {
        path: 'login',
        element: <PatientLogin />,
      },
      {
        path: 'details',
        element: <PatientDetailsForm />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
  
  // Admin routes
  {
    path: '/admin',
    children: [
      {
        index: true,
        element: <Navigate to="/admin/login" replace />,
      },
      {
        path: 'login',
        element: <AdminLogin />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'approvals',
        element: (
          <ProtectedRoute requiredRole="admin">
            <ApprovalsList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'patients',
        element: (
          <ProtectedRoute requiredRole="admin">
            <PatientList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute requiredRole="admin">
            <InventoryManagement />
          </ProtectedRoute>
        ),
      },
    ],
  },
  
  // 404 redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default router;
