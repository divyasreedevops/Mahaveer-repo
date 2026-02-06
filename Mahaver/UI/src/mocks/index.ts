/**
* Mock service worker initialization
*/

export { handlers } from './handlers';

/**
 * Start MSW in development mode (browser only)
 * Enhanced with better error handling for HTTPS/HTTP mixed content issues
 */
export async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    try {
      const { worker } = await import('./browser');
      
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      
      console.log('[MSW] 🎭 Mocking enabled - API calls intercepted');
    } catch (error) {
      console.error('[MSW] ❌ Failed to start:', error);
      console.log('[MSW] ℹ️ Continuing without mocks - using real API');
    }
  } else {
    console.log('[MSW] ℹ️ Mocking disabled - using real API');
  }
}
