# Environment Configuration

This document explains how to configure environment variables for the Patient Admin App.

## Environment Variables

The application uses Vite's environment variable system, which requires all variables to be prefixed with `VITE_`.

### Creating Your Environment File

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your environment.

### Available Variables

#### API Configuration

- **`VITE_API_BASE_URL`** (Required)
  - Base URL for the backend API
  - Default: `https://localhost:7212`
  - Example: `https://api.yourdomain.com`
  
#### Feature Flags

- **`VITE_ENABLE_MOCKS`**
  - Enable/disable MSW (Mock Service Worker) API mocking
  - Default: `true`
  - Set to `false` in production or when using real API

#### App Metadata

- **`VITE_APP_NAME`**
  - Application name
  - Default: `PatientAdminApp`

- **`VITE_APP_VERSION`**
  - Application version
  - Default: `0.0.1`

## API Authentication

The application uses JWT Bearer token authentication for protected API endpoints.

### How It Works

1. **Login Flow**:
   - User authenticates via `/api/auth/login`
   - Backend returns JWT token
   - Token is stored in `localStorage` as `auth_token`

2. **Protected API Calls**:
   - Axios interceptor automatically adds `Authorization: Bearer <token>` header
   - All subsequent API calls include the token
   - Token is read from `localStorage.getItem('auth_token')`

3. **Token Expiry**:
   - If API returns 401 Unauthorized
   - Token is cleared from localStorage
   - User is redirected to login page

### Axios Interceptor Configuration

The API client (`src/api/client.ts`) includes:

- **Request Interceptor**:
  - Adds `Authorization: Bearer <token>` to all protected requests
  - Logs API requests in development mode
  - Supports both `auth_token` and `token` localStorage keys

- **Response Interceptor**:
  - Handles 401 errors (token expired/invalid)
  - Handles 403 errors (insufficient permissions)
  - Transforms errors to consistent `ApiError` format
  - Logs responses in development mode

### Testing with Different Environments

#### Development (with MSW mocks)
```env
VITE_API_BASE_URL=https://localhost:7212
VITE_ENABLE_MOCKS=true
```

#### Development (with real backend)
```env
VITE_API_BASE_URL=https://localhost:7212
VITE_ENABLE_MOCKS=false
```

#### Staging
```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com
VITE_ENABLE_MOCKS=false
```

#### Production
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_ENABLE_MOCKS=false
```

## HTTPS in Development

If your backend uses HTTPS with a self-signed certificate (like `https://localhost:7212`), you may need to:

1. **Accept the certificate in your browser**:
   - Navigate to `https://localhost:7212` directly
   - Click "Advanced" and "Proceed to site"

2. **Configure HTTPS in Vite** (optional):
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       https: true,
       proxy: {
         '/api': {
           target: 'https://localhost:7212',
           changeOrigin: true,
           secure: false, // Allow self-signed certificates
         }
       }
     }
   })
   ```

## Security Best Practices

1. **Never commit `.env` files** to version control
   - Already configured in `.gitignore`

2. **Use different tokens for different environments**
   - Development vs Production should have separate credentials

3. **Rotate tokens regularly**
   - Implement token refresh mechanism for long-lived sessions

4. **Use environment-specific `.env` files**:
   - `.env.local` - Local overrides (not committed)
   - `.env.development` - Development defaults
   - `.env.production` - Production defaults

## Troubleshooting

### API calls failing with 401
- Check if `VITE_API_BASE_URL` is correct
- Verify backend is running
- Check browser console for auth token
- Clear localStorage and login again

### CORS errors
- Ensure backend allows requests from your frontend origin
- Check backend CORS configuration
- Verify `withCredentials` setting in axios client

### Environment variables not updating
- Restart Vite dev server after changing `.env`
- Clear browser cache
- Check variable names have `VITE_` prefix

### MSW not working
- Verify `VITE_ENABLE_MOCKS=true`
- Check browser console for MSW registration messages
- Ensure service worker is registered in browser DevTools → Application → Service Workers
