import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.REPL_SLUG ? '0.0.0.0' : 'localhost',
    port: parseInt(process.env.VITE_PORT || process.env.REPL_SLUG ? '3000' : '8008'),
    strictPort: !process.env.REPL_SLUG,
    // Disable caching
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  // Force full page reload on changes
  optimizeDeps: {
    force: true,
  },
  // Add base URL for Replit deployment
  base: process.env.REPL_SLUG ? '/' : '/',
})
