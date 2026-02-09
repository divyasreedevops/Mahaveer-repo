import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Browser MSW worker for development
 */
export const worker = setupWorker(...handlers);
