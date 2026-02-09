import React from 'react';
import { SWRConfig } from 'swr';
import { fetcher } from './fetcher';
import swrConfig from './swrConfig';

interface SWRProviderProps {
  children: React.ReactNode;
}

/**
 * SWR Provider component - wraps the app with SWR configuration
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        ...swrConfig,
        fetcher,
      }}
    >
      {children}
    </SWRConfig>
  );
}

export default SWRProvider;
