import { SWRConfiguration } from 'swr';

/**
 * Global SWR configuration
 */
export const swrConfig: SWRConfiguration = {
  // Revalidate on focus
  revalidateOnFocus: true,
  
  // Retry on error
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Revalidate on reconnect
  revalidateOnReconnect: true,
  
  // Dedupe requests within 2 seconds
  dedupingInterval: 2000,
  
  // Cache provider (default uses Map)
  // provider: () => new Map(),
  
  // Focus throttle interval
  focusThrottleInterval: 5000,
  
  // Load data on mount even if already stale
  revalidateIfStale: true,
  
  // Keep previous data while fetching new data
  keepPreviousData: true,
};

export default swrConfig;
