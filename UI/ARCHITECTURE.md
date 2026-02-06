# Architecture Overview

## Application Structure

The Patient Admin App follows a modular, layered architecture designed for scalability, maintainability, and testability.

## Layers

### 1. Presentation Layer
**Location**: `src/app/components/`

React components organized by feature:
- `admin/` - Admin-specific components
- `patient/` - Patient-specific components
- `ui/` - Reusable UI components (shadcn/ui)
- `figma/` - Figma-specific components

### 2. Business Logic Layer
**Location**: `src/hooks/`

Custom React hooks that encapsulate business logic:
- `useAuth` - Authentication state and operations
- `usePatients` - Patient data management
- `useInventory` - Inventory operations
- `useOtp` - OTP verification flow

### 3. Data Access Layer
**Location**: `src/api/`

Service modules for API communication:
- `client.ts` - Axios instance with interceptors
- `*.service.ts` - Feature-specific API services
- Handles authorization, error transformation, token refresh

### 4. State Management

#### Server State
- **SWR** for data fetching and caching
- Automatic revalidation and cache management
- Optimistic updates support

#### Client State
- React Context (`src/app/context/`)
- Local component state with hooks
- Form state with React Hook Form

### 5. Type Safety
**Location**: `src/types/`

TypeScript interfaces and types:
- API types generated from OpenAPI spec
- Domain models and DTOs
- Utility types

### 6. Validation Layer
**Location**: `src/schemas/`

Zod schemas for validation:
- Form validation
- API request/response validation
- Runtime type checking

### 7. Testing Layer
**Location**: `src/test/`, `*.test.{ts,tsx}`

Testing infrastructure:
- Vitest for unit/integration tests
- React Testing Library for component tests
- MSW for API mocking

## Data Flow

```
User Interaction
    ↓
Component (Presentation)
    ↓
Custom Hook (Business Logic)
    ↓
API Service (Data Access)
    ↓
Axios Client (HTTP)
    ↓
Backend API
    ↓
Response → SWR Cache → Component Update
```

## Key Design Patterns

### 1. Service Layer Pattern
API logic separated into service modules:
```typescript
// src/api/patient.service.ts
export const patientService = {
  getPatientsByStatus,
  registerPatient,
  updatePatient,
};
```

### 2. Custom Hooks Pattern
Business logic encapsulated in hooks:
```typescript
// src/hooks/usePatients.ts
export function usePatients(status: string) {
  const { data, error, mutate } = useSWR(
    `/Patient/status/${status}`,
    () => patientService.getPatientsByStatus(status)
  );
  return { patients: data?.data, error, mutate };
}
```

### 3. Provider Pattern
Context and configuration providers:
```typescript
// src/lib/SWRProvider.tsx
<SWRProvider>
  <App />
</SWRProvider>
```

### 4. Error Boundary Pattern
Error handling at component boundaries:
```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 5. Repository Pattern
MSW handlers act as mock repositories:
```typescript
// src/mocks/handlers.ts
http.get('/Patient/status/:status', ({ params }) => {
  // Return mock data
});
```

## Authentication Flow

1. User submits credentials
2. `useAuth` hook calls `authService.loginAdmin()`
3. Service sends request via `apiClient`
4. On success, token stored in localStorage
5. `apiClient` interceptor adds token to subsequent requests
6. On 401 error, interceptor attempts refresh or redirects to login

## Form Handling

1. Component uses React Hook Form
2. Zod schema provided via `@hookform/resolvers`
3. Form validates on submit
4. Custom hook (e.g., `useAuth`) handles submission
5. API service sends validated data
6. SWR cache mutated on success
7. UI updates automatically

## Error Handling Strategy

### API Errors
- Interceptor transforms axios errors to ApiError type
- Services return typed responses
- Components handle errors via hook state

### Runtime Errors
- ErrorBoundary catches unhandled errors
- Displays user-friendly error UI
- Logs to console (production: sends to Sentry)

### Validation Errors
- Zod schemas validate at form level
- Inline error messages shown to user
- Prevents invalid API requests

## Performance Optimizations

1. **Code Splitting**: Vite automatic chunking
2. **SWR Caching**: Reduces redundant API calls
3. **React Optimizations**: Memoization where needed
4. **Lazy Loading**: Dynamic imports for routes
5. **Image Optimization**: Fallback images, lazy loading

## Security Considerations

1. **Token Management**: Stored in localStorage (consider httpOnly cookies)
2. **HTTPS Only**: Production enforces secure connections
3. **CORS**: Backend configured for specific origins
4. **Input Validation**: Client and server-side validation
5. **Error Messages**: No sensitive information exposed

## Scalability

### Horizontal Scaling
- Stateless frontend (Docker containers)
- CDN for static assets
- Load balancer for multiple instances

### Code Organization
- Feature-based folders
- Shared UI components library
- Reusable hooks and utilities

### Build Optimization
- Tree shaking
- Minification
- Compression (gzip/brotli)
- Asset optimization

## Dependencies

### Core
- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool

### Data Fetching
- SWR - Data fetching and caching
- Axios - HTTP client

### Validation
- Zod - Schema validation
- React Hook Form - Form management

### Testing
- Vitest - Test runner
- Testing Library - Component testing
- MSW - API mocking

### Styling
- Tailwind CSS - Utility-first CSS
- shadcn/ui - Component library

## Future Enhancements

1. **State Management**: Consider Zustand for complex state
2. **Routing**: Add React Router for multi-page navigation
3. **PWA**: Add service worker for offline support
4. **Real-time**: WebSocket integration for live updates
5. **Internationalization**: i18n for multi-language support
6. **Analytics**: Enhanced tracking and reporting
7. **Monitoring**: Performance monitoring (Sentry, LogRocket)
8. **A/B Testing**: Feature flags and experimentation
