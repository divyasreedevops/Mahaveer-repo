import { RouterProvider } from 'react-router-dom';
import { AppProvider } from '@/app/context/AppContext';
import { router } from './router';

/**
 * Main App component with router
 */
export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
