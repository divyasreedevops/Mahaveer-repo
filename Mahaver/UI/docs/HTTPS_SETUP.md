# HTTPS Development Setup

This guide explains how to set up HTTPS for local development to match your backend API.

## Quick Start (Using Proxy - Recommended)

The easiest way is to use Vite's built-in proxy. This is already configured:

1. Set your API base URL to use the proxy:
   ```env
   VITE_API_BASE_URL=/api
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

The proxy will forward all `/api/*` requests to `https://localhost:7212` and handle HTTPS/certificate issues.

## Option 1: Using Vite Proxy (Recommended)

### Configuration

The `vite.config.ts` is configured with:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://localhost:7212',
      changeOrigin: true,
      secure: false, // Allows self-signed certificates
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

### Environment Setup

```env
# Use proxy path
VITE_API_BASE_URL=/api

# Disable MSW since we're using real API
VITE_ENABLE_MOCKS=false
```

### How It Works

1. Frontend makes request to: `GET /api/users`
2. Vite proxy forwards to: `GET https://localhost:7212/users`
3. No HTTPS/CORS issues because it's same-origin for the browser

## Option 2: Using HTTPS Dev Server

If you need the entire app to run on HTTPS:

### 1. Generate Self-Signed Certificate

```bash
# Create certs directory
mkdir certs

# Generate certificate (Windows PowerShell)
# Option A: Using OpenSSL
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes

# Option B: Using mkcert (easier, more trusted)
# Install mkcert first: https://github.com/FiloSottile/mkcert
mkcert -install
mkcert -key-file certs/key.pem -cert-file certs/cert.pem localhost 127.0.0.1
```

### 2. Update Vite Config

The config already supports HTTPS if certificates exist:

```typescript
server: {
  https: {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem'),
  },
}
```

### 3. Environment Setup

```env
# Use full HTTPS URL
VITE_API_BASE_URL=https://localhost:7212

# Optional: Enable mocks
VITE_ENABLE_MOCKS=false
```

### 4. Start Server

```bash
npm run dev
```

Your app will be available at `https://localhost:5173`

## Option 3: Disable HTTPS Backend (Development Only)

If you control the backend and want to simplify development:

1. Configure backend to also serve HTTP on a different port (e.g., `http://localhost:5212`)

2. Update environment:
   ```env
   VITE_API_BASE_URL=http://localhost:5212
   VITE_ENABLE_MOCKS=false
   ```

**⚠️ Not recommended for production-like testing**

## MSW (Mock Service Worker) with HTTPS

MSW can have issues with HTTPS in development. If you enable mocks:

### Solution 1: Use HTTP for Development
```env
# Don't use HTTPS URL with MSW
VITE_API_BASE_URL=http://localhost:5000  # Mock endpoint
VITE_ENABLE_MOCKS=true
```

### Solution 2: Use Proxy with MSW
```env
VITE_API_BASE_URL=/api
VITE_ENABLE_MOCKS=true
```

### Solution 3: Disable MSW
```env
# Work with real API, no mocks
VITE_ENABLE_MOCKS=false
```

## Troubleshooting

### "The operation is insecure" Error

This happens when:
- MSW tries to register service worker on HTTP page with HTTPS resources
- Mixed content (HTTP page + HTTPS API)

**Solutions:**
1. ✅ Use proxy mode: `VITE_API_BASE_URL=/api`
2. ✅ Disable MSW: `VITE_ENABLE_MOCKS=false`
3. ✅ Use full HTTPS setup with certificates

### Certificate Not Trusted

**Browser shows "Not Secure" warning:**

For OpenSSL certificates:
- Click "Advanced" → "Proceed to site"
- This is normal for self-signed certs in development

For mkcert certificates:
- Run `mkcert -install` to trust local CA
- Certificates will be automatically trusted by browser

### CORS Issues

If you get CORS errors:

1. **Using Proxy**: CORS is automatically handled
2. **Direct API calls**: Ensure backend has correct CORS headers:
   ```csharp
   // C# .NET example
   builder.Services.AddCors(options =>
   {
       options.AddDefaultPolicy(policy =>
       {
           policy.WithOrigins("https://localhost:5173")
                 .AllowAnyMethod()
                 .AllowAnyHeader()
                 .AllowCredentials();
       });
   });
   ```

### MSW Service Worker Not Found

If you see 404 for `/mockServiceWorker.js`:

```bash
# Copy MSW service worker to public folder
npx msw init public/ --save
```

## Recommended Setup for Your Project

Based on your backend at `https://localhost:7212`:

```env
# .env
VITE_API_BASE_URL=/api
VITE_ENABLE_MOCKS=false
```

This uses the Vite proxy, avoiding HTTPS complexity while working with your real backend.

## Production Deployment

In production, you won't need these workarounds:

```env
# Production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_ENABLE_MOCKS=false
```

Both frontend and backend will have proper SSL certificates from a CA (Let's Encrypt, etc.).
