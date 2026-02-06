import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Node MSW server for testing
 */
export const server = setupServer(...handlers);
