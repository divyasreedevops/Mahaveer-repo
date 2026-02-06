import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import ErrorBoundary from '@/app/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

const NoError = () => <div>No error</div>;

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <NoError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Restore console.error
    console.error = originalError;
  });
});
