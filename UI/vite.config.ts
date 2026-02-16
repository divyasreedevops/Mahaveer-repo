import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Run dev server on HTTP (simpler, no SSL issues)
    port: 5173,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://mahaveer-backend-alb-1021924745.ap-south-2.elb.amazonaws.com',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        rewrite: (path) => {
          console.log('[Vite Proxy] Rewriting:', path);
          return path.replace(/^\/api/, '');
        },
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Vite Proxy] Request:', req.method, req.url, '->', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Vite Proxy] Response:', req.url, '->', proxyRes.statusCode);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[Vite Proxy] Error:', err.message);
          });
        },
      },
    },
  },
})
