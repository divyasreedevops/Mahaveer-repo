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
      // Proxy API requests to HTTPS backend
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://16.112.72.213:5000',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
