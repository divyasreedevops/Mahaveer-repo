import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import ErrorBoundary from './app/components/ErrorBoundary.tsx';
import { SWRProvider, ToastProvider } from './lib';
import { Toaster } from 'sonner';
import { enableMocking } from './mocks';
import './styles/index.css';

// Enable MSW mocking in development if configured
enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <ToastProvider>
          <SWRProvider>
            <App />
            <Toaster position="top-right" richColors closeButton />
          </SWRProvider>
        </ToastProvider>
      </ErrorBoundary>
    </StrictMode>
  );
});
