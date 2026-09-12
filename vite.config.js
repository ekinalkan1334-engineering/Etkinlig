import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Vitrin, admin panelin API'sinden beslenir.
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      // Etkinlik kapak görselleri API tarafından servis edilir.
      '/yuklemeler': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
})
