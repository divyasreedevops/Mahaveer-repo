import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { SWRProvider } from '@/lib';

interface AllTheProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper with all providers for testing
 */
function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <SWRProvider>
      {children}
    </SWRProvider>
  );
}

/**
 * Custom render function with providers
 */
function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing library
export * from '@testing-library/react';
export { render };
